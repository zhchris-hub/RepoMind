import json
import os
import shutil
from pathlib import Path

import git
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.project import File, Project

TECH_STACK_INDICATORS = {
    "package.json": "Node.js/JavaScript",
    "requirements.txt": "Python",
    "pyproject.toml": "Python",
    "setup.py": "Python",
    "pom.xml": "Java/Maven",
    "build.gradle": "Java/Gradle",
    "go.mod": "Go",
    "Cargo.toml": "Rust",
    "Gemfile": "Ruby",
    "composer.json": "PHP",
    "CMakeLists.txt": "C/C++",
    "Makefile": "C/C++",
    "Dockerfile": "Docker",
    "docker-compose.yml": "Docker Compose",
    ".github/workflows": "GitHub Actions",
    "tsconfig.json": "TypeScript",
    "tailwind.config.js": "TailwindCSS",
    "next.config.js": "Next.js",
    "nuxt.config.ts": "Nuxt.js",
    "vite.config.ts": "Vite",
    "angular.json": "Angular",
    "vue.config.js": "Vue.js",
    "manage.py": "Django",
    "alembic.ini": "Alembic",
    "flyway.conf": "Flyway",
}

FRAMEWORK_INDICATORS = {
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "express": "Express.js",
    "react": "React",
    "vue": "Vue.js",
    "angular": "Angular",
    "next": "Next.js",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "gin": "Gin",
    "echo": "Echo",
    "rails": "Ruby on Rails",
    "laravel": "Laravel",
}

IGNORE_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
    ".tox", ".mypy_cache", ".pytest_cache", "dist", "build", ".next",
    ".nuxt", "target", "vendor", "bin", "obj",
}

IGNORE_EXTENSIONS = {
    ".pyc", ".pyo", ".class", ".o", ".so", ".dll", ".exe",
    ".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg", ".webp",
    ".mp3", ".mp4", ".avi", ".mov", ".wav",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".woff", ".woff2", ".ttf", ".eot",
    ".lock", ".min.js", ".min.css",
}

CODE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs",
    ".rb", ".php", ".c", ".cpp", ".h", ".hpp", ".cs",
    ".sql", ".sh", ".bash", ".yaml", ".yml", ".toml", ".json",
    ".html", ".css", ".scss", ".less", ".vue", ".svelte",
}


def clone_repo(repo_url: str) -> str:
    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    clone_dir = os.path.join(settings.REPO_CLONE_DIR, repo_name)

    if os.path.exists(clone_dir):
        shutil.rmtree(clone_dir)

    os.makedirs(settings.REPO_CLONE_DIR, exist_ok=True)
    git.Repo.clone_from(repo_url, clone_dir, depth=1)
    return clone_dir


def scan_directory(root_dir: str) -> list[dict]:
    files = []
    root_path = Path(root_dir)

    for path in sorted(root_path.rglob("*")):
        if path.is_dir():
            if path.name in IGNORE_DIRS:
                continue
            continue

        rel_path = str(path.relative_to(root_path))

        if any(part in IGNORE_DIRS for part in path.parts):
            continue

        ext = path.suffix.lower()
        if ext in IGNORE_EXTENSIONS:
            continue
        if ext not in CODE_EXTENSIONS:
            continue

        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
            if len(content) > 500_000:
                continue
            language = detect_language(ext)
            files.append({
                "path": rel_path,
                "language": language,
                "content": content,
            })
        except (OSError, UnicodeDecodeError):
            continue

    return files


def detect_language(ext: str) -> str:
    lang_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "JavaScript (React)", ".tsx": "TypeScript (React)",
        ".java": "Java", ".go": "Go", ".rs": "Rust", ".rb": "Ruby",
        ".php": "PHP", ".c": "C", ".cpp": "C++", ".h": "C/C++ Header",
        ".hpp": "C++ Header", ".cs": "C#", ".sql": "SQL", ".sh": "Shell",
        ".bash": "Shell", ".yaml": "YAML", ".yml": "YAML", ".toml": "TOML",
        ".json": "JSON", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
        ".less": "LESS", ".vue": "Vue", ".svelte": "Svelte",
    }
    return lang_map.get(ext, "Unknown")


def detect_tech_stack(root_dir: str) -> list[str]:
    root_path = Path(root_dir)
    stacks = set()

    for indicator, tech in TECH_STACK_INDICATORS.items():
        if (root_path / indicator).exists() or (root_path / indicator).is_dir():
            stacks.add(tech)

    return sorted(stacks)


def build_directory_tree(root_dir: str, max_depth: int = 4) -> str:
    root_path = Path(root_dir)
    lines = []

    def _walk(path: Path, prefix: str = "", depth: int = 0):
        if depth > max_depth:
            return

        entries = sorted(
            [e for e in path.iterdir() if e.name not in IGNORE_DIRS and not e.name.startswith(".")],
            key=lambda e: (not e.is_dir(), e.name.lower()),
        )

        for i, entry in enumerate(entries):
            connector = "└── " if i == len(entries) - 1 else "├── "
            suffix = "/" if entry.is_dir() else ""
            lines.append(f"{prefix}{connector}{entry.name}{suffix}")

            if entry.is_dir():
                extension = "    " if i == len(entries) - 1 else "│   "
                _walk(entry, prefix + extension, depth + 1)

    lines.append(f"{root_path.name}/")
    _walk(root_path)
    return "\n".join(lines)


def _make_progress(steps: list[dict]) -> str:
    return json.dumps(steps, ensure_ascii=False)


def _update_step(steps: list[dict], key: str, status: str) -> list[dict]:
    for s in steps:
        if s["key"] == key:
            s["status"] = status
    return steps


async def analyze_repo(repo_url: str, db: AsyncSession) -> Project:
    project = Project(
        name=repo_url.rstrip("/").split("/")[-1].replace(".git", ""),
        repo_url=repo_url,
        status="cloning",
        progress_steps=_make_progress([
            {"key": "clone", "label": "克隆仓库", "status": "active"},
            {"key": "scan", "label": "扫描文件", "status": "pending"},
            {"key": "techstack", "label": "检测技术栈", "status": "pending"},
            {"key": "parse", "label": "解析完成", "status": "pending"},
        ]),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    try:
        clone_dir = clone_repo(repo_url)
        steps = json.loads(project.progress_steps)
        steps = _update_step(steps, "clone", "done")
        steps = _update_step(steps, "scan", "active")
        project.progress_steps = _make_progress(steps)
        project.status = "scanning"
        await db.commit()

        tech_stack = detect_tech_stack(clone_dir)
        project.tech_stack = json.dumps(tech_stack)
        steps = _update_step(steps, "scan", "done")
        steps = _update_step(steps, "techstack", "active")
        project.progress_steps = _make_progress(steps)
        await db.commit()

        directory_tree = build_directory_tree(clone_dir)
        project.directory_tree = directory_tree
        steps = _update_step(steps, "techstack", "done")
        steps = _update_step(steps, "parse", "active")
        project.progress_steps = _make_progress(steps)
        await db.commit()

        files = scan_directory(clone_dir)
        for file_data in files:
            db_file = File(
                project_id=project.id,
                path=file_data["path"],
                language=file_data["language"],
                content=file_data["content"],
            )
            db.add(db_file)

        steps = _update_step(steps, "parse", "done")
        project.progress_steps = _make_progress(steps)
        project.status = "parsed"
        await db.commit()
        await db.refresh(project)

        shutil.rmtree(clone_dir, ignore_errors=True)

    except Exception as e:
        project.status = f"error: {str(e)}"
        await db.commit()
        raise

    return project
