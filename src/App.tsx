import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import { auth } from './firebase';
import {
  CANDIDATE_STATUS_META,
  ROLES,
  ROLES_BY_ID,
  STORYLINE_SECTIONS,
  TEAM_ROLES,
} from './data/castingBrief';
import {
  getTeamMemberProfile,
  subscribeActivity,
  subscribeCandidates,
  subscribeTeamMembers,
} from './services/castingService';
import type {
  ActivityEvent,
  Candidate,
  CandidateStatus,
  RoleId,
  TeamMember,
} from './types';
import { AuthGate } from './components/AuthGate';
import { OverviewGrid } from './components/OverviewGrid';
import { RoleBriefCard } from './components/RoleBriefCard';
import { CandidateCard } from './components/CandidateCard';
import { UploadCandidateModal } from './components/UploadCandidateModal';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { BriefModal } from './components/BriefModal';
import { ShareModal } from './components/ShareModal';
import { ActivityModal } from './components/ActivityModal';
import { ProfileModal } from './components/ProfileModal';

type ViewMode = 'overview' | RoleId;
type StatusFilter = 'all' | CandidateStatus;

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'callback', label: 'Callback' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Passed' },
];

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // Default directly to the first character so Left Characters -> Right Entries is immediate
  const [activeView, setActiveView] = useState<ViewMode>('arjun-reddy');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDefaultRole, setUploadDefaultRole] = useState<RoleId>('arjun-reddy');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const prof = await getTeamMemberProfile(user.uid);
          setMember(prof);
        } catch {
          setMember(null);
        }
      } else {
        setMember(null);
      }
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!member) {
      setCandidates([]);
      setTeamMembers([]);
      setActivityEvents([]);
      return;
    }

    const unsubCandidates = subscribeCandidates(setCandidates);
    const unsubMembers = subscribeTeamMembers(setTeamMembers);
    const unsubActivity = subscribeActivity(setActivityEvents);

    return () => {
      unsubCandidates();
      unsubMembers();
      unsubActivity();
    };
  }, [member?.uid]);

  const candidatesById = useMemo(() => {
    const map: Record<string, Candidate> = {};
    for (const c of candidates) map[c.id] = c;
    return map;
  }, [candidates]);

  const selectedCandidate = selectedCandidateId ? candidatesById[selectedCandidateId] ?? null : null;

  const roleStats = useMemo(() => {
    const stats: Record<RoleId, { total: number; approved: number; shortlisted: number }> = {} as Record<
      RoleId,
      { total: number; approved: number; shortlisted: number }
    >;
    for (const r of ROLES) {
      stats[r.id] = { total: 0, approved: 0, shortlisted: 0 };
    }
    for (const c of candidates) {
      if (!stats[c.roleId]) continue;
      stats[c.roleId].total += 1;
      if (c.status === 'approved') stats[c.roleId].approved += 1;
      if (c.status === 'shortlisted' || c.status === 'callback') stats[c.roleId].shortlisted += 1;
    }
    return stats;
  }, [candidates]);

  const lockedRolesCount = useMemo(
    () => ROLES.filter((r) => roleStats[r.id]?.approved > 0).length,
    [roleStats],
  );

  const activeRole = activeView === 'overview' ? null : ROLES_BY_ID[activeView];

  const filteredCandidates = useMemo(() => {
    let list =
      activeView === 'overview'
        ? candidates
        : candidates.filter((c) => c.roleId === activeView);

    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.actorName.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.pitchNote.toLowerCase().includes(q) ||
          c.uploadedByName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [candidates, activeView, statusFilter, searchQuery]);

  const openUploadFor = (roleId: RoleId) => {
    setEditingCandidate(null);
    setUploadDefaultRole(roleId);
    setUploadModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setMember(null);
  };

  if (!authReady) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0F1115]">
        <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!member) {
    return <AuthGate firebaseUser={firebaseUser} onAuthenticated={setMember} />;
  }

  const memberRoleMeta = TEAM_ROLES[member.role] ?? TEAM_ROLES.team;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F1F5F9]">
      {/* High-Contrast Dark Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0F1115] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                Vaishnavi Bupara Casting
              </h1>
              <p className="font-mono-meta text-[11px] font-medium text-slate-400">
                <span className="text-emerald-400">{lockedRolesCount}/12 Cast</span> ·{' '}
                {candidates.length} Entries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openUploadFor(activeRole ? activeRole.id : 'arjun-reddy')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>

            <button
              type="button"
              onClick={() => setBriefModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Brief</span>
            </button>

            <button
              type="button"
              onClick={() => setActivityModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline">Activity</span>
              {activityEvents.length > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 font-mono-meta text-[10px] font-bold text-slate-950">
                  {activityEvents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-left transition hover:border-slate-500"
              title="Profile & Team"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-extrabold text-slate-950">
                {member.displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden max-w-[100px] truncate text-xs font-semibold text-white lg:inline">
                {member.displayName}
              </span>
              <span className="hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 xl:inline">
                {memberRoleMeta.shortLabel}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Character Selector Strip */}
        <div className="border-t border-slate-800 bg-[#161920] px-4 lg:hidden">
          <div className="casting-tablist" role="tablist" aria-label="Characters">
            {ROLES.map((r) => {
              const st = roleStats[r.id];
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={activeView === r.id}
                  onClick={() => {
                    setActiveView(r.id);
                    setStatusFilter('all');
                  }}
                  className="casting-tab-dark inline-flex items-center gap-1.5"
                >
                  {st.approved > 0 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  <span>{r.name}</span>
                  <span className="font-mono-meta text-[10px] opacity-70">({st.total})</span>
                </button>
              );
            })}
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'overview'}
              onClick={() => {
                setActiveView('overview');
                setStatusFilter('all');
              }}
              className="casting-tab-dark"
            >
              All 12 Grid
            </button>
          </div>
        </div>
      </header>

      {/* Split Workspace: Dark Character Roster (Left) + Bright Entries Panel (Right) */}
      <div className="flex flex-1">
        {/* Left High-Contrast Dark Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-[#14171D] text-slate-200 lg:block">
          <div className="sticky top-[61px] flex h-[calc(100dvh-61px)] flex-col overflow-y-auto p-3.5">
            {/* Compact Overview Switcher */}
            <button
              type="button"
              onClick={() => {
                setActiveView('overview');
                setStatusFilter('all');
              }}
              className={`mb-4 flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                activeView === 'overview'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                All 12 Roles Grid
              </span>
              <span className="font-mono-meta text-[11px]">{candidates.length}</span>
            </button>

            <nav aria-label="Characters" className="space-y-4">
              {STORYLINE_SECTIONS.map((sec) => {
                const secRoles = ROLES.filter((r) => r.storyline === sec.key);
                return (
                  <div key={sec.key}>
                    <p className="px-2 font-mono-meta text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      {sec.title.replace(/^Storyline [AB] — /, '')}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {secRoles.map((r) => {
                        const st = roleStats[r.id];
                        const selected = activeView === r.id;
                        return (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveView(r.id);
                                setStatusFilter('all');
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                                selected
                                  ? 'bg-white text-slate-950 shadow-md ring-2 ring-amber-400'
                                  : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {st.approved > 0 && (
                                    <CheckCircle2
                                      className={`h-3.5 w-3.5 shrink-0 ${
                                        selected ? 'text-emerald-600' : 'text-emerald-400'
                                      }`}
                                    />
                                  )}
                                  <span className="truncate text-xs font-bold">{r.name}</span>
                                </div>
                                <span
                                  className={`font-mono-meta text-[10px] ${
                                    selected ? 'text-slate-600' : 'text-slate-400'
                                  }`}
                                >
                                  Age {r.ageSummary}
                                </span>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 font-mono-meta text-[11px] font-bold ${
                                  selected
                                    ? 'bg-slate-900 text-white'
                                    : st.total > 0
                                      ? 'bg-slate-700 text-white'
                                      : 'bg-slate-800/70 text-slate-500'
                                }`}
                              >
                                {st.total}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Entries Panel */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-6xl space-y-4">
            {activeView === 'overview' ? (
              <OverviewGrid
                candidates={candidates}
                onSelectRole={(rid) => {
                  setActiveView(rid);
                  setStatusFilter('all');
                }}
                onUploadForRole={openUploadFor}
              />
            ) : activeRole ? (
              <>
                <RoleBriefCard
                  role={activeRole}
                  candidateCount={roleStats[activeRole.id].total}
                  approvedCount={roleStats[activeRole.id].approved}
                  onAddEntry={() => openUploadFor(activeRole.id)}
                />

                {/* Compact Filter + Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3.5 py-2 shadow-sm">
                  <div
                    role="tablist"
                    aria-label="Filter entries by status"
                    className="casting-tablist"
                  >
                    {STATUS_TABS.map((tab) => {
                      const count =
                        tab.key === 'all'
                          ? candidates.filter((c) => c.roleId === activeRole.id).length
                          : candidates.filter(
                              (c) => c.roleId === activeRole.id && c.status === tab.key,
                            ).length;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={statusFilter === tab.key}
                          onClick={(e) => {
                            setStatusFilter(tab.key);
                            e.currentTarget.scrollIntoView({
                              block: 'nearest',
                              inline: 'nearest',
                            });
                          }}
                          className="casting-tab"
                        >
                          {tab.label}{' '}
                          <span className="ml-0.5 font-mono-meta text-[11px] opacity-70">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search actor..."
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* All Entries Grid */}
                {filteredCandidates.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <p className="text-lg font-bold text-slate-900">
                      {statusFilter === 'all' && !searchQuery
                        ? `No entries yet for ${activeRole.name}`
                        : `No ${statusFilter === 'all' ? 'matching' : CANDIDATE_STATUS_META[statusFilter].label.toLowerCase()} entries`}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Upload photos and audition video links to start reviewing.
                    </p>
                    <button
                      type="button"
                      onClick={() => openUploadFor(activeRole.id)}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-400"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" /> Add First Entry
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCandidates.map((cand) => (
                      <CandidateCard
                        key={cand.id}
                        candidate={cand}
                        onOpen={(c) => setSelectedCandidateId(c.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </main>
      </div>

      {/* Modals */}
      <UploadCandidateModal
        open={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setEditingCandidate(null);
        }}
        member={member}
        defaultRoleId={uploadDefaultRole}
        editingCandidate={editingCandidate}
        onSaved={(rid) => {
          setActiveView(rid);
          setStatusFilter('all');
        }}
      />

      <CandidateDetailModal
        candidate={selectedCandidate}
        member={member}
        onClose={() => setSelectedCandidateId(null)}
        onEdit={(cand) => {
          setSelectedCandidateId(null);
          setEditingCandidate(cand);
          setUploadDefaultRole(cand.roleId);
          setUploadModalOpen(true);
        }}
      />

      <BriefModal
        open={briefModalOpen}
        onClose={() => setBriefModalOpen(false)}
        onSelectRole={(rid) => {
          setActiveView(rid);
          setStatusFilter('all');
        }}
      />

      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} />

      <ActivityModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        events={activityEvents}
        candidatesById={candidatesById}
        onJumpToCandidate={(rid, cid) => {
          setActiveView(rid);
          setStatusFilter('all');
          setSelectedCandidateId(cid);
        }}
      />

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        member={member}
        teamMembers={teamMembers}
        onUpdated={setMember}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
