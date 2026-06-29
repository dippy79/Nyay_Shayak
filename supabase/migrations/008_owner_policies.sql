alter table public.legal_documents enable row level security;
alter table public.consultations enable row level security;
alter table public.lawyers enable row level security;
create policy "owner_select_docs" on public.legal_documents for select using (auth.uid() = user_id);
create policy "owner_insert_docs" on public.legal_documents for insert with check (auth.uid() = user_id);
create policy "owner_select_consult" on public.consultations for select using (auth.uid() = user_id);
create policy "owner_insert_consult" on public.consultations for insert with check (auth.uid() = user_id);
create policy "lawyer_update_self" on public.lawyers for update using (auth.uid() = id);

