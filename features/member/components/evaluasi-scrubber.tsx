export function EvaluasiScrubber() {
  return (
    <div
      role="img"
      aria-label="Linimasa ulangan 1 sampai 15, puncak pada ulangan 11 bingkai 245"
      className="flex flex-col gap-1.5"
    >
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: "65%" }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-[9px] font-medium text-muted-foreground">
        <span>00:00 (Rep #1)</span>
        <span className="font-bold text-warning-foreground">
          Puncak: Rep #11 (Frame 245 - 02:18)
        </span>
        <span>03:45 (Rep #15)</span>
      </div>
    </div>
  );
}
