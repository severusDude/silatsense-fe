import { memberDetailIds } from "@/features/coach/data/get-member-detail";
import { MemberDetailPage } from "@/features/coach/pages/member-detail-page";

export function generateStaticParams() {
  return memberDetailIds.map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetailPage id={id} />;
}
