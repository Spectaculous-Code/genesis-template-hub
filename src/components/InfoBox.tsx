import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFinnishBookName } from "@/lib/bookNameMapping";

interface InfoBoxProps {
  message: string;
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

const InfoBox = ({ 
  message, 
  onClose, 
  autoHide = true, 
  duration = 5000 
}: InfoBoxProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`
        p-4 bg-card border border-border shadow-lg max-w-sm
        transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-0 transform translate-y-2 scale-95' : 'opacity-100 transform translate-y-0 scale-100'}
        animate-fade-in
      `}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              {message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            onClick={handleClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Helper function to generate next chapter info
export const generateNextChapterInfo = (currentBook: string, currentChapter: number, totalChapters: number): string | null => {
  const finnishBookName = getFinnishBookName(currentBook);
  
  if (currentChapter < totalChapters) {
    return `Seuraava luku: ${finnishBookName} ${currentChapter + 1}`;
  }
  
  // Could extend this to show next book info
  return null;
};

export default InfoBox;