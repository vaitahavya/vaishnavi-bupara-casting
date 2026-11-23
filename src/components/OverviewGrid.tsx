import { CheckCircle2, Plus, Users, Video, Image as ImageIcon } from 'lucide-react';
import { PROJECT_META, ROLES, STORYLINE_SECTIONS } from '../data/castingBrief';
import type { Candidate, RoleId } from '../types';

interface OverviewGridProps {
  candidates: Candidate[];
  onSelectRole: (roleId: RoleId) => void;
  onUploadForRole: (roleId: RoleId) => void;
}

export function OverviewGrid({
  candidates,
  onSelectRole,
  onUploadForRole,
}: OverviewGridProps) {
  return (
    <div className="space-y-8">
      {/* Executive Look Direction Banner */}
      <section className="rounded-2xl border border-[#E4D7BE] bg-gradient-to-br from-[#FDFBF6] to-[#F7F0E2] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono-meta text-[11px] uppercase tracking-[0.16em] text-[#8A5A10]">
            Overall Look Direction · {PROJECT_META.tier}
          </p>
          <span className="font-mono-meta text-[11px] text-[#666057]">
            {PROJECT_META.format} · {PROJECT_META.location}
          </span>
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#2C2722]">
          {PROJECT_META.lookDirection}
        </p>
      </section>

      {/* Storyline Sections */}
      {STORYLINE_SECTIONS.map((section) => {
        const sectionRoles = ROLES.filter((r) => r.storyline === section.key);
        return (
          <section key={section.key} className="space-y-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E5DFD5] pb-2">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#1A1816]">
                  {section.title}
                </h2>
                <p className="text-xs text-[#666057]">{section.subtitle}</p>
              </div>
              <span className="font-mono-meta text-xs text-[#8A8073]">
                {sectionRoles.length} {sectionRoles.length === 1 ? 'role' : 'roles'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sectionRoles.map((role) => {
                const roleCandidates = candidates.filter((c) => c.roleId === role.id);
                const approved = roleCandidates.filter((c) => c.status === 'approved');
                const shortlisted = roleCandidates.filter(
                  (c) => c.status === 'shortlisted' || c.status === 'callback',
                );
                const leadCandidate = approved[0] ?? shortlisted[0] ?? roleCandidates[0];
                const leadThumb =
                  leadCandidate?.photos[0]?.thumbDataUrl || leadCandidate?.photos[0]?.url || null;

                return (
                  <div
                    key={role.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(26,24,22,0.04)] transition hover:border-[#C9BBA2] hover:shadow-md ${
                      approved.length > 0 ? 'border-[#B6DFC8]' : 'border-[#E5DFD5]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono-meta rounded-full border border-[#E5DFD5] bg-[#FAF8F4] px-2 py-0.5 text-[10px] font-medium text-[#5D564E]">
                              Age {role.ageSummary}
                            </span>
                            {approved.length > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#B6DFC8] bg-[#E6F4EC] px-2 py-0.5 text-[10px] font-semibold text-[#1B5E41]">
                                <CheckCircle2 className="h-3 w-3" /> Cast Locked
                              </span>
                            ) : shortlisted.length > 0 ? (
                              <span className="rounded-full border border-[#EDD3A0] bg-[#FDF3DF] px-2 py-0.5 text-[10px] font-semibold text-[#8A5A10]">
                                {shortlisted.length} Shortlisted
                              </span>
                            ) : (
                              <span className="rounded-full border border-[#EFECE5] bg-[#FAF8F4] px-2 py-0.5 text-[10px] font-medium text-[#8A8073]">
                                Open
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 font-display text-xl font-semibold text-[#1A1816]">
                            {role.name}
                          </h3>
                          <p className="text-xs text-[#666057]">{role.subtitle}</p>
                        </div>

                        {/* Thumbnail preview of approved or top candidate */}
                        <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-[#E5DFD5] bg-[#F2EEE6]">
                          {leadThumb ? (
                            <img
                              src={leadThumb}
                              alt={leadCandidate.actorName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#A99F91]">
                              <Users className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[#453F38]">
                        {role.characterRead}
                      </p>

                      {approved.length > 0 && (
                        <div className="mt-2.5 rounded-lg border border-[#C6E6D4] bg-[#F2FAF5] px-2.5 py-1.5 text-[11px] font-medium text-[#1B5E41]">
                          Approved: <strong>{approved.map((a) => a.actorName).join(', ')}</strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EFECE5] pt-3">
                      <div className="flex items-center gap-2.5 font-mono-meta text-[11px] text-[#666057]">
                        <span>{roleCandidates.length} talent</span>
                        {roleCandidates.length > 0 && (
                          <>
                            <span className="inline-flex items-center gap-0.5">
                              <ImageIcon className="h-3 w-3 text-[#9C7434]" />
                              {roleCandidates.reduce((s, c) => s + c.photos.length, 0)}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Video className="h-3 w-3 text-[#9C7434]" />
                              {roleCandidates.reduce((s, c) => s + c.videoLinks.length, 0)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUploadForRole(role.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#DED7CC] bg-[#FAF8F4] px-2.5 py-1.5 text-[11px] font-semibold text-[#1A1816] transition hover:border-[#9C7434] hover:bg-[#FDF9F0]"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRole(role.id)}
                          className="rounded-lg bg-[#1A1816] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#322E2A]"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
