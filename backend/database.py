import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

# Production environment variable path pointing to the Docker db container
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@db:5432/inventory_db")

# Enterprise Connection Retry Loop
# This prevents crashes when the app boots faster than the database container
MAX_RETRIES = 5
RETRY_DELAY = 3  # seconds

engine = None

for attempt in range(1, MAX_RETRIES + 1):
    try:
        print(f" Connecting to database (Attempt {attempt}/{MAX_RETRIES})...")
        engine = create_engine(DATABASE_URL)
        # Force a quick connection test
        with engine.connect() as connection:
            print(" Connected to database successfully!")
            break
    except OperationalError as e:
        if attempt == MAX_RETRIES:
            print("❌ Could not connect to the database. Max retries reached.")
            raise e
        print(f" Database not ready yet. Retrying in {RETRY_DELAY} seconds...")
        time.sleep(RETRY_DELAY)

# Create a sessionmaker factory for creating transactional database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The base class that our database model classes will inherit from
Base = declarative_base()

# FastAPI Dependency Injection utility to safely yield and close database connections
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
