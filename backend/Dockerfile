# Backend — FastAPI + Uvicorn
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

# FIX OS vulnerabilities
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application
COPY app/ ./app/

# Default: run API on 8000 (override with CMD if needed)
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
