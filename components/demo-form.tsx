'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { demoSchema, type DemoInput } from '@/lib/schemas';

async function fakeSubmit(values: DemoInput) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return values;
}

export function DemoForm() {
  const form = useForm<DemoInput>({
    resolver: zodResolver(demoSchema),
    defaultValues: { name: '', email: '' },
    mode: 'onBlur',
  });

  const mutation = useMutation({
    mutationFn: fakeSubmit,
    onSuccess: (data) => {
      toast.success('Submitted', {
        description: `Hello ${data.name} (${data.email}) — stack is wired.`,
      });
      form.reset();
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Stack check</CardTitle>
        <CardDescription>
          RHF + Zod + TanStack Query + shadcn + Sonner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="demo-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="demo-name"
                    placeholder="Pendekar Kilat"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="demo-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="demo-email"
                    type="email"
                    placeholder="pendekar@silatsense.id"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                  />
                  <FieldDescription>
                    Validated client-side with the shared Zod schema.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
