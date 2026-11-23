import type { Timestamp } from 'firebase/firestore';

export type TeamRoleKey =
  | 'casting_agent'
  | 'casting_director'
  | 'director'
  | 'producer'
  | 'team';

export type CandidateStatus =
  | 'submitted'
  | 'shortlisted'
  | 'callback'
  | 'approved'
  | 'rejected';

export type VerdictValue = 'approve' | 'shortlist' | 'maybe' | 'pass';

export type NoteDecisionTag =
  | 'note'
  | 'approved'
  | 'shortlisted'
  | 'callback'
  | 'rejected'
  | 'question';

export type VideoPlatform =
  | 'youtube'
  | 'vimeo'
  | 'gdrive'
  | 'instagram'
  | 'direct'
  | 'other';

export type RoleId =
  | 'arjun-reddy'
  | 'kavya-reddy'
  | 'rajesh-mehta'
  | 'vikram-mehta'
  | 'meera-mehta'
  | 'anjali-mehta'
  | 'amma-mehta'
  | 'mehta-teen'
  | 'mehta-child-1'
  | 'mehta-child-2'
  | 'aarav'
  | 'aarav-child'
  | 'classmate-rival'
  | 'extras-association'
  | 'extras-hospital'
  | 'extras-centre';

export type StorylineKey = 'doctors' | 'mehtas' | 'bridge' | 'supporting' | 'extras';

export interface RoleBrief {
  id: RoleId;
  name: string;
  subtitle: string;
  storyline: StorylineKey;
  storylineLabel: string;
  ageRange: string;
  ageSummary: string;
  shootDays: string;
  shootDaysCount: number;
  build: string;
  look: string;
  characterRead: string;
  pairingNote?: string;
  category: 'adult' | 'child' | 'extras';
}

export interface TeamMember {
  uid: string;
  displayName: string;
  role: TeamRoleKey;
  email: string | null;
  photoURL: string | null;
  authMethod: 'google' | 'passcode';
  joinedAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CandidatePhoto {
  id: string;
  mediaId?: string;
  url?: string;
  thumbDataUrl?: string;
  caption?: string;
}

export interface CandidateVideoLink {
  id: string;
  label: string;
  url: string;
  platform: VideoPlatform;
}

export interface MemberVerdict {
  uid: string;
  name: string;
  role: TeamRoleKey;
  verdict: VerdictValue;
  updatedAt: Timestamp;
}

export interface Candidate {
  id: string;
  roleId: RoleId;
  actorName: string;
  age: string;
  location: string;
  agencyOrContact: string;
  pitchNote: string;
  photos: CandidatePhoto[];
  videoLinks: CandidateVideoLink[];
  status: CandidateStatus;
  statusUpdatedBy: string;
  statusUpdatedByRole: TeamRoleKey;
  statusUpdatedByUid: string;
  statusUpdatedAt?: Timestamp;
  verdicts: Record<string, MemberVerdict>;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedByRole: TeamRoleKey;
  notesCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CandidateNote {
  id: string;
  candidateId: string;
  roleId: RoleId;
  authorUid: string;
  authorName: string;
  authorRole: TeamRoleKey;
  body: string;
  decisionTag: NoteDecisionTag;
  createdAt?: Timestamp;
}

export interface ActivityEvent {
  id: string;
  type:
    | 'candidate_uploaded'
    | 'status_changed'
    | 'note_added'
    | 'verdict_cast'
    | 'candidate_updated';
  roleId: RoleId;
  roleName: string;
  candidateId: string;
  actorName: string;
  actorUid: string;
  actorDisplayName: string;
  actorRole: TeamRoleKey;
  summary: string;
  createdAt?: Timestamp;
}
