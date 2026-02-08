FROM python:3.11-slim

# Install necessary packages including build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    libsndfile1 \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create a Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade --no-cache-dir pip
RUN pip install --no-cache-dir uv
ENV UV_HTTP_TIMEOUT=1200
RUN uv pip install -r requirements.txt --prerelease=allow

ENV FASTER_WHISPER_CACHE=/models/whisper \
    COQUI_TTS_CACHE=/models/tts

RUN mkdir -p "$FASTER_WHISPER_CACHE" "$COQUI_TTS_CACHE"

# Copy backend module
COPY . /app/backend

# Set PYTHONPATH to include the parent directory  
ENV PYTHONPATH="/app:$PYTHONPATH"
## Neo4j credentials are provided via environment at runtime (docker-compose/.env)

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
