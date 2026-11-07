"use client";

import { useSyncExternalStore } from "react";
import { Camera } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CameraDevice } from "@/features/member/types";

const STORAGE_KEY = "silatsense_preferred_camera";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

export function ProfileCameraCard({ cameras }: { cameras: CameraDevice[] }) {
  const savedCamera = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const selectedCamera =
    (savedCamera && cameras.some((c) => c.id === savedCamera)
      ? savedCamera
      : undefined) ??
    cameras[0]?.id ??
    "";

  const handleCameraChange = (cameraId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, cameraId);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore write errors
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-bold">
          <Camera className="size-4" aria-hidden="true" /> Kamera
        </CardTitle>
        <CardDescription>Konfigurasi Input kamera</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field>
          <FieldLabel htmlFor="profil-camera">Perangkat Kamera</FieldLabel>
          <Select
            items={cameras.map((camera) => ({
              label: camera.label,
              value: camera.id,
            }))}
            value={selectedCamera}
            onValueChange={(next) => {
              if (typeof next === "string") handleCameraChange(next);
            }}
          >
            <SelectTrigger
              id="profil-camera"
              className="w-full"
              aria-label="Perangkat kamera"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            Preferensi kamera disimpan secara lokal pada peramban ini.
          </FieldDescription>
        </Field>
      </CardContent>
    </Card>
  );
}
