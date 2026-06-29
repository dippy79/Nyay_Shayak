alter table public.case_lookups enable row level security;
drop policy if exists "Case lookups are viewable by everyone" on public.case_lookups;
drop policy if exists "Users can insert case lookups" on public.case_lookups;
create policy "authenticated_read_case" on public.case_lookups for select using (auth.role() = 'authenticated');
create policy "service_insert_case" on public.case_lookups for insert with check (auth.role() = 'service_role');
create policy "service_update_case" on public.case_lookups for update using (auth.role() = 'service_role');

