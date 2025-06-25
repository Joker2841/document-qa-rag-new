import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

from app.config import DATABASE_URL

logger = logging.getLogger(__name__)

# Create database engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def create_tables():
    """Create all database tables."""
    try:
        # Import all models to ensure they're registered
        from app.models.document import DocumentDB
        from app.models.query import QueryHistoryDB, AnalyticsStatsDB
        
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except OperationalError as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def get_db():
    """Dependency to get DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database with tables."""
    create_tables()
    
    # Initialize analytics stats if not exists
    try:
        from app.models.query import AnalyticsStatsDB
        db = SessionLocal()
        stats = db.query(AnalyticsStatsDB).first()
        if not stats:
            initial_stats = AnalyticsStatsDB(
                total_queries=0,
                total_documents=0,
                avg_response_time=0.0
            )
            db.add(initial_stats)
            db.commit()
            logger.info("Initial analytics stats created")
        db.close()
    except Exception as e:
        logger.error(f"Error initializing analytics stats: {e}")