import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './src/routes/auth.js'
import equipmentRoutes from './src/routes/equipment.js'

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_URL, credentials: false }))
app.use(express.json({ limit: '1mb' }))

app.get('/', (_req, res) => res.json({ message: 'KrushiShare API is running', health: '/api/health' }))
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}))
app.use('/api/auth', authRoutes)
app.use('/api/equipment', equipmentRoutes)

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI. Create backend/.env from backend/.env.example.')
    process.exit(1)
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('Set JWT_SECRET in backend/.env to a secret at least 16 characters long.')
    process.exit(1)
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`KrushiShare API running at http://localhost:${PORT}`))
  } catch (error) {
    console.error('Could not connect to MongoDB:', error.message)
    process.exit(1)
  }
}
start()
