import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from app import models, schemas, crud, scheduler, database
from app.database import engine, get_db, SessionLocal
from app.product_hunt import fetch_and_store

# Configure logging to console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app.main")

# Auto-initialize database tables (works for both PostgreSQL and SQLite fallback)
logger.info("Initializing database schemas...")
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize background cron sync worker
    logger.info("Starting up FastAPI application...")
    scheduler.start_scheduler(sync_on_startup=True)
    yield
    # Shutdown: Stop the background scheduler gracefully
    logger.info("Shutting down FastAPI application...")
    scheduler.shutdown_scheduler()

app = FastAPI(
    title="Product Hunt Clone API",
    description="FastAPI service for managing product launches, upvotes, categories, and sync cron tasks.",
    version="1.0.0",
    lifespan=lifespan
)

# Set up wide CORS support to enable smooth localhost communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev simplicity, can be tightened
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Product Hunt Clone API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search term for names or taglines"),
    category: Optional[str] = Query(None, description="Filter products by specific category"),
    sort_by: str = Query("votes", description="Sorting criteria: 'votes' or 'date'"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves list of launched products with search, category filtering, and sorting support.
    """
    products = crud.get_products(
        db, 
        search=search, 
        category=category, 
        sort_by=sort_by, 
        skip=skip, 
        limit=limit
    )
    return products

@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """
    Fetches the full details of a specific product by its ID.
    """
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found."
        )
    return product

@app.post("/api/products/{product_id}/vote", response_model=schemas.VoteResponse)
def upvote_product(product_id: str, db: Session = Depends(get_db)):
    """
    Increments the upvote count of a product by 1.
    """
    updated_product = crud.increment_votes(db, product_id)
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found. Cannot upvote."
        )
    return schemas.VoteResponse(
        product_id=updated_product.id,
        votes=updated_product.votes,
        success=True
    )

@app.get("/api/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """
    Retrieves lists of unique, distinct categories currently present in the database.
    """
    return crud.get_categories(db)

@app.post("/api/sync", response_model=schemas.SyncResponse)
async def trigger_manual_sync(db: Session = Depends(get_db)):
    """
    Manually triggers database synchronization (API fetch or mock seeding).
    """
    try:
        count = await fetch_and_store(db)
        return schemas.SyncResponse(
            success=True,
            message=f"Manual database sync executed successfully.",
            added_count=count
        )
    except Exception as e:
        logger.error(f"Manual sync failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manual database sync failed: {str(e)}"
        )
