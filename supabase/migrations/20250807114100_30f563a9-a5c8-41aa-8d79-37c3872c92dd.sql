-- Create Bible versions table
CREATE TABLE public.bible_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  language VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Bible books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  testament VARCHAR(10) NOT NULL CHECK (testament IN ('old', 'new')),
  book_order INTEGER NOT NULL,
  chapters_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, testament)
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  verses_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

-- Create verses table
CREATE TABLE public.verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.bible_versions(id) ON DELETE CASCADE,
  verse_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, version_id, verse_number)
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user markings table
CREATE TABLE public.user_markings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES public.verses(id) ON DELETE CASCADE,
  marking_type VARCHAR(20) NOT NULL CHECK (marking_type IN ('highlight', 'comment', 'like')),
  content TEXT, -- For comments
  color VARCHAR(20), -- For highlight colors
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, verse_id, marking_type)
);

-- Create user reading history table
CREATE TABLE public.user_reading_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable Row Level Security
ALTER TABLE public.bible_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_markings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public Bible data (readable by everyone)
CREATE POLICY "Bible versions are publicly readable" ON public.bible_versions FOR SELECT USING (true);
CREATE POLICY "Books are publicly readable" ON public.books FOR SELECT USING (true);
CREATE POLICY "Chapters are publicly readable" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Verses are publicly readable" ON public.verses FOR SELECT USING (true);

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user markings
CREATE POLICY "Users can view their own markings" ON public.user_markings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own markings" ON public.user_markings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own markings" ON public.user_markings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own markings" ON public.user_markings FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for reading history
CREATE POLICY "Users can view their own reading history" ON public.user_reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reading history" ON public.user_reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reading history" ON public.user_reading_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reading history" ON public.user_reading_history FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_markings_updated_at
  BEFORE UPDATE ON public.user_markings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample Bible version
INSERT INTO public.bible_versions (code, name, language) VALUES ('KR92', 'Kirkkoraamattu 1992', 'fi');

-- Insert sample books (you can add more later)
INSERT INTO public.books (name, testament, book_order, chapters_count) VALUES 
  ('Matteus', 'new', 1, 28),
  ('Markus', 'new', 2, 16),
  ('Luukas', 'new', 3, 24),
  ('Johannes', 'new', 4, 21),
  ('1. Mooseksen kirja', 'old', 1, 50),
  ('2. Mooseksen kirja', 'old', 2, 40),
  ('Psalmit', 'old', 19, 150);