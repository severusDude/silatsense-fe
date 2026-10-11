import { CalendarDays, ClipboardCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

const pillarBadgeVariant = {
  success: "success",
  destructive: "destructive",
  warning: "warning",
} as const;

export function SessionKelayakanCard({ session }: { session: SessionDetail }) {
  return (
    <section aria-label="Status kelayakan tanding" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Status Kelayakan Tanding</CardTitle>
          <CardDescription>Standar Kualifikasi UKM Silat UNSIL</CardDescription>
          <CardAction>
            <Badge variant="outline">IPSI CLASS B</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-xl border-l-4 border-warning bg-warning/10 p-2.5">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
            <p className="text-[11px] leading-relaxed text-foreground">
              <span className="font-bold">Perlu remidiasi sebelum uji tanding. </span>
              Skor akumulatif biomekanika saat ini{" "}
              <span className="font-bold">{session.scorePct}%</span>. Batas minimum
              lolos adalah <span className="font-bold">{session.targetPct}%</span>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="flex flex-col gap-1 rounded-xl border p-2.5"
              >
                <p className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-foreground">
                    {pillar.name}
                  </span>
                  <Badge variant={pillarBadgeVariant[pillar.badge]}>
                    {pillar.stageLabel}
                  </Badge>
                </p>
                <p className="flex items-baseline justify-between gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{pillar.detail}</span>
                  <span className="text-base font-bold">{pillar.scorePct}%</span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 border-t pt-2.5">
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed">
              <ClipboardCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <span className="font-bold">Syarat Kelulusan:</span>{" "}
                <span className="text-muted-foreground">
                  Minimal seluruh 4 pilar dasar mencapai skor ≥ 85% serta
                  verifikasi langsung pelatih di dojo.
                </span>
              </span>
            </p>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed">
              <ClipboardCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <span className="font-bold">Catatan Penguji:</span>{" "}
                <span className="text-muted-foreground">
                  Wajib selesaikan paket drill mandiri sebelum mendaftar sesi
                  tatap muka.
                </span>
              </span>
            </p>
          </div>
          <p className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">{session.retestLabel}</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              {session.retestValue}
            </span>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
