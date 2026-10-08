"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navLinks = [
  { label: "Beranda", href: "#beranda" },
  { label: "Kurikulum", href: "#kurikulum" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[448px] items-center justify-between px-4">
        <Link href="#beranda" className="flex items-center gap-2.5">
          <span className="font-heading flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            S
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-base font-bold tracking-tight">SILATSENSE</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              UKM Pencak Silat UNSIL
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/sign-up" className={buttonVariants({ size: "sm", className: "rounded-full" })}>
            Mulai Latihan <ArrowRight data-icon="inline-end" />
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                  >
                    {open ? <X className="size-4" /> : <Menu className="size-4" />}
                  </Button>
                }
              />
              <TooltipContent>{open ? "Tutup menu" : "Buka menu"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {open && (
        <nav aria-label="Navigasi utama" className="border-t">
          <ul className="mx-auto flex w-full max-w-[448px] flex-col px-4 py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-sm font-medium text-primary hover:bg-muted"
              >
                Masuk
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
