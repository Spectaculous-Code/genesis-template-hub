-- Create summaries table for main compilations
CREATE TABLE public.summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on summaries
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Create summary_groups table for groups within summaries
CREATE TABLE public.summary_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_id uuid NOT NULL REFERENCES public.summaries(id) ON DELETE CASCADE,
  subtitle text NOT NULL,
  text_content text,
  group_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on summary_groups
ALTER TABLE public.summary_groups ENABLE ROW LEVEL SECURITY;

-- Create summary_bible_references table for Bible references within groups
CREATE TABLE public.summary_bible_references (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.summary_groups(id) ON DELETE CASCADE,
  reference_text text NOT NULL, -- e.g., "1.Moos.1:1" or "Ef.4:7-10"
  reference_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on summary_bible_references
ALTER TABLE public.summary_bible_references ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_summary_groups_summary_id ON public.summary_groups(summary_id);
CREATE INDEX idx_summary_groups_order ON public.summary_groups(summary_id, group_order);
CREATE INDEX idx_summary_bible_references_group_id ON public.summary_bible_references(group_id);
CREATE INDEX idx_summary_bible_references_order ON public.summary_bible_references(group_id, reference_order);

-- RLS policies for summaries
CREATE POLICY "Users can view their own summaries" 
ON public.summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" 
ON public.summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
ON public.summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" 
ON public.summaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for summary_groups
CREATE POLICY "Users can view their summary groups" 
ON public.summary_groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.summaries s 
    WHERE s.id = summary_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create summary groups in their summaries" 
ON public.summary_groups 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.summaries s 
    WHERE s.id = summary_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their summary groups" 
ON public.summary_groups 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.summaries s 
    WHERE s.id = summary_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their summary groups" 
ON public.summary_groups 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.summaries s 
    WHERE s.id = summary_id AND s.user_id = auth.uid()
  )
);

-- RLS policies for summary_bible_references
CREATE POLICY "Users can view their summary bible references" 
ON public.summary_bible_references 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = group_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create bible references in their summary groups" 
ON public.summary_bible_references 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = group_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their summary bible references" 
ON public.summary_bible_references 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = group_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their summary bible references" 
ON public.summary_bible_references 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.summary_groups sg
    JOIN public.summaries s ON s.id = sg.summary_id
    WHERE sg.id = group_id AND s.user_id = auth.uid()
  )
);

-- Create trigger function for updating timestamps
CREATE TRIGGER update_summaries_updated_at
  BEFORE UPDATE ON public.summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_summary_groups_updated_at
  BEFORE UPDATE ON public.summary_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_summary_bible_references_updated_at
  BEFORE UPDATE ON public.summary_bible_references
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();