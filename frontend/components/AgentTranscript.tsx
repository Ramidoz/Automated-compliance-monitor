"use client";

import { useState } from "react";
import type { ScanResponse, TranscriptStep } from "@/lib/api";

const TOOL_KIND: Record<string, string> = {
  search_regulation_index: "rules",
  get_rule_details: "rules",
  search_document: "doc",
  read_document_excerpt: "doc",
  report_finding: "output",
  finalize: "terminal",
};

function ToolPill({ name }: { name: string }) {
  const kind = TOOL_KIND[name] ?? "doc";
  return <span className={`tool-pill tool-${kind}`}>{name}</span>;
}

function ToolResultRow({
  name,
  result,
  open,
  onToggle,
}: {
  name: string;
  result: any;
  open: boolean;
  onToggle: () => void;
}) {
  const summary =
    typeof result === "object" && result !== null
      ? JSON.stringify(result).slice(0, 140)
      : String(result).slice(0, 140);
  return (
    <div className="tool-result-row">
      <button
        type="button"
        onClick={onToggle}
        className={`preview ${open ? "open" : ""}`}
      >
        <span className="arrow">▸</span>
        <ToolPill name={name} />
        <span style={{ marginLeft: 4 }}>{summary}{summary.length >= 140 ? "…" : ""}</span>
      </button>
      {open && (
        <pre className="json-pretty">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AgentTranscript({ scan }: { scan: ScanResponse }) {
  const transcript = scan.agent_transcript ?? [];
  const [expanded, setExpanded] = useState(true);
  const [openResult, setOpenResult] = useState<Record<number, boolean>>({});
  if (transcript.length === 0) return null;

  const inputTokens = scan.input_tokens ?? 0;
  const outputTokens = scan.output_tokens ?? 0;
  const cachedTokens = scan.cached_tokens ?? 0;
  const cacheRate = inputTokens > 0 ? Math.round((cachedTokens / inputTokens) * 100) : 0;
  const iterations = scan.agent_iterations ?? transcript.length;
  const toolCalls = transcript.filter((s) => s.kind === "tool_use").length;

  // Group consecutive tool_use + tool_result pairs together.
  const rendered: Array<TranscriptStep & { result?: TranscriptStep }> = [];
  for (let i = 0; i < transcript.length; i++) {
    const step = transcript[i];
    const next = transcript[i + 1];
    if (
      step.kind === "tool_use" &&
      next?.kind === "tool_result" &&
      next.content?.name === step.content?.name
    ) {
      rendered.push({ ...step, result: next });
      i += 1;
    } else {
      rendered.push(step);
    }
  }

  return (
    <div className="card transcript-card">
      <div className="transcript-header">
        <div>
          <span className="eyebrow">Agent transcript</span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              marginTop: 4,
              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
              color: "var(--c-ink)",
            }}
          >
            <div className="transcript-summary">
              {expanded ? "▾" : "▸"}{" "}
              <span style={{ marginLeft: 4 }}>
                Claude Sonnet 4.6 · {iterations} iteration{iterations === 1 ? "" : "s"} ·{" "}
                {toolCalls} tool call{toolCalls === 1 ? "" : "s"}
              </span>
              {cacheRate > 0 && <span className="cache"> · {cacheRate}% cache</span>}
            </div>
          </button>
        </div>
        <div className="transcript-stats">
          <div className="stat">
            <span className="v">{inputTokens.toLocaleString()}</span>
            <span className="l">In tokens</span>
          </div>
          <div className="stat">
            <span className="v">{outputTokens.toLocaleString()}</span>
            <span className="l">Out tokens</span>
          </div>
          <div className="stat cache">
            <span className="v">{cacheRate}%</span>
            <span className="l">Cache hit</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="transcript-body">
          {rendered.map((step, idx) => {
            const c: any = step.content;
            return (
              <div
                key={idx}
                className="transcript-step-row"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="iter-badge">{step.iteration}</div>
                {step.kind === "thinking" && (
                  <>
                    <div className="head">Thinking · internal</div>
                    <div className="think">{c.thinking || c.text}</div>
                  </>
                )}
                {step.kind === "text" && (
                  <>
                    <div className="head">Assistant</div>
                    <div className="body">{c.text}</div>
                  </>
                )}
                {step.kind === "tool_use" && (
                  <>
                    <div className="head">Tool call</div>
                    <div className="tool-call" style={{ marginTop: 6 }}>
                      <ToolPill name={c.name} />
                      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11.5, color: "var(--c-ink-soft)" }}>
                        {Object.entries(c.input || {})
                          .slice(0, 1)
                          .map(([k, v]) => `${k}: ${typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`)
                          .join(", ")}
                      </span>
                    </div>
                    {step.result && (
                      <ToolResultRow
                        name={(step.result.content as any).name}
                        result={(step.result.content as any).result}
                        open={!!openResult[idx]}
                        onToggle={() =>
                          setOpenResult((s) => ({ ...s, [idx]: !s[idx] }))
                        }
                      />
                    )}
                  </>
                )}
                {step.kind === "tool_result" && (
                  <>
                    <div className="head">Tool result</div>
                    <ToolResultRow
                      name={c.name}
                      result={c.result}
                      open={!!openResult[idx]}
                      onToggle={() =>
                        setOpenResult((s) => ({ ...s, [idx]: !s[idx] }))
                      }
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
