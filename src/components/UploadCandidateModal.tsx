import { useEffect, useRef, useState } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Star,
  Video,
  Link2,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { ROLES, STORYLINE_SECTIONS } from '../data/castingBrief';
import {
  createCandidate,
  normalizeUrl,
  updateCandidateDetails,
  type PendingPhotoDraft,
} from '../services/castingService';
import type { Candidate, CandidateVideoLink, RoleId, TeamMember } from '../types';
import { processUploadedPhoto } from '../utils/media';
import { detectVideoInfo } from '../utils/video';
import { attachFormAriaValidation } from '../utils/dialogFallback';

interface UploadCandidateModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember;
  defaultRoleId: RoleId;
  editingCandidate?: Candidate | null;
  onSaved?: (roleId: RoleId, candidateId?: string) => void;
}

export function UploadCandidateModal({
  open,
  onClose,
  member,
  defaultRoleId,
  editingCandidate,
  onSaved,
}: UploadCandidateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roleId, setRoleId] = useState<RoleId>(defaultRoleId);
  const [actorName, setActorName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('Hyderabad');
  const [agencyOrContact, setAgencyOrContact] = useState('');
  const [pitchNote, setPitchNote] = useState('');
  const [photos, setPhotos] = useState<PendingPhotoDraft[]>([]);
  const [externalPhotoUrl, setExternalPhotoUrl] = useState('');
  const [videoLinks, setVideoLinks] = useState<CandidateVideoLink[]>([
    { id: 'v-1', label: 'Audition Self-Tape', url: '', platform: 'other' },
  ]);

  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingCandidate) {
      setRoleId(editingCandidate.roleId);
      setActorName(editingCandidate.actorName);
      setAge(editingCandidate.age);
      setLocation(editingCandidate.location);
      setAgencyOrContact(editingCandidate.agencyOrContact);
      setPitchNote(editingCandidate.pitchNote);
      setPhotos(
        editingCandidate.photos.map((p, idx) => ({
          id: p.id || `existing-${idx}`,
          kind: 'existing',
          existingPhoto: p,
          previewUrl: p.thumbDataUrl || p.url || '',
          caption: p.caption || '',
        })),
      );
      setVideoLinks(
        editingCandidate.videoLinks.length > 0
          ? editingCandidate.videoLinks.map((v, idx) => ({
              id: v.id || `vid-${idx}`,
              label: v.label,
              url: v.url,
              platform: v.platform,
            }))
          : [{ id: 'v-1', label: 'Audition Self-Tape', url: '', platform: 'other' }],
      );
    } else {
      setRoleId(defaultRoleId);
      setActorName('');
      setAge('');
      setLocation('Hyderabad');
      setAgencyOrContact('');
      setPitchNote('');
      setPhotos([]);
      setExternalPhotoUrl('');
      setVideoLinks([{ id: 'v-1', label: 'Audition Self-Tape', url: '', platform: 'other' }]);
    }
  }, [open, defaultRoleId, editingCandidate]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', onNativeClose);
    return () => dialog.removeEventListener('close', onNativeClose);
  }, [onClose]);

  useEffect(() => {
    if (!formRef.current || !open) return;
    return attachFormAriaValidation(formRef.current);
  }, [open]);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const remaining = 6 - photos.length;
    if (remaining <= 0) {
      setError('Maximum 6 photos per candidate. Remove one before adding another.');
      return;
    }

    setProcessingPhotos(true);
    try {
      const selected = Array.from(files).slice(0, remaining);
      const nextDrafts: PendingPhotoDraft[] = [];
      for (const file of selected) {
        const processed = await processUploadedPhoto(file);
        nextDrafts.push({
          id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind: 'uploaded',
          processed,
          previewUrl: processed.thumbDataUrl,
          caption: '',
        });
      }
      setPhotos((prev) => [...prev, ...nextDrafts]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process selected image.');
    } finally {
      setProcessingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddExternalPhoto = () => {
    const url = normalizeUrl(externalPhotoUrl);
    if (!url) return;
    if (photos.length >= 6) {
      setError('Maximum 6 photos per candidate.');
      return;
    }
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid image URL (starting with https://).');
      return;
    }
    setPhotos((prev) => [
      ...prev,
      {
        id: `ext-${Date.now()}`,
        kind: 'url',
        externalUrl: url,
        previewUrl: url,
        caption: '',
      },
    ]);
    setExternalPhotoUrl('');
    setError(null);
  };

  const makeCover = (index: number) => {
    setPhotos((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const addVideoRow = () => {
    if (videoLinks.length >= 8) return;
    setVideoLinks((prev) => [
      ...prev,
      { id: `v-${Date.now()}`, label: 'Showreel / Clip', url: '', platform: 'other' },
    ]);
  };

  const updateVideoRow = (id: string, field: 'label' | 'url', value: string) => {
    setVideoLinks((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, [field]: value };
        if (field === 'url') {
          next.platform = detectVideoInfo(normalizeUrl(value)).platform;
        }
        return next;
      }),
    );
  };

  const removeVideoRow = (id: string) => {
    setVideoLinks((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!actorName.trim()) {
      setError('Please enter the actor’s name.');
      return;
    }

    const validVideos = videoLinks
      .filter((v) => v.url.trim().length > 0)
      .map((v) => {
        const normalized = normalizeUrl(v.url);
        return {
          ...v,
          url: normalized,
          platform: detectVideoInfo(normalized).platform,
        };
      });

    for (const v of validVideos) {
      try {
        new URL(v.url);
      } catch {
        setError(`Invalid video link URL: "${v.url}"`);
        return;
      }
    }

    if (photos.length === 0 && validVideos.length === 0) {
      setError('Please add at least one photo or one video link for this candidate.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCandidate) {
        await updateCandidateDetails({
          candidate: editingCandidate,
          member,
          roleId,
          actorName,
          age,
          location,
          agencyOrContact,
          pitchNote,
          photos,
          videoLinks: validVideos,
        });
        onSaved?.(roleId, editingCandidate.id);
      } else {
        const newId = await createCandidate({
          member,
          roleId,
          actorName,
          age,
          location,
          agencyOrContact,
          pitchNote,
          photos,
          videoLinks: validVideos,
        });
        onSaved?.(roleId, newId);
      }
      dialogRef.current?.close();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save candidate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="upload-modal-title"
      className="w-full max-w-3xl"
    >
      <div className="flex max-h-[92dvh] flex-col overflow-hidden rounded-2xl border border-[#DED7CC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5DFD5] bg-[#FAF8F4] px-6 py-4">
          <div>
            <p className="font-mono-meta text-[11px] uppercase tracking-[0.14em] text-[#9C7434]">
              {editingCandidate ? 'Edit Talent Submission' : 'New Talent Submission'}
            </p>
            <h1 id="upload-modal-title" className="font-display text-2xl font-semibold text-[#1A1816]">
              {editingCandidate ? `Update ${editingCandidate.actorName}` : 'Upload Candidate for Role'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close upload modal"
            className="rounded-lg border border-[#DED7CC] bg-white p-2 text-[#5D564E] hover:bg-[#EFECE5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Role & Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="cand-role" className="block text-xs font-semibold text-[#1A1816]">
                Target Role (12 Brief Characters)
              </label>
              <span id="cand-role-hint" className="field-hint">
                Assign this talent to a specific character from the Vaishnavi Bupara brief
              </span>
              <select
                id="cand-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value as RoleId)}
                aria-describedby="cand-role-hint"
                className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm font-medium text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
              >
                {STORYLINE_SECTIONS.map((sec) => (
                  <optgroup key={sec.key} label={sec.title}>
                    {ROLES.filter((r) => r.storyline === sec.key).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.ageSummary}) — {r.subtitle}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cand-name" className="block text-xs font-semibold text-[#1A1816]">
                Actor Full Name *
              </label>
              <span id="cand-name-hint" className="field-hint">
                Stage or real name used in casting sheets
              </span>
              <input
                id="cand-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoFocus
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                placeholder="e.g., Raghuveer Rao"
                aria-describedby="cand-name-hint"
                data-error="cand-name-error"
                className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
              />
              <div id="cand-name-error" className="error-msg">
                Please enter the actor’s name.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cand-age" className="block text-xs font-semibold text-[#1A1816]">
                  Age / Playing Age
                </label>
                <span className="field-hint">e.g., 42</span>
                <input
                  id="cand-age"
                  type="text"
                  maxLength={30}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="42"
                  className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cand-loc" className="block text-xs font-semibold text-[#1A1816]">
                  Location
                </label>
                <span className="field-hint">Base city</span>
                <input
                  id="cand-loc"
                  type="text"
                  maxLength={100}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hyderabad"
                  className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cand-contact" className="block text-xs font-semibold text-[#1A1816]">
                Agency / Contact / Availability
              </label>
              <span className="field-hint">
                Optional casting agency, phone, or shoot date availability notes
              </span>
              <input
                id="cand-contact"
                type="text"
                maxLength={160}
                value={agencyOrContact}
                onChange={(e) => setAgencyOrContact(e.target.value)}
                placeholder="e.g., Hyderabad Talent Co. · Available Dec 2026"
                className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cand-pitch" className="block text-xs font-semibold text-[#1A1816]">
                Casting Agent Note / Fit Summary
              </label>
              <span className="field-hint">
                Why this actor fits the character read, language fluency (Telugu/Hindi/English), or prior work
              </span>
              <textarea
                id="cand-pitch"
                rows={3}
                maxLength={2000}
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
                placeholder="Natural Hyderabadi diction, strong understated screen presence, recent OTT web series credits..."
                className="w-full rounded-xl border border-[#DED7CC] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="rounded-2xl border border-[#E5DFD5] bg-[#FCFBF8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1A1816]">
                  <ImagePlus className="h-4 w-4 text-[#9C7434]" />
                  Photos & Headshots ({photos.length}/6)
                </h2>
                <p className="mt-0.5 text-[11px] text-[#666057]">
                  Upload natural close-ups, profile shots, and full-length looks. Auto-optimized for fast review.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                disabled={processingPhotos || photos.length >= 6}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A1816] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#322E2A] disabled:opacity-50"
              >
                {processingPhotos ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Optimizing...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" /> Upload Photos
                  </>
                )}
              </button>
            </div>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-xl border border-[#DED7CC] bg-white"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-[#EFECE5]">
                      <img
                        src={p.previewUrl}
                        alt={`Candidate photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {idx === 0 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#1A1816]/85 px-2 py-0.5 text-[10px] font-semibold text-[#F4D89A]">
                        <Star className="h-2.5 w-2.5 fill-current" /> Cover
                      </span>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(idx)}
                          title="Set as cover photo"
                          className="rounded-lg bg-white/90 p-1.5 text-[#1A1816] shadow hover:bg-white"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        title="Remove photo"
                        className="rounded-lg bg-white/90 p-1.5 text-[#B42318] shadow hover:bg-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* External Photo URL option */}
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8A8073]" />
                <input
                  type="url"
                  value={externalPhotoUrl}
                  onChange={(e) => setExternalPhotoUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full rounded-lg border border-[#DED7CC] bg-white py-2 pl-8 pr-3 text-xs text-[#1A1816] focus:border-[#9C7434] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddExternalPhoto}
                disabled={!externalPhotoUrl.trim() || photos.length >= 6}
                className="rounded-lg border border-[#DED7CC] bg-white px-3 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#EFECE5] disabled:opacity-50"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Video Links Section */}
          <div className="rounded-2xl border border-[#E5DFD5] bg-[#FCFBF8] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1A1816]">
                  <Video className="h-4 w-4 text-[#9C7434]" />
                  Audition & Showreel Video Links
                </h2>
                <p className="mt-0.5 text-[11px] text-[#666057]">
                  YouTube, Vimeo, Google Drive, Instagram Reels, or direct video links. YouTube/Vimeo/Drive embed inline!
                </p>
              </div>
              <button
                type="button"
                onClick={addVideoRow}
                disabled={videoLinks.length >= 8}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DED7CC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1A1816] hover:bg-[#EFECE5] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add Link
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {videoLinks.map((row) => {
                const detected = row.url.trim() ? detectVideoInfo(normalizeUrl(row.url)) : null;
                return (
                  <div
                    key={row.id}
                    className="grid gap-2 rounded-xl border border-[#E5DFD5] bg-white p-2.5 sm:grid-cols-12"
                  >
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateVideoRow(row.id, 'label', e.target.value)}
                      placeholder="Label (e.g. Self-tape)"
                      maxLength={120}
                      className="rounded-lg border border-[#E5DFD5] bg-[#FAF8F4] px-2.5 py-2 text-xs font-medium text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none sm:col-span-4"
                    />
                    <div className="flex items-center gap-2 sm:col-span-8">
                      <input
                        type="url"
                        value={row.url}
                        onChange={(e) => updateVideoRow(row.id, 'url', e.target.value)}
                        placeholder="https://youtube.com/... or https://drive.google.com/..."
                        className="w-full rounded-lg border border-[#E5DFD5] bg-[#FAF8F4] px-2.5 py-2 text-xs text-[#1A1816] focus:border-[#9C7434] focus:bg-white focus:outline-none"
                      />
                      {detected && (
                        <span className="shrink-0 rounded-md border border-[#E4D7BE] bg-[#FDF9F0] px-2 py-1 font-mono-meta text-[10px] font-medium text-[#8A5A10]">
                          {detected.platformLabel}
                        </span>
                      )}
                      {videoLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVideoRow(row.id)}
                          aria-label="Remove video link"
                          className="rounded-lg p-1.5 text-[#8A8073] hover:bg-[#FEF3F2] hover:text-[#B42318]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[#F2C6C2] bg-[#FEF3F2] px-4 py-3 text-xs font-medium text-[#B42318]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#E5DFD5] pt-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-[#DED7CC] bg-white px-4 py-2.5 text-xs font-semibold text-[#5D564E] hover:bg-[#FAF8F4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || processingPhotos}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A1816] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#322E2A] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving to Casting Room...
                </>
              ) : editingCandidate ? (
                'Save Changes'
              ) : (
                'Submit Candidate'
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
