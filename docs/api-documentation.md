# API guide

Interactive documentation is available at `/docs`. Public reads include categories, products, payment methods and delivery methods. Cart, checkout, tracking and AI chat require `Authorization: Bearer <JWT>`. `/api/admin/*` endpoints enforce staff or administrator roles, with payment confirmation and financial reports reserved for administrators.

Important workflow endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/cart/items`, `POST /api/checkout`, `GET /api/orders/{reference}`, `PATCH /api/admin/orders/{id}/status`, `GET /api/admin/reports/summary`, and `POST /api/ai/chat`.

