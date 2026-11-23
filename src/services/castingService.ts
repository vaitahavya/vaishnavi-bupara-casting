import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, TEAM_PASSCODE } from '../firebase';
import { CANDIDATE_STATUS_META, ROLES_BY_ID, VERDICT_META } from '../data/castingBrief';
import type {
  ActivityEvent,
  Candidate,
  CandidateNote,
  CandidatePhoto,
  CandidateStatus,
  CandidateVideoLink,
  NoteDecisionTag,
  RoleId,
  TeamMember,
  TeamRoleKey,
  VerdictValue,
} from '../types';
import type { ProcessedImage } from '../utils/media';

// In-memory cache for full-res media dataUrls to avoid redundant Firestore reads
const mediaCache = new Map<string, string>();

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function getTeamMemberProfile(uid: string): Promise<TeamMember | null> {
  const snap = await getDoc(doc(db, 'teamMembers', uid));
  if (!snap.exists()) return null;
  return snap.data() as TeamMember;
}

export async function registerTeamMember(params: {
  uid: string;
  displayName: string;
  role: TeamRoleKey;
  email: string | null;
  photoURL: string | null;
  authMethod: 'google' | 'passcode';
  passcode?: string;
}): Promise<TeamMember> {
  const ref = doc(db, 'teamMembers', params.uid);
  const payload: Record<string, unknown> = {
    uid: params.uid,
    displayName: params.displayName.trim().slice(0, 80),
    role: params.role,
    email: params.email || null,
    photoURL: params.photoURL || null,
    authMethod: params.authMethod,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (params.authMethod === 'passcode') {
    payload.passcode = (params.passcode ?? TEAM_PASSCODE).trim();
  }

  await setDoc(ref, payload);
  const snap = await getDoc(ref);
  return snap.data() as TeamMember;
}

export async function updateTeamMemberProfile(
  uid: string,
  updates: { displayName: string; role: TeamRoleKey },
): Promise<TeamMember> {
  const ref = doc(db, 'teamMembers', uid);
  await updateDoc(ref, {
    displayName: updates.displayName.trim().slice(0, 80),
    role: updates.role,
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return snap.data() as TeamMember;
}

export function subscribeTeamMembers(callback: (members: TeamMember[]) => void) {
  const q = query(collection(db, 'teamMembers'), orderBy('joinedAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => d.data() as TeamMember);
    callback(list);
  });
}

export function subscribeCandidates(callback: (candidates: Candidate[]) => void) {
  const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data() as Omit<Candidate, 'id'>;
      return {
        ...data,
        id: d.id,
        verdicts: data.verdicts ?? {},
        photos: data.photos ?? [],
        videoLinks: data.videoLinks ?? [],
      } as Candidate;
    });
    callback(list);
  });
}

export function subscribeCandidateNotes(
  candidateId: string,
  callback: (notes: CandidateNote[]) => void,
) {
  const q = query(
    collection(db, 'candidates', candidateId, 'notes'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({
      ...(d.data() as Omit<CandidateNote, 'id'>),
      id: d.id,
    }));
    callback(list);
  });
}

export function subscribeActivity(callback: (events: ActivityEvent[]) => void) {
  const q = query(collection(db, 'activity'), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({
      ...(d.data() as Omit<ActivityEvent, 'id'>),
      id: d.id,
    }));
    callback(list);
  });
}

export async function fetchFullMediaDataUrl(mediaId: string): Promise<string | null> {
  const cached = mediaCache.get(mediaId);
  if (cached) return cached;
  const snap = await getDoc(doc(db, 'media', mediaId));
  if (!snap.exists()) return null;
  const dataUrl = snap.data().dataUrl as string;
  if (dataUrl) mediaCache.set(mediaId, dataUrl);
  return dataUrl || null;
}

export interface PendingPhotoDraft {
  id: string;
  kind: 'uploaded' | 'existing' | 'url';
  processed?: ProcessedImage;
  existingPhoto?: CandidatePhoto;
  externalUrl?: string;
  previewUrl: string;
  caption: string;
}

export async function createCandidate(params: {
  member: TeamMember;
  roleId: RoleId;
  actorName: string;
  age: string;
  location: string;
  agencyOrContact: string;
  pitchNote: string;
  photos: PendingPhotoDraft[];
  videoLinks: CandidateVideoLink[];
}): Promise<string> {
  const candidateRef = doc(collection(db, 'candidates'));
  const candidateId = candidateRef.id;

  const finalPhotos: CandidatePhoto[] = [];

  for (const draft of params.photos.slice(0, 6)) {
    if (draft.kind === 'uploaded' && draft.processed) {
      const mediaRef = doc(collection(db, 'media'));
      await setDoc(mediaRef, {
        candidateId,
        roleId: params.roleId,
        dataUrl: draft.processed.fullDataUrl,
        mimeType: draft.processed.mimeType,
        width: draft.processed.width,
        height: draft.processed.height,
        uploadedByUid: params.member.uid,
        createdAt: serverTimestamp(),
      });
      mediaCache.set(mediaRef.id, draft.processed.fullDataUrl);
      const photoEntry: CandidatePhoto = {
        id: mediaRef.id,
        mediaId: mediaRef.id,
        thumbDataUrl: draft.processed.thumbDataUrl,
      };
      if (draft.caption.trim()) photoEntry.caption = draft.caption.trim().slice(0, 200);
      finalPhotos.push(photoEntry);
    } else if (draft.kind === 'url' && draft.externalUrl) {
      const photoEntry: CandidatePhoto = {
        id: draft.id,
        url: normalizeUrl(draft.externalUrl),
      };
      if (draft.caption.trim()) photoEntry.caption = draft.caption.trim().slice(0, 200);
      finalPhotos.push(photoEntry);
    }
  }

  const sanitizedVideos = params.videoLinks
    .slice(0, 8)
    .filter((v) => v.url.trim().length > 0)
    .map((v) => ({
      url: normalizeUrl(v.url),
      label: (v.label.trim() || 'Audition / Reel').slice(0, 120),
      platform: v.platform,
    }));

  const now = serverTimestamp();

  await setDoc(candidateRef, {
    roleId: params.roleId,
    actorName: params.actorName.trim().slice(0, 100),
    age: params.age.trim().slice(0, 30),
    location: params.location.trim().slice(0, 100),
    agencyOrContact: params.agencyOrContact.trim().slice(0, 160),
    pitchNote: params.pitchNote.trim().slice(0, 2000),
    photos: finalPhotos,
    videoLinks: sanitizedVideos,
    status: 'submitted',
    statusUpdatedBy: params.member.displayName,
    statusUpdatedByRole: params.member.role,
    statusUpdatedByUid: params.member.uid,
    statusUpdatedAt: now,
    verdicts: {},
    uploadedByUid: params.member.uid,
    uploadedByName: params.member.displayName,
    uploadedByRole: params.member.role,
    notesCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  const role = ROLES_BY_ID[params.roleId];
  await addDoc(collection(db, 'activity'), {
    type: 'candidate_uploaded',
    roleId: params.roleId,
    roleName: role.name,
    candidateId,
    actorName: params.actorName.trim().slice(0, 100),
    actorUid: params.member.uid,
    actorDisplayName: params.member.displayName,
    actorRole: params.member.role,
    summary: `Uploaded ${params.actorName.trim()} for ${role.name} (${finalPhotos.length} photo${finalPhotos.length === 1 ? '' : 's'}, ${sanitizedVideos.length} video link${sanitizedVideos.length === 1 ? '' : 's'}).`,
    createdAt: serverTimestamp(),
  });

  return candidateId;
}

export async function updateCandidateDetails(params: {
  candidate: Candidate;
  member: TeamMember;
  roleId: RoleId;
  actorName: string;
  age: string;
  location: string;
  agencyOrContact: string;
  pitchNote: string;
  photos: PendingPhotoDraft[];
  videoLinks: CandidateVideoLink[];
}) {
  const finalPhotos: CandidatePhoto[] = [];

  for (const draft of params.photos.slice(0, 6)) {
    if (draft.kind === 'existing' && draft.existingPhoto) {
      const entry: CandidatePhoto = { ...draft.existingPhoto };
      if (draft.caption.trim()) entry.caption = draft.caption.trim().slice(0, 200);
      else delete entry.caption;
      finalPhotos.push(entry);
    } else if (draft.kind === 'uploaded' && draft.processed) {
      const mediaRef = doc(collection(db, 'media'));
      await setDoc(mediaRef, {
        candidateId: params.candidate.id,
        roleId: params.roleId,
        dataUrl: draft.processed.fullDataUrl,
        mimeType: draft.processed.mimeType,
        width: draft.processed.width,
        height: draft.processed.height,
        uploadedByUid: params.member.uid,
        createdAt: serverTimestamp(),
      });
      mediaCache.set(mediaRef.id, draft.processed.fullDataUrl);
      const entry: CandidatePhoto = {
        id: mediaRef.id,
        mediaId: mediaRef.id,
        thumbDataUrl: draft.processed.thumbDataUrl,
      };
      if (draft.caption.trim()) entry.caption = draft.caption.trim().slice(0, 200);
      finalPhotos.push(entry);
    } else if (draft.kind === 'url' && draft.externalUrl) {
      const entry: CandidatePhoto = {
        id: draft.id,
        url: normalizeUrl(draft.externalUrl),
      };
      if (draft.caption.trim()) entry.caption = draft.caption.trim().slice(0, 200);
      finalPhotos.push(entry);
    }
  }

  const sanitizedVideos = params.videoLinks
    .slice(0, 8)
    .filter((v) => v.url.trim().length > 0)
    .map((v) => ({
      url: normalizeUrl(v.url),
      label: (v.label.trim() || 'Audition / Reel').slice(0, 120),
      platform: v.platform,
    }));

  await updateDoc(doc(db, 'candidates', params.candidate.id), {
    roleId: params.roleId,
    actorName: params.actorName.trim().slice(0, 100),
    age: params.age.trim().slice(0, 30),
    location: params.location.trim().slice(0, 100),
    agencyOrContact: params.agencyOrContact.trim().slice(0, 160),
    pitchNote: params.pitchNote.trim().slice(0, 2000),
    photos: finalPhotos,
    videoLinks: sanitizedVideos,
    updatedAt: serverTimestamp(),
  });

  const role = ROLES_BY_ID[params.roleId];
  await addDoc(collection(db, 'activity'), {
    type: 'candidate_updated',
    roleId: params.roleId,
    roleName: role.name,
    candidateId: params.candidate.id,
    actorName: params.actorName.trim().slice(0, 100),
    actorUid: params.member.uid,
    actorDisplayName: params.member.displayName,
    actorRole: params.member.role,
    summary: `Updated profile/media for ${params.actorName.trim()} (${role.name}).`,
    createdAt: serverTimestamp(),
  });
}

export async function updateCandidateStatus(params: {
  candidate: Candidate;
  member: TeamMember;
  status: CandidateStatus;
}) {
  const role = ROLES_BY_ID[params.candidate.roleId];
  await updateDoc(doc(db, 'candidates', params.candidate.id), {
    status: params.status,
    statusUpdatedBy: params.member.displayName,
    statusUpdatedByRole: params.member.role,
    statusUpdatedByUid: params.member.uid,
    statusUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'activity'), {
    type: 'status_changed',
    roleId: params.candidate.roleId,
    roleName: role.name,
    candidateId: params.candidate.id,
    actorName: params.candidate.actorName,
    actorUid: params.member.uid,
    actorDisplayName: params.member.displayName,
    actorRole: params.member.role,
    summary: `Marked ${params.candidate.actorName} as ${CANDIDATE_STATUS_META[params.status].label} for ${role.name}.`,
    createdAt: serverTimestamp(),
  });
}

export async function setMemberVerdict(params: {
  candidate: Candidate;
  member: TeamMember;
  verdict: VerdictValue | null;
}) {
  const candidateRef = doc(db, 'candidates', params.candidate.id);
  const role = ROLES_BY_ID[params.candidate.roleId];

  if (params.verdict === null) {
    await updateDoc(candidateRef, {
      [`verdicts.${params.member.uid}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await updateDoc(candidateRef, {
    [`verdicts.${params.member.uid}`]: {
      uid: params.member.uid,
      name: params.member.displayName,
      role: params.member.role,
      verdict: params.verdict,
      updatedAt: Timestamp.now(),
    },
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'activity'), {
    type: 'verdict_cast',
    roleId: params.candidate.roleId,
    roleName: role.name,
    candidateId: params.candidate.id,
    actorName: params.candidate.actorName,
    actorUid: params.member.uid,
    actorDisplayName: params.member.displayName,
    actorRole: params.member.role,
    summary: `Voted "${VERDICT_META[params.verdict].label}" on ${params.candidate.actorName} (${role.name}).`,
    createdAt: serverTimestamp(),
  });
}

export async function addCandidateNote(params: {
  candidate: Candidate;
  member: TeamMember;
  body: string;
  decisionTag: NoteDecisionTag;
  alsoUpdateStatus?: CandidateStatus;
}) {
  const trimmed = params.body.trim().slice(0, 2000);
  if (!trimmed) return;

  const batch = writeBatch(db);
  const noteRef = doc(collection(db, 'candidates', params.candidate.id, 'notes'));
  const candidateRef = doc(db, 'candidates', params.candidate.id);
  const role = ROLES_BY_ID[params.candidate.roleId];

  batch.set(noteRef, {
    candidateId: params.candidate.id,
    roleId: params.candidate.roleId,
    authorUid: params.member.uid,
    authorName: params.member.displayName,
    authorRole: params.member.role,
    body: trimmed,
    decisionTag: params.decisionTag,
    createdAt: serverTimestamp(),
  });

  const candidateUpdate: Record<string, unknown> = {
    notesCount: increment(1),
    updatedAt: serverTimestamp(),
  };

  if (params.alsoUpdateStatus) {
    candidateUpdate.status = params.alsoUpdateStatus;
    candidateUpdate.statusUpdatedBy = params.member.displayName;
    candidateUpdate.statusUpdatedByRole = params.member.role;
    candidateUpdate.statusUpdatedByUid = params.member.uid;
    candidateUpdate.statusUpdatedAt = serverTimestamp();
  }

  batch.update(candidateRef, candidateUpdate);
  await batch.commit();

  const excerpt = trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
  await addDoc(collection(db, 'activity'), {
    type: 'note_added',
    roleId: params.candidate.roleId,
    roleName: role.name,
    candidateId: params.candidate.id,
    actorName: params.candidate.actorName,
    actorUid: params.member.uid,
    actorDisplayName: params.member.displayName,
    actorRole: params.member.role,
    summary: `Added note on ${params.candidate.actorName}: "${excerpt}"`,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCandidateNote(candidateId: string, noteId: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'candidates', candidateId, 'notes', noteId));
  batch.update(doc(db, 'candidates', candidateId), {
    notesCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function deleteCandidate(candidate: Candidate) {
  // Clean up associated media docs best-effort
  for (const photo of candidate.photos) {
    if (photo.mediaId) {
      try {
        await deleteDoc(doc(db, 'media', photo.mediaId));
        mediaCache.delete(photo.mediaId);
      } catch {
        // Ignore if already removed
      }
    }
  }
  await deleteDoc(doc(db, 'candidates', candidate.id));
}
