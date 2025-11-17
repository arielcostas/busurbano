# PostgreSQL Database Setup

This document describes how to set up the PostgreSQL database for the delay collector.

## Prerequisites

- PostgreSQL 18
- psql

## Database Setup

### 1. Create Database and User

Connect to PostgreSQL as superuser:

```bash
sudo -u postgres psql
```

Create database and user:

```sql
-- Create database
CREATE DATABASE busurbano;

-- Create user
CREATE USER busurbano_collector WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT CONNECT ON DATABASE busurbano TO busurbano_collector;
\c busurbano
GRANT USAGE ON SCHEMA public TO busurbano_collector;
GRANT INSERT, SELECT ON ALL TABLES IN SCHEMA public TO busurbano_collector;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO busurbano_collector;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, SELECT ON TABLES TO busurbano_collector;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO busurbano_collector;
```

### 2. Create Schema

Run the schema file:

```bash
psql -U postgres -d busurbano -f schema.sql
```

Or from within psql:

```sql
\c busurbano
\i schema.sql
```

## Configuration

Update your `.env` file:

```bash
cp .env.example .env
nano .env
```

Set the following:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=busurbano
DB_USER=busurbano_collector
DB_PASSWORD=your_secure_password
```
