"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/shared/section-heading";
import { faqItems } from "@/features/landing/components/faq-items";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="flex flex-col gap-4">
      <div id="faq-heading">
        <SectionHeading
          eyebrow="Tanya Jawab"
          title="Pertanyaan yang Sering Diajukan"
          description="Segala hal mengenai sistem AI dan keanggotaan UKM Silat UNSIL."
        />
      </div>
      <div className="flex flex-col gap-2">
        {faqItems.map((item, index) => {
          const open = openIndex === index;
          return (
            <Card key={item.question} className="gap-0 py-0">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-2 p-3.5 text-left"
              >
                <span className="text-xs font-bold">{item.question}</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <p className="border-t px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
