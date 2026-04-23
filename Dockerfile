# Stage 1: Build dashboard
FROM node:20-slim AS dashboard-builder
WORKDIR /dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY dashboard/ .
RUN npm run build
# Output: /dashboard/../hanimo-rag/static/ → /hanimo-rag/static/

# Stage 2: Python application
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer caching)
COPY pyproject.toml setup.py ./
COPY hanimo-rag/__init__.py hanimo-rag/__init__.py
RUN pip install --no-cache-dir .

# Copy application code
COPY hanimo-rag/ hanimo-rag/
COPY hanimo-rag.md ./

# Copy built dashboard from Stage 1
COPY --from=dashboard-builder /hanimo-rag/static/ hanimo-rag/static/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "hanimo_rag.main:app", "--host", "0.0.0.0", "--port", "8000"]
