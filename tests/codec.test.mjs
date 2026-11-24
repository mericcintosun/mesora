// Idempotency of the write path. lib/codec.ts re-exports these from
// lib/participant-key.ts, which has no path aliases, so Node can load it directly.
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_PEOPLE, participantKey, upsertParticipant } from "../lib/participant-key.ts";

const deniz = { name: "Deniz", district: "kadikoy", diet: "vegetarian", budgetTry: 400, earliest: "19:00" };

test("adding the same person twice keeps one row", () => {
  const once = upsertParticipant([], deniz);
  const twice = upsertParticipant(once, deniz);
  assert.equal(twice.length, 1);
  assert.deepEqual(twice[0], deniz);
});

test("the key ignores case and surrounding spaces, and the newest row wins", () => {
  const first = upsertParticipant([], deniz);
  const again = upsertParticipant(first, { ...deniz, name: "  DENIZ ", budgetTry: 350 });
  assert.equal(again.length, 1);
  assert.equal(again[0].budgetTry, 350);
  assert.equal(again[0].name, "DENIZ");
  assert.equal(participantKey(" Deniz  Kaya "), participantKey("deniz kaya"));
});

test("different people are kept and the list is capped", () => {
  let list = [];
  for (let i = 0; i < MAX_PEOPLE + 3; i++) list = upsertParticipant(list, { ...deniz, name: `Friend ${i}` });
  assert.equal(list.length, MAX_PEOPLE);
});
