import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User, Product } from './models.js'

const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`
const rows = [
  ['Classic Watch', 'Accessories', 4999, 20, ['1523275335684-37898b6baf30', '1524592094714-0f0654e20314']],
  ['Leather Wallet', 'Accessories', 1299, 10, ['1627123424574-724758594e93']],
  ['Aviator Sunglasses', 'Accessories', 1999, 0, ['1572635196237-14b3f281503f']],
  ['Canvas Backpack', 'Bags', 2499, 15, ['1553062407-98eeb64c6a62']],
  ['Travel Duffel', 'Bags', 3499, 0, ['1548036328-c9fa89d128fa']],
  ['Wireless Earbuds', 'Electronics', 2999, 25, ['1590658268037-6bf12165a8df']],
  ['Smart Speaker', 'Electronics', 4499, 10, ['1589492477829-5e65395b66cc']],
  ['Running Sneakers', 'Footwear', 3999, 30, ['1542291026-7eec264c27ff', '1595950653106-6c9ebd614d3a']],
  ['Minimal Sneakers', 'Footwear', 2799, 0, ['1549298916-b41d501d3772', '1608231387042-66d1773070a5']],
  ['Denim Jacket', 'Clothing', 3299, 12, ['1576871337622-98d48d1cf531']]
]

await mongoose.connect(process.env.MONGO_URI)
await Promise.all([User.deleteMany(), Product.deleteMany()])
await User.create({ name: 'Admin', email: 'admin@mystore.com', password: await bcrypt.hash('Admin@123', 12), role: 'admin' })
await Product.insertMany(rows.map(([name, category, price, discount, ids], i) => ({
  name, category, price, discount, stock: 25, sold: i * 3, rating: 4 + (i % 10) / 10,
  description: `${name} — quality you can feel, designed to last.`, images: ids.map(U)
})))
console.log('Seeded. Admin: admin@mystore.com / Admin@123'); process.exit()