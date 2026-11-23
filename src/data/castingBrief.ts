import type {
  CandidateStatus,
  NoteDecisionTag,
  RoleBrief,
  RoleId,
  StorylineKey,
  TeamRoleKey,
  VerdictValue,
} from '../types';

export const PROJECT_META = {
  title: 'Vaishnavi Bupara Micro-Drama',
  date: 'Nov 23, 2026',
  handle: '@vaitahavya',
  format: '6 episodes × ~5 min',
  location: 'LB Nagar, Hyderabad',
  tier: 'Premium branded series',
  lookDirection:
    'Everyone should read as affluent, well-groomed South Indian / Hyderabadi: real and credible, never flashy. Keep skin, hair and styling premium-natural. Tone is a prestige limited series, restrained and cinematic, not daytime TV.',
  headcountNote:
    'Total: 12 roles (9 adults, 3–4 children depending on whether Aarav’s child is counted with the kids).',
};

export const STORYLINE_SECTIONS: Array<{
  key: StorylineKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'doctors',
    title: 'Storyline A — The Doctors',
    subtitle: 'Arjun & Kavya Reddy · Long-marriage chemistry',
  },
  {
    key: 'mehtas',
    title: 'Storyline B — The Mehta Joint Family',
    subtitle: '7 roles · Traditional vs modern contrast & tight-knit cousins',
  },
  {
    key: 'bridge',
    title: 'The Bridge Character',
    subtitle: 'Connects both storylines · Brand’s manners made visible',
  },
  {
    key: 'supporting',
    title: 'Supporting',
    subtitle: 'Ep 4 call & doctors-only cut',
  },
];

export const ROLES: RoleBrief[] = [
  {
    id: 'arjun-reddy',
    name: 'Dr. Arjun Reddy',
    subtitle: 'Cardiologist',
    storyline: 'doctors',
    storylineLabel: 'Doctors',
    ageRange: 'Early 40s (40–43); character is 42',
    ageSummary: '40–43',
    build: 'Medium, lightly softened; a fit man who stopped having time for the gym',
    look: 'Salt-and-pepper at the temples, clean shave or neat stubble, tired but distinguished. Crisp shirts, understated steel watch.',
    characterRead:
      'Measured, proud of a life built from a one-room beginning. Attached to being close to the hospital, quietly worn thin. Must feel like an accomplished but weary professional, real rather than glamorous.',
    pairingNote: 'Arjun and Kavya need the chemistry of a long marriage.',
    category: 'adult',
  },
  {
    id: 'kavya-reddy',
    name: 'Dr. Kavya Reddy',
    subtitle: 'Paediatrician',
    storyline: 'doctors',
    storylineLabel: 'Doctors',
    ageRange: '~40',
    ageSummary: '~40',
    build: 'Slim to medium, graceful, a little weary',
    look: 'Warm, expressive face. Low-maintenance elegance: cotton saris or kurtas at the clinic, minimal jewellery.',
    characterRead:
      'Warm, perceptive, quietly exhausted. Calm and capable at work, depleted at home.',
    pairingNote: 'Arjun and Kavya need the chemistry of a long marriage.',
    category: 'adult',
  },
  {
    id: 'rajesh-mehta',
    name: 'Rajesh Mehta',
    subtitle: 'Elder brother, business head',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: '~50',
    ageSummary: '~50',
    build: 'Solid, commanding presence, slightly heavy-set',
    look: 'Greying, well-groomed, traditional-formal.',
    characterRead: 'The patriarch who carries the weight of keeping everyone together.',
    pairingNote: 'Cast the two brothers for contrast, traditional vs modern.',
    category: 'adult',
  },
  {
    id: 'vikram-mehta',
    name: 'Vikram Mehta',
    subtitle: 'Younger brother, operations',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: '~48',
    ageSummary: '~48',
    build: 'Medium; trimmer and more modern than Rajesh',
    look: 'Smart-casual, business-modern.',
    characterRead: 'The conflicted one. Expressive, with a face that can hide a secret.',
    pairingNote: 'Cast the two brothers for contrast, traditional vs modern.',
    category: 'adult',
  },
  {
    id: 'meera-mehta',
    name: 'Meera Mehta',
    subtitle: 'Rajesh’s wife',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: '~45',
    ageSummary: '~45',
    build: 'Medium, warm, matriarchal',
    look: 'Elegant silk saris, gold.',
    characterRead:
      'The emotional centre of the family; a face that holds worry and love at once.',
    pairingNote: 'The two wives are the emotional engine of this storyline.',
    category: 'adult',
  },
  {
    id: 'anjali-mehta',
    name: 'Anjali Mehta',
    subtitle: 'Vikram’s wife',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: '~43',
    ageSummary: '~43',
    build: 'Slim to medium, contemporary',
    look: 'Modern-traditional mix, quietly stylish.',
    characterRead:
      'Loves her family but craves a door of her own. The two wives are the emotional engine of this storyline.',
    pairingNote: 'The two wives are the emotional engine of this storyline.',
    category: 'adult',
  },
  {
    id: 'mehta-teen',
    name: 'Gen-Z teen (eldest child)',
    subtitle: 'Eldest Mehta child',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: '~15–16',
    ageSummary: '15–16',
    build: 'Lean, teenage',
    look: 'Always on the phone; trendy but not a caricature.',
    characterRead:
      'The one who discovers the Bupara reel and bridges the online world and the matriarch.',
    pairingNote: 'Full set of three Mehta kids spans ~8–16; cousins who have grown up as siblings.',
    category: 'child',
  },
  {
    id: 'mehta-child-1',
    name: 'Younger Mehta child 1',
    subtitle: 'Mehta cousin / sibling unit',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: 'Range between ~8 and 14 (full set of three kids spans ~8–16)',
    ageSummary: '~8–14',
    build: 'Natural, well-kept child / pre-teen',
    look: 'Natural, well-kept kids of an affluent business family.',
    characterRead:
      'Cousins who have grown up as siblings. They must feel like a real sibling unit, not extras; their bond is the emotional stake.',
    pairingNote: 'Cast together with Gen-Z teen & Younger Mehta child 2 as a believable sibling unit.',
    category: 'child',
  },
  {
    id: 'mehta-child-2',
    name: 'Younger Mehta child 2',
    subtitle: 'Mehta cousin / sibling unit',
    storyline: 'mehtas',
    storylineLabel: 'Mehtas',
    ageRange: 'Range between ~8 and 14 (full set of three kids spans ~8–16)',
    ageSummary: '~8–14',
    build: 'Natural, well-kept child / pre-teen',
    look: 'Natural, well-kept kids of an affluent business family.',
    characterRead:
      'Cousins who have grown up as siblings. They must feel like a real sibling unit, not extras; their bond is the emotional stake.',
    pairingNote: 'Cast together with Gen-Z teen & Younger Mehta child 1 as a believable sibling unit.',
    category: 'child',
  },
  {
    id: 'aarav',
    name: 'Aarav',
    subtitle: 'Bupara relationship / sales head',
    storyline: 'bridge',
    storylineLabel: 'Both',
    ageRange: '~35',
    ageSummary: '~35',
    build: 'Lean-athletic, composed, well-kept',
    look: 'Understated premium: fine knit or tailored shirt, no loud branding.',
    characterRead:
      'A peer to the buyers and a young dad. An advisor who listens first and sells nothing. Avoid the loud "broker" archetype entirely; he is the brand’s manners made visible.',
    category: 'adult',
  },
  {
    id: 'aarav-child',
    name: 'Aarav’s child',
    subtitle: 'Brief clinic appearance (Ep 3)',
    storyline: 'bridge',
    storylineLabel: 'Doctors (Ep 3)',
    ageRange: '~3–5',
    ageSummary: '3–5',
    build: 'Toddler / young child',
    look: 'Toddler / young child.',
    characterRead: 'Brief appearance at Kavya’s clinic (Ep 3); humanises Aarav.',
    category: 'child',
  },
  {
    id: 'classmate-rival',
    name: 'The classmate / rival',
    subtitle: 'Arjun’s old peer',
    storyline: 'supporting',
    storylineLabel: 'Doctors',
    ageRange: 'Early 40s',
    ageSummary: 'Early 40s',
    build: 'Fit, polished, flashier than Arjun',
    look: 'Deliberately more "new money" shiny; the comparison should sting.',
    characterRead:
      'Needles Arjun about not having "moved up" (Ep 4 call; larger role in the doctors-only cut).',
    category: 'adult',
  },
];

export const ROLES_BY_ID: Record<RoleId, RoleBrief> = ROLES.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<RoleId, RoleBrief>,
);

export const TEAM_ROLES: Record<
  TeamRoleKey,
  { label: string; shortLabel: string; badgeClass: string; description: string }
> = {
  director: {
    label: 'Director',
    shortLabel: 'Director',
    badgeClass: 'bg-slate-900 text-white border-slate-900',
    description: 'Reviews auditions, leaves notes, and locks final cast',
  },
  producer: {
    label: 'Producer',
    shortLabel: 'Producer',
    badgeClass: 'bg-amber-600 text-white border-amber-600',
    description: 'Oversees casting progress and approvals',
  },
  casting_director: {
    label: 'Casting Director',
    shortLabel: 'Casting Dir.',
    badgeClass: 'bg-blue-700 text-white border-blue-700',
    description: 'Curates submissions and coordinates callbacks',
  },
  casting_agent: {
    label: 'Casting Agent',
    shortLabel: 'Agent',
    badgeClass: 'bg-violet-700 text-white border-violet-700',
    description: 'Uploads talent photos and audition video links',
  },
  team: {
    label: 'Creative Team',
    shortLabel: 'Team',
    badgeClass: 'bg-slate-200 text-slate-900 border-slate-300',
    description: 'Reviews talent, votes, and shares feedback',
  },
};

export const CANDIDATE_STATUS_META: Record<
  CandidateStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  submitted: {
    label: 'Submitted',
    badgeClass: 'bg-slate-800 text-white border-slate-800',
    dotClass: 'bg-slate-300',
  },
  shortlisted: {
    label: 'Shortlisted',
    badgeClass: 'bg-amber-500 text-slate-950 border-amber-500',
    dotClass: 'bg-slate-950',
  },
  callback: {
    label: 'Callback',
    badgeClass: 'bg-blue-600 text-white border-blue-600',
    dotClass: 'bg-blue-100',
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-600 text-white border-emerald-600',
    dotClass: 'bg-emerald-100',
  },
  rejected: {
    label: 'Passed',
    badgeClass: 'bg-rose-600 text-white border-rose-600',
    dotClass: 'bg-rose-100',
  },
};

export const VERDICT_META: Record<
  VerdictValue,
  { label: string; activeClass: string; chipClass: string }
> = {
  approve: {
    label: 'Approve',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
    chipClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  shortlist: {
    label: 'Shortlist',
    activeClass: 'bg-amber-500 text-slate-950 border-amber-500',
    chipClass: 'bg-amber-100 text-amber-950 border-amber-300',
  },
  maybe: {
    label: 'Discuss',
    activeClass: 'bg-blue-600 text-white border-blue-600',
    chipClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  pass: {
    label: 'Pass',
    activeClass: 'bg-rose-600 text-white border-rose-600',
    chipClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
};

export const NOTE_TAG_META: Record<
  NoteDecisionTag,
  { label: string; badgeClass: string }
> = {
  note: {
    label: 'Note',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  shortlisted: {
    label: 'Shortlist',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
  },
  callback: {
    label: 'Callback',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  question: {
    label: 'Question',
    badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
  },
  rejected: {
    label: 'Passed',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
};
