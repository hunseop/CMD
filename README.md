# CMD Dashboard

The CMD (Centralized Management Dashboard) application provides a unified interface for managing firewall and proxy devices. It is built with Flask and SQLAlchemy and includes utilities for uploading device information from Excel files.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Copy the provided example environment file and adjust the values:

```bash
cp .env.example .env
# Edit .env and set SECRET_KEY and DATABASE_URL
```

## Running the Application

Initialize the database and start the dashboard with:

```bash
python run.py
```

The script creates the database tables on first run and launches the server on port 5000.

## Running Tests

Execute the test suite with:

```bash
pytest
```

Tests use an in-memory SQLite database and do not affect your local data.
