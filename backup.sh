#!/bin/bash

# Variables
CONTAINER_NAME="mysql-db"
DB_NAME="is2025_v4"
DB_USER="root"
DB_PASS="root"
BACKUP_DIR="/home/angelo/projects/Laravel_React/IS_TNT/dbBackup"
DATE=$(date +"%b_%d_%Y_%I%p")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run the mysqldump inside the mysql container and save backup on host machine
docker exec $CONTAINER_NAME sh -c "exec mysqldump -u$DB_USER -p$DB_PASS $DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
else
  echo "Backup failed!"
fi
