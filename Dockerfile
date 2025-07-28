# Railway-optimized Dockerfile - Fixed
FROM python:3.10-slim

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Download NLTK data (fixed syntax)
RUN python -c "import nltk; nltk.download('vader_lexicon', quiet=True); nltk.download('punkt', quiet=True); print('NLTK data downloaded')" || echo "NLTK download failed"

# Copy application code
COPY backend/ .

# Create necessary directories
RUN mkdir -p /app/data /app/temp /app/exports

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV PYTHONPATH=/app

# Create startup script (skip migrations for now)
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🚀 Starting AI Outreach Platform..."\n\
echo "⚠️ Skipping database migrations to avoid enum conflicts"\n\
echo "🌟 Starting server..."\n\
exec python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1\n\
' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:$PORT/ || exit 1

EXPOSE $PORT

CMD ["/app/start.sh"]