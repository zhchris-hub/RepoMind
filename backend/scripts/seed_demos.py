#!/usr/bin/env python3
"""Seed script to generate demo project fixtures.

Run with: DEEPSEEK_API_KEY=sk-xxx python scripts/seed_demos.py

Requires a running PostgreSQL instance (same DATABASE_URL as the app).
Produces JSON fixture files in app/fixtures/data/.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent dir to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import async_session, engine, Base
from app.models.project import Project, File, Chunk
from app.services.parser.repo_scanner import (
    clone_repo, scan_directory, detect_tech_stack, build_directory_tree,
)
from app.services.analyzer.ast_analyzer import analyze_file
from app.services.ai.architecture import analyze_architecture
from app.services.rag.rag_service import index_project, generate_embedding_async

DEMO_REPOS = [
    "https://github.com/tj/n",
    "https://github.com/pallets/markupsafe",
    "https://github.com/gorilla/mux",
]

FIXTURES_DIR = Path(__file__).parent.parent / "app" / "fixtures" / "data"


async def seed_repo(repo_url: str):
    print(f"\n{'='*60}")
    print(f"Seeding: {repo_url}")
    print(f"{'='*60}")

    # Step 1: Clone and scan
    print("[1/5] Cloning and scanning...")
    clone_dir = clone_repo(repo_url)
    try:
        tech_stack = detect_tech_stack(clone_dir)
        directory_tree = build_directory_tree(clone_dir)
        files_data = scan_directory(clone_dir)
        print(f"  Found {len(files_data)} files, tech stack: {tech_stack}")
    finally:
        import shutil
        shutil.rmtree(clone_dir, ignore_errors=True)

    # Step 2: AST analysis
    print("[2/5] Running AST analysis...")
    file_analyses = {}
    dependency_graph = {}
    total_functions = 0
    total_classes = 0
    total_imports = 0

    for file_data in files_data:
        analysis = analyze_file(file_data["content"], file_data["language"])
        if analysis:
            file_analyses[file_data["path"]] = analysis
            total_functions += len(analysis["functions"])
            total_classes += len(analysis["classes"])
            total_imports += len(analysis["imports"])
            if analysis["imports"]:
                dependency_graph[file_data["path"]] = analysis["imports"]

    ast_data = json.dumps({
        "total_files": len(files_data),
        "analyzed_files": len(file_analyses),
        "total_functions": total_functions,
        "total_classes": total_classes,
        "total_imports": total_imports,
        "file_analyses": file_analyses,
        "dependency_graph": dependency_graph,
    }, ensure_ascii=False)
    print(f"  Analyzed {len(file_analyses)} files, {total_functions} functions, {total_classes} classes")

    # Step 3: Create temp project in DB for AI analysis
    print("[3/5] Running AI architecture analysis (needs DEEPSEEK_API_KEY)...")
    async with async_session() as db:
        name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        project = Project(
            name=name,
            repo_url=repo_url,
            status="parsed",
            tech_stack=json.dumps(tech_stack),
            directory_tree=directory_tree,
            ast_data=ast_data,
            progress_steps=json.dumps([
                {"key": "clone", "label": "克隆仓库", "status": "done"},
                {"key": "scan", "label": "扫描文件", "status": "done"},
                {"key": "techstack", "label": "检测技术栈", "status": "done"},
                {"key": "parse", "label": "解析完成", "status": "done"},
            ]),
        )
        db.add(project)
        await db.flush()

        db_files = []
        for file_data in files_data:
            content = file_data["content"].replace("\x00", "")
            f = File(
                project_id=project.id,
                path=file_data["path"],
                language=file_data["language"],
                content=content,
            )
            db.add(f)
            db_files.append(f)
        await db.flush()

        # Load files relationship for architecture analysis
        await db.refresh(project, attribute_names=["files"])

        # Run architecture analysis (4 DeepSeek calls)
        project = await analyze_architecture(project, db)
        print(f"  Architecture analysis complete, status: {project.status}")

        # Step 4: Generate embeddings
        print("[4/5] Generating embeddings...")
        await index_project(project.id, db)
        print("  Embeddings generated")

        # Step 5: Export to JSON
        print("[5/5] Exporting fixture...")
        await db.refresh(project)
        result = await db.execute(
            select(Project).options(
                selectinload(Project.files).selectinload(File.chunks)
            ).where(Project.id == project.id)
        )
        project = result.scalar_one()

        fixture = {
            "project": {
                "name": project.name,
                "repo_url": project.repo_url,
                "tech_stack": project.tech_stack,
                "directory_tree": project.directory_tree,
                "overview": project.overview,
                "architecture_diagram": project.architecture_diagram,
                "readme_content": project.readme_content,
                "learning_path": project.learning_path,
                "progress_steps": project.progress_steps,
                "ast_data": project.ast_data,
            },
            "files": [],
            "chunks_by_file": {},
        }

        for f in project.files:
            fixture["files"].append({
                "path": f.path,
                "language": f.language,
                "content": f.content,
            })
            if f.chunks:
                fixture["chunks_by_file"][f.path] = [
                    {"content": c.content, "embedding": [float(x) for x in c.embedding] if c.embedding is not None else None}
                    for c in f.chunks
                ]

        # Write fixture file
        FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
        fixture_path = FIXTURES_DIR / f"{name}.json"
        fixture_path.write_text(json.dumps(fixture, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Saved to {fixture_path}")

        # Clean up temp project from DB
        for f in project.files:
            for c in f.chunks:
                await db.delete(c)
            await db.delete(f)
        await db.delete(project)
        await db.commit()
        print(f"  Cleaned up temp project from DB")

    print(f"Done: {name}")


async def main():
    print("RepoMind Demo Seed Script")
    print("=========================")

    from app.core.config import settings
    if not settings.DEEPSEEK_API_KEY:
        print("ERROR: DEEPSEEK_API_KEY environment variable is required")
        sys.exit(1)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    for repo_url in DEMO_REPOS:
        try:
            await seed_repo(repo_url)
        except Exception as e:
            print(f"ERROR seeding {repo_url}: {e}")
            import traceback
            traceback.print_exc()
            continue

    print(f"\n{'='*60}")
    print("All done! Fixture files:")
    for f in sorted(FIXTURES_DIR.glob("*.json")):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name} ({size_kb:.1f} KB)")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
