import { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Share2, KeyRound, Link2 } from 'lucide-react';
import { LIVE_SHARE_URL, TEAM_PASSCODE } from '../firebase';
import { attachLightDismissFallback } from '../utils/dialogFallback';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShareModal({ open, onClose }: ShareModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedKey, setCopiedKey] = useState<'url' | 'code' | 'invite' | null>(null);

  const shareUrl =
    typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
      ? window.location.origin
      : LIVE_SHARE_URL;

  const whatsappInvite = `Vaishnavi Bupara Micro-Drama — Casting Room\n\nReview talent profiles, audition tapes, and leave approval notes transparently with the Director, Producers & Casting team:\n${shareUrl}\n\nSign in with Google, or use Quick Team Access:\nPasscode: ${TEAM_PASSCODE}`;

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

  const copyText = async (text: string, key: 'url' | 'code' | 'invite') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Fallback ignored silently
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="share-modal-title"
      className="w-full max-w-lg"
    >
      <div className="overflow-hidden rounded-2xl border border-[#DED7CC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5DFD5] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF3DF] text-[#8A5A10]">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h1 id="share-modal-title" className="font-display text-xl font-semibold text-[#1A1816]">
                Share Casting Room
              </h1>
              <p className="text-xs text-[#666057]">
                Invite Casting Agents, Director, Producers & Team
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close share dialog"
            className="rounded-lg border border-[#E5DFD5] p-2 text-[#5D564E] hover:bg-[#FAF8F4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5D564E]">
              <Link2 className="h-3.5 w-3.5 text-[#9C7434]" />
              Live Casting Room Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-lg border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 font-mono-meta text-xs text-[#1A1816]"
              />
              <button
                type="button"
                onClick={() => copyText(shareUrl, 'url')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DED7CC] bg-white px-3 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#FAF8F4]"
              >
                {copiedKey === 'url' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#1B5E41]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5D564E]">
              <KeyRound className="h-3.5 w-3.5 text-[#9C7434]" />
              Quick Team Access Passcode
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={TEAM_PASSCODE}
                className="w-full rounded-lg border border-[#DED7CC] bg-[#FAF8F4] px-3 py-2 font-mono-meta text-sm font-semibold tracking-widest text-[#1A1816]"
              />
              <button
                type="button"
                onClick={() => copyText(TEAM_PASSCODE, 'code')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DED7CC] bg-white px-3 py-2 text-xs font-semibold text-[#1A1816] hover:bg-[#FAF8F4]"
              >
                {copiedKey === 'code' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#1B5E41]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#666057]">
              Members can sign in via Google (1-click) or enter their name, role & passcode above.
            </p>
          </div>

          <div className="rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A1816]">
                Ready-to-Send WhatsApp / Email Invite
              </span>
              <button
                type="button"
                onClick={() => copyText(whatsappInvite, 'invite')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1816] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#35302B]"
              >
                {copiedKey === 'invite' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#86EFAC]" /> Copied Message
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Invite
                  </>
                )}
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#5D564E]">
              {whatsappInvite}
            </pre>
          </div>
        </div>
      </div>
    </dialog>
  );
}
