// Edge validation for the JSON routes. Unknown fields (names, coordinates, a link
// fragment) are stripped before anything else sees the body.
import { z } from "zod";
import { MAX_PEOPLE } from "@/lib/codec";
import { DISTRICT_ORDER } from "@/lib/types";

export const participantInputSchema = z
  .object({
    district: z.enum(DISTRICT_ORDER),
    diet: z.enum(["any", "vegetarian", "vegan"]).default("any"),
    budgetTry: z.number().finite().positive().default(400),
    earliest: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "earliest must be HH:MM in 24 hour time")
      .default("19:00"),
  })
  .strip();

export const planInputSchema = z
  .object({
    participants: z.array(participantInputSchema).min(1).max(MAX_PEOPLE),
  })
  .strip();

export type PlanInput = z.infer<typeof planInputSchema>;

/** One readable line from a zod failure, for the `hint` field. */
export function hintFrom(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "The request body did not match the expected shape.";
  const path = first.path.length ? first.path.join(".") : "body";
  return `${path}: ${first.message}`;
}
