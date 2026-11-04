import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionViewModel } from "@/features/member/types";

const STATUS_VARIANTS: Record<
  SessionViewModel["processingStatus"],
  "success" | "warning" | "destructive"
> = {
  queued: "warning",
  processing: "warning",
  completed: "success",
  failed: "destructive",
};

export function SesiInfoCard({ session }: { session: SessionViewModel }) {
  const rows: { label: string; value: string }[] = [
    { label: "Latihan", value: session.trainingName },
    { label: "Durasi", value: session.durationLabel },
    { label: "Mulai", value: session.startedAtLabel },
    { label: "Diunggah", value: session.uploadedAtLabel },
    { label: "Ukuran berkas", value: session.fileSizeLabel },
    { label: "Resolusi", value: session.resolutionLabel },
    { label: "Format", value: session.formatLabel },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <Badge className="bg-destructive/10 text-destructive">
            {session.eyebrow}
          </Badge>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <h2 className="truncate text-lg font-bold">
              {session.trainingName}
            </h2>
            <Badge variant={STATUS_VARIANTS[session.processingStatus]}>
              {session.processingLabel}
            </Badge>
          </div>
        </div>

        {session.analysisStatusLabel ? (
          <p className="text-[11px] text-muted-foreground">
            Analisis: {session.analysisStatusLabel}
          </p>
        ) : null}

        {session.retryOf ? (
          <p className="rounded-xl bg-secondary/50 p-2.5 text-[11px] text-muted-foreground">
            Perbaikan dari sesi{" "}
            <span className="font-semibold text-foreground">{session.retryOf}</span>
          </p>
        ) : null}

        {session.error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-2.5"
          >
            <p className="text-xs font-semibold text-destructive">
              {session.error.detail}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Kode: {session.error.code}
            </p>
          </div>
        ) : null}

        <dl className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-2.5"
            >
              <dt className="shrink-0 text-[11px] font-bold tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="truncate text-xs font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>

        {session.mediaStatus === "available" &&
        session.mediaExpiresAtLabel !== "—" ? (
          <p className="text-[10px] text-muted-foreground">
            Rekaman tersedia hingga {session.mediaExpiresAtLabel}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
