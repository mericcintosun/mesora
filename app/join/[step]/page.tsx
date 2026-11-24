import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JoinFlow, type JoinStepId } from "@/components/join-flow";

// Kept local: values exported from a "use client" module are client references on the server.
const STEP_IDS: JoinStepId[] = ["area", "diet", "budget", "time"];
const STEP_TITLES: Record<JoinStepId, string> = { area: "Area", diet: "Diet", budget: "Budget", time: "Time" };

export function generateStaticParams() {
  return STEP_IDS.map((step) => ({ step }));
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const { step } = await params;
  const label = STEP_TITLES[step as JoinStepId] ?? "Area";
  return { title: `Join the plan: ${label}` };
}

export default async function JoinStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!STEP_IDS.includes(step as JoinStepId)) notFound();
  return <JoinFlow step={step as JoinStepId} />;
}
