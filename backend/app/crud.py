from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models, schemas

def get_product(db: Session, product_id: str):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(
    db: Session,
    search: str = None,
    category: str = None,
    sort_by: str = "votes",
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Product)
    
    if category and category.lower() != "all":
        query = query.filter(models.Product.category.ilike(category))
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(search_filter),
                models.Product.tagline.ilike(search_filter),
                models.Product.description.ilike(search_filter)
            )
        )
        
    if sort_by == "votes":
        query = query.order_by(models.Product.votes.desc(), models.Product.launch_date.desc())
    else:
        query = query.order_by(models.Product.launch_date.desc())
        
    return query.offset(skip).limit(limit).all()

def get_categories(db: Session):
    # Retrieve unique categories list, sorted alphabetically
    results = db.query(models.Product.category).distinct().all()
    categories = [r[0] for r in results if r[0]]
    # Ensure nice title case capitalization and deduplication
    unique_categories = sorted(list(set(cat.strip().title() for cat in categories)))
    return unique_categories

def increment_votes(db: Session, product_id: str):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db_product.votes += 1
        db.commit()
        db.refresh(db_product)
        return db_product
    return None

def upsert_product(db: Session, product_in: schemas.ProductCreate):
    db_product = db.query(models.Product).filter(models.Product.id == product_in.id).first()
    if db_product:
        db_product.name = product_in.name
        db_product.tagline = product_in.tagline
        db_product.description = product_in.description
        # Prevent database sync from resetting local voting. Keep the max of the two
        db_product.votes = max(db_product.votes, product_in.votes)
        db_product.thumbnail = product_in.thumbnail
        db_product.website_url = product_in.website_url
        db_product.category = product_in.category
        db_product.launch_date = product_in.launch_date
    else:
        db_product = models.Product(**product_in.model_dump())
        db.add(db_product)
    
    db.commit()
    db.refresh(db_product)
    return db_product
