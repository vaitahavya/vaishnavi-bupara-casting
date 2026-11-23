import { useEffect, useRef, useState } from 'react';
import {
  X,
  ExternalLink,
  Video,
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  CANDIDATE_STATUS_META,
  NOTE_TAG_META,
  ROLES_BY_ID,
  TEAM_ROLES,
  VERDICT_META,
} from '../data/castingBrief';
import {
  addCandidateNote,
  deleteCandidate,
  deleteCandidateNote,
  fetchFullMediaDataUrl,
  setMemberVerdict,
  subscribeCandidateNotes,
  updateCandidateStatus,
} from '../services/castingService';
import type {
  Candidate,
  CandidateNote,
  CandidateStatus,
  NoteDecisionTag,
  TeamMember,
  VerdictValue,
} from '../types';
import { attachLightDismissFallback } from '../utils/dialogFallback';
import { detectVideoInfo } from '../utils/video';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  member: TeamMember;
  onClose: () => void;
  onEdit: (candidate: Candidate) => void;
}

const STATUS_OPTIONS: CandidateStatus[] = [
  'submitted',
  'shortlisted',
  'callback',
  'approved',
  'rejected',
];

const VERDICT_OPTIONS: VerdictValue[] = ['approve', 'shortlist', 'maybe', 'pass'];

const NOTE_TAG_OPTIONS: NoteDecisionTag[] = [
  'note',
  'approved',
  'shortlisted',
  'callback',
  'question',
  'rejected',
];

function formatDateTime(ts?: { toDate: () => Date }) {
  if (!ts) return 'Just now';
  return ts.toDate().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CandidateDetailModal({
  candidate,
  member,
  onClose,
  onEdit,
}: CandidateDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [noteTag, setNoteTag] = useState<NoteDecisionTag>('note');
  const [syncStatusFromTag, setSyncStatusFromTag] = useState(false);

  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingVerdict, setUpdatingVerdict] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (candidate && !dialog.open) {
      dialog.showModal();
    } else if (!candidate && dialog.open) {
      dialog.close();
    }
  }, [candidate]);

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

  useEffect(() => {
    setActivePhotoIndex(0);
    setActiveVideoIndex(0);
    setConfirmingDelete(false);
    setActionError(null);
    setNoteBody('');
    setNoteTag('note');
    setSyncStatusFromTag(false);
  }, [candidate?.id]);

  // Real-time subscription to candidate's transparent review notes
  useEffect(() => {
    if (!candidate) {
      setNotes([]);
      return;
    }
    return subscribeCandidateNotes(candidate.id, setNotes);
  }, [candidate?.id]);

  // Fetch high-res image on demand when viewing a Firestore media photo
  useEffect(() => {
    if (!candidate || candidate.photos.length === 0) {
      setFullImageSrc(null);
      return;
    }
    const photo = candidate.photos[activePhotoIndex] ?? candidate.photos[0];
    if (!photo) {
      setFullImageSrc(null);
      return;
    }

    let cancelled = false;
    setFullImageSrc(photo.thumbDataUrl || photo.url || null);

    if (photo.mediaId) {
      fetchFullMediaDataUrl(photo.mediaId)
        .then((highRes) => {
          if (!cancelled && highRes) setFullImageSrc(highRes);
        })
        .catch(() => {
          // Keep thumbnail fallback
        });
    }

    return () => {
      cancelled = true;
    };
  }, [candidate, activePhotoIndex]);

  if (!candidate) {
    return (
      <dialog ref={dialogRef} aria-label="Candidate review" className="w-full max-w-6xl" />
    );
  }

  const role = ROLES_BY_ID[candidate.roleId];
  const statusMeta = CANDIDATE_STATUS_META[candidate.status];
  const uploaderRole = TEAM_ROLES[candidate.uploadedByRole] ?? TEAM_ROLES.team;
  const updaterRole = TEAM_ROLES[candidate.statusUpdatedByRole] ?? TEAM_ROLES.team;
  const myVerdict = candidate.verdicts?.[member.uid]?.verdict ?? null;
  const allVerdicts = Object.values(candidate.verdicts ?? {});

  const canEditOrDelete =
    candidate.uploadedByUid === member.uid ||
    ['director', 'producer', 'casting_director'].includes(member.role);

  const activeVideo = candidate.videoLinks[activeVideoIndex] ?? candidate.videoLinks[0];
  const parsedActiveVideo = activeVideo ? detectVideoInfo(activeVideo.url) : null;

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (newStatus === candidate.status) return;
    setActionError(null);
    setUpdatingStatus(true);
    try {
      await updateCandidateStatus({ candidate, member, status: newStatus });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVerdictClick = async (verdict: VerdictValue) => {
    setActionError(null);
    setUpdatingVerdict(true);
    try {
      await setMemberVerdict({
        candidate,
        member,
        verdict: myVerdict === verdict ? null : verdict,
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save vote.');
    } finally {
      setUpdatingVerdict(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setActionError(null);
    setSavingNote(true);
    try {
      let alsoStatus: CandidateStatus | undefined;
      if (syncStatusFromTag) {
        if (noteTag === 'approved') alsoStatus = 'approved';
        else if (noteTag === 'shortlisted') alsoStatus = 'shortlisted';
        else if (noteTag === 'callback') alsoStatus = 'callback';
        else if (noteTag === 'rejected') alsoStatus = 'rejected';
      }
      await addCandidateNote({
        candidate,
        member,
        body: noteBody,
        decisionTag: noteTag,
        alsoUpdateStatus: alsoStatus,
      });
      setNoteBody('');
      setNoteTag('note');
      setSyncStatusFromTag(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not post note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteCandidate = async () => {
    setActionError(null);
    try {
      await deleteCandidate(candidate);
      dialogRef.current?.close();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not delete candidate.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="candidate-detail-title"
      className="w-full max-w-6xl"
    >
      <div className="flex max-h-[92dvh] flex-col overflow-hidden rounded-2xl border border-[#DED7CC] bg-[#FAF8F4] shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD5] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-meta text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">
                {role.name} · {role.shootDaysCount}d ({role.shootDays})
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
            </div>
            <h1
              id="candidate-detail-title"
              className="mt-1 font-display text-2xl font-semibold text-[#1A1816]"
            >
              {candidate.actorName}
              {candidate.age && (
                <span className="ml-2 font-mono-meta text-sm font-normal text-[#666057]">
                  · {candidate.age} yrs
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {canEditOrDelete && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    dialogRef.current?.close();
                    onEdit(candidate);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DED7CC] bg-[#FAF8F4] px-3 py-1.5 text-xs font-semibold text-[#1A1816] hover:bg-[#EFECE5]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {confirmingDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDeleteCandidate}
                      className="rounded-lg bg-[#B42318] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#912018]"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-lg border border-[#DED7CC] px-2.5 py-1.5 text-xs font-medium text-[#5D564E]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    aria-label="Delete candidate"
                    className="rounded-lg border border-[#E5DFD5] p-1.5 text-[#8A8073] hover:border-[#F2C6C2] hover:bg-[#FEF3F2] hover:text-[#B42318]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close review modal"
              className="rounded-lg border border-[#DED7CC] bg-white p-2 text-[#5D564E] hover:bg-[#EFECE5]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Two-Column Body */}
        <div className="grid flex-1 overflow-y-auto lg:grid-cols-12">
          {/* LEFT: Photos, Videos & Agent Info */}
          <div className="space-y-5 border-b border-[#E5DFD5] p-5 lg:col-span-7 lg:border-b-0 lg:border-r">
            {/* Photo Lightbox */}
            {candidate.photos.length > 0 ? (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-[#E5DFD5] bg-[#161412]">
                  <div className="flex aspect-[4/3] max-h-[420px] w-full items-center justify-center">
                    {fullImageSrc ? (
                      <img
                        src={fullImageSrc}
                        alt={`${candidate.actorName} photo ${activePhotoIndex + 1}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-[#666057]" />
                    )}
                  </div>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 font-mono-meta text-[11px] text-white">
                    {activePhotoIndex + 1} / {candidate.photos.length}
                  </span>
                </div>

                {candidate.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {candidate.photos.map((p, idx) => (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                          idx === activePhotoIndex
                            ? 'border-[#9C7434] ring-2 ring-[#9C7434]/30'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={p.thumbDataUrl || p.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center rounded-2xl border border-dashed border-[#DED7CC] bg-white text-xs text-[#8A8073]">
                No photos uploaded — review audition video links below
              </div>
            )}

            {/* Video Links & Inline Embed */}
            <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1A1816]">
                  <Video className="h-4 w-4 text-[#9C7434]" />
                  Audition Tapes & Video Links ({candidate.videoLinks.length})
                </h2>
              </div>

              {candidate.videoLinks.length === 0 ? (
                <p className="mt-2 text-xs text-[#8A8073]">No video links attached yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {/* Video Selector Pills */}
                  <div className="flex flex-wrap gap-2">
                    {candidate.videoLinks.map((vid, idx) => {
                      const info = detectVideoInfo(vid.url);
                      const selected = idx === activeVideoIndex;
                      return (
                        <button
                          key={`${vid.url}-${idx}`}
                          type="button"
                          onClick={() => setActiveVideoIndex(idx)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? 'border-[#1A1816] bg-[#1A1816] text-white'
                              : 'border-[#DED7CC] bg-[#FAF8F4] text-[#1A1816] hover:bg-[#EFECE5]'
                          }`}
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>{vid.label || `Video ${idx + 1}`}</span>
                          <span className="opacity-70">({info.platformLabel})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Video Player / Launch Card */}
                  {activeVideo && parsedActiveVideo && (
                    <div className="space-y-2">
                      {parsedActiveVideo.platform === 'direct' && parsedActiveVideo.embedUrl ? (
                        <video
                          controls
                          src={parsedActiveVideo.embedUrl}
                          className="aspect-video w-full rounded-xl bg-black"
                        />
                      ) : parsedActiveVideo.embedUrl ? (
                        <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#E5DFD5] bg-black">
                          <iframe
                            src={parsedActiveVideo.embedUrl}
                            title={activeVideo.label || 'Audition video'}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] p-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1A1816]">
                              {activeVideo.label} ({parsedActiveVideo.platformLabel})
                            </p>
                            <p className="mt-0.5 truncate font-mono-meta text-[11px] text-[#666057]">
                              {activeVideo.url}
                            </p>
                          </div>
                          <a
                            href={activeVideo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1A1816] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#322E2A]"
                          >
                            Watch Video <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <a
                          href={activeVideo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C4B82] hover:underline"
                        >
                          Open original link in new tab <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Candidate Metadata & Casting Agent Pitch */}
            <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5D564E]">
                {candidate.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#9C7434]" />
                    {candidate.location}
                  </span>
                )}
                {candidate.agencyOrContact && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-[#9C7434]" />
                    {candidate.agencyOrContact}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#9C7434]" />
                  Submitted by <strong className="text-[#1A1816]">{candidate.uploadedByName}</strong>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${uploaderRole.badgeClass}`}
                  >
                    {uploaderRole.shortLabel}
                  </span>
                </span>
              </div>

              {candidate.pitchNote && (
                <div className="rounded-xl border border-[#EFECE5] bg-[#FAF8F4] p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A5A10]">
                    Submission Note
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#2C2722]">
                    {candidate.pitchNote}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Transparent Approval Controls, Team Consensus & Notes Thread */}
          <div className="flex flex-col bg-white lg:col-span-5">
            {/* Official Status Bar */}
            <div className="border-b border-[#E5DFD5] p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5D564E]">
                  Official Casting Status
                </span>
                {updatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9C7434]" />}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((st) => {
                  const meta = CANDIDATE_STATUS_META[st];
                  const active = candidate.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? `${meta.badgeClass} ring-2 ring-[#1A1816]/15`
                          : 'border-[#E5DFD5] bg-[#FAF8F4] text-[#5D564E] hover:bg-[#EFECE5]'
                      }`}
                    >
                      {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[11px] text-[#666057]">
                Last updated by <strong className="text-[#1A1816]">{candidate.statusUpdatedBy}</strong>{' '}
                <span className={`inline-block rounded-full border px-1.5 py-0.2 text-[10px] font-semibold ${updaterRole.badgeClass}`}>
                  {updaterRole.shortLabel}
                </span>{' '}
                · {formatDateTime(candidate.statusUpdatedAt)}
              </p>

              {/* Personal Team Verdict */}
              <div className="mt-4 border-t border-[#EFECE5] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5D564E]">
                    Your Verdict ({member.displayName})
                  </span>
                  {updatingVerdict && <Loader2 className="h-3 w-3 animate-spin text-[#9C7434]" />}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {VERDICT_OPTIONS.map((v) => {
                    const meta = VERDICT_META[v];
                    const active = myVerdict === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        disabled={updatingVerdict}
                        onClick={() => handleVerdictClick(v)}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                          active
                            ? meta.activeClass
                            : 'border-[#E5DFD5] bg-[#FAF8F4] text-[#453F38] hover:bg-[#EFECE5]'
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>

                {/* All Team Verdicts Transparent Strip */}
                {allVerdicts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8073]">
                      Team Consensus ({allVerdicts.length})
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {allVerdicts.map((v) => {
                        const vMeta = VERDICT_META[v.verdict] ?? VERDICT_META.maybe;
                        const rMeta = TEAM_ROLES[v.role] ?? TEAM_ROLES.team;
                        return (
                          <span
                            key={v.uid}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${vMeta.chipClass}`}
                          >
                            <strong>{v.name}</strong>
                            <span className="opacity-75">({rMeta.shortLabel}):</span>
                            <span>{vMeta.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transparent Review Notes Thread */}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1A1816]">
                  <MessageSquare className="h-4 w-4 text-[#9C7434]" />
                  Transparent Team Notes ({notes.length})
                </h2>
                <span className="text-[10px] text-[#8A8073]">
                  Visible to Casting, Director & Producers
                </span>
              </div>

              <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: '300px' }}>
                {notes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#DED7CC] bg-[#FAF8F4] px-4 py-6 text-center text-xs text-[#666057]">
                    No review notes yet. Leave feedback on look, chemistry, diction, or approval
                    decisions below.
                  </div>
                ) : (
                  notes.map((n) => {
                    const authorRole = TEAM_ROLES[n.authorRole] ?? TEAM_ROLES.team;
                    const tagMeta = NOTE_TAG_META[n.decisionTag] ?? NOTE_TAG_META.note;
                    const canDeleteNote =
                      n.authorUid === member.uid ||
                      member.role === 'director' ||
                      member.role === 'producer';
                    return (
                      <div
                        key={n.id}
                        className="rounded-xl border border-[#EFECE5] bg-[#FAF8F4] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#1A1816]">
                              {n.authorName}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${authorRole.badgeClass}`}
                            >
                              {authorRole.shortLabel}
                            </span>
                            {n.decisionTag !== 'note' && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tagMeta.badgeClass}`}
                              >
                                {tagMeta.label}
                              </span>
                            )}
                          </div>
                          {canDeleteNote && (
                            <button
                              type="button"
                              onClick={() => deleteCandidateNote(candidate.id, n.id)}
                              aria-label="Delete note"
                              className="text-[#8A8073] hover:text-[#B42318]"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-[#2C2722]">
                          {n.body}
                        </p>
                        <p className="mt-1.5 text-[10px] text-[#8A8073]">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {actionError && (
                <div className="mt-3 rounded-lg border border-[#F2C6C2] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]">
                  {actionError}
                </div>
              )}

              {/* Add Note Form */}
              <form onSubmit={handlePostNote} className="mt-4 space-y-2.5 border-t border-[#E5DFD5] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {NOTE_TAG_OPTIONS.map((tag) => {
                      const active = noteTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setNoteTag(tag);
                            if (['approved', 'shortlisted', 'callback', 'rejected'].includes(tag)) {
                              setSyncStatusFromTag(true);
                            } else {
                              setSyncStatusFromTag(false);
                            }
                          }}
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
                            active
                              ? NOTE_TAG_META[tag].badgeClass + ' ring-1 ring-[#1A1816]/20'
                              : 'border-[#E5DFD5] bg-white text-[#666057] hover:bg-[#FAF8F4]'
                          }`}
                        >
                          {NOTE_TAG_META[tag].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {['approved', 'shortlisted', 'callback', 'rejected'].includes(noteTag) && (
                  <label className="flex items-center gap-2 text-[11px] text-[#5D564E]">
                    <input
                      type="checkbox"
                      checked={syncStatusFromTag}
                      onChange={(e) => setSyncStatusFromTag(e.target.checked)}
                      className="rounded border-[#DED7CC]"
                    />
                    Also update candidate status to{' '}
                    <strong className="text-[#1A1816]">
                      {
                        CANDIDATE_STATUS_META[
                          noteTag as 'approved' | 'shortlisted' | 'callback' | 'rejected'
                        ].label
                      }
                    </strong>
                  </label>
                )}

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder={`Add a transparent ${TEAM_ROLES[member.role].label.toLowerCase()} note...`}
                    className="flex-1 resize-none rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 text-xs text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !noteBody.trim()}
                    aria-label="Post review note"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1A1816] px-3.5 text-white transition hover:bg-[#322E2A] disabled:opacity-50"
                  >
                    {savingNote ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
