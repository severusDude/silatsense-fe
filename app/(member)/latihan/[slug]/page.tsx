import { persiapanSlugs } from "@/features/member/data/get-persiapan";
import { PersiapanPage } from "@/features/member/pages/persiapan-page";

export function generateStaticParams() {
  return persiapanSlugs.map((slug) => ({ slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PersiapanPage slug={slug} />;
}
