"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileLogoutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full text-destructive"
      onClick={() => {
        // TODO: wire sign-out (auth session clear)
      }}
    >
      <LogOut className="size-4" aria-hidden="true" /> Logout
    </Button>
  );
}
