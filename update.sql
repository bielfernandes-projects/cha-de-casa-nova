alter table public.gifts add column if not exists is_pix boolean default false;
alter table public.gifts add column if not exists buyer_name text;
alter table public.gifts add column if not exists notes text;
