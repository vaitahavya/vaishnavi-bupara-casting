import { useEffect, useRef, useState } from 'react';
import { signInAnonymously, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Clapperboard, KeyRound, ShieldCheck, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { auth, googleProvider, TEAM_PASSCODE } from '../firebase';
import { PROJECT_META, TEAM_ROLES } from '../data/castingBrief';
import { registerTeamMember } from '../services/castingService';
import type { TeamMember, TeamRoleKey } from '../types';
import { attachFormAriaValidation } from '../utils/dialogFallback';

interface AuthGateProps {
  firebaseUser: User | null;
  onAuthenticated: (member: TeamMember) => void;
}

const ROLE_OPTIONS: TeamRoleKey[] = [
  'director',
  'producer',
  'casting_director',
  'casting_agent',
  'team',
];

export function AuthGate({ firebaseUser, onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<'google' | 'passcode'>('google');
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName ?? '');
  const [role, setRole] = useState<TeamRoleKey>('director');
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (firebaseUser?.displayName && !displayName) {
      setDisplayName(firebaseUser.displayName);
    }
  }, [firebaseUser, displayName]);

  useEffect(() => {
    if (!formRef.current) return;
    return attachFormAriaValidation(formRef.current);
  }, [mode, firebaseUser]);

  const isGoogleSignedIn =
    firebaseUser !== null &&
    firebaseUser.providerData.some((p) => p.providerId === 'google.com');

  const handleGoogleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      if (!msg.includes('popup-closed-by-user')) {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your name so your notes and approvals are attributed transparently.');
      return;
    }

    setBusy(true);
    try {
      let user = firebaseUser;

      if (!isGoogleSignedIn) {
        if (passcode.trim().toUpperCase() !== TEAM_PASSCODE) {
          setError('Incorrect team passcode. Ask the producer or director for the casting room passcode.');
          setBusy(false);
          return;
        }
        if (!user) {
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }
      }

      if (!user) throw new Error('Authentication session could not be created.');

      const member = await registerTeamMember({
        uid: user.uid,
        displayName: displayName.trim(),
        role,
        email: isGoogleSignedIn ? user.email : null,
        photoURL: isGoogleSignedIn ? user.photoURL : null,
        authMethod: isGoogleSignedIn ? 'google' : 'passcode',
        passcode: isGoogleSignedIn ? undefined : passcode.trim().toUpperCase(),
      });

      onAuthenticated(member);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not join casting room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F7F4EE] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[#DED7CC] bg-white shadow-[0_24px_70px_-24px_rgba(26,24,22,0.18)] lg:grid lg:grid-cols-12">
        {/* Left Editorial Column */}
        <div className="flex flex-col justify-between bg-[#1A1816] p-8 text-[#F7F4EE] lg:col-span-5 lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B5893D]/40 bg-[#B5893D]/15 px-3 py-1 font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#E5C687]">
              <Clapperboard className="h-3.5 w-3.5" />
              Casting Room · {PROJECT_META.handle}
            </div>
            <h1 className="editorial-title mt-5 font-semibold text-white">
              {PROJECT_META.title}
            </h1>
            <p className="mt-2 font-mono-meta text-xs text-[#C7BFB3]">
              {PROJECT_META.format} · {PROJECT_META.location}
            </p>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D7B36A]">
                Overall Look Direction
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-[#DDD6CB]">
                {PROJECT_META.lookDirection}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-xs text-[#C7BFB3]">
            <div className="flex items-center justify-between">
              <span>Pre-loaded Roles</span>
              <span className="font-mono-meta font-semibold text-white">12 Characters</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Storylines</span>
              <span className="font-mono-meta text-white">Doctors · Mehtas · Bridge</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Transparency</span>
              <span className="font-mono-meta text-[#86EFAC]">Live Team Notes & Approvals</span>
            </div>
          </div>
        </div>

        {/* Right Sign-In & Role Setup Column */}
        <div className="p-8 lg:col-span-7 lg:p-10">
          {isGoogleSignedIn ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#9C7434]">
                    Step 2 of 2 · Complete Team Profile
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#1A1816]">
                    Confirm Your Name & Role
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD5] px-2.5 py-1.5 text-xs font-medium text-[#5D564E] hover:bg-[#FAF8F4]"
                >
                  <LogOut className="h-3.5 w-3.5" /> Switch Account
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#666057]">
                Signed in as <strong className="text-[#1A1816]">{firebaseUser?.email}</strong>. Your
                name and role badge will appear on every upload, approval, and review note.
              </p>

              <form ref={formRef} onSubmit={handleCompleteOnboarding} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="google-display-name" className="block text-xs font-semibold text-[#1A1816]">
                    Your Name
                  </label>
                  <span id="google-name-hint" className="field-hint">
                    Shown transparently to the Director, Producers, Casting Director & Team.
                  </span>
                  <input
                    id="google-display-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Vaitahavya"
                    aria-describedby="google-name-hint"
                    data-error="google-name-error"
                    className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                  />
                  <div id="google-name-error" className="error-msg">
                    Please enter your full name (at least 2 characters).
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#1A1816]">Your Team Role</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((key) => {
                      const info = TEAM_ROLES[key];
                      const active = role === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRole(key)}
                          className={`rounded-xl border p-3 text-left transition ${
                            active
                              ? 'border-[#9C7434] bg-[#FDF9F0] ring-1 ring-[#9C7434]'
                              : 'border-[#E5DFD5] bg-white hover:border-[#C9BFA9]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#1A1816]">{info.label}</span>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                active ? 'bg-[#9C7434]' : 'bg-[#DED7CC]'
                              }`}
                            />
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-[#666057]">
                            {info.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-[#F2C6C2] bg-[#FEF3F2] px-3.5 py-2.5 text-xs font-medium text-[#B42318]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1816] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#322E2A] disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Enter Casting Room <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <p className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#9C7434]">
                Team Access · Production Sign-In
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1A1816]">
                Enter the Casting Room
              </h2>
              <p className="mt-1 text-xs text-[#666057]">
                Sign in with Google for persistent attribution, or join directly with the shared
                project passcode.
              </p>

              {/* Access Method Switcher */}
              <div
                role="tablist"
                aria-label="Sign-in method"
                className="casting-tablist mt-5 border-b border-[#E5DFD5]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'google'}
                  onClick={() => {
                    setMode('google');
                    setError(null);
                  }}
                  className="casting-tab"
                >
                  Google Sign-In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'passcode'}
                  onClick={() => {
                    setMode('passcode');
                    setError(null);
                  }}
                  className="casting-tab"
                >
                  Quick Team Passcode
                </button>
              </div>

              {mode === 'google' ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-[#E5DFD5] bg-[#FAF8F4] p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1B5E41]" />
                      <div>
                        <h3 className="text-sm font-semibold text-[#1A1816]">
                          Recommended for Director, Producers & Casting Leads
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#5D564E]">
                          Sign in with your Google account and select your role once. Your approvals,
                          shortlists, and review notes stay synced across phone and desktop.
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-[#F2C6C2] bg-[#FEF3F2] px-3.5 py-2.5 text-xs font-medium text-[#B42318]">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleGoogleLogin}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[#1A1816] bg-[#1A1816] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#332E29] disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#EA4335"
                            d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-[#666057]">
                    No Google account handy?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('passcode')}
                      className="font-semibold text-[#8A5A10] underline underline-offset-2"
                    >
                      Join with Project Passcode instead
                    </button>
                  </p>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleCompleteOnboarding} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="guest-name" className="block text-xs font-semibold text-[#1A1816]">
                        Your Name
                      </label>
                      <span id="guest-name-hint" className="field-hint">
                        Shown on uploads & notes
                      </span>
                      <input
                        id="guest-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g., Ramesh (Casting)"
                        aria-describedby="guest-name-hint"
                        data-error="guest-name-error"
                        className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                      />
                      <div id="guest-name-error" className="error-msg">
                        Enter your name (min 2 characters).
                      </div>
                    </div>

                    <div>
                      <label htmlFor="guest-passcode" className="block text-xs font-semibold text-[#1A1816]">
                        Project Passcode
                      </label>
                      <span id="guest-passcode-hint" className="field-hint">
                        Shared by the production team
                      </span>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8A8073]" />
                        <input
                          id="guest-passcode"
                          type="text"
                          required
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="Enter passcode"
                          autoComplete="off"
                          aria-describedby="guest-passcode-hint"
                          data-error="guest-passcode-error"
                          className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] py-2.5 pl-9 pr-3.5 font-mono-meta text-sm uppercase tracking-wider text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                        />
                        <div id="guest-passcode-error" className="error-msg">
                          Enter the team passcode.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#1A1816]">Your Team Role</span>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {ROLE_OPTIONS.map((key) => {
                        const info = TEAM_ROLES[key];
                        const active = role === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setRole(key)}
                            className={`rounded-xl border p-2.5 text-left transition ${
                              active
                                ? 'border-[#9C7434] bg-[#FDF9F0] ring-1 ring-[#9C7434]'
                                : 'border-[#E5DFD5] bg-white hover:border-[#C9BFA9]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#1A1816]">
                                {info.label}
                              </span>
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  active ? 'bg-[#9C7434]' : 'bg-[#DED7CC]'
                                }`}
                              />
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-[#666057]">
                              {info.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-[#F2C6C2] bg-[#FEF3F2] px-3.5 py-2.5 text-xs font-medium text-[#B42318]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1816] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#322E2A] disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Join Casting Room <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
