import mongoose from 'mongoose'
const { Schema, model } = mongoose
export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true }))
export const Product = model('Product', new Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 90 },
  description: String, images: [String],
  stock: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 4.5 }, sold: { type: Number, default: 0 }
}, { timestamps: true }))
export const Order = model('Order', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, qty: Number }],
  address: { name: String, phone: String, line: String, city: String, state: String, pin: String },
  subtotal: Number, shipping: Number, total: Number,
  method: { type: String, enum: ['razorpay', 'cod'] },
  paid: { type: Boolean, default: false }, rzpOrderId: String, rzpPaymentId: String,
  status: { type: String, enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Placed' }
}, { timestamps: true }))