import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List } from "lucide-react";

interface VideoNavigationProps {
  currentIndex: number;
  totalVideos: number;
  onPrevious: () => void;
  onNext: () => void;
  onShowAll: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const VideoNavigation = ({
  currentIndex,
  totalVideos,
  onPrevious,
  onNext,
  onShowAll,
  hasPrevious,
  hasNext,
}: VideoNavigationProps) => {
  return (
    <div className="space-y-3">
      <div className="text-center text-sm text-muted-foreground">
        Video {currentIndex + 1} / {totalVideos}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex-1"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Edellinen
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={onNext}
          disabled={!hasNext}
          className="flex-1"
        >
          Seuraava
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <Button
        variant="secondary"
        size="lg"
        onClick={onShowAll}
        className="w-full"
      >
        <List className="mr-2 h-4 w-4" />
        Kaikki videot sarjassa
      </Button>
    </div>
  );
};
