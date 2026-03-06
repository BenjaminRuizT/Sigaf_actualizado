FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN echo '#!/bin/sh' > /start.sh && \
    echo 'exec uvicorn server:app --host 0.0.0.0 --port $PORT' >> /start.sh && \
    chmod +x /start.sh

ENTRYPOINT ["/bin/sh", "/start.sh"]
