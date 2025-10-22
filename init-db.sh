#!/bin/bash

# Wait for SQL Server to be ready
sleep 10s

# Create database
/opt/mssql-tools/bin/sqlcmd -S mssql -U sa -P YourStrong@Passw0rd -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CustomerServiceDB') CREATE DATABASE CustomerServiceDB"

echo "Database initialized successfully"
