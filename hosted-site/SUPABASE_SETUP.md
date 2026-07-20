# Supabase free-tier setup

1. Create a free Supabase project.
2. Open the SQL editor and run `supabase/migrations/001_products.sql`.
3. Copy the project URL, anon key, and service-role key from Project Settings → API.
4. Configure the hosted environment variables from `.env.example`. Keep the service-role key secret.
5. Add comma-separated staff emails to `STAFF_EMAILS`. The owner email belongs in `ADMIN_EMAILS`.

Public visitors can only read active products through Row Level Security. Product writes pass through the server route, require ChatGPT sign-in, validate the admin/staff email, and use the service-role credential only on the server.
