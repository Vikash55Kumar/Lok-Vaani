FROM python:3.11-slim

# Set runtime environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONWARNINGS="ignore"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements for layer caching
COPY requirements.txt .

# Upgrade pip and install requirements
RUN pip install --upgrade pip==23.3.1
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Use gunicorn to run the Flask app
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:$PORT --timeout 1200 --workers 1"]
