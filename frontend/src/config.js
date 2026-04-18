// In production, point to your deployed Render backend URL
// In dev, Vite proxy handles /api → localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default API_BASE
