"use client";

import { useState } from "react";
import type { ScanResponse, TranscriptStep } from "@/lib/api";

const TOOL_COLORS: Record<string, string> = {
  search_regulation_index: "bg-purple-50 text-purple-700 border-purple-200",
  get_rule_details: "bg-purple-50 text-purple-700 border-purple-200",
  search_document: "bg-blue-50 text-blue-700 border-blue-200",
  read_document_excerpt: "bg-blue-50 text-blue-700 border-blue-200",
  report_finding: "bg-emerald-50 text-emerald-700 border-emerald-200",
  finalize: "bg-amber-50 text-amber-700 border-amber-200",
};

function ToolPill({ name }: { name: string }) {
  const cls = TOOL_COLORS[name] ?? "bg-ink-50 text-ink-600 border-ink-200";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
      {name}
    </span>
  );
}

function StepRow({ step }: { step: TranscriptStep }) {
  const [open, setOpen] = useState(false);
  const c = step.content;

  if (step.kind === "text") {
    return (
      <div className="border-l-2 border-ink-200 pl-3 text-sm text-ink-800">
        <div className="text-[10px] uppercase tracking-wider text-ink-400">
          Turn {step.iteration} · assistant
        </div>
        <p className="mt-0.5 whitespace-pre-wrap">{c.text}</p>
      </div>
    );
  }

  if (step.kind === "thinking") {
    return (
      <div className="border-l-2 border-amber-200 bg-amber-50/50 pl-3 text-sm text-amber-900">
        <div className="text-[10px] uppercase tracking-wider text-amber-700">
          Turn {step.iteration} · thinking
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-xs">{c.thinking}</p>
      </div>
    );
  }

  if (step.kind === "tool_use") {
    return (
      <div className="border-l-2 border-purple-300 pl-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-400">
          Turn {step.iteration} · tool call <ToolPill name={c.name} />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1 cursor-pointer text-left font-mono text-xs text-ink-700 hover:text-ink-900"
        >
          {open ? "▾" : "▸"} input
        </button>
        {open && (
          <pre className="mt-1 max-h-64 overflow-auto rounded bg-ink-50 px-2 py-1 font-mono text-[11px] text-ink-700">
            {JSON.stringify(c.input, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (step.kind === "tool_result") {
    const preview =
      typeof c.result === "object"
        ? JSON.stringify(c.result).slice(0, 140)
        : String(c.result).slice(0, 140);
    return (
      <div className="border-l-2 border-ink-200 pl-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-400">
          Turn {step.iteration} · tool result <ToolPill name={c.name} />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1 cursor-pointer text-left font-mono text-xs text-ink-600 hover:text-ink-900"
        >
          {open ? "▾" : "▸"} {preview}
          {preview.length >= 140 ? "…" : ""}
        </button>
        {open && (
          <pre className="mt-1 max-h-64 overflow-auto rounded bg-ink-50 px-2 py-1 font-mono text-[11px] text-ink-700">
            {JSON.stringify(c.result, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return null;
}

export function AgentTranscript({ scan }: { scan: ScanResponse }) {
  const transcript = scan.agent_transcript ?? [];
  const [expanded, setExpanded] = useState(false);
  if (transcript.length === 0) {
    return null;
  }
  const inputTokens = scan.input_tokens ?? 0;
  const outputTokens = scan.output_tokens ?? 0;
  const cachedTokens = scan.cached_tokens ?? 0;
  const cacheRate = inputTokens > 0 ? Math.round((cachedTokens / inputTokens) * 100) : 0;

  return (
    <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
            Agent transcript
          </div>
          <div className="mt-0.5 text-sm font-medium text-ink-900">
            {scan.agent_iterations ?? transcript.length} turn
            {(scan.agent_iterations ?? transcript.length) === 1 ? "" : "s"} ·{" "}
            {transcript.filter((s) => s.kind === "tool_use").length} tool calls ·{" "}
            {inputTokens.toLocaleString()} input / {outputTokens.toLocaleString()} output tokens
            {cacheRate > 0 && (
              <span className="ml-1 text-emerald-600">· {cacheRate}% cache hit</span>
            )}
          </div>
        </div>
        <span className="text-ink-400">{expanded ? "Hide ▾" : "Show ▸"}</span>
      </button>
      {expanded && (
        <div className="mt-4 space-y-3">
          {transcript.map((step, i) => (
            <StepRow key={i} step={step} />
          ))}
        </div>
      )}
    </section>
  );
}
