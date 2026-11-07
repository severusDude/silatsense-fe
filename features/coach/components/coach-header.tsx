import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoachHeader() {
  return (
    <section aria-labelledby="coach-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 id="coach-heading" className="text-xl font-bold tracking-tight">
          Dashboard Pelatih
        </h1>
        <p className="text-xs text-muted-foreground">
          Ringkasan performa latihan mandiri dan monitoring kinematika 5 atlet binaan UKM UNSIL.
        </p>
      </div>
      {/* TODO: wire report export (GET /coach/report) when the backend lands */}
      <Button aria-disabled="true" title="Unduh rapor (TODO)">
        <Download className="size-4" /> Unduh Rapor Tim (PDF)
      </Button>
    </section>
  );
}
