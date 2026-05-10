import json
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Chunk, File, Project

logger = logging.getLogger(__name__)

FIXTURES_DIR = Path(__file__).parent / "data"


async def load_demo_fixtures(db: AsyncSession):
    if not FIXTURES_DIR.exists():
        return

    fixture_files = sorted(FIXTURES_DIR.glob("*.json"))
    if not fixture_files:
        return

    existing = await db.execute(select(Project.id).where(Project.is_demo == True).limit(1))
    if existing.scalar_one_or_none() is not None:
        return

    for fixture_file in fixture_files:
        try:
            data = json.loads(fixture_file.read_text(encoding="utf-8"))
            project_data = data["project"]

            project = Project(
                name=project_data["name"],
                repo_url=project_data["repo_url"],
                status="completed",
                tech_stack=project_data.get("tech_stack"),
                directory_tree=project_data.get("directory_tree"),
                overview=project_data.get("overview"),
                architecture_diagram=project_data.get("architecture_diagram"),
                readme_content=project_data.get("readme_content"),
                learning_path=project_data.get("learning_path"),
                progress_steps=project_data.get("progress_steps"),
                ast_data=project_data.get("ast_data"),
                is_demo=True,
            )
            db.add(project)
            await db.flush()

            for file_data in data.get("files", []):
                file_row = File(
                    project_id=project.id,
                    path=file_data["path"],
                    language=file_data["language"],
                    content=file_data["content"],
                )
                db.add(file_row)
                await db.flush()

                chunks_for_file = data.get("chunks_by_file", {}).get(file_data["path"], [])
                for chunk_data in chunks_for_file:
                    chunk = Chunk(
                        file_id=file_row.id,
                        content=chunk_data["content"],
                        embedding=chunk_data.get("embedding"),
                    )
                    db.add(chunk)

            logger.info("Loaded demo fixture: %s", project_data["name"])
        except Exception:
            logger.exception("Failed to load fixture: %s", fixture_file.name)
            continue

    await db.commit()
    logger.info("Demo fixtures loaded successfully")
