# Vaishnavi Bupara Micro-Drama — Casting Room

Collaborative casting web application for **Vaishnavi Bupara Micro-Drama** (6 episodes × ~5 min · LB Nagar, Hyderabad · Premium branded series).

**Live App:** https://vaishnavi-bupara-casting.web.app

## Features

- **All 12 Brief Roles Pre-Loaded** across Storyline A (*The Doctors*), Storyline B (*The Mehta Joint Family*), *The Bridge Character*, and *Supporting*, complete with full Age, Build, Look, Character Read, and Pairing Notes.
- **Talent Submissions**: Casting agents upload multiple headshots (auto-optimized client-side for crisp fast review) or external photo URLs, plus multiple audition/showreel video links with inline embeds for YouTube, Vimeo, Google Drive, and direct video files.
- **Transparent Team Review & Approvals**: Director, Producers, Casting Director, Casting Agents, and Creative Team review talent in real time, update official casting status (`Submitted`, `Shortlisted`, `Callback`, `Approved`, `Passed`), cast individual team verdicts, and post role-badged review notes visible to everyone.
- **Dual Team Access**: Supports both **Google Sign-In** and **Quick Team Passcode Access** (via Firebase Anonymous Auth) with strict Firestore Security Rules.
- **Live Activity Feed & Master Brief**: Track casting progress (`X / 12 Roles Cast`), inspect live activity across all roles, and share one-click WhatsApp/Email room invites.

## Tech Stack

- React 19, TypeScript, Vite 6, Tailwind CSS v4
- Firebase Authentication (Google Sign-In + Anonymous Passcode)
- Cloud Firestore (real-time listeners + strict security rules)
- Firebase Hosting

## Local Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
npx -y firebase-tools@latest deploy
```
