FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for enhanced AI outreach platform
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install with better caching
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model and NLTK data
RUN python -m spacy download en_core_web_sm
RUN python -c "import nltk; nltk.download('vader_lexicon', quiet=True); nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

# Copy backend application code
COPY backend/ .

# Create necessary directories
RUN mkdir -p /app/data /app/models /app/temp /app/exports

# Download sentence transformers model if needed
RUN python -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('all-MiniLM-L6-v2'); model.save('/app/models/sentence-transformers_all-MiniLM-L6-v2')" || echo "Model download failed, will download at runtime"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV PYTHONPATH=/app
ENV MODEL_PATH=/app/models

# Create a startup script
RUN echo '#!/bin/bash\nset -e\necho "Starting Enhanced AI Outreach Platform..."\necho "Running database migrations..."\npython -m alembic upgrade head || echo "Migration failed, continuing..."\necho "Starting server..."\npython -m uvicorn app.main:app --host 0.0.0.0 --port $PORT' > /app/start.sh
RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:$PORT/ || exit 1

# Expose port
EXPOSE $PORT

# Use the startup script
CMD ["/app/start.sh"]
