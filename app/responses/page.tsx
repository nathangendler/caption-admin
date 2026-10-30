import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData, loadResponses } from "@/lib/admin/pipeline";

export default async function ResponsesPage() {
  await requireSuperadmin();
  const [data, responses] = await Promise.all([loadPipelineData(), loadResponses(100)]);
  const modelById = new Map(data.models.map((m) => [m.id, m]));
  const stepById = new Map(data.steps.map((s) => [s.id, s]));
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">LLM responses</h1>
        <p className="mt-1 text-sm text-neutral-600">Every step of every generation, newest first. Showing the latest 100.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {responses.map((r) => (
          <li key={r.id} className="rounded border border-black p-3 text-sm">
            <p className="flex flex-wrap gap-x-3 text-neutral-600">
              <span>{new Date(r.created_at).toLocaleString("en-US")}</span>
              <span>{modelById.get(r.llm_model_id ?? "")?.name ?? "model removed"}</span>
              <span>{stepById.get(r.step_id ?? "")?.name ?? "step removed"}</span>
              <span>{r.latency_ms !== null ? `${r.latency_ms} ms` : ""}</span>
              {r.generation_id ? <Link href={`/moments/${r.generation_id}`} className="underline">moment</Link> : <span>no moment (failed run)</span>}
            </p>
            {r.error && <p className="mt-1 font-semibold">Error: {r.error}</p>}
            <details className="mt-1">
              <summary className="cursor-pointer">Prompt</summary>
              <pre className="mt-1 whitespace-pre-wrap text-xs">{r.prompt}</pre>
            </details>
            <details className="mt-1">
              <summary className="cursor-pointer">Response</summary>
              <pre className="mt-1 whitespace-pre-wrap text-xs">{r.response ?? "(none)"}</pre>
            </details>
          </li>
        ))}
        {responses.length === 0 && <li className="text-sm text-neutral-600">No responses recorded yet.</li>}
      </ul>
    </main>
  );
}
