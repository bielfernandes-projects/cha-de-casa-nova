-- Tabela de Presentes
create table if not exists public.gifts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric(10, 2) not null,
  image_url text not null,
  purchase_url text not null,
  status text default 'available' check (status in ('available', 'purchased')),
  buyer_message text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS (Row Level Security) para a tabela de presentes
alter table public.gifts enable row level security;

-- Política de Leitura Pública (Qualquer um pode ver os presentes)
create policy "Qualquer um pode ler gifts"
  on public.gifts
  for select
  using (true);

-- Política de Inserção e Atualização (Para simplicidade, deixando liberado. Em produção o ideal seria travar para os donos ou usar server-side para admin)
create policy "Qualquer um pode inserir gifts"
  on public.gifts
  for insert
  with check (true);

create policy "Qualquer um pode atualizar gifts"
  on public.gifts
  for update
  using (true);

-- Script para o Storage Bucket de imagens
insert into storage.buckets (id, name, public) 
values ('gifts-images', 'gifts-images', true)
on conflict (id) do nothing;

create policy "Imagens podem ser vistas por qualquer um"
on storage.objects for select
using ( bucket_id = 'gifts-images' );

create policy "Imagens podem ser enviadas por qualquer um"
on storage.objects for insert
with check ( bucket_id = 'gifts-images' );
