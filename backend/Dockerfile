# ─── Base image ───────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Keeps Python from generating .pyc files and forces unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────────
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ─── Application source ───────────────────────────────────────────────────────
COPY . .

# ─── Non-root user ────────────────────────────────────────────────────────────
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup --no-create-home appuser \
 && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Uvicorn binds on all interfaces so Docker networking can reach it.
# Workers=1 keeps the in-memory cache consistent across the process.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
