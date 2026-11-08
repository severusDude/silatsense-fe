import { MemberDetailPage } from "@/features/coach/pages/member-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetailPage id={id} />;
}
