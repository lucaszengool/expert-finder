from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import experts, search
from app.utils.database import init_db

app = FastAPI(title="Expert Finder API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Include routers
app.include_router(experts.router, prefix="/api/experts", tags=["experts"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

@app.get("/")
async def root():
    return {"message": "Expert Finder API is running"}
