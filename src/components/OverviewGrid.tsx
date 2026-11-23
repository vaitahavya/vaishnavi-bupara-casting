import { CheckCircle2, Plus, Users } from 'lucide-react';
import { ROLES, STORYLINE_SECTIONS } from '../data/castingBrief';
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
    <div className="space-y-6">
      {STORYLINE_SECTIONS.map((section) => {
        const sectionRoles = ROLES.filter((r) => r.storyline === section.key);
        return (
          <section key={section.key} className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-300 pb-1.5">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                {section.title}
              </h2>
              <span className="font-mono-meta text-xs font-semibold text-slate-600">
                {sectionRoles.length} roles
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {sectionRoles.map((role) => {
                const roleCandidates = candidates.filter((c) => c.roleId === role.id);
                const approved = roleCandidates.filter((c) => c.status === 'approved');
                const leadCandidate = approved[0] ?? roleCandidates[0];
                const leadThumb =
                  leadCandidate?.photos[0]?.thumbDataUrl || leadCandidate?.photos[0]?.url || null;

                return (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition hover:border-slate-900 ${
                      approved.length > 0 ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRole(role.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                        {leadThumb ? (
                          <img
                            src={leadThumb}
                            alt={leadCandidate.actorName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-sm font-bold text-slate-950">{role.name}</h3>
                          {approved.length > 0 && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 font-mono-meta text-[11px] font-semibold text-slate-600">
                          <span>Age {role.ageSummary}</span>
                          <span>·</span>
                          <span className="text-slate-900">{roleCandidates.length} entries</span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUploadForRole(role.id)}
                      aria-label={`Add entry for ${role.name}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 transition hover:bg-amber-400"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                    </button>
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
