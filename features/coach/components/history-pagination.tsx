import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function HistoryPagination({
  memberId,
  nextCursor,
  hasCursor,
}: {
  memberId: string;
  nextCursor: string | null;
  hasCursor: boolean;
}) {
  if (!nextCursor && !hasCursor) {
    return null;
  }

  return (
    <nav aria-label="Navigasi halaman riwayat sesi" className="flex items-center justify-between gap-2 pt-2">
      {nextCursor ? (
        <Link
          href={`/coach/members/${memberId}/riwayat?cursor=${nextCursor}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Muat Lebih Banyak
        </Link>
      ) : (
        <div />
      )}
      {hasCursor ? (
        <Link
          href={`/coach/members/${memberId}/riwayat`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Kembali ke Awal
        </Link>
      ) : null}
    </nav>
  );
}
