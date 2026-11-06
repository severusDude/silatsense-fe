import { SesiPage } from "@/features/member/pages/sesi-page";

export default function Page({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  return <SesiPage params={params} />;
}
