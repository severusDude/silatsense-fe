type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance uppercase">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
