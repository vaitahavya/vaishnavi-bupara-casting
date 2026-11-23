/**
 * Safari fallback for `<dialog closedby="any">` light-dismiss per modern-web-guidance
 * (`dialog` + `light-dismiss-a-dialog`). Uses pointerdown + pointerup coordinate checks
 * against `getBoundingClientRect()` so text-selection drags ending on the backdrop do not
 * inadvertently dismiss, and padding clicks inside the dialog are ignored.
 */
export function attachLightDismissFallback(dialog: HTMLDialogElement): () => void {
  if ('closedBy' in HTMLDialogElement.prototype) {
    return () => {};
  }

  const isOutside = (e: PointerEvent) => {
    const r = dialog.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };

  let pressedOutside = false;

  const onPointerDown = (e: PointerEvent) => {
    pressedOutside = isOutside(e);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (pressedOutside && isOutside(e)) {
      dialog.close();
    }
    pressedOutside = false;
  };

  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('pointerup', onPointerUp);

  return () => {
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('pointerup', onPointerUp);
  };
}

/**
 * Syncs `aria-invalid` and `aria-describedby` with CSS `:user-invalid` after interaction,
 * per modern-web-guidance (`validate-input-after-interaction`).
 */
export function attachFormAriaValidation(form: HTMLFormElement): () => void {
  const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
  const dirtyState = new WeakMap<HTMLElement, { hasInteracted: boolean; hasBlurred: boolean }>();

  const linkError = (el: HTMLElement, shown: boolean) => {
    const errorId = el.dataset.error;
    if (!errorId) return;
    const ids = (el.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  };

  const syncControl = (el: EventTarget | null) => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      return;
    }
    const isInvalid = supportsUserInvalid
      ? el.matches(':user-invalid')
      : el.classList.contains('user-invalid-fallback');
    el.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
    linkError(el, isInvalid);
  };

  const updateFallback = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const isValid = el.validity.valid;
    el.classList.toggle('user-invalid-fallback', !isValid);
    el.classList.toggle('user-valid-fallback', isValid);
    el.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    linkError(el, !isValid);
  };

  form.querySelectorAll('input, select, textarea').forEach((el) => {
    el.setAttribute('aria-invalid', 'false');
  });

  const onBlur = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
    if (!supportsUserInvalid) {
      const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
      state.hasBlurred = true;
      dirtyState.set(el, state);
      if (state.hasInteracted) updateFallback(el);
    } else {
      syncControl(el);
    }
  };

  const onInput = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
    if (!supportsUserInvalid) {
      const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
      state.hasInteracted = true;
      dirtyState.set(el, state);
      if (state.hasBlurred) updateFallback(el);
    } else {
      syncControl(el);
    }
  };

  const onInvalid = (e: Event) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
    if (!supportsUserInvalid) {
      dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
      updateFallback(el);
    } else {
      syncControl(el);
    }
  };

  form.addEventListener('blur', onBlur, true);
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('invalid', onInvalid, true);

  return () => {
    form.removeEventListener('blur', onBlur, true);
    form.removeEventListener('input', onInput);
    form.removeEventListener('change', onInput);
    form.removeEventListener('invalid', onInvalid, true);
  };
}
