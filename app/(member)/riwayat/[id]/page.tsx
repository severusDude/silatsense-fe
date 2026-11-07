import { SessionDetailPage } from "@/features/member/pages/session-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionDetailPage id={id} />;
}
