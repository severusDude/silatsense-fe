"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 60;

export function SessionStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    pollsRef.current = 0;

    const id = window.setInterval(() => {
      pollsRef.current += 1;
      if (pollsRef.current >= MAX_POLLS) {
        setTimedOut(true);
        window.clearInterval(id);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [active, router]);

  if (!active) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 p-2.5"
    >
      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Loader2
          aria-hidden="true"
          className="size-3.5 animate-spin motion-reduce:animate-none"
        />
        {timedOut
          ? "Pemrosesan lebih lama dari biasanya."
          : "Menunggu analisis selesai…"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.refresh()}
      >
        <RefreshCw data-icon="inline-start" /> Muat ulang
      </Button>
    </div>
  );
}
