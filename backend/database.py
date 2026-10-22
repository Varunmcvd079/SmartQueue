import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import shutil

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        tmp_db = "/tmp/smartqueue.db"
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        local_db = os.path.join(base_dir, "smartqueue.db")
        if not os.path.exists(tmp_db) and os.path.exists(local_db):
            try:
                shutil.copy2(local_db, tmp_db)
            except Exception:
                pass
        DATABASE_URL = f"sqlite:///{tmp_db}"
    else:
        DATABASE_URL = "sqlite:///./smartqueue.db"

# For SQLite, enable check_same_thread=False for FastAPI concurrency
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
