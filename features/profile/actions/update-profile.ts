"use server";

import "server-only";

import { profileSchema, type UpdateProfileInput } from "@/features/profile/schemas";

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileInput> {
  const parsed = profileSchema.parse(input);
  // TODO: connect backend via lib/api-client.ts (PATCH /member/profile) - stub echoes input for now
  return parsed;
}
