import { DemoForm } from "@/components/demo-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">SilatSense</h1>
        <p className="max-w-md text-muted-foreground">
          Next.js + shadcn/ui + React Hook Form + Zod + TanStack Query +
          Next Top Loader. Edit <code className="font-mono">app/page.tsx</code>{" "}
          to get started.
        </p>
        <DemoForm />
      </main>
    </div>
  );
}
