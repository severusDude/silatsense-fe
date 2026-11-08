import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberFeedbackForm } from "@/features/coach/components/member-feedback-form";
import type { CoachMemberDetailViewModel } from "@/features/coach/types";

export function MemberFeedbackCard({
  memberId,
  memberName,
  feedback,
}: {
  memberId: string;
  memberName: string;
  feedback: CoachMemberDetailViewModel["feedback"];
}) {
  if (!feedback.sessionId) {
    return (
      <Card className="opacity-60 bg-muted/20 border border-dashed border-border/80">
        <CardHeader>
          <CardTitle>Feedback Koreksi Pelatih</CardTitle>
          <CardDescription>Belum ada sesi untuk diulas.</CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          Atlet {memberName} belum memiliki sesi latihan yang dapat diulas.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Koreksi Pelatih</CardTitle>
        <CardDescription>
          Tuliskan instruksi teknis langsung ke aplikasi atlet {memberName}
          {feedback.sessionLabel ? ` (${feedback.sessionLabel})` : ""}.
        </CardDescription>
      </CardHeader>
      <MemberFeedbackForm
        memberId={memberId}
        memberName={memberName}
        feedback={feedback}
      />
    </Card>
  );
}
