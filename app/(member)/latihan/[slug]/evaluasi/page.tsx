import { evaluasiSlugs } from "@/features/member/data/get-evaluasi";
import { EvaluasiPage } from "@/features/member/pages/evaluasi-page";

export function generateStaticParams() {
  return evaluasiSlugs.map((slug) => ({ slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EvaluasiPage slug={slug} />;
}
