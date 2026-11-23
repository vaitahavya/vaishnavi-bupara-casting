import { useEffect, useRef, useState } from 'react';
import { X, Users, LogOut, Loader2, Check } from 'lucide-react';
import { TEAM_ROLES } from '../data/castingBrief';
import { updateTeamMemberProfile } from '../services/castingService';
import type { TeamMember, TeamRoleKey } from '../types';
import { attachLightDismissFallback } from '../utils/dialogFallback';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember;
  teamMembers: TeamMember[];
  onUpdated: (member: TeamMember) => void;
  onSignOut: () => void;
}

const ROLE_OPTIONS: TeamRoleKey[] = [
  'director',
  'producer',
  'casting_director',
  'casting_agent',
  'team',
];

export function ProfileModal({
  open,
  onClose,
  member,
  teamMembers,
  onUpdated,
  onSignOut,
}: ProfileModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [displayName, setDisplayName] = useState(member.displayName);
  const [role, setRole] = useState<TeamRoleKey>(member.role);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(member.displayName);
    setRole(member.role);
    setSaved(false);
  }, [member, open]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const next = await updateTeamMemberProfile(member.uid, {
        displayName: displayName.trim(),
        role,
      });
      onUpdated(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="profile-modal-title"
      className="w-full max-w-xl"
    >
      <div className="flex max-h-[88dvh] flex-col overflow-hidden rounded-2xl border border-[#DED7CC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5DFD5] bg-[#FAF8F4] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5DFD5] bg-white text-[#9C7434]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h1 id="profile-modal-title" className="font-display text-xl font-semibold text-[#1A1816]">
                Your Profile & Team Roster
              </h1>
              <p className="text-xs text-[#666057]">
                {member.email ? member.email : 'Quick Passcode Access'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close team profile modal"
            className="rounded-lg border border-[#DED7CC] bg-white p-2 text-[#5D564E] hover:bg-[#EFECE5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-semibold text-[#1A1816]">
                  Display Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="prof-role" className="block text-xs font-semibold text-[#1A1816]">
                  Team Role
                </label>
                <select
                  id="prof-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRoleKey)}
                  className="mt-1 w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                >
                  {ROLE_OPTIONS.map((rk) => (
                    <option key={rk} value={rk}>
                      {TEAM_ROLES[rk].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  dialogRef.current?.close();
                  onSignOut();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#F2C6C2] bg-[#FEF3F2] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FDE2DF]"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A1816] px-4 py-2 text-xs font-semibold text-white hover:bg-[#322E2A] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#86EFAC]" /> Saved
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>

          <div className="border-t border-[#E5DFD5] pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5D564E]">
              Casting Room Members ({teamMembers.length})
            </h2>
            <ul className="mt-3 divide-y divide-[#EFECE5] rounded-xl border border-[#E5DFD5] bg-[#FAF8F4]">
              {teamMembers.map((tm) => {
                const rMeta = TEAM_ROLES[tm.role] ?? TEAM_ROLES.team;
                return (
                  <li key={tm.uid} className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#1A1816]">
                        {tm.displayName} {tm.uid === member.uid ? '(You)' : ''}
                      </p>
                      <p className="truncate text-[11px] text-[#8A8073]">
                        {tm.email || 'Passcode Guest'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${rMeta.badgeClass}`}
                    >
                      {rMeta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </dialog>
  );
}
