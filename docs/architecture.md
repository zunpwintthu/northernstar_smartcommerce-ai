# Architecture

The React client calls FastAPI REST endpoints. FastAPI owns authentication, transactions, authorization and the SQLAlchemy business model. PostgreSQL is the production-oriented default; SQLite supports quick tests. A separate MCP service imports the canonical model and exposes only explicit read tools, validates roles and records every successful invocation in `audit_logs`. The in-process AI router classifies questions and queries trusted data. Ollama can generate presentation prose from those results, but never becomes the source of price, stock, order, or sales facts.

Checkout validates every cart line, creates the order and snapshots its lines, deducts stock and adds inventory transactions in one database transaction. An exception rolls the whole transaction back.

