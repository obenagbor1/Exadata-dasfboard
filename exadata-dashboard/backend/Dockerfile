FROM python:3.11-slim

# Oracle Instant Client dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        libaio1 \
        wget \
        unzip \
        && rm -rf /var/lib/apt/lists/*

# NOTE: Download Oracle Instant Client Basic Light (21c or 23c) from Oracle's
# website and place the unzipped contents in ./instantclient before building.
# We can't download it here because it requires accepting Oracle's licence.
COPY instantclient /opt/oracle/instantclient
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient
ENV ORACLE_CLIENT_LIB_DIR=/opt/oracle/instantclient

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY .env .env

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
