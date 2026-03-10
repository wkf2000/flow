FROM node:22-slim AS frontend

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
COPY src/ src/

RUN pip install --no-cache-dir .

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/flow /usr/local/bin/flow
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=frontend /app/frontend/dist /app/static

ENV FLOW_DATA_DIR=/data

EXPOSE 8000

CMD ["uvicorn", "flow.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
