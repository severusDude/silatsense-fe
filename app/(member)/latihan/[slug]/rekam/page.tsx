import { RekamPage } from "@/features/member/pages/rekam-page";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <RekamPage params={params} searchParams={searchParams} />;
}
