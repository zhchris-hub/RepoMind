import json

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.project import Chunk, File, Project

_embedding_model = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedding_model


def generate_embedding(text: str) -> list[float]:
    model = _get_embedding_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


async def generate_embedding_async(text: str) -> list[float]:
    import asyncio
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, generate_embedding, text)


def chunk_code(content: str, max_chars: int = 1500, overlap: int = 200) -> list[str]:
    lines = content.split("\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for line in lines:
        if current_len + len(line) > max_chars and current_chunk:
            chunks.append("\n".join(current_chunk))
            # Calculate overlap lines based on average line length
            avg_line_len = max(1, current_len // len(current_chunk))
            overlap_line_count = max(1, overlap // avg_line_len)
            overlap_lines = current_chunk[-overlap_line_count:]
            current_chunk = overlap_lines
            current_len = sum(len(l) for l in current_chunk)

        current_chunk.append(line)
        current_len += len(line)

    if current_chunk:
        chunks.append("\n".join(current_chunk))

    return chunks


async def index_project(project_id: int, db: AsyncSession):
    # Delete existing chunks to avoid duplicates on re-indexing
    file_ids = await db.execute(select(File.id).where(File.project_id == project_id))
    file_id_list = [row[0] for row in file_ids.fetchall()]
    if file_id_list:
        await db.execute(delete(Chunk).where(Chunk.file_id.in_(file_id_list)))
        await db.commit()

    result = await db.execute(select(File).where(File.project_id == project_id))
    files = result.scalars().all()

    for file in files:
        chunks = chunk_code(file.content)
        for chunk_text in chunks:
            try:
                embedding = await generate_embedding_async(chunk_text)
                chunk = Chunk(
                    file_id=file.id,
                    content=chunk_text,
                    embedding=embedding,
                )
                db.add(chunk)
            except Exception:
                continue

    await db.commit()


async def search_similar_chunks(
    project_id: int, query: str, db: AsyncSession, top_k: int = 5
) -> list[str]:
    query_embedding = await generate_embedding_async(query)

    result = await db.execute(
        select(Chunk.content)
        .join(File, Chunk.file_id == File.id)
        .where(File.project_id == project_id)
        .order_by(Chunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )
    return [row[0] for row in result.fetchall()]


async def answer_question(project_id: int, question: str, db: AsyncSession, api_key: str | None = None) -> str:
    key = api_key or settings.DEEPSEEK_API_KEY
    if not key:
        return "需要 DeepSeek API Key 才能使用问答功能。请点击右上角齿轮图标添加您的 API Key。"
    chunks = await search_similar_chunks(project_id, question, db)
    if not chunks:
        return "该项目尚未完成代码索引，无法回答问题。请先运行架构分析以生成代码索引。"
    context = "\n---\n".join(chunks)

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    prompt = f"""基于以下代码片段回答用户问题。

项目名称：{project.name if project else "Unknown"}
技术栈：{project.tech_stack if project else "Unknown"}

相关代码片段：
{context}

用户问题：{question}

请用中文回答，引用具体的文件路径和函数名。如果代码片段中没有足够信息，请说明。"""

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.DEEPSEEK_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个代码分析专家，基于提供的代码片段回答问题。回答要准确、简洁，引用具体文件和函数。",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 2048,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
