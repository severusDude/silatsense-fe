import { PersiapanPage } from "@/features/member/pages/persiapan-page";

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PersiapanPage params={params} />;
}
