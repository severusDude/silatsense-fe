import { sessionDetailIds } from "@/features/member/data/get-session-detail";
import { SessionDetailPage } from "@/features/member/pages/session-detail-page";

export function generateStaticParams() {
  return sessionDetailIds.map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionDetailPage id={id} />;
}
