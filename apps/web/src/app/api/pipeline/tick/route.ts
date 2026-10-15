import { createClient, loadAgent } from "@lm/agents";
import { advance } from "@lm/orchestrator";
import { cmsClient } from "@/cms/client";
import { cmsPipelineStore, runFromDoc } from "@/pipeline/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Advances the oldest active pipeline run by one step. Called every minute by
 * the scheduler (and right after a run is created). One step per call keeps
 * every call inside the function time limit; a failure resumes on the next.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Forbidden", { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ idle: true, reason: "ANTHROPIC_API_KEY is not set; the agent pipeline is off." }, { status: 503 });
  const payload = await cmsClient();
  const { docs } = await payload.find({ collection: "pipeline-runs", where: { status: { in: ["queued", "running"] } }, sort: "updatedAt", limit: 1, overrideAccess: true, depth: 0 });
  const doc = docs[0];
  if (!doc) return Response.json({ idle: true });
  // Profiles as the creator last edited them in the console's agent registry.
  const { docs: agents } = await payload.find({ collection: "agents", limit: 100, overrideAccess: true, depth: 0 });
  const profiles = new Map(agents.map((a) => [a.agentId, a.profile]));
  const kit = (id: string) => {
    const k = loadAgent(id);
    const p = profiles.get(id);
    return p ? { ...k, profile: p } : k;
  };
  const run = await advance(runFromDoc(doc as never), { store: cmsPipelineStore(payload, doc.id), client: createClient(), kit });
  return Response.json({ run: run.id, stage: run.stage, status: run.status, costUsd: run.costUsd });
}
