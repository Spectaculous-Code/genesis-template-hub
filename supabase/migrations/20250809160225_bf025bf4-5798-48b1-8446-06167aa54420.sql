-- Enable RLS on the materialized view (publicly readable for Bible content)
ALTER MATERIALIZED VIEW public.chapter_verses_mv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapter verses are publicly readable" 
ON public.chapter_verses_mv 
FOR SELECT 
USING (true);