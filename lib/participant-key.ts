// The write path's idempotency rule, kept free of path aliases and runtime imports so
// `node --experimental-strip-types --test` can load it directly (tests/codec.test.mjs).
// lib/codec.ts re-exports both functions; every write (the join flow's final button and
// the website_add_my_constraints site action) goes through upsertParticipant.
import type { Participant } from "./types";

export const MAX_PEOPLE = 8;

/**
 * Idempotency key: the participant's name, Unicode-normalized (NFC), trimmed, inner
 * whitespace collapsed and lowercased. "Deniz", " deniz " and "DENIZ" are one person.
 */
export function participantKey(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Adds or replaces a participant by participantKey, capped at MAX_PEOPLE. A double
 * click or a retry with the same name replaces the row and never duplicates it.
 */
export function upsertParticipant(list: Participant[], next: Participant): Participant[] {
  const key = participantKey(next.name);
  const row: Participant = { ...next, name: next.name.normalize("NFC").trim().replace(/\s+/g, " ") };
  const rest = list.filter((p) => participantKey(p.name) !== key);
  return [...rest, row].slice(0, MAX_PEOPLE);
}
