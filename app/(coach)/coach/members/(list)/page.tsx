import { CoachMembersPage } from "@/features/coach/pages/coach-members-page";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <CoachMembersPage searchParams={searchParams} />;
}
