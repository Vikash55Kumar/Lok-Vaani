# FROM python:3.11-slim

# # Set environment variables
# ENV PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     PIP_NO_CACHE_DIR=1 \
#     PIP_DISABLE_PIP_VERSION_CHECK=1 \
#     PYTHONWARNINGS="ignore"

# # Install curl for health checks
# RUN apt-get update && apt-get install -y \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# # Copy requirements first for better Docker layer caching
# COPY requirements.txt .

# # Upgrade pip and install requirements with version pinning
# RUN pip install --upgrade pip==23.3.1
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy application code
# COPY . .

# # CMD sh -c "gunicorn app:app --bind 0.0.0.0:$PORT --timeout 1200 --workers 1"
# # Copy and set up entrypoint
# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# # Use entrypoint to handle credentials, then run the Flask app
# ENTRYPOINT ["/entrypoint.sh"]
# CMD ["python", "app.py"]

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive \
    PYTHONWARNINGS="ignore"

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    python3-venv \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Upgrade pip and install requirements
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 && \
    python3 -m pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy and set up entrypoint

# Use entrypoint to handle credentials, then run the Flask app
CMD sh -c "gunicorn app:app --bind 0.0.0.0:$PORT --timeout 1200 --workers 1"