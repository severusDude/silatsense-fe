"use client";

import { Component, useEffect, useState, startTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CoachBottomNav } from "@/features/coach/components/coach-bottom-nav";

export function runSegmentRecovery(
  router: { refresh: () => void },
  reset: () => void,
): void {
  router.refresh();
  reset();
}

export function CoachErrorCard({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    console.error("[Coach Segment Error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  const handleRetry = () => {
    setIsPending(true);
    startTransition(() => {
      runSegmentRecovery(router, reset);
      setIsPending(false);
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <Card size="sm" className="w-full max-w-sm border-border/80 shadow-xs">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-sm font-bold">
            Layanan Sedang Mengalami Kendala
          </CardTitle>
          <CardDescription className="text-xs">
            Gagal menghubungkan ke server analisis silat. Silakan coba muat ulang halaman.
          </CardDescription>
        </CardHeader>

        {error.digest ? (
          <CardContent className="text-center">
            <p className="font-mono text-xs text-muted-foreground">
              ID: {error.digest}
            </p>
          </CardContent>
        ) : null}

        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleRetry}
            disabled={isPending}
            size="sm"
            className="w-full gap-1.5 font-bold"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Coba Muat Ulang
          </Button>
          <Link
            href="/coach"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full gap-1.5 text-xs",
            })}
          >
            Kembali ke Dasbor
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export class CoachMainErrorBoundary extends Component<
  { children: ReactNode },
  { error: (Error & { digest?: string }) | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error & { digest?: string }) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <CoachErrorCard
          error={this.state.error}
          reset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function CoachSegmentFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col gap-5 px-4 pt-4 pb-8">
        <CoachErrorCard error={error} reset={reset} />
      </main>
      <CoachBottomNav />
    </div>
  );
}
