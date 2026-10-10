import { rekamSlugs } from "@/features/member/data/get-rekam";
import { RekamPage } from "@/features/member/pages/rekam-page";

export function generateStaticParams() {
  return rekamSlugs.map((slug) => ({ slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RekamPage slug={slug} />;
}
