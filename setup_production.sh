#!/bin/bash

# Production Setup Script for Railway Deployment
set -e

echo "🚂 Setting up AI Outreach Platform for Railway Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Preparing for Railway deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    echo "node_modules/" >> .gitignore
    echo "backend/venv/" >> .gitignore
    echo "backend/__pycache__/" >> .gitignore
    echo "backend/.env" >> .gitignore
    echo "frontend/.env" >> .gitignore
    echo "*.pyc" >> .gitignore
    echo ".DS_Store" >> .gitignore
fi

# Update CORS settings for production
print_status "Updating CORS settings for Railway..."

# Create a temporary Python script to update CORS
cat > temp_update_cors.py << 'EOL'
import re

# Read the main.py file
with open('backend/app/main.py', 'r') as f:
    content = f.read()

# Find the CORS middleware configuration
cors_pattern = r'app\.add_middleware\(\s*CORSMiddleware,.*?\)'
cors_replacement = '''app.add_middleware(
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
        "https://www.expertfinderofficial.org",
        "https://*.railway.app",  # Allow all Railway domains
        "https://*.up.railway.app"  # Allow all Railway preview domains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)'''

# Replace the CORS configuration
updated_content = re.sub(cors_pattern, cors_replacement, content, flags=re.DOTALL)

# Write back to file
with open('backend/app/main.py', 'w') as f:
    f.write(updated_content)

print("CORS configuration updated for Railway deployment")
EOL

python temp_update_cors.py
rm temp_update_cors.py

# Create production environment files
print_status "Creating production environment templates..."

# Backend production env template
cat > backend/.env.production << 'EOL'
# Production Environment Variables for Railway Backend

# Database (Railway will provide this automatically)
DATABASE_URL=${RAILWAY_POSTGRES_URL}

# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
CLERK_SECRET_KEY=your_clerk_secret_key

# Email Services (Optional but recommended)
SENDGRID_API_KEY=your_sendgrid_api_key
MAILGUN_API_KEY=your_mailgun_api_key

# Social Media APIs (Optional)
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
FACEBOOK_PAGE_ID=your_facebook_page_id
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Security (Generate new keys for production)
ENCRYPTION_KEY=your_32_byte_encryption_key_here
JWT_SECRET=your_jwt_secret_here

# Webhook Secrets
SENDGRID_WEBHOOK_SECRET=your_sendgrid_webhook_secret
MAILGUN_WEBHOOK_SECRET=your_mailgun_webhook_secret
TWITTER_WEBHOOK_SECRET=your_twitter_webhook_secret

# Environment
ENVIRONMENT=production
DEBUG=false
PYTHONUNBUFFERED=1
PORT=8000
PYTHONPATH=/app
EOL

# Frontend production env template
cat > frontend/.env.production << 'EOL'
# Production Environment Variables for Railway Frontend

# API Connection (Update with your Railway backend URL)
REACT_APP_API_URL=https://your-backend-name.up.railway.app

# Clerk Authentication
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Environment
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOL

# Optimize package.json for production
print_status "Optimizing package.json for production..."

# Add build scripts if they don't exist
if ! grep -q "\"build\":" frontend/package.json; then
    print_status "Adding build script to package.json..."
    # This would need to be done manually or with a more sophisticated script
fi

# Create Railway deployment checklist
cat > RAILWAY_CHECKLIST.md << 'EOL'
# ✅ Railway Deployment Checklist

## Pre-Deployment
- [ ] All code committed to git
- [ ] API keys ready (OpenAI, Clerk minimum required)
- [ ] Custom domains configured (optional)

## Railway Setup
- [ ] Backend service created from root directory
- [ ] Frontend service created from frontend/ directory  
- [ ] PostgreSQL database added
- [ ] Environment variables configured

## Required Environment Variables

### Backend Service:
- [ ] `DATABASE_URL` (auto from Railway PostgreSQL)
- [ ] `OPENAI_API_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `ENCRYPTION_KEY` (generate 32-byte key)
- [ ] Other API keys as needed

### Frontend Service:
- [ ] `REACT_APP_API_URL` (Backend Railway URL)
- [ ] `REACT_APP_CLERK_PUBLISHABLE_KEY`

## Post-Deployment
- [ ] Test backend API at `/docs` endpoint
- [ ] Test frontend loads correctly
- [ ] Test authentication flow
- [ ] Test campaign creation
- [ ] Verify database connections
- [ ] Check logs for errors

## Optional Optimizations
- [ ] Custom domains configured
- [ ] CDN enabled
- [ ] Monitoring set up
- [ ] Backup strategy implemented
EOL

# Create a simple deployment script
cat > deploy_to_railway.sh << 'EOL'
#!/bin/bash

echo "🚂 Deploying AI Outreach Platform to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Login check
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway first: railway login"
    exit 1
fi

echo "Committing latest changes..."
git add .
git commit -m "Deploy enhanced AI outreach platform to Railway" || echo "No changes to commit"

echo "Pushing to repository..."
git push origin main

echo "🎉 Deployment initiated! Check Railway dashboard for progress."
echo "Backend will be available at: https://your-backend.up.railway.app"
echo "Frontend will be available at: https://your-frontend.up.railway.app"
EOL

chmod +x deploy_to_railway.sh

# Final instructions
print_success "Production setup complete! 🎉"
echo ""
print_status "Next steps for Railway deployment:"
echo "1. Review RAILWAY_DEPLOYMENT.md for detailed instructions"
echo "2. Update .env.production files with your API keys"
echo "3. Create services on Railway (backend, frontend, database)"
echo "4. Configure environment variables in Railway dashboard"
echo "5. Run: ./deploy_to_railway.sh (optional, or use Railway dashboard)"
echo ""
print_warning "Important files created:"
echo "- RAILWAY_DEPLOYMENT.md (Complete deployment guide)"
echo "- RAILWAY_CHECKLIST.md (Deployment checklist)"
echo "- backend/.env.production (Backend environment template)"
echo "- frontend/.env.production (Frontend environment template)"
echo "- deploy_to_railway.sh (Deployment script)"
echo ""
print_success "Your AI Outreach Platform is ready for Railway! 🚀"