#!/bin/bash

# Tamil AI Writing Assistant - Setup Script
# This script sets up the entire project for development

set -e  # Exit on any error

echo "🚀 Setting up Tamil AI Writing Assistant..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit backend/.env and add your GEMINI_API_KEY"
    else
        print_success ".env file already exists"
    fi
    
    cd ..
    print_success "Backend setup completed"
}

# Setup Chrome extension
setup_extension() {
    print_status "Setting up Chrome extension..."
    
    cd chrome-extension
    
    # Install npm dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Build the extension
    print_status "Building Chrome extension..."
    npm run build
    
    cd ..
    print_success "Chrome extension setup completed"
}

# Main setup function
main() {
    echo "=========================================="
    echo "  Tamil AI Writing Assistant Setup"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_python
    check_node
    
    # Setup components
    setup_backend
    setup_extension
    
    echo
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo
    echo "Next steps:"
    echo "1. Edit backend/.env and add your GEMINI_API_KEY"
    echo "2. Start the backend: cd backend && source venv/bin/activate && python run.py"
    echo "3. Load the Chrome extension from chrome-extension/ folder"
    echo "4. Open frontend/index.html in your browser"
    echo
    echo "For detailed instructions, see README.md"
}

# Run main function
main "$@"
