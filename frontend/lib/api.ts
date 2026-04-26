export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

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

export interface ScanResponse {
  id: number;
  created_at: string;
  filename: string;
  frameworks: string[];
  risk_score: number;
  risk_label: "low" | "moderate" | "high" | "critical" | "unknown";
  summary: string;
  findings: Finding[];
  used_claude?: boolean;
  cache_hit?: boolean;
  document_excerpt?: string;
}

export interface ScanListItem {
  id: number;
  created_at: string;
  filename: string;
  frameworks: string[];
  risk_score: number;
  risk_label: string;
  finding_count: number;
}

export interface Regulation {
  framework: string;
  display_name: string;
  description: string;
  rule_count: number;
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

export async function uploadScan(file: File, frameworks: string[]): Promise<ScanResponse> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("frameworks", frameworks.join(","));
  return jsonOrThrow(await fetch(`${API_BASE}/scan`, { method: "POST", body: fd }));
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
