import { ImageIcon } from "lucide-react";

type ImagePlaceholderProps = {
  label: string;
  className?: string;
};

/** Dashed placeholder box until real photos land (per plan: images later). */
export function ImagePlaceholder({ label, className }: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${label} — placeholder`}
      className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted p-4 text-center text-xs text-muted-foreground ${className ?? ""}`}
    >
      <ImageIcon className="size-5" />
      <span>{label} — placeholder</span>
    </div>
  );
}
