FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY . /app/backend

EXPOSE 8000

CMD ["sh", "-c", "cd /app/backend && alembic upgrade head && cd /app && python -m backend.seed && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
