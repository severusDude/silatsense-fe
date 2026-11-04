import { PersiapanPage } from "@/features/member/pages/persiapan-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PersiapanPage slug={slug} />;
}
