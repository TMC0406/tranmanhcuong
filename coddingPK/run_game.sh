#!/bin/bash
# Simple script to run the Mini PK Multiplayer Game locally

# Detect Python version
if command -v python3 &>/dev/null; then
    echo "Starting server with Python 3..."
    python3 -m http.server 8000
elif command -v python &>/dev/null; then
    python_version=$(python --version 2>&1)
    if [[ "$python_version" == *"Python 3"* ]]; then
        echo "Starting server with Python..."
        python -m http.server 8000
    else
        echo "Starting server with Python 2..."
        python -m SimpleHTTPServer 8000
    fi
elif command -v npx &>/dev/null; then
    echo "Starting server with Node.js http-server..."
    npx http-server -p 8000
else
    echo "Error: Could not find Python or Node.js to start a server."
    echo "Please install Python 3 or Node.js, or manually open the index.html file in a browser."
    exit 1
fi

# Open browser automatically
echo "Game server started at http://localhost:8000/coddingPK/"
echo "Opening browser..."

# Try to open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:8000/coddingPK/"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "http://localhost:8000/coddingPK/"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:8000/coddingPK/"
    elif command -v gnome-open &>/dev/null; then
        gnome-open "http://localhost:8000/coddingPK/"
    else
        echo "Please open http://localhost:8000/coddingPK/ in your browser"
    fi
else
    echo "Please open http://localhost:8000/coddingPK/ in your browser"
fi

echo "Press Ctrl+C to stop the server when done."
