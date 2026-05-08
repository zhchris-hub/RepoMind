export interface Project {
  id: number;
  name: string;
  repo_url: string;
  status: string;
  tech_stack: string | null;
  directory_tree: string | null;
  overview: string | null;
  architecture_diagram: string | null;
  readme_content: string | null;
  learning_path: string | null;
  progress_steps: string | null;
}

export interface ProgressStep {
  key: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
}
