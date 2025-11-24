-- Drop duplicate RLS policies that reference wrong schema (bible_schema) for summary tables
-- These tables are actually in public schema

-- Fix summary_bible_references policies
DROP POLICY IF EXISTS "Users can create bible references in their summary groups" ON public.summary_bible_references;
DROP POLICY IF EXISTS "Users can view their summary bible references" ON public.summary_bible_references;
DROP POLICY IF EXISTS "Users can update their summary bible references" ON public.summary_bible_references;
DROP POLICY IF EXISTS "Users can delete their summary bible references" ON public.summary_bible_references;

-- Recreate with correct schema references (public schema)
CREATE POLICY "Users can create bible references in their summary groups" 
ON public.summary_bible_references
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = summary_bible_references.group_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their summary bible references" 
ON public.summary_bible_references
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = summary_bible_references.group_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their summary bible references" 
ON public.summary_bible_references
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = summary_bible_references.group_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their summary bible references" 
ON public.summary_bible_references
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = summary_bible_references.group_id 
    AND s.user_id = auth.uid()
  )
);

-- Fix summary_groups policies
DROP POLICY IF EXISTS "Users can create summary groups in their summaries" ON public.summary_groups;
DROP POLICY IF EXISTS "Users can view their summary groups" ON public.summary_groups;
DROP POLICY IF EXISTS "Users can update their summary groups" ON public.summary_groups;
DROP POLICY IF EXISTS "Users can delete their summary groups" ON public.summary_groups;

CREATE POLICY "Users can create summary groups in their summaries" 
ON public.summary_groups
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.summaries s
    WHERE s.id = summary_groups.summary_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their summary groups" 
ON public.summary_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.summaries s
    WHERE s.id = summary_groups.summary_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their summary groups" 
ON public.summary_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.summaries s
    WHERE s.id = summary_groups.summary_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their summary groups" 
ON public.summary_groups
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.summaries s
    WHERE s.id = summary_groups.summary_id 
    AND s.user_id = auth.uid()
  )
);

-- Fix summaries policies
DROP POLICY IF EXISTS "Users can create their own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can view their own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can update their own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can delete their own summaries" ON public.summaries;

CREATE POLICY "Users can create their own summaries" 
ON public.summaries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own summaries" 
ON public.summaries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
ON public.summaries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" 
ON public.summaries
FOR DELETE
USING (auth.uid() = user_id);