from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/repomind"
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    REPO_CLONE_DIR: str = "/tmp/repomind_repos"

    class Config:
        env_file = ".env"


settings = Settings()
