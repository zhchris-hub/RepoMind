import type { Project } from "../types";

const BASE = "/api";

export async function analyzeRepo(repoUrl: string): Promise<Project> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/projects/${projectId}/analyze-architecture`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function chat(projectId: number, question: string): Promise<{ answer: string }> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
