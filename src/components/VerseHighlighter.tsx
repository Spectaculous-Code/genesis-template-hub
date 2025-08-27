import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Highlighter, MessageSquare, Share, BookOpen } from "lucide-react";

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
}

const VerseHighlighter = ({ 
  verse, 
  isHighlighted, 
  isCurrentVerse, 
  onHighlight, 
  onVerseClick,
  book,
  chapter
}: VerseHighlighterProps) => {
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();

  return (
    <div 
      id={`verse-${verse.number}`}
      className={`
        group relative p-3 rounded-lg transition-all duration-200 cursor-pointer
        ${isCurrentVerse ? 'bg-primary/10 border border-primary/20' : ''}
        ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}
        hover:bg-accent/50
      `}
      onClick={onVerseClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium text-primary">
          {verse.number}
        </span>
        
        <p className="flex-1 text-foreground leading-relaxed select-text">
          {verse.text}
        </p>
        
        {/* Action buttons */}
        <div className={`
          flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
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
                navigate(`/study/${book}/${chapter}/${verse.number}`);
              }
            }}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerseHighlighter;