from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.utils.database import init_db
import traceback
import uuid
import os

# Import all routers
from app.api import experts, search, marketplace, matching, test_debug, email

# Import enhanced outreach modules with fallback
try:
    from app.api import outreach, outreach_enhanced, webhooks
    OUTREACH_ENABLED = True
    ENHANCED_OUTREACH_ENABLED = True
    print("✅ Full outreach modules loaded")
except ImportError as e:
    print(f"⚠️ Enhanced outreach modules not found: {e}")
    try:
        from app.api import outreach
        OUTREACH_ENABLED = True
        ENHANCED_OUTREACH_ENABLED = False
        print("✅ Basic outreach module loaded")
    except ImportError as basic_e:
        print(f"⚠️ Basic outreach module not found: {basic_e}")
        try:
            # Try simplified versions
            from app.api import outreach_enhanced_simple as outreach_enhanced
            from app.api import webhooks_simple as webhooks
            OUTREACH_ENABLED = False
            ENHANCED_OUTREACH_ENABLED = True
            print("✅ Simplified outreach modules loaded")
        except ImportError as simple_e:
            print(f"⚠️ All outreach modules failed: {simple_e}")
            OUTREACH_ENABLED = False
            ENHANCED_OUTREACH_ENABLED = False

from app.routers import clerk_webhook

# Create FastAPI app
app = FastAPI(title="Expert Finder API", version="2.0.0")

# Configure CORS - FIXED VERSION
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
        "https://expertfinderofficial.org",
        "https://www.expertfinderofficial.org"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

# Global exception handler
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

# Include all routers
app.include_router(experts.router)
app.include_router(search.router)
app.include_router(marketplace.router)
app.include_router(matching.router)
app.include_router(test_debug.router)
app.include_router(email.router)
app.include_router(clerk_webhook.router, tags=["webhooks"])

# Include outreach routers if they exist
if OUTREACH_ENABLED:
    app.include_router(outreach.router)
    
if ENHANCED_OUTREACH_ENABLED:
    app.include_router(outreach_enhanced.router, tags=["Enhanced Outreach"])
    app.include_router(webhooks.router, tags=["Webhooks"])

@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup"""
    init_db()
    print("Database initialized successfully")
    print(f"Outreach module enabled: {OUTREACH_ENABLED}")
    print(f"Enhanced outreach enabled: {ENHANCED_OUTREACH_ENABLED}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Expert Finder API v2.0.0", 
        "status": "online",
        "outreach_enabled": OUTREACH_ENABLED
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "expert-finder-api",
        "outreach_enabled": OUTREACH_ENABLED
    }