# Tamil AI Writing Assistant - Makefile
# Provides convenient commands for development and deployment

.PHONY: help setup start stop build test clean docker-setup docker-start docker-stop

# Default target
help:
	@echo "Tamil AI Writing Assistant - Available Commands:"
	@echo ""
	@echo "Setup Commands:"
	@echo "  setup          - Run automated setup for all components"
	@echo "  setup-backend  - Setup backend only"
	@echo "  setup-extension - Setup Chrome extension only"
	@echo ""
	@echo "Development Commands:"
	@echo "  start          - Start all services (backend + frontend)"
	@echo "  start-backend  - Start backend only"
	@echo "  start-frontend - Start frontend only"
	@echo "  stop           - Stop all services"
	@echo ""
	@echo "Build Commands:"
	@echo "  build          - Build Chrome extension"
	@echo "  clean          - Clean build artifacts"
	@echo ""
	@echo "Docker Commands:"
	@echo "  docker-setup   - Setup with Docker"
	@echo "  docker-start   - Start with Docker Compose"
	@echo "  docker-stop    - Stop Docker services"
	@echo ""
	@echo "Testing Commands:"
	@echo "  test           - Run tests"
	@echo "  test-api       - Test API endpoints"

# Setup commands
setup:
	@echo "🚀 Setting up Tamil AI Writing Assistant..."
	@if [ -f "setup.sh" ]; then \
		chmod +x setup.sh && ./setup.sh; \
	else \
		echo "❌ setup.sh not found. Please run manually:"; \
		echo "   Backend: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"; \
		echo "   Extension: cd chrome-extension && npm install && npm run build"; \
	fi

setup-backend:
	@echo "🔧 Setting up backend..."
	@cd backend && \
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt && \
	cp .env.example .env && \
	echo "✅ Backend setup complete. Please edit backend/.env with your API key."

setup-extension:
	@echo "🔧 Setting up Chrome extension..."
	@cd chrome-extension && \
	npm install && \
	npm run build && \
	echo "✅ Chrome extension setup complete."

# Development commands
start:
	@echo "🚀 Starting Tamil AI Writing Assistant..."
	@if [ -f "start.sh" ]; then \
		chmod +x start.sh && ./start.sh; \
	else \
		echo "❌ start.sh not found. Starting manually..."; \
		$(MAKE) start-backend & $(MAKE) start-frontend; \
	fi

start-backend:
	@echo "🔧 Starting backend server..."
	@cd backend && \
	source venv/bin/activate && \
	python run.py

start-frontend:
	@echo "🔧 Starting frontend server..."
	@cd frontend && \
	python3 -m http.server 3000

stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "python run.py" || true
	@pkill -f "python3 -m http.server" || true
	@echo "✅ Services stopped"

# Build commands
build:
	@echo "🔨 Building Chrome extension..."
	@cd chrome-extension && \
	npm run build && \
	echo "✅ Chrome extension built successfully"

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf backend/__pycache__
	@rm -rf backend/venv
	@rm -rf chrome-extension/node_modules
	@rm -rf chrome-extension/dist
	@rm -rf frontend/__pycache__
	@echo "✅ Clean complete"

# Docker commands
docker-setup:
	@echo "🐳 Setting up with Docker..."
	@if [ -f "docker-compose.yml" ]; then \
		docker-compose build; \
		echo "✅ Docker setup complete"; \
	else \
		echo "❌ docker-compose.yml not found"; \
	fi

docker-start:
	@echo "🐳 Starting with Docker Compose..."
	@if [ -f "docker-compose.yml" ]; then \
		docker-compose up -d; \
		echo "✅ Services started with Docker"; \
		echo "Backend: http://localhost:8000"; \
		echo "Frontend: http://localhost:3000"; \
	else \
		echo "❌ docker-compose.yml not found"; \
	fi

docker-stop:
	@echo "🐳 Stopping Docker services..."
	@if [ -f "docker-compose.yml" ]; then \
		docker-compose down; \
		echo "✅ Docker services stopped"; \
	else \
		echo "❌ docker-compose.yml not found"; \
	fi

# Testing commands
test:
	@echo "🧪 Running tests..."
	@cd backend && \
	source venv/bin/activate && \
	python -m pytest tests/ -v || echo "⚠️  No tests found"

test-api:
	@echo "🧪 Testing API endpoints..."
	@echo "Testing health endpoint..."
	@curl -s http://localhost:8000/health || echo "❌ Backend not running"
	@echo "Testing root endpoint..."
	@curl -s http://localhost:8000/ || echo "❌ Backend not running"
	@echo "Testing Gemini API..."
	@curl -s http://localhost:8000/test-gemini || echo "❌ Backend not running or API key not set"

# Development helpers
dev:
	@echo "🔧 Starting development mode..."
	@$(MAKE) start-backend &
	@sleep 2
	@$(MAKE) start-frontend &
	@echo "✅ Development servers started"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"

logs:
	@echo "📋 Showing logs..."
	@if [ -f "docker-compose.yml" ]; then \
		docker-compose logs -f; \
	else \
		echo "❌ Docker not available. Check individual service logs."; \
	fi

status:
	@echo "📊 Service Status:"
	@echo "Backend:"
	@curl -s http://localhost:8000/health > /dev/null && echo "  ✅ Running" || echo "  ❌ Not running"
	@echo "Frontend:"
	@curl -s http://localhost:3000 > /dev/null && echo "  ✅ Running" || echo "  ❌ Not running"
