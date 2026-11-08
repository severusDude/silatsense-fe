import { MemberHistoryPage } from "@/features/coach/pages/member-history-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  return <MemberHistoryPage id={id} searchParams={searchParams} />;
}
