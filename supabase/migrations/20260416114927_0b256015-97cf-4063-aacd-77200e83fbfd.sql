CREATE POLICY "Anyone can view recent orders for social proof"
ON public.orders
FOR SELECT
TO anon
USING (true);