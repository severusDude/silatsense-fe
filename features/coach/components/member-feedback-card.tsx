import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberFeedbackForm } from "@/features/coach/components/member-feedback-form";

export function MemberFeedbackCard({ memberId, memberName }: { memberId: string; memberName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Koreksi Pelatih</CardTitle>
        <CardDescription>Tuliskan instruksi teknis langsung ke aplikasi atlet {memberName}.</CardDescription>
      </CardHeader>
      <MemberFeedbackForm memberId={memberId} memberName={memberName} />
    </Card>
  );
}
