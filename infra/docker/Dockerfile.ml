FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY ml_services/hf_space/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml_services/ /app/ml_services/
COPY ml_services/hf_space/app.py /app/app.py

ENV PYTHONPATH=/app
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
