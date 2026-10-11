import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreRing } from "@/features/member/components/evaluasi-posture-list";
import { SessionPostureItem } from "@/features/member/components/session-posture-item";
import type { SessionDetail } from "@/features/member/types";

export function SessionPostureList({ session }: { session: SessionDetail }) {
  const empty = session.postures.length === 0;
  const sesuai = session.postures.filter(
    (posture) => posture.status === "sesuai",
  ).length;
  const total = empty ? 5 : session.postures.length;

  return (
    <section aria-label="Catatan pelatih" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Catatan Pelatih</CardTitle>
          <CardDescription>Evaluasi biomekanika kinetik oleh pelatih</CardDescription>
          <CardAction>
            <ScoreRing sesuai={sesuai} total={total} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {empty ? (
            <p className="rounded-xl border bg-secondary/30 p-3 text-xs font-semibold text-foreground">
              Belum ada catatan dari pelatih
            </p>
          ) : (
            session.postures.map((posture) => (
              <SessionPostureItem key={posture.id} posture={posture} />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
