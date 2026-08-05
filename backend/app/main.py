from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import DATABASE_URL
from app.db.database import engine
from app.api.v1.endpoints.auth import router as auth_router

# Debug
print("=" * 60)
print("DATABASE_URL =", DATABASE_URL)
print("=" * 60)

app = FastAPI(
    title="Quiz Management Platform API",
    version="1.0.0"
)

app.include_router(auth_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "Quiz Management Platform API is running 🚀"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "success",
            "database": "Connected"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": str(e)
        }