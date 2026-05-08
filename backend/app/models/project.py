from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    repo_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="pending")
    tech_stack: Mapped[str | None] = mapped_column(Text, nullable=True)
    directory_tree: Mapped[str | None] = mapped_column(Text, nullable=True)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture_diagram: Mapped[str | None] = mapped_column(Text, nullable=True)
    readme_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    learning_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    ast_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    files: Mapped[list["File"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    project: Mapped["Project"] = relationship(back_populates="files")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="file", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    file_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(Vector(1024), nullable=True)

    file: Mapped["File"] = relationship(back_populates="chunks")
