import { EvaluasiPage } from "@/features/member/pages/evaluasi-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  const { slug, sessionId } = await params;
  return <EvaluasiPage slug={slug} sessionId={sessionId} />;
}
