-- Allow authenticated users to create their own pending orders (checkout without service role).
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders for insert with check (user_id = auth.uid());
