from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import experts, search, marketplace, matching
from app.api import test_debug
from app.utils.database import init_db
import traceback
import uuid
import os

from app.api.email_routes import router as email_router

# Add to your FastAPI app


# Also add CORS for frontend
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Expert Finder API", version="2.0.0")
app.include_router(email_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:3003",
        "https://web-production-80694.up.railway.app", 
        "https://expert-finder.up.railway.app",
        "https://expert-finder-production.up.railway.app",
        "*"  # Allow all origins during development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handler for better error logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to log all errors"""
    error_id = str(uuid.uuid4())[:8]
    
    # Log the full error
    print(f"\n{'='*60}")
    print(f"ERROR ID: {error_id}")
    print(f"Endpoint: {request.method} {request.url.path}")
    print(f"Error Type: {type(exc).__name__}")
    print(f"Error Message: {str(exc)}")
    print(f"\nFull Traceback:")
    traceback.print_exc()
    print(f"{'='*60}\n")
    
    # Return user-friendly error
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "error_id": error_id,
            "message": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An error occurred",
            "type": type(exc).__name__
        }
    )

# Include routers
app.include_router(experts.router)
app.include_router(search.router)
app.include_router(marketplace.router)
app.include_router(matching.router)
app.include_router(test_debug.router)

@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup"""
    init_db()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Expert Finder API v2.0.0", "status": "online"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "expert-finder-api"
    }
