#!/bin/bash
echo "🎵 Starting Tanglish Talk..."

# Start backend with auto-restart on crash
(cd backend && while true; do node index.js; echo "⚠️  Backend crashed, restarting in 2s..."; sleep 2; done) &
BACKEND_PID=$!
echo "✅ Backend started (auto-restart enabled)"

sleep 2

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!
echo "✅ Frontend started"

echo ""
echo "🚀 Tanglish Talk running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" SIGINT SIGTERM
wait
