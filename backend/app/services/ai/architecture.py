import json

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.project import Project


async def call_deepseek(prompt: str, system: str = "") -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.DEEPSEEK_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 4096,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def generate_overview(project: Project) -> str:
    files_info = ""
    if project.files:
        file_list = [f"- {f.path} ({f.language})" for f in project.files[:50]]
        files_info = "\n".join(file_list)

    prompt = f"""分析以下代码仓库，生成项目概述：

仓库名称：{project.name}
技术栈：{project.tech_stack}
目录结构：
{project.directory_tree}

主要文件：
{files_info}

请用中文简洁描述：
1. 这个项目是什么（一句话）
2. 使用了什么技术栈
3. 项目的核心功能
4. 整体架构模式（MVC/微服务/分层/DDD等）"""

    return await call_deepseek(
        prompt,
        system="你是一个资深软件架构师，擅长分析代码仓库结构和架构。请简洁准确地分析项目。"
    )


async def generate_architecture_diagram(project: Project) -> str:
    files_info = ""
    if project.files:
        file_list = [f"- {f.path}" for f in project.files[:30]]
        files_info = "\n".join(file_list)

    prompt = f"""根据以下项目信息，生成 Mermaid 格式的系统架构图：

项目名称：{project.name}
技术栈：{project.tech_stack}
目录结构：
{project.directory_tree}

文件列表：
{files_info}

要求：
1. 输出纯 Mermaid 代码（graph TD 格式）
2. 展示前端、后端、数据库、外部服务之间的关系
3. 不要包含 ```mermaid 标记，只输出图代码
4. 节点名称简洁明了"""

    return await call_deepseek(
        prompt,
        system="你是一个架构图生成专家。只输出 Mermaid 图代码，不要任何解释文字。"
    )


async def generate_readme(project: Project) -> str:
    prompt = f"""根据以下项目分析结果，生成一份完整的 README.md：

项目名称：{project.name}
仓库地址：{project.repo_url}
技术栈：{project.tech_stack}
目录结构：
{project.directory_tree}
项目概述：
{project.overview}

请生成包含以下部分的 README：
1. 项目标题和简介
2. 核心功能
3. 技术栈
4. 快速开始（安装和运行）
5. 项目结构
6. API 说明（如有）

使用 Markdown 格式，内容简洁实用。"""

    return await call_deepseek(
        prompt,
        system="你是一个技术文档专家，擅长编写清晰的项目 README。"
    )


async def generate_learning_path(project: Project) -> str:
    files_info = ""
    if project.files:
        file_list = [f"- {f.path} ({f.language})" for f in project.files[:40]]
        files_info = "\n".join(file_list)

    prompt = f"""为以下项目生成学习路径，帮助新开发者快速上手：

项目名称：{project.name}
技术栈：{project.tech_stack}
目录结构：
{project.directory_tree}

文件列表：
{files_info}

请生成分步学习路径：
1. 推荐的阅读顺序
2. 每一步应该关注什么
3. 关键文件说明
4. 预计学习时间

用中文回答，格式清晰。"""

    return await call_deepseek(
        prompt,
        system="你是一个技术导师，擅长引导新人快速理解复杂代码库。"
    )


async def analyze_architecture(project: Project, db: AsyncSession) -> Project:
    project.overview = await generate_overview(project)
    project.architecture_diagram = await generate_architecture_diagram(project)
    project.readme_content = await generate_readme(project)
    project.learning_path = await generate_learning_path(project)
    project.status = "completed"
    await db.commit()
    await db.refresh(project)
    return project
