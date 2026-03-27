FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 4. Create working directory
WORKDIR /app

# 5. Copy requirements
COPY requirements.txt .

RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements.txt

# 7. Copy application code
COPY . .

# 8. Run the application
# Using a shell script to ensure environment variables are loaded
# CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:$PORT --timeout 1200 --workers 1 --worker-class uvicorn.workers.UvicornWorker"]
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080", "--timeout", "1200", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker"]