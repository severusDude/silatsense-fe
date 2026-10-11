import { Video } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionDetail } from "@/features/member/types";

export function SessionVideoPlaceholder({ session }: { session: SessionDetail }) {
  return (
    <section aria-label="Tinjauan kinematika" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <CardTitle>{session.techniqueName}</CardTitle>
          <CardDescription>{session.techniqueDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {/* TODO: bind real telemetry frame when backend serves media (GET /member/history/:id) — placeholder shell only */}
          <div
            role="img"
            aria-label="Placeholder video telemetri"
            className="-mx-(--card-spacing) flex aspect-video w-auto items-center justify-center bg-foreground"
          >
            <Video aria-hidden="true" className="size-8 text-background/60" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
