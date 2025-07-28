# 🚂 Railway Deployment Guide - AI Outreach Platform

Deploy your enhanced AI outreach platform to Railway with full production capabilities.

## 🎯 Quick Deployment Steps

### 1. **Prepare Your Repository**
```bash
# Commit all changes
git add .
git commit -m "Enhanced AI outreach platform ready for deployment"
git push origin main
```

### 2. **Create Railway Services**

#### **Backend Service:**
1. Go to [Railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository
3. Choose "Deploy from root" 
4. Use the main `Dockerfile` (backend deployment)

#### **Frontend Service:**
1. In the same project → Add Service → GitHub Repository
2. Select the same repository
3. Set **Root Directory** to `frontend/`
4. Use `frontend/Dockerfile`

#### **Database Service:**
1. Add Service → Database → PostgreSQL
2. Railway will automatically create a PostgreSQL instance

### 3. **Configure Environment Variables**

#### **Backend Service Variables:**
```env
# Database (Auto-provided by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
CLERK_SECRET_KEY=your_clerk_secret_key

# Email Services (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
MAILGUN_API_KEY=your_mailgun_api_key

# Social Media APIs (Optional)
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
FACEBOOK_PAGE_ID=your_facebook_page_id
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Security
ENCRYPTION_KEY=generate_a_32_byte_key_here
JWT_SECRET=your_jwt_secret_here

# Webhook Secrets
SENDGRID_WEBHOOK_SECRET=your_sendgrid_webhook_secret
MAILGUN_WEBHOOK_SECRET=your_mailgun_webhook_secret
TWITTER_WEBHOOK_SECRET=your_twitter_webhook_secret

# Other
ENVIRONMENT=production
DEBUG=false
```

#### **Frontend Service Variables:**
```env
# API Connection
REACT_APP_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
# or use custom domain: https://your-backend-domain.railway.app

# Clerk Authentication
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Environment
REACT_APP_ENVIRONMENT=production
```

### 4. **Configure Custom Domains (Optional)**
1. Go to Settings for each service
2. Add your custom domains:
   - Backend: `api.yourdomain.com`
   - Frontend: `yourdomain.com`

### 5. **Set Up Domain Environment**
Update frontend environment variable:
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

## 🔧 Advanced Configuration

### **Database Migrations**
The backend automatically runs migrations on startup via the Docker CMD:
```bash
python -m alembic upgrade head
```

### **Health Checks**
Both services include health checks:
- **Backend**: `GET /` 
- **Frontend**: `GET /health`

### **Scaling**
Update `numReplicas` in Railway JSON files:
```json
{
  "deploy": {
    "numReplicas": 2
  }
}
```

## 📊 Required API Keys & Setup

### **Free Tier (Essential):**
1. **OpenAI API** - [Get key](https://platform.openai.com)
2. **Clerk Auth** - [Get keys](https://clerk.com)

### **Production Features (Optional):**
3. **SendGrid** - Email delivery - [Setup](https://sendgrid.com)
4. **Instagram/Facebook** - [Meta Developers](https://developers.facebook.com)
5. **WhatsApp Business** - [WhatsApp API](https://developers.facebook.com/docs/whatsapp)
6. **Twitter/X** - [Developer Portal](https://developer.twitter.com)

## 🚀 Deployment Commands

### **Option 1: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
railway up --service backend

# Deploy frontend  
railway up --service frontend
```

### **Option 2: GitHub Integration**
1. Connect Repository to Railway
2. Auto-deploys on push to main branch
3. Configure branch in Railway settings

## 🔍 Monitoring & Logs

### **View Logs:**
```bash
# Backend logs
railway logs --service backend

# Frontend logs
railway logs --service frontend
```

### **Monitor Performance:**
- Railway Dashboard shows CPU/Memory usage
- Built-in health checks monitor service status
- Database metrics available in PostgreSQL service

## 🛠 Troubleshooting

### **Common Issues:**

1. **Database Connection Errors**
   - Ensure `DATABASE_URL` is set from Railway PostgreSQL
   - Check database service is running

2. **API Key Errors**
   - Verify all required environment variables are set
   - Check API key formats and permissions

3. **Build Failures**
   - Check Dockerfile syntax
   - Ensure all dependencies in requirements.txt
   - Review build logs in Railway dashboard

4. **CORS Issues**
   - Update CORS origins in backend to include Railway domains
   - Check frontend API URL configuration

### **Debug Steps:**
```bash
# Check service status
railway status

# Restart services
railway restart --service backend
railway restart --service frontend

# View detailed logs
railway logs --service backend --follow
```

## 📈 Production Optimizations

### **Performance:**
- Uses multi-stage Docker builds
- Nginx caching for frontend static assets
- Database connection pooling
- Redis for session storage (add Redis service if needed)

### **Security:**
- Environment variables encrypted
- HTTPS enforced by Railway
- Security headers in nginx
- API rate limiting enabled

### **Cost Optimization:**
- Sleep applications during low usage
- Optimize Docker image sizes
- Use Railway's built-in CDN

## 🎉 Success!

After deployment, your AI Outreach Platform will be available at:
- **Frontend**: `https://your-frontend.railway.app`
- **Backend API**: `https://your-backend.railway.app`
- **API Docs**: `https://your-backend.railway.app/docs`

Your platform now includes:
✅ Multi-channel outreach automation
✅ AI-powered response handling  
✅ Real-time analytics dashboard
✅ Webhook integration for live updates
✅ Production-ready scaling capabilities

Ready to automate your outreach at enterprise scale! 🚀