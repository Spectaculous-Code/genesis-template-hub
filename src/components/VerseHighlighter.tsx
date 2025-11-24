import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Highlighter, MessageSquare, Share, BookOpen, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface Verse {
  number: number;
  text: string;
}

interface VerseHighlighterProps {
  verse: Verse;
  isHighlighted: boolean;
  isCurrentVerse: boolean;
  onHighlight: () => void;
  onVerseClick: () => void;
  book?: string;
  chapter?: number;
  versionCode?: string;
}

const VerseHighlighter = ({ 
  verse, 
  isHighlighted, 
  isCurrentVerse, 
  onHighlight, 
  onVerseClick,
  book,
  chapter,
  versionCode = 'finstlk201'
}: VerseHighlighterProps) => {
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const addToSummary = async () => {
    if (!user || !book || !chapter) {
      toast({
        title: "Virhe",
        description: "Käyttäjätiedot tai jakeen tiedot puuttuvat",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get version_id from versionCode (use bible_schema)
      const { data: versionData } = await (supabase as any)
        .schema('bible_schema')
        .from('bible_versions')
        .select('id')
        .eq('code', versionCode)
        .single();

      if (!versionData) {
        throw new Error('Version not found');
      }

      // Get or create the latest summary
      let { data: latestSummary } = await supabase
        .from('summaries')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Create a new summary if none exists
      if (!latestSummary) {
        const { data: newSummary, error: summaryError } = await supabase
          .from('summaries')
          .insert({
            user_id: user.id,
            title: `Uusi kooste ${new Date().toLocaleDateString('fi-FI')}`
          })
          .select('id, title')
          .single();

        if (summaryError) throw summaryError;
        latestSummary = newSummary;
      }

      // Get or create the first group in the summary
      let { data: firstGroup } = await supabase
        .from('summary_groups')
        .select('id')
        .eq('summary_id', latestSummary.id)
        .order('group_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Create first group if none exists
      if (!firstGroup) {
        const { data: newGroup, error: groupError } = await supabase
          .from('summary_groups')
          .insert({
            summary_id: latestSummary.id,
            subtitle: 'Raamatunviittaukset',
            group_order: 0
          })
          .select('id')
          .single();

        if (groupError) throw groupError;
        firstGroup = newGroup;
      }

      // Get the next reference order for this group
      const { data: existingRefs } = await supabase
        .from('summary_bible_references')
        .select('reference_order')
        .eq('group_id', firstGroup.id)
        .order('reference_order', { ascending: false })
        .limit(1);

      const nextOrder = existingRefs && existingRefs.length > 0 ? existingRefs[0].reference_order + 1 : 0;

      // Format the verse reference using Finnish book name (e.g., "1.Moos.3:4")
      const referenceText = `${book}.${chapter}:${verse.number}`;

      // Add the bible reference with version_id
      const { error: refError } = await supabase
        .from('summary_bible_references')
        .insert({
          group_id: firstGroup.id,
          reference_text: referenceText,
          reference_order: nextOrder,
          version_id: versionData.id
        });

      if (refError) throw refError;

      toast({
        title: "Lisätty koosteeseen",
        description: `Jae ${referenceText} lisätty koosteeseen "${latestSummary.title}"`
      });

      // Navigate to summary page
      navigate('/summaries');

    } catch (error) {
      console.error('Error adding to summary:', error);
      toast({
        title: "Virhe",
        description: "Jakeen lisääminen koosteeseen epäonnistui",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      id={`verse-${verse.number}`}
      className={`
        group relative p-3 rounded-lg transition-all duration-300 cursor-pointer
        scroll-mt-24
        ${isCurrentVerse ? 'bg-[hsl(var(--active-verse))]/15 border-2 border-[hsl(var(--active-verse))] ring-4 ring-[hsl(var(--active-verse))]/20 shadow-lg' : ''}
        ${isHighlighted && !isCurrentVerse ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}
        ${!isCurrentVerse && !isHighlighted ? 'hover:bg-accent/50' : ''}
      `}
      onClick={onVerseClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Action buttons - floating in top right */}
      <div className={`
        absolute -top-1 right-2 flex items-center gap-1 
        bg-background/95 backdrop-blur-sm rounded-md p-1 shadow-sm
        opacity-0 group-hover:opacity-100 transition-opacity
        ${showActions ? 'opacity-100' : ''}
      `}>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onHighlight();
          }}
          className={isHighlighted ? 'text-yellow-600 dark:text-yellow-400' : ''}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Future: Add note functionality
          }}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Future: Add sharing functionality
          }}
        >
          <Share className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (book && chapter) {
              const from = location.pathname + location.search;
              const prevRef = { book, chapter, verse: verse.number };
              navigate(`/study/${book}/${chapter}/${verse.number}`, { state: { from, prevRef } });
            }
          }}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            addToSummary();
          }}
          title="Lisää koosteeseen"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium text-primary">
          {verse.number}
        </span>
        
        <p className="flex-1 text-foreground leading-relaxed select-text pr-2">
          {verse.text}
        </p>
      </div>
    </div>
  );
};

export default VerseHighlighter;