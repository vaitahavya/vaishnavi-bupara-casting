import { useState } from 'react';
import { ChevronDown, ChevronUp, HeartHandshake, Eye, UserCheck, Sparkles } from 'lucide-react';
import type { RoleBrief } from '../types';

interface RoleBriefCardProps {
  role: RoleBrief;
  candidateCount: number;
  approvedCount: number;
}

export function RoleBriefCard({ role, candidateCount, approvedCount }: RoleBriefCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="rounded-2xl border border-[#E5DFD5] bg-white shadow-[0_1px_2px_rgba(26,24,22,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-meta rounded-full border border-[#E4D7BE] bg-[#FDF9F0] px-2.5 py-0.5 text-[11px] font-medium text-[#8A5A10]">
              {role.storylineLabel}
            </span>
            <span className="font-mono-meta rounded-full border border-[#E5DFD5] bg-[#FAF8F4] px-2.5 py-0.5 text-[11px] text-[#5D564E]">
              Age: {role.ageSummary}
            </span>
            {approvedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#B6DFC8] bg-[#E6F4EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B5E41]">
                <UserCheck className="h-3 w-3" />
                {approvedCount} Approved
              </span>
            )}
            <span className="text-xs text-[#666057]">
              · {candidateCount} {candidateCount === 1 ? 'submission' : 'submissions'}
            </span>
          </div>
          <h2 className="editorial-role-title mt-1.5 font-semibold text-[#1A1816]">
            {role.name}{' '}
            <span className="font-sans text-sm font-normal text-[#666057]">
              — {role.subtitle}
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#E5DFD5] bg-[#FAF8F4] px-3 py-1.5 text-xs font-medium text-[#5D564E] transition hover:bg-[#EFECE5] hover:text-[#1A1816]"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              Hide Brief <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show Brief <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="grid gap-4 border-t border-[#EFECE5] bg-[#FCFBF8] px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5A10]">
              <Sparkles className="h-3.5 w-3.5" />
              Age & Build
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#2C2722]">
              <strong className="font-semibold">Age:</strong> {role.ageRange}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#2C2722]">
              <strong className="font-semibold">Build:</strong> {role.build}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5A10]">
              <Eye className="h-3.5 w-3.5" />
              Look & Styling
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#2C2722]">{role.look}</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5A10]">
              <UserCheck className="h-3.5 w-3.5" />
              Character Read
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#2C2722]">{role.characterRead}</p>
            {role.pairingNote && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-[#EADBC2] bg-[#FDF8EC] px-2.5 py-2 text-[11px] leading-snug text-[#7D5B24]">
                <HeartHandshake className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>Pairing note:</strong> {role.pairingNote}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
