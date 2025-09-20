#!/bin/bash

# Tamil AI Writing Assistant - Start Script
# This script starts all components of the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f "backend/.env" ]; then
        print_error ".env file not found in backend directory"
        print_warning "Please run setup.sh first or create backend/.env manually"
        exit 1
    fi
    
    # Check if API key is set
    if ! grep -q "GEMINI_API_KEY=your-gemini-api-key-here" backend/.env; then
        print_success "Environment configuration found"
    else
        print_warning "Please update backend/.env with your actual GEMINI_API_KEY"
        print_warning "You can get your API key from: https://aistudio.google.com/"
    fi
}

# Start backend
start_backend() {
    print_status "Starting backend server..."
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_error "Virtual environment not found. Please run setup.sh first"
        exit 1
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Start the server
    print_status "Backend starting on http://localhost:8000"
    python run.py &
    BACKEND_PID=$!
    
    cd ..
    print_success "Backend started (PID: $BACKEND_PID)"
}

# Start frontend
start_frontend() {
    print_status "Starting frontend server..."
    
    cd frontend
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        print_status "Frontend starting on http://localhost:3000"
        python3 -m http.server 3000 &
        FRONTEND_PID=$!
        print_success "Frontend started (PID: $FRONTEND_PID)"
    else
        print_warning "Python3 not found. Please open frontend/index.html manually in your browser"
    fi
    
    cd ..
}

# Main function
main() {
    echo "=========================================="
    echo "  Tamil AI Writing Assistant"
    echo "=========================================="
    echo
    
    # Check environment
    check_env
    
    # Start services
    start_backend
    start_frontend
    
    echo
    echo "=========================================="
    print_success "Application started successfully!"
    echo "=========================================="
    echo
    echo "Services running:"
    echo "• Backend API: http://localhost:8000"
    echo "• Frontend: http://localhost:3000"
    echo "• API Docs: http://localhost:8000/docs"
    echo
    echo "Chrome Extension:"
    echo "1. Go to chrome://extensions/"
    echo "2. Enable Developer mode"
    echo "3. Load unpacked: chrome-extension/ folder"
    echo
    echo "Press Ctrl+C to stop all services"
    echo
    
    # Wait for user interrupt
    trap 'echo; print_status "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_success "Services stopped"; exit 0' INT
    
    # Keep script running
    wait
}

# Run main function
main "$@"
