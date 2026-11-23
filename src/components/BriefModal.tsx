import { useEffect, useRef } from 'react';
import { X, Sparkles, MapPin, Film, Calendar, Users } from 'lucide-react';
import { PROJECT_META, ROLES, STORYLINE_SECTIONS } from '../data/castingBrief';
import { attachLightDismissFallback } from '../utils/dialogFallback';

interface BriefModalProps {
  open: boolean;
  onClose: () => void;
  onSelectRole: (roleId: typeof ROLES[number]['id']) => void;
}

export function BriefModal({ open, onClose, onSelectRole }: BriefModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
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

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="brief-modal-title"
      className="w-full max-w-4xl"
    >
      <div className="flex max-h-[90dvh] flex-col overflow-hidden rounded-2xl border border-[#DED7CC] bg-[#FAF8F4] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5DFD5] bg-white px-6 py-5">
          <div>
            <p className="font-mono-meta text-[11px] uppercase tracking-[0.16em] text-[#9C7434]">
              Master Casting Brief · {PROJECT_META.date} · {PROJECT_META.handle}
            </p>
            <h1 id="brief-modal-title" className="editorial-role-title mt-1 font-semibold text-[#1A1816]">
              {PROJECT_META.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#5D564E]">
              <span className="inline-flex items-center gap-1">
                <Film className="h-3.5 w-3.5 text-[#9C7434]" />
                {PROJECT_META.format}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#9C7434]" />
                {PROJECT_META.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#9C7434]" />
                {PROJECT_META.tier}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close casting brief"
            className="rounded-lg border border-[#E5DFD5] bg-[#FAF8F4] p-2 text-[#5D564E] transition hover:bg-[#EFECE5] hover:text-[#1A1816]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 space-y-6">
          <section className="rounded-xl border border-[#E4D7BE] bg-[#FDF9F0] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8A5A10]">
              <Sparkles className="h-4 w-4" />
              Overall Look Direction
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-[#2C2722]">
              {PROJECT_META.lookDirection}
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-[#1A1816]">
                Headcount Summary — 12 Roles
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFD5] bg-white px-3 py-1 text-xs font-medium text-[#5D564E]">
                <Users className="h-3.5 w-3.5 text-[#9C7434]" />
                9 Adults · 3–4 Children
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#E5DFD5] bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5DFD5] bg-[#F7F4EE] text-[11px] uppercase tracking-[0.12em] text-[#666057]">
                    <th className="px-4 py-3 font-semibold">Character</th>
                    <th className="px-4 py-3 font-semibold">Age</th>
                    <th className="px-4 py-3 font-semibold">Storyline</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE5]">
                  {ROLES.map((role) => (
                    <tr key={role.id} className="hover:bg-[#FAF8F4]">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[#1A1816]">{role.name}</div>
                        <div className="text-xs text-[#666057]">{role.subtitle}</div>
                      </td>
                      <td className="px-4 py-2.5 font-mono-meta text-xs text-[#453F38]">
                        {role.ageSummary}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-[#5D564E]">
                        {role.storylineLabel}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectRole(role.id);
                            dialogRef.current?.close();
                          }}
                          className="rounded-md border border-[#DED7CC] bg-[#FAF8F4] px-2.5 py-1 text-xs font-medium text-[#1A1816] transition hover:border-[#9C7434] hover:text-[#7D5B24]"
                        >
                          Open Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2.5 text-xs text-[#666057]">{PROJECT_META.headcountNote}</p>
          </section>

          <section className="space-y-4">
            {STORYLINE_SECTIONS.map((section) => {
              const sectionRoles = ROLES.filter((r) => r.storyline === section.key);
              return (
                <div key={section.key} className="rounded-xl border border-[#E5DFD5] bg-white p-5">
                  <h3 className="font-display text-lg font-semibold text-[#1A1816]">
                    {section.title}
                  </h3>
                  <p className="text-xs text-[#666057]">{section.subtitle}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {sectionRoles.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-[#EFECE5] bg-[#FAF8F4] p-3.5"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold text-sm text-[#1A1816]">{r.name}</span>
                          <span className="font-mono-meta text-[11px] text-[#9C7434]">
                            {r.ageSummary}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#5D564E]">{r.characterRead}</p>
                        {r.pairingNote && (
                          <p className="mt-1.5 border-l-2 border-[#B5893D] pl-2 text-[11px] italic text-[#7D5B24]">
                            {r.pairingNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </dialog>
  );
}
