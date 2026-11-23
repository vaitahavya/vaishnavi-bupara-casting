import { Image as ImageIcon, Video, MessageSquare } from 'lucide-react';
import {
  CANDIDATE_STATUS_META,
  ROLES_BY_ID,
  TEAM_ROLES,
  VERDICT_META,
} from '../data/castingBrief';
import type { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  showRoleLabel?: boolean;
  onOpen: (candidate: Candidate) => void;
}

export function CandidateCard({ candidate, showRoleLabel = false, onOpen }: CandidateCardProps) {
  const cover = candidate.photos[0];
  const coverSrc = cover?.thumbDataUrl || cover?.url || null;
  const statusMeta = CANDIDATE_STATUS_META[candidate.status];
  const verdicts = Object.values(candidate.verdicts ?? {});
  const role = ROLES_BY_ID[candidate.roleId];

  return (
    <article className="candidate-card-wrap group overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onOpen(candidate)}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        {/* Big Visual-First Portrait Frame (3:4 prevents CLS) */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={candidate.actorName}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-800 p-4 text-center text-slate-300">
              <Video className="h-9 w-9 text-amber-400" />
              <span className="text-xs font-semibold">Video Entry</span>
            </div>
          )}

          {/* High-Contrast Status Pill */}
          <div className="absolute left-3 top-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-md ${statusMeta.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>
          </div>

          {/* Media Count Pills */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {candidate.photos.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-0.5 font-mono-meta text-[11px] font-semibold text-white">
                <ImageIcon className="h-3 w-3" />
                {candidate.photos.length}
              </span>
            )}
            {candidate.videoLinks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 font-mono-meta text-[11px] font-bold text-slate-950">
                <Video className="h-3 w-3" />
                {candidate.videoLinks.length}
              </span>
            )}
          </div>
        </div>

        {/* Clean, Scannable Minimal Footer */}
        <div className="p-3.5">
          {showRoleLabel && (
            <p className="font-mono-meta text-[10px] font-bold uppercase tracking-wider text-amber-700">
              {role.name}
            </p>
          )}
          <div className="candidate-card-meta flex items-baseline justify-between gap-2">
            <h3 className="truncate text-base font-bold text-slate-950">{candidate.actorName}</h3>
            {candidate.age && (
              <span className="shrink-0 font-mono-meta text-xs font-semibold text-slate-600">
                {candidate.age}y
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
            <div className="flex flex-wrap gap-1">
              {verdicts.length === 0 ? (
                <span className="text-[11px] font-medium text-slate-500">Tap to review</span>
              ) : (
                verdicts.slice(0, 2).map((v) => {
                  const vMeta = VERDICT_META[v.verdict] ?? VERDICT_META.maybe;
                  const rMeta = TEAM_ROLES[v.role] ?? TEAM_ROLES.team;
                  return (
                    <span
                      key={v.uid}
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${vMeta.chipClass}`}
                    >
                      {rMeta.shortLabel}: {vMeta.label}
                    </span>
                  );
                })
              )}
              {verdicts.length > 2 && (
                <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                  +{verdicts.length - 2}
                </span>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono-meta text-[11px] font-bold text-slate-800">
              <MessageSquare className="h-3 w-3 text-slate-600" />
              {candidate.notesCount}
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
