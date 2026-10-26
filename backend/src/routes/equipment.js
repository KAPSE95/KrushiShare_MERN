import { Router } from 'express'
import mongoose from 'mongoose'
import Equipment from '../models/Equipment.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const fields = ['name', 'category', 'price', 'unit', 'location', 'ownerName', 'phone', 'description']

function validateBody(body) {
  const data = {}
  for (const field of fields) if (body[field] !== undefined) data[field] = body[field]
  if (data.name !== undefined) data.name = String(data.name).trim()
  if (data.category !== undefined) data.category = String(data.category).trim()
  if (data.location !== undefined) data.location = String(data.location).trim()
  if (data.ownerName !== undefined) data.ownerName = String(data.ownerName).trim()
  if (data.phone !== undefined) data.phone = String(data.phone).trim()
  if (data.description !== undefined) data.description = String(data.description).trim()
  if (data.price !== undefined) data.price = Number(data.price)
  if (data.unit !== undefined && !['hour', 'day', 'week'].includes(data.unit)) throw Object.assign(new Error('Price unit must be hour, day or week.'), { status: 400 })
  return data
}

router.get('/', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.search) {
      const safe = String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [{ name: new RegExp(safe, 'i') }, { category: new RegExp(safe, 'i') }, { location: new RegExp(safe, 'i') }, { ownerName: new RegExp(safe, 'i') }]
    }
    if (req.query.category && req.query.category !== 'All') filter.category = String(req.query.category)
    const items = await Equipment.find(filter).populate('owner', 'name').sort({ createdAt: -1 }).lean()
    res.json({ items })
  } catch (error) { next(error) }
})

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid equipment id.' })
    const item = await Equipment.findById(req.params.id).populate('owner', 'name')
    if (!item) return res.status(404).json({ message: 'Equipment not found.' })
    res.json({ item })
  } catch (error) { next(error) }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = validateBody(req.body)
    for (const key of ['name', 'category', 'price', 'location', 'ownerName']) {
      if (data[key] === undefined || data[key] === '' || (key === 'price' && (!Number.isFinite(data.price) || data.price < 0))) {
        return res.status(400).json({ message: `Please provide a valid ${key}.` })
      }
    }
    const item = await Equipment.create({ ...data, owner: req.user.id })
    res.status(201).json({ message: 'Equipment added successfully.', item })
  } catch (error) { next(error) }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid equipment id.' })
    const item = await Equipment.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Equipment not found.' })
    if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: 'You can only update your own equipment.' })
    const data = validateBody(req.body)
    if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0)) return res.status(400).json({ message: 'Price must be a valid non-negative number.' })
    for (const [key, value] of Object.entries(data)) item[key] = value
    await item.save()
    res.json({ message: 'Equipment updated successfully.', item })
  } catch (error) { next(error) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid equipment id.' })
    const item = await Equipment.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Equipment not found.' })
    if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: 'You can only delete your own equipment.' })
    await item.deleteOne()
    res.json({ message: 'Equipment deleted successfully.' })
  } catch (error) { next(error) }
})

export default router
