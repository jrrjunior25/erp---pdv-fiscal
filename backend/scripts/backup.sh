#!/bin/bash

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_CONTAINER="erp_pdv_postgres"
DB_NAME="erp_pdv"
DB_USER="postgres"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting backup..."

echo "[$(date)] Backing up PostgreSQL database..."
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

echo "[$(date)] Backing up XML files..."
tar -czf $BACKUP_DIR/xmls_$DATE.tar.gz ./storage/xmls 2>/dev/null || echo "No XMLs to backup"

echo "[$(date)] Cleaning old backups (keeping last 30 days)..."
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "[$(date)] Backup completed successfully!"
echo "Backup files:"
ls -lh $BACKUP_DIR/*$DATE*
