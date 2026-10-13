"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { filterMembers } from "@/features/coach/components/filter-members";
import { MemberCardList } from "@/features/coach/components/member-card-list";
import type { TeamMember } from "@/features/coach/types";

export function MemberSearch({ members, totalAktif }: { members: TeamMember[]; totalAktif: number }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterMembers(members, query), [members, query]);

  return (
    <div className="flex flex-col gap-2.5">
      <InputGroup className="h-10">
        <InputGroupAddon>
          <Search className="size-4" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atlet atau NIM…"
          aria-label="Cari nama atlet atau NIM"
        />
      </InputGroup>
      <MemberCardList members={filtered} totalAktif={totalAktif} />
    </div>
  );
}
