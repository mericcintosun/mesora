"use client";

// Site-action bridge for the open agentic web runtime. The network declared in
// /mesora.network.json calls these website_* actions inside the visitor's browser;
// each one changes real page state (the link fragment, the plan) and returns JSON.
// The agentify-website runtime looks them up on window.mesoraSiteActions.
import { useEffect } from "react";
import { OPEN_INVITE, type Diet, type DistrictId, DISTRICT_ORDER } from "@/lib/data";
import { groupFromHash, hashFor, upsertParticipant } from "@/lib/codec";
import { solvePlan } from "@/lib/solver";

export const GROUP_EVENT = "mesora:group-changed";

interface AddArgs {
  name?: string;
  district?: string;
  diet?: string;
  budget_try?: number;
  earliest?: string;
}

function currentGroup() {
  return groupFromHash(window.location.hash) ?? { title: OPEN_INVITE.title, participants: OPEN_INVITE.participants };
}

export const siteActions = {
  website_add_my_constraints(args: AddArgs) {
    const district = DISTRICT_ORDER.find((d) => d === args.district) as DistrictId | undefined;
    if (!district) return { ok: false, error: `district must be one of ${DISTRICT_ORDER.join(", ")}` };
    const diet: Diet = args.diet === "vegan" || args.diet === "vegetarian" ? args.diet : "any";
    const group = currentGroup();
    const participants = upsertParticipant(group.participants, {
      name: (args.name || "Guest").slice(0, 24),
      district,
      diet,
      budgetTry: Number(args.budget_try) || 400,
      earliest: /^\d{2}:\d{2}$/.test(args.earliest ?? "") ? (args.earliest as string) : "19:00",
    });
    const hash = hashFor(group.title, participants);
    window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
    window.dispatchEvent(new Event(GROUP_EVENT));
    return { ok: true, people: participants.length, link: window.location.href };
  },
  website_solve_plan() {
    const plan = solvePlan(currentGroup().participants);
    return {
      ok: !!plan.pick,
      venue: plan.pick?.venue.name ?? null,
      area: plan.pick?.venue.area ?? null,
      start: plan.start,
      longest_trip_min: plan.pick?.longest ?? null,
      midpoint_longest_trip_min: plan.midpoint.longest,
      legs: plan.pick?.legs ?? [],
      travel_source: plan.travelSource,
    };
  },
  website_get_link() {
    return { link: window.location.href, people: currentGroup().participants.length };
  },
};

declare global {
  interface Window {
    mesoraSiteActions?: typeof siteActions;
  }
}

export function AgentBridge() {
  useEffect(() => {
    window.mesoraSiteActions = siteActions;
    return () => {
      delete window.mesoraSiteActions;
    };
  }, []);
  return null;
}
