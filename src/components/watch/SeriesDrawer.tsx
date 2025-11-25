import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface VideoClip {
  id: string;
  order_index: number;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
}

interface SeriesDrawerProps {
  open: boolean;
  onClose: () => void;
  seriesTitle: string;
  videos: VideoClip[];
  currentVideoId: string;
  onVideoSelect: (orderIndex: number) => void;
}

export const SeriesDrawer = ({
  open,
  onClose,
  seriesTitle,
  videos,
  currentVideoId,
  onVideoSelect,
}: SeriesDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>{seriesTitle}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(80vh-80px)] mt-4">
          <div className="space-y-2 pr-4">
            {videos.map((video) => (
              <Button
                key={video.id}
                variant={video.id === currentVideoId ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => {
                  onVideoSelect(video.order_index);
                  onClose();
                }}
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-semibold text-sm">
                      {video.order_index}.
                    </span>
                    <span className="font-medium flex-1">{video.title}</span>
                  </div>
                  {video.subtitle && (
                    <span className="text-xs text-muted-foreground ml-6">
                      {video.subtitle}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
