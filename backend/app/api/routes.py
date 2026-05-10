from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import async_session, get_db
from app.models.project import Project
from app.services.parser.repo_scanner import analyze_repo
from app.services.analyzer.ast_analyzer import analyze_ast
from app.services.ai.architecture import analyze_architecture
from app.services.rag.rag_service import answer_question, index_project

router = APIRouter()


class AnalyzeRequest(BaseModel):
    repo_url: str


class ChatRequest(BaseModel):
    project_id: int
    question: str


class ProjectResponse(BaseModel):
    id: int
    name: str
    repo_url: str
    status: str
    tech_stack: str | None
    directory_tree: str | None
    overview: str | None
    architecture_diagram: str | None
    readme_content: str | None
    learning_path: str | None
    progress_steps: str | None
    ast_data: str | None
    is_demo: bool | None = None

    class Config:
        from_attributes = True


async def _run_architecture_bg(project_id: int, api_key: str | None = None):
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Project).options(selectinload(Project.files)).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            if not project:
                return
            if project.status == "parsed":
                await analyze_ast(project, db)
                await db.refresh(project)
            if project.status in ("parsed", "ast_analyzed"):
                result2 = await db.execute(
                    select(Project).options(selectinload(Project.files)).where(Project.id == project_id)
                )
                project = result2.scalar_one_or_none()
                if project:
                    await analyze_architecture(project, db, api_key=api_key)
                    await index_project(project_id, db)
    except Exception as e:
        try:
            async with async_session() as db:
                result = await db.execute(select(Project).where(Project.id == project_id))
                project = result.scalar_one_or_none()
                if project:
                    project.status = f"error: {str(e)[:200]}"
                    await db.commit()
        except Exception:
            pass


@router.post("/analyze", response_model=ProjectResponse)
async def create_analysis(
    req: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_api_key: str | None = Header(None),
):
    project = await analyze_repo(req.repo_url, db)
    background_tasks.add_task(_run_architecture_bg, project.id, api_key=x_api_key)
    return project


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    return result.scalars().all()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/projects/{project_id}/analyze-ast")
async def run_ast_analysis(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await analyze_ast(project, db)
    return {"status": "completed", "project_id": project.id}


@router.post("/projects/{project_id}/analyze-architecture")
async def run_architecture_analysis(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    x_api_key: str | None = Header(None),
):
    result = await db.execute(
        select(Project).options(selectinload(Project.files)).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await analyze_architecture(project, db, api_key=x_api_key)
    await index_project(project_id, db)
    return {"status": "completed", "project_id": project.id}


@router.post("/chat")
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    x_api_key: str | None = Header(None),
):
    answer = await answer_question(req.project_id, req.question, db, api_key=x_api_key)
    return {"answer": answer}
