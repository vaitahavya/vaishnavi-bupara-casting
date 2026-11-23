import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, CheckCircle2, Info, CalendarDays } from 'lucide-react';
import type { RoleBrief } from '../types';

interface RoleBriefCardProps {
  role: RoleBrief;
  candidateCount: number;
  approvedCount: number;
  onAddEntry: () => void;
}

export function RoleBriefCard({
  role,
  candidateCount,
  approvedCount,
  onAddEntry,
}: RoleBriefCardProps) {
  // Collapsed by default so talent entries stay front-and-center with minimal text
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [role.id]);

  return (
    <section className="rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="editorial-role-title font-bold text-slate-950">{role.name}</h2>
            <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono-meta text-[11px] font-semibold text-white">
              Age {role.ageSummary}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-amber-100 px-2.5 py-0.5 font-mono-meta text-[11px] font-bold text-amber-950">
              <CalendarDays className="h-3 w-3 text-amber-700" />
              {role.shootDaysCount} {role.shootDaysCount === 1 ? 'Day' : 'Days'} · {role.shootDays}
            </span>
            {approvedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                <CheckCircle2 className="h-3 w-3" />
                {approvedCount} Approved
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600">
            {role.subtitle} · <strong className="text-slate-900">{candidateCount}</strong>{' '}
            {candidateCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-200"
          >
            <Info className="h-3.5 w-3.5 text-amber-600" />
            <span>Role Brief</span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onAddEntry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs sm:grid-cols-3">
          <div>
            <p className="font-mono-meta text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Age & Build
            </p>
            <p className="mt-1 font-medium text-slate-900">{role.ageRange}</p>
            <p className="mt-0.5 text-slate-700">{role.build}</p>
          </div>
          <div>
            <p className="font-mono-meta text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Look
            </p>
            <p className="mt-1 text-slate-800">{role.look}</p>
          </div>
          <div>
            <p className="font-mono-meta text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Character Read
            </p>
            <p className="mt-1 text-slate-800">{role.characterRead}</p>
            {role.pairingNote && (
              <p className="mt-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-950">
                <strong>Pairing:</strong> {role.pairingNote}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
