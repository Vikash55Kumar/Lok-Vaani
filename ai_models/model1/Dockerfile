
# 1. Use an NVIDIA CUDA base image instead of python:slim
# This image includes the CUDA runtime and CUDNN libraries required for PyTorch
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

# 3. Install Python and system dependencies
# Since the base image is Ubuntu, we need to install python manually
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# 4. Create working directory
WORKDIR /app

# 5. Copy requirements
COPY requirements.txt .

# 6. Install Python dependencies
# We use --index-url to force installing the CUDA-enabled version of PyTorch
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 && \
    python3 -m pip install -r requirements.txt

# 7. Copy application code
COPY . .

# 8. Run the application
# Using a shell script to ensure environment variables are loaded
# CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:$PORT --timeout 1200 --workers 1 --worker-class uvicorn.workers.UvicornWorker"]
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080", "--timeout", "1200", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker"]