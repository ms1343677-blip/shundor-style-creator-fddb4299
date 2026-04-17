-- Allow anonymous users to read profile names for social proof on homepage
CREATE POLICY "Anyone can view profile names for social proof"
ON public.profiles
FOR SELECT
TO anon
USING (true);