import { EvaluasiPage } from "@/features/member/pages/evaluasi-page";

export default function Page({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  return <EvaluasiPage params={params} />;
}
