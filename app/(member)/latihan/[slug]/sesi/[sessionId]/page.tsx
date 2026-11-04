import { SesiPage } from "@/features/member/pages/sesi-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  const { slug, sessionId } = await params;
  return <SesiPage slug={slug} sessionId={sessionId} />;
}
