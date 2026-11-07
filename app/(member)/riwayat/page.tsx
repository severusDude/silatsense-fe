import { RiwayatPage } from "@/features/member/pages/riwayat-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <RiwayatPage searchParams={searchParams} />;
}
