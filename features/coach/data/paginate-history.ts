import type { HistoryPageSession } from "@/features/coach/types";

export interface HistoryPageSlice {
  sessions: HistoryPageSession[];
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
}

export function parseHistoryPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function paginateHistory(sessions: HistoryPageSession[], page: number, pageSize: number): HistoryPageSlice {
  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const requested = Number.isFinite(page) ? Math.trunc(page) : 1;
  const safePage = Math.min(Math.max(requested, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const slice = sessions.slice(startIndex, startIndex + pageSize);
  return {
    sessions: slice,
    page: safePage,
    totalPages,
    rangeStart: slice.length === 0 ? 0 : startIndex + 1,
    rangeEnd: startIndex + slice.length,
  };
}
