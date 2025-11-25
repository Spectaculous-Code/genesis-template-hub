interface VideoInfoProps {
  title: string;
  subtitle?: string | null;
  description?: string | null;
}

export const VideoInfo = ({ title, subtitle, description }: VideoInfoProps) => {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
      )}
      {description && (
        <p className="text-sm text-foreground/80 leading-relaxed">{description}</p>
      )}
    </div>
  );
};
