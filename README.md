# SmartCommerce AI

SmartCommerce AI is a full-stack commerce platform for markets where conventional online payment gateways are unavailable. Customers browse a polished catalogue, build a cart, choose manual payment and local delivery, place a transactional order, and track it. Staff manage orders and low stock; administrators view grounded reports and use a read-only AI assistant.

## What works

- Customer registration, JWT login, catalogue search, product details, cart and stock validation
- Transactional checkout, unique order references, manual payment instructions, delivery fees and WhatsApp click-to-chat links
- Customer order history and tracking; staff/admin order status management
- Product/category administration with role checks
- Inventory deductions and transaction records
- Admin summary, product sales, low-stock view and CSV export
- Grounded AI intent routing for catalogue, low stock and confirmed-sales questions
- Separate role-aware, audited read-only MCP HTTP tool service
- Responsive React storefront and administration overview
- PostgreSQL/SQLite support, Docker Compose, seed/admin scripts and CI tests

The first release intentionally keeps SMTP delivery, uploaded payment evidence, full PDF/Excel exports, Alembic revision history, scheduled alert delivery, and full Ollama-generated prose as extension points. Core answers remain deterministic and database-grounded when Ollama is unavailable.

## Quick start with Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
docker compose exec backend python scripts/seed_database.py
docker compose exec backend python scripts/create_admin.py
docker compose exec ollama ollama pull qwen2.5:7b
```

- Storefront: http://localhost:5173
- API/OpenAPI: http://localhost:8000/docs
- MCP tools: http://localhost:8001/docs
- Ollama: http://localhost:11434

For a lightweight local backend, leave `DATABASE_URL` unset and run from `backend/`; SQLite is used automatically.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/seed_database.py
uvicorn app.main:app --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Demo access

Customer accounts are created through `/login`. Create an admin with `python backend/scripts/create_admin.py` (or the Docker command above); no insecure default password is shipped.

## Sample requests

```bash
curl http://localhost:8000/health
curl 'http://localhost:8000/api/products?q=shirt'
curl -X POST http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Jane Doe","email":"jane@example.com","password":"change-this-password"}'
curl 'http://localhost:8001/tools/search_products?q=shirt' -H 'X-User-Role: customer'
```

See [architecture](docs/architecture.md), [API notes](docs/api-documentation.md), and [MCP tools](docs/mcp-tools.md).

## Screenshots

Run the frontend and add screenshots of the home, product, checkout and admin pages here for the portfolio release.

