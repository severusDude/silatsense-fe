import { CoachLayout } from "@/features/coach/pages/coach-layout";
import { CoachDashboardPage } from "@/features/coach/pages/coach-dashboard-page";

export default function Page() {
  return (
    <CoachLayout>
      <CoachDashboardPage />
    </CoachLayout>
  );
}
