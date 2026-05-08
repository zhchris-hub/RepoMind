# Contributing to RepoMind

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# 1. Clone
git clone https://github.com/your-username/RepoMind.git
cd RepoMind

# 2. Database
docker compose up -d db

# 3. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # configure your env
uvicorn app.main:app --reload --port 8000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Code Style

**Python:**
- Type hints on all function signatures
- Async/await for all database operations
- Follow existing patterns in `services/`

**TypeScript:**
- Strict mode enabled
- Functional components with hooks
- Tailwind for styling, framer-motion for animations

## Submitting Changes

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test locally with `docker compose up`
5. Submit a PR with a clear title and description

## Reporting Issues

Use the issue tracker. Include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if UI-related
