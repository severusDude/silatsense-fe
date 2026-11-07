"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListTodo, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateFollowUpTaskAction } from "@/features/member/actions/update-follow-up-task";
import type { FollowUpTaskViewModel } from "@/features/member/types";

export function SessionFollowUpTasks({
  tasks,
  sessionId,
}: {
  tasks: FollowUpTaskViewModel[];
  sessionId: string;
}) {
  const router = useRouter();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  if (tasks.length === 0) return null;

  async function handleUpdateStatus(
    taskId: string,
    status: "completed" | "dismissed",
  ) {
    setPendingTaskId(taskId);
    try {
      const res = await updateFollowUpTaskAction({ taskId, sessionId, status });
      if (!res.ok) {
        toast.error(res.error.message || "Gagal memperbarui status tugas.");
        return;
      }
      toast.success(
        status === "completed"
          ? "Tugas ditandai selesai."
          : "Tugas diabaikan.",
      );
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setPendingTaskId(null);
    }
  }

  return (
    <section aria-label="Tugas tindak lanjut pelatih" className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <ListTodo aria-hidden="true" className="size-4 text-muted-foreground" />
              Tugas Tindak Lanjut Pelatih
            </CardTitle>
            <Badge variant="outline">{tasks.length} Tugas</Badge>
          </div>
          <CardDescription>
            Instruksi perbaikan teknik dari pelatih untuk dikerjakan mandiri
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {tasks.map((task) => {
            const isOpen = task.status === "open";
            const isCompleted = task.status === "completed";
            const isBusy = pendingTaskId === task.id;

            return (
              <div
                key={task.id}
                className="flex flex-col gap-2 rounded-xl border bg-muted/10 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      {task.instruction}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Oleh: {task.authorName} • Diperbarui: {task.updatedAtLabel}
                    </p>
                  </div>
                  <Badge
                    variant={
                      isCompleted ? "success" : isOpen ? "warning" : "secondary"
                    }
                  >
                    {task.statusLabel}
                  </Badge>
                </div>

                {isOpen ? (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-muted/30">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(task.id, "dismissed")}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      <X aria-hidden="true" className="mr-1 size-3.5" />
                      Abaikan
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(task.id, "completed")}
                      className="h-7 text-xs"
                    >
                      <Check aria-hidden="true" className="mr-1 size-3.5" />
                      Tandai Selesai
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
