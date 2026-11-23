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
  Users,
} from 'lucide-react';
import { auth } from './firebase';
import {
  CANDIDATE_STATUS_META,
  PROJECT_META,
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

  const [activeView, setActiveView] = useState<ViewMode>('overview');
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

  // Observe Firebase Auth session & load TeamMember profile
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

  // Subscribe to real-time Firestore collections once authenticated as a team member
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

  // Progress counts
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
          c.agencyOrContact.toLowerCase().includes(q) ||
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F7F4EE]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#9C7434]" />
          <p className="font-mono-meta text-xs uppercase tracking-[0.14em] text-[#666057]">
            Loading Casting Room...
          </p>
        </div>
      </div>
    );
  }

  if (!member) {
    return <AuthGate firebaseUser={firebaseUser} onAuthenticated={setMember} />;
  }

  const memberRoleMeta = TEAM_ROLES[member.role] ?? TEAM_ROLES.team;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F4EE]">
      {/* Sticky Prestige Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5DFD5] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1816] text-[#E5C687] shadow-sm transition hover:bg-[#322E2A]"
              aria-label="Go to all 12 roles overview"
            >
              <Clapperboard className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-semibold leading-none text-[#1A1816] sm:text-2xl">
                  Vaishnavi Bupara
                </h1>
                <span className="hidden rounded-full border border-[#E4D7BE] bg-[#FDF9F0] px-2 py-0.5 font-mono-meta text-[10px] font-medium uppercase tracking-wider text-[#8A5A10] sm:inline-block">
                  Micro-Drama Casting
                </span>
              </div>
              <p className="mt-0.5 font-mono-meta text-[11px] text-[#666057]">
                {lockedRolesCount}/12 Roles Cast · {candidates.length} Talent Submitted ·{' '}
                {PROJECT_META.location}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBriefModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#1A1816] transition hover:bg-[#EFECE5]"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#9C7434]" />
              <span className="hidden sm:inline">Casting Brief</span>
            </button>

            <button
              type="button"
              onClick={() => setActivityModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#1A1816] transition hover:bg-[#EFECE5]"
            >
              <Activity className="h-3.5 w-3.5 text-[#9C7434]" />
              <span className="hidden md:inline">Activity</span>
              {activityEvents.length > 0 && (
                <span className="rounded-full bg-[#1A1816] px-1.5 py-0.5 font-mono-meta text-[10px] text-white">
                  {activityEvents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#1A1816] transition hover:bg-[#EFECE5]"
            >
              <Share2 className="h-3.5 w-3.5 text-[#9C7434]" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={() => openUploadFor(activeRole ? activeRole.id : 'arjun-reddy')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A1816] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#322E2A]"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Talent</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5DFD5] bg-white px-2.5 py-1.5 text-left transition hover:border-[#C9BFA9]"
              title="Edit profile or view team roster"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFECE5] text-[11px] font-bold text-[#1A1816]">
                {member.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden leading-tight lg:block">
                <div className="max-w-[110px] truncate text-xs font-semibold text-[#1A1816]">
                  {member.displayName}
                </div>
                <div className="text-[10px] text-[#666057]">{memberRoleMeta.shortLabel}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Role Strip */}
        <div className="border-t border-[#EFECE5] bg-[#FAF8F4] px-4 py-2 lg:hidden">
          <div className="casting-tablist" role="tablist" aria-label="Roles navigation">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'overview'}
              onClick={() => {
                setActiveView('overview');
                setStatusFilter('all');
              }}
              className="casting-tab"
            >
              All 12 Roles
            </button>
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
                  className="casting-tab inline-flex items-center gap-1.5"
                >
                  {st.approved > 0 && <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E41]" />}
                  <span>{r.name}</span>
                  <span className="font-mono-meta text-[10px] opacity-65">({st.total})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Shell */}
      <div className="mx-auto flex w-full max-w-[1480px] flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Desktop Role Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-[84px] max-h-[calc(100dvh-104px)] space-y-4 overflow-y-auto pr-1">
            {/* Casting Progress Card */}
            <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1A1816]">Casting Progress</span>
                <span className="font-mono-meta font-semibold text-[#1B5E41]">
                  {lockedRolesCount} / 12
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EFECE5]">
                <div
                  className="h-full rounded-full bg-[#1B5E41] transition-all duration-500"
                  style={{ width: `${(lockedRolesCount / ROLES.length) * 100}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#666057]">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-[#9C7434]" />
                  {teamMembers.length} team active
                </span>
                <span>{candidates.length} submissions</span>
              </div>
            </div>

            {/* Overview Button */}
            <button
              type="button"
              onClick={() => {
                setActiveView('overview');
                setStatusFilter('all');
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                activeView === 'overview'
                  ? 'border-[#1A1816] bg-[#1A1816] text-white shadow-sm'
                  : 'border-[#E5DFD5] bg-white text-[#1A1816] hover:border-[#C9BFA9]'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                All 12 Roles Overview
              </span>
              <span className="font-mono-meta text-[11px] opacity-80">{candidates.length}</span>
            </button>

            {/* Storyline Role Groups */}
            <nav aria-label="Characters by storyline" className="space-y-4">
              {STORYLINE_SECTIONS.map((sec) => {
                const secRoles = ROLES.filter((r) => r.storyline === sec.key);
                return (
                  <div key={sec.key}>
                    <p className="px-2 font-mono-meta text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8073]">
                      {sec.title}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {secRoles.map((r) => {
                        const st = roleStats[r.id];
                        const isSelected = activeView === r.id;
                        return (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveView(r.id);
                                setStatusFilter('all');
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                                isSelected
                                  ? 'bg-white font-semibold text-[#1A1816] shadow-sm ring-1 ring-[#9C7434]/50'
                                  : 'text-[#453F38] hover:bg-white/70 hover:text-[#1A1816]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {st.approved > 0 && (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#1B5E41]" />
                                  )}
                                  <span className="truncate text-xs">{r.name}</span>
                                </div>
                                <span className="block truncate text-[10px] text-[#8A8073]">
                                  Age {r.ageSummary} · {r.subtitle}
                                </span>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 font-mono-meta text-[10px] font-semibold ${
                                  st.approved > 0
                                    ? 'bg-[#E6F4EC] text-[#1B5E41]'
                                    : st.total > 0
                                      ? 'bg-[#EFECE5] text-[#453F38]'
                                      : 'text-[#A09689]'
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

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 space-y-5">
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
              />

              {/* Filter & Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5DFD5] bg-white px-4 py-2.5">
                <div
                  role="tablist"
                  aria-label="Filter submissions by status"
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
                        <span className="ml-0.5 font-mono-meta text-[11px] opacity-65">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8073]" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search actor, city, notes..."
                      className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] py-1.5 pl-8 pr-3 text-xs text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openUploadFor(activeRole.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#9C7434] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#7D5B24]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add to Role
                  </button>
                </div>
              </div>

              {/* Candidate Cards Grid */}
              {filteredCandidates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D6CEC0] bg-white px-6 py-16 text-center">
                  <p className="font-display text-2xl font-semibold text-[#1A1816]">
                    {statusFilter === 'all' && !searchQuery
                      ? `No submissions yet for ${activeRole.name}`
                      : `No matching ${statusFilter === 'all' ? '' : CANDIDATE_STATUS_META[statusFilter].label.toLowerCase()} candidates`}
                  </p>
                  <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#666057]">
                    Casting agents can upload headshots and audition video links directly here.
                    Director, Producers, and Team will review and leave transparent approval notes.
                  </p>
                  <button
                    type="button"
                    onClick={() => openUploadFor(activeRole.id)}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#1A1816] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#322E2A]"
                  >
                    <Plus className="h-4 w-4" /> Upload First Candidate for {activeRole.name}
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
