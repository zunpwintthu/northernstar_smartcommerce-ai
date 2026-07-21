alter table public.products
  add column if not exists original_price numeric(12,2),
  add column if not exists discount_percent integer not null default 0;

alter table public.products
  drop constraint if exists products_discount_percent_check;

alter table public.products
  add constraint products_discount_percent_check check (discount_percent between 0 and 99);
