import { useEffect, useRef } from 'react';
import { X, Activity, Upload, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';
import type { ActivityEvent, Candidate, RoleId } from '../types';
import { TEAM_ROLES } from '../data/castingBrief';
import { attachLightDismissFallback } from '../utils/dialogFallback';

interface ActivityModalProps {
  open: boolean;
  onClose: () => void;
  events: ActivityEvent[];
  candidatesById: Record<string, Candidate>;
  onJumpToCandidate: (roleId: RoleId, candidateId: string) => void;
}

function formatRelativeTime(ts?: { toDate: () => Date }) {
  if (!ts) return 'Just now';
  const d = ts.toDate();
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ActivityModal({
  open,
  onClose,
  events,
  candidatesById,
  onJumpToCandidate,
}: ActivityModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const detachFallback = attachLightDismissFallback(dialog);
    const onNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', onNativeClose);
    return () => {
      detachFallback();
      dialog.removeEventListener('close', onNativeClose);
    };
  }, [onClose]);

  const iconFor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'candidate_uploaded':
        return <Upload className="h-3.5 w-3.5 text-[#2C4B82]" />;
      case 'status_changed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E41]" />;
      case 'note_added':
        return <MessageSquare className="h-3.5 w-3.5 text-[#8A5A10]" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-[#9C7434]" />;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="activity-modal-title"
      className="w-full max-w-2xl"
    >
      <div className="flex max-h-[86dvh] flex-col overflow-hidden rounded-2xl border border-[#DED7CC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5DFD5] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF8F4] text-[#9C7434] border border-[#E5DFD5]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h1 id="activity-modal-title" className="font-display text-xl font-semibold text-[#1A1816]">
                Transparent Team Activity
              </h1>
              <p className="text-xs text-[#666057]">
                Live feed of uploads, approvals, verdicts & notes visible to all stakeholders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close activity log"
            className="rounded-lg border border-[#E5DFD5] p-2 text-[#5D564E] hover:bg-[#FAF8F4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DED7CC] bg-[#FAF8F4] px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#5D564E]">No casting activity yet.</p>
              <p className="mt-1 text-xs text-[#8A8073]">
                Uploads, director approvals, and review notes will appear here in real time.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {events.map((ev) => {
                const roleMeta = TEAM_ROLES[ev.actorRole] ?? TEAM_ROLES.team;
                const exists = Boolean(candidatesById[ev.candidateId]);
                return (
                  <li
                    key={ev.id}
                    className="flex items-start gap-3 rounded-xl border border-[#EFECE5] bg-[#FAF8F4] p-3.5 transition hover:border-[#DED7CC]"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E5DFD5] bg-white">
                      {iconFor(ev.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#1A1816]">
                          {ev.actorDisplayName}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.shortLabel}
                        </span>
                        <span className="text-[11px] text-[#8A8073]">
                          · {formatRelativeTime(ev.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#2C2722]">
                        {ev.summary}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-mono-meta text-[10px] uppercase tracking-wider text-[#9C7434]">
                          {ev.roleName}
                        </span>
                        {exists && (
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToCandidate(ev.roleId, ev.candidateId);
                              dialogRef.current?.close();
                            }}
                            className="text-[11px] font-semibold text-[#2C4B82] underline-offset-2 hover:underline"
                          >
                            View {ev.actorName} →
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
