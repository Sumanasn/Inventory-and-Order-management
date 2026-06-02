import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Production environment variable path pointing to the Docker db container
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@db:5432/inventory_db")

# Create the database engine
engine = create_engine(DATABASE_URL)

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
