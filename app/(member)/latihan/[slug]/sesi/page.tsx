import { sesiSlugs } from "@/features/member/data/get-sesi";
import { SesiPage } from "@/features/member/pages/sesi-page";

export function generateStaticParams() {
  return sesiSlugs.map((slug) => ({ slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SesiPage slug={slug} />;
}
