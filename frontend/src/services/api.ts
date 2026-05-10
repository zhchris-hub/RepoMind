import type { Project } from "../types";

const BASE = "/api";

// API Key management (localStorage)
export function getApiKey(): string | null {
  return localStorage.getItem("repomind_api_key");
}

export function setApiKey(key: string) {
  localStorage.setItem("repomind_api_key", key);
}

export function clearApiKey() {
  localStorage.removeItem("repomind_api_key");
}

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const key = getApiKey();
  if (key) headers["X-Api-Key"] = key;
  return headers;
}

export async function analyzeRepo(repoUrl: string): Promise<Project> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeAST(projectId: number): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/projects/${projectId}/analyze-ast`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeArchitecture(projectId: number): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/projects/${projectId}/analyze-architecture`, {
    method: "POST",
    headers: apiHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function chat(projectId: number, question: string): Promise<{ answer: string }> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ project_id: projectId, question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
