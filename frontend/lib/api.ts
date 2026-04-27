/**
 * API base URL. Three resolution paths:
 *
 *   1. Server-side (Node, RSC fetches) — requires an absolute URL. Use
 *      BACKEND_URL (set in next.config.mjs / docker-compose / Vercel env).
 *   2. Cross-domain prod — when NEXT_PUBLIC_API_BASE is set, frontend
 *      hits the backend directly and bypasses the next.config rewrites.
 *   3. Local dev — relative "/api", proxied by next.config rewrites
 *      to BACKEND_URL on the server hosting the dev server.
 */
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  if (typeof window === "undefined") {
    const backend = process.env.BACKEND_URL || "http://localhost:8000";
    return `${backend.replace(/\/$/, "")}/api`;
  }
  return "/api";
}

export const API_BASE = resolveApiBase();

export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "missing" | "present" | "violation" | "weak" | "contradiction";

export interface Finding {
  framework: string;
  rule_id: string;
  title: string;
  severity: Severity;
  status: Status;
  citation?: string;
  remediation?: string;
  evidence?: string;
  source: "rules" | "claude";
}

export type TranscriptKind = "thinking" | "text" | "tool_use" | "tool_result";

export interface TranscriptStep {
  iteration: number;
  kind: TranscriptKind;
  content: Record<string, any>;
}

export interface ScanResponse {
  id: number;
  created_at: string;
  filename: string;
  policy_name?: string;
  frameworks: string[];
  risk_score: number;
  risk_label: "low" | "moderate" | "high" | "critical" | "unknown";
  summary: string;
  findings: Finding[];
  used_claude?: boolean;
  cache_hit?: boolean;
  document_excerpt?: string;
  agent_transcript?: TranscriptStep[];
  agent_iterations?: number;
  input_tokens?: number;
  output_tokens?: number;
  cached_tokens?: number;
}

export interface ScanListItem {
  id: number;
  created_at: string;
  filename: string;
  policy_name?: string;
  frameworks: string[];
  risk_score: number;
  risk_label: string;
  finding_count: number;
}

export type DiffChange =
  | "closed"
  | "opened"
  | "regressed"
  | "improved"
  | "still_failing"
  | "still_passing";

export interface DiffEntry {
  framework: string;
  rule_id: string;
  title: string;
  change: DiffChange;
  before: Finding | null;
  after: Finding | null;
}

export interface DiffResponse {
  before: ScanListItem;
  after: ScanListItem;
  risk_score_delta: number;
  entries: DiffEntry[];
  counts: Record<DiffChange, number>;
}

export interface Regulation {
  framework: string;
  display_name: string;
  description: string;
  rule_count: number;
}

export interface PublicConfig {
  demo_mode: boolean;
  use_claude: boolean;
  model: string | null;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function uploadScan(
  file: File,
  frameworks: string[],
  policyName: string = "",
): Promise<ScanResponse> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("frameworks", frameworks.join(","));
  if (policyName) fd.append("policy_name", policyName);
  return jsonOrThrow(await fetch(`${API_BASE}/scan`, { method: "POST", body: fd }));
}

export async function listVersions(id: number | string): Promise<ScanListItem[]> {
  return jsonOrThrow(await fetch(`${API_BASE}/scans/${id}/versions`, { cache: "no-store" }));
}

export async function compareScans(
  afterId: number | string,
  beforeId: number | string,
): Promise<DiffResponse> {
  return jsonOrThrow(
    await fetch(`${API_BASE}/scans/${afterId}/compare/${beforeId}`, { cache: "no-store" }),
  );
}

export async function listScans(): Promise<ScanListItem[]> {
  return jsonOrThrow(await fetch(`${API_BASE}/scans`, { cache: "no-store" }));
}

export async function getScan(id: number | string): Promise<ScanResponse> {
  return jsonOrThrow(await fetch(`${API_BASE}/scans/${id}`, { cache: "no-store" }));
}

export async function listRegulations(): Promise<Regulation[]> {
  return jsonOrThrow(await fetch(`${API_BASE}/regulations`, { cache: "no-store" }));
}

export async function getConfig(): Promise<PublicConfig> {
  return jsonOrThrow(await fetch(`${API_BASE}/config`, { cache: "no-store" }));
}
