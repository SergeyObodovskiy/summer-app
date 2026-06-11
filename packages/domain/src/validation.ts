/** Validation rules for user-entered text. Pure, zero-dependency — shared by
 *  web and mobile so both platforms enforce identical requirements. */

/** Minimum length of a goal title, counted after trimming surrounding whitespace. */
export const GOAL_TITLE_MIN = 2;

/** Control characters (C0 0x00–0x1F incl. newlines/tabs, DEL 0x7F, C1 0x80–0x9F)
 *  are disallowed in a single-line title — they only arrive via paste. Everything
 *  else — letters of any language, digits, spaces, punctuation, emoji — is allowed. */
function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || (c >= 0x7f && c <= 0x9f)) return true;
  }
  return false;
}

export interface TitleValidation {
  /** whether the title may be used to create / keep a goal */
  ok: boolean;
  /** the trimmed value — what callers should actually store */
  value: string;
  /** human-readable reason (ru) when not ok */
  error?: string;
}

/**
 * Validate a goal title. Trims surrounding whitespace, then requires:
 *  - a non-empty result (so a lone space never creates a goal);
 *  - no control characters (typically from a paste);
 *  - at least {@link GOAL_TITLE_MIN} characters.
 * Returns the trimmed `value` so callers store the normalized form.
 */
export function validateGoalTitle(raw: string): TitleValidation {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, value, error: "Введите название" };
  if (hasControlChars(value)) return { ok: false, value, error: "Недопустимые символы" };
  if (value.length < GOAL_TITLE_MIN) {
    return { ok: false, value, error: `Минимум ${GOAL_TITLE_MIN} символа` };
  }
  return { ok: true, value };
}
