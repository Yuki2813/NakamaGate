FROM python:3.11-slim

# Buenas prácticas de Python en contenedores
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# WORKDIR raíz: backend/ se importa como paquete (backend.main, backend.seed, ...)
WORKDIR /app

# 1. Instalar dependencias primero (mejor caché de capas)
# El contexto del build es ./backend, así que requirements.txt está en la raíz del contexto
COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# 2. Copiar el código del backend
# COPY . copia todo el contenido del contexto (./backend) a /app/backend
# .dockerignore (en backend/) excluye .env, .venv, __pycache__, tests, etc.
COPY . /app/backend

# Render inyecta PORT en runtime; localmente usamos 8000 por defecto
EXPOSE 8000

# Entrypoint:
#  1. alembic upgrade head  → asegura que el esquema está al día (idempotente)
#  2. python -m backend.seed → garantiza que existe el admin (idempotente)
#  3. uvicorn                 → arranca la API
# El "cd backend" es necesario porque alembic.ini usa rutas relativas a su carpeta.
CMD ["sh", "-c", "cd /app/backend && alembic upgrade head && cd /app && python -m backend.seed && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
