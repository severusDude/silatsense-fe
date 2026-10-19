import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function HistoryPagination({
  memberId,
  page,
  totalPages,
  totalSessions,
  rangeStart,
  rangeEnd,
}: {
  memberId: string;
  page: number;
  totalPages: number;
  totalSessions: number;
  rangeStart: number;
  rangeEnd: number;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav aria-label="Navigasi halaman riwayat sesi" className="flex flex-col gap-2.5">
      <p className="text-xs text-muted-foreground">
        Menampilkan <span className="font-bold text-foreground">{rangeStart} - {rangeEnd}</span> dari{" "}
        <span className="font-bold text-foreground">{totalSessions}</span> total sesi biomekanika
      </p>
      <div className="flex items-center justify-between gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft data-icon="inline-start" />
            Sebelumnya
          </Button>
        ) : (
          <Link
            href={`/coach/members/${memberId}/riwayat?page=${page - 1}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft data-icon="inline-start" />
            Sebelumnya
          </Link>
        )}
        <div className="flex items-center gap-1.5">
          {pages.map((entry) =>
            entry === page ? (
              <span key={entry} aria-current="page" className={buttonVariants({ variant: "default", size: "icon" })}>
                {entry}
              </span>
            ) : (
              <Link
                key={entry}
                href={`/coach/members/${memberId}/riwayat?page=${entry}`}
                className={buttonVariants({ variant: "outline", size: "icon" })}
              >
                {entry}
              </Link>
            )
          )}
        </div>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Selanjutnya
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <Link
            href={`/coach/members/${memberId}/riwayat?page=${page + 1}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Selanjutnya
            <ChevronRight data-icon="inline-end" />
          </Link>
        )}
      </div>
    </nav>
  );
}
