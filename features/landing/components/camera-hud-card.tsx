import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/landing/components/shared/image-placeholder";

export function CameraHudCard() {
  return (
    <Card className="gap-0 overflow-hidden border-border bg-foreground py-0 text-background">
      <div className="relative">
        <ImagePlaceholder label="Pratinjau pelacakan pose silat" className="rounded-none border-0" />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="rounded-full">
            <span className="size-2 rounded-full bg-emerald-500" />
            Kamera Stream Aktif
          </Badge>
        </div>
        <div className="absolute top-[56%] left-10">
          <Badge variant="secondary" className="rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Lutut Kiri: 124° [Akurat]
          </Badge>
        </div>
      </div>
      <CardContent className="flex flex-col gap-2 bg-foreground p-3.5 text-background">
        <div className="flex items-center justify-between text-xs">
          <p className="text-background/60">
            Verifikasi Sikap: <span className="font-bold text-background">Kuda-kuda</span>
          </p>
          <p className="flex items-center gap-1 font-semibold text-emerald-400">
            <BadgeCheck className="size-3.5" /> Optimal
          </p>
        </div>
        <p className="rounded-xl bg-background/10 p-2 text-xs text-background/60">
          Punggung tegak sempurna. Turunkan pusat massa (Center of Mass) sebesar 3 cm untuk traksi
          maksimal.
        </p>
      </CardContent>
    </Card>
  );
}
