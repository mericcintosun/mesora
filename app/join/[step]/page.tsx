import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JoinFlow, type JoinStepId } from "@/components/join-flow";

const STEP_IDS: JoinStepId[] = ["area", "diet", "budget", "time"];

export function generateStaticParams() {
  return STEP_IDS.map((step) => ({ step }));
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const { step } = await params;
  return { title: `Join the plan: ${step} | Mesora` };
}

export default async function JoinStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!STEP_IDS.includes(step as JoinStepId)) notFound();
  return <JoinFlow step={step as JoinStepId} />;
}
