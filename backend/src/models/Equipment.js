import mongoose from 'mongoose'

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['hour', 'day', 'week'], default: 'day' },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  ownerName: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, trim: true, maxlength: 25, default: '' },
  description: { type: String, trim: true, maxlength: 600, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

export default mongoose.model('Equipment', equipmentSchema)
