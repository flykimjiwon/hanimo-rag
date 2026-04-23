.PHONY: dev build test lint docker-up docker-down docker-build docker-logs clean

dev:
	hanimo-rag serve --reload

build:
	pip install -e .

test:
	pytest tests/ -v

lint:
	ruff check hanimo_rag/ tests/
	ruff format --check hanimo_rag/ tests/

format:
	ruff format hanimo_rag/ tests/

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build

docker-logs:
	docker compose logs -f hanimo-rag

clean:
	rm -rf build/ dist/ *.egg-info .pytest_cache __pycache__
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
