import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CoachHeader() {
  return (
    <section aria-labelledby="coach-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 id="coach-heading" className="text-xl font-bold tracking-tight">
          Dashboard Pelatih
        </h1>
        <p className="text-xs text-muted-foreground">
          Ringkasan performa latihan mandiri dan monitoring kinematika atlet binaan UKM UNSIL.
        </p>
      </div>
      {/* TODO: wire report export (GET /coach/report) when the backend lands */}
      <Button
        aria-disabled="true"
        title="Unduh rapor (Segera hadir)"
        className="opacity-60 bg-muted/20 border border-dashed border-border/80 text-muted-foreground hover:bg-muted/20 justify-center gap-1.5"
      >
        <Download className="size-4" /> Unduh Rapor Tim (PDF)
        <Badge variant="outline" className="ml-1 text-[10px]">
          Segera hadir
        </Badge>
      </Button>
    </section>
  );
}
