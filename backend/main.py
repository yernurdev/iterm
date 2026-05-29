from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from database.mongo import connect_to_mongo, close_mongo_connection
from api import auth, terms, check
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
app.include_router(terms.router, prefix=settings.API_V1_STR + "/terms", tags=["terms"])
app.include_router(check.router, prefix=settings.API_V1_STR + "/check", tags=["check"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Iterm API"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
