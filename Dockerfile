FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml ./
COPY src/ src/

RUN uv pip install --system --no-cache .

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/flow /usr/local/bin/flow
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

ENV FLOW_DATA_DIR=/data

EXPOSE 8000

CMD ["uvicorn", "flow.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
