import { Image as ImageIcon, Video, MessageSquare, MapPin, User } from 'lucide-react';
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
  const uploaderRole = TEAM_ROLES[candidate.uploadedByRole] ?? TEAM_ROLES.team;
  const verdicts = Object.values(candidate.verdicts ?? {});
  const role = ROLES_BY_ID[candidate.roleId];

  return (
    <article className="candidate-card-wrap group overflow-hidden rounded-2xl border border-[#E5DFD5] bg-white shadow-[0_1px_3px_rgba(26,24,22,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#CBBFA8] hover:shadow-[0_12px_30px_-14px_rgba(26,24,22,0.2)]">
      <button
        type="button"
        onClick={() => onOpen(candidate)}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9C7434]"
      >
        {/* Portrait Media Frame (3:4 prevents CLS) */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EFECE5]">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={candidate.actorName}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#F2EEE6] to-[#E5DFD3] p-4 text-center text-[#786F64]">
              <Video className="h-8 w-8 text-[#9C7434]" />
              <span className="text-xs font-medium">Video-only submission</span>
            </div>
          )}

          {/* Top Status Pill */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${statusMeta.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>
          </div>

          {/* Media Count Badges */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
            {candidate.photos.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1816]/80 px-2 py-0.5 font-mono-meta text-[10px] font-medium text-white backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" />
                {candidate.photos.length}
              </span>
            )}
            {candidate.videoLinks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1816]/80 px-2 py-0.5 font-mono-meta text-[10px] font-medium text-[#F5D99B] backdrop-blur-sm">
                <Video className="h-3 w-3" />
                {candidate.videoLinks.length}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          {showRoleLabel && (
            <p className="font-mono-meta text-[10px] uppercase tracking-[0.12em] text-[#9C7434]">
              {role.name}
            </p>
          )}
          <div className="candidate-card-meta flex items-baseline justify-between gap-2">
            <h3 className="truncate font-display text-xl font-semibold text-[#1A1816]">
              {candidate.actorName}
            </h3>
            {candidate.age && (
              <span className="shrink-0 font-mono-meta text-xs text-[#666057]">
                {candidate.age} yrs
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#666057]">
            {candidate.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#9C7434]" />
                {candidate.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3 text-[#9C7434]" />
              {candidate.uploadedByName} ({uploaderRole.shortLabel})
            </span>
          </div>

          {candidate.pitchNote && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#453F38]">
              {candidate.pitchNote}
            </p>
          )}

          {/* Team Verdicts & Notes Footer */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EFECE5] pt-2.5">
            <div className="flex flex-wrap gap-1">
              {verdicts.length === 0 ? (
                <span className="text-[11px] text-[#8A8073]">Awaiting team votes</span>
              ) : (
                verdicts.slice(0, 2).map((v) => {
                  const vMeta = VERDICT_META[v.verdict] ?? VERDICT_META.maybe;
                  const rMeta = TEAM_ROLES[v.role] ?? TEAM_ROLES.team;
                  return (
                    <span
                      key={v.uid}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${vMeta.chipClass}`}
                    >
                      {rMeta.shortLabel}: {vMeta.label}
                    </span>
                  );
                })
              )}
              {verdicts.length > 2 && (
                <span className="rounded-full border border-[#E5DFD5] bg-[#FAF8F4] px-2 py-0.5 text-[10px] font-semibold text-[#5D564E]">
                  +{verdicts.length - 2}
                </span>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 font-mono-meta text-[11px] font-medium text-[#5D564E]">
              <MessageSquare className="h-3.5 w-3.5 text-[#9C7434]" />
              {candidate.notesCount}
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
