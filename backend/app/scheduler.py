from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import logging
import threading
from app.database import SessionLocal
from app.product_hunt import fetch_and_store

logger = logging.getLogger(__name__)
# Keep track of scheduler state
_scheduler = None

def sync_job():
    """
    Synchronous wrapper for running the async fetch_and_store task.
    Creates its own DB session and handles event loop management.
    """
    logger.info("Starting Product Hunt database sync...")
    db = SessionLocal()
    try:
        # Create an event loop to execute the async fetching function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        count = loop.run_until_complete(fetch_and_store(db))
        logger.info(f"Database sync successful. Synced {count} products.")
    except Exception as e:
        logger.error(f"Failed to execute background database sync: {str(e)}")
    finally:
        db.close()

def start_scheduler(sync_on_startup: bool = True):
    """
    Initializes and starts the background sync scheduler.
    """
    global _scheduler
    if _scheduler is not None:
        logger.warning("Scheduler already running. Skipping initialization.")
        return

    _scheduler = BackgroundScheduler()
    # Add interval job to run every 30 minutes
    _scheduler.add_job(sync_job, 'interval', minutes=30, id='ph_sync_job')
    _scheduler.start()
    logger.info("APScheduler background service successfully initialized.")

    if sync_on_startup:
        logger.info("Scheduling immediate database seed/sync on startup...")
        # Run startup sync in a separate thread to avoid blocking server boot sequence
        startup_thread = threading.Thread(target=sync_job, name="PH-Startup-Sync")
        startup_thread.start()

def shutdown_scheduler():
    """
    Gracefully shuts down the background scheduler.
    """
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Background scheduler gracefully stopped.")
