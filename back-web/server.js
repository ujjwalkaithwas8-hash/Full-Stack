import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { User, Product, Order } from './models/models.js'

const app = express()
const rzp = process.env.RAZORPAY_KEY_ID ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null
app.use(helmet(), express.json({ limit: '1mb' }), cookieParser(), cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

const A = f => (q, s, n) => Promise.resolve(f(q, s, n)).catch(n)
const bad = (m, c = 400) => Object.assign(new Error(m), { status: c })
const pub = u => ({ _id: u._id, name: u.name, email: u.email, role: u.role })
const eff = p => Math.round(p.price * (1 - p.discount / 100))
const issue = (res, u) => {
    res.cookie('token', jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }),
        { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 6048e5 })
    return pub(u)
}
const protect = A(async (q, s, n) => {
    let u; try { u = await User.findById(jwt.verify(q.cookies.token, process.env.JWT_SECRET).id) } catch { }
    if (!u) throw bad('Not authenticated', 401); q.user = u; n()
})
const adminOnly = (q, s, n) => q.user.role === 'admin' ? n() : s.status(403).json({ message: 'Admin only' })

// ---- Auth
app.post('/api/auth/register', A(async (q, s) => {
    const { name, email, password } = q.body
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !(password?.length >= 6)) throw bad('Name, valid email and a 6+ character password are required')
    if (await User.findOne({ email: email.toLowerCase() })) throw bad('Email already registered')
    const u = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 12) })
    s.status(201).json(issue(s, u))
}))
app.post('/api/auth/login', A(async (q, s) => {
    const u = await User.findOne({ email: String(q.body.email || '').toLowerCase() }).select('+password')
    if (!u || !(await bcrypt.compare(String(q.body.password || ''), u.password))) throw bad('Invalid email or password', 401)
    s.json(issue(s, u))
}))
app.post('/api/auth/logout', (q, s) => { s.clearCookie('token'); s.json({ ok: true }) })
app.get('/api/auth/me', protect, (q, s) => s.json(pub(q.user)))

// ---- Products
const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
app.get('/api/products', A(async (q, s) => {
    const { q: term, category, max, sort, page = 1, limit = 8 } = q.query, f = {}
    if (term) f.name = { $regex: esc(String(term)), $options: 'i' }
    if (category) f.category = String(category)
    if (max) f.price = { $lte: +max }
    const so = { price_asc: { price: 1 }, price_desc: { price: -1 }, popular: { sold: -1 } }[sort] || { createdAt: -1 }
    const lim = Math.min(+limit || 8, 50)
    const [items, total] = await Promise.all([Product.find(f).sort(so).skip((Math.max(+page, 1) - 1) * lim).limit(lim), Product.countDocuments(f)])
    s.json({ items, total, pages: Math.ceil(total / lim) })
}))
app.get('/api/categories', A(async (q, s) => s.json(await Product.distinct('category'))))
app.get('/api/products/:id', A(async (q, s) => { const p = await Product.findById(q.params.id); if (!p) throw bad('Product not found', 404); s.json(p) }))
app.post('/api/products', protect, adminOnly, A(async (q, s) => s.status(201).json(await Product.create(q.body))))
app.put('/api/products/:id', protect, adminOnly, A(async (q, s) => s.json(await Product.findByIdAndUpdate(q.params.id, q.body, { new: true, runValidators: true }))))
app.delete('/api/products/:id', protect, adminOnly, A(async (q, s) => { await Product.findByIdAndDelete(q.params.id); s.json({ ok: true }) }))

// ---- Orders (prices and stock are always computed server-side)
app.post('/api/orders', protect, A(async (q, s) => {
    const { items, address: a = {}, method } = q.body, lines = []
    if (!Array.isArray(items) || !items.length) throw bad('Cart is empty')
    if (!['razorpay', 'cod'].includes(method)) throw bad('Invalid payment method')
    if (method === 'razorpay' && !rzp) throw bad('Online payments are not configured', 503)
    if (!a.name || !/^[6-9]\d{9}$/.test(a.phone || '') || !a.line || !a.city || !a.state || !/^[1-9]\d{5}$/.test(a.pin || '')) throw bad('A complete shipping address is required')
    let o
    try {
        for (const i of items) {
            const qty = Math.floor(+i.qty), p = await Product.findById(i.id)
            if (!p || !(qty >= 1)) throw bad('Invalid item in cart')
            const r = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty, sold: qty } })
            if (!r.modifiedCount) throw bad(`${p.name}: not enough stock`)
            lines.push({ product: p._id, name: p.name, price: eff(p), qty })
        }
        const sub = lines.reduce((t, l) => t + l.price * l.qty, 0), ship = sub >= 1999 ? 0 : 99
        o = await Order.create({ user: q.user._id, items: lines, address: a, subtotal: sub, shipping: ship, total: sub + ship, method })
        let rz = null
        if (method === 'razorpay') {
            const r = await rzp.orders.create({ amount: o.total * 100, currency: 'INR', receipt: String(o._id) })
            o.rzpOrderId = r.id; await o.save()
            rz = { keyId: process.env.RAZORPAY_KEY_ID, orderId: r.id, amount: r.amount }
        }
        s.status(201).json({ order: o, rz })
    } catch (e) {
        await Promise.all(lines.map(l => Product.updateOne({ _id: l.product }, { $inc: { stock: l.qty, sold: -l.qty } })))
        if (o) await Order.deleteOne({ _id: o._id })
        throw e
    }
}))
app.post('/api/orders/:id/verify', protect, A(async (q, s) => {
    const o = await Order.findOne({ _id: q.params.id, user: q.user._id })
    if (!o?.rzpOrderId) throw bad('Order not found', 404)
    const { razorpay_payment_id: pid, razorpay_signature: sig } = q.body
    const exp = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${o.rzpOrderId}|${pid}`).digest('hex')
    if (typeof sig !== 'string' || sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) throw bad('Payment verification failed')
    o.paid = true; o.rzpPaymentId = pid; await o.save(); s.json(o)
}))
app.get('/api/orders/my-orders', protect, A(async (q, s) => s.json(await Order.find({ user: q.user._id }).sort('-createdAt'))))
app.get('/api/orders/:id', protect, A(async (q, s) => {
    const o = await Order.findById(q.params.id)
    if (!o || (String(o.user) !== String(q.user._id) && q.user.role !== 'admin')) throw bad('Order not found', 404)
    s.json(o)
}))

// ---- Admin
app.get('/api/admin/dashboard', protect, adminOnly, A(async (q, s) => {
    const since = new Date(Date.now() - 6 * 864e5); since.setHours(0, 0, 0, 0)
    const [rev, orders, customers, products, recent, daily] = await Promise.all([
        Order.aggregate([{ $match: { paid: true } }, { $group: { _id: null, t: { $sum: '$total' } } }]),
        Order.countDocuments(), User.countDocuments({ role: 'user' }), Product.countDocuments(),
        Order.find().sort('-createdAt').limit(5).populate('user', 'name'),
        Order.aggregate([{ $match: { paid: true, createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, t: { $sum: '$total' } } }, { $sort: { _id: 1 } }])
    ])
    s.json({ revenue: rev[0]?.t || 0, orders, customers, products, recent, daily })
}))
app.get('/api/admin/orders', protect, adminOnly, A(async (q, s) => s.json(await Order.find().sort('-createdAt').populate('user', 'name email'))))
app.put('/api/admin/orders/:id', protect, adminOnly, A(async (q, s) => {
    const o = await Order.findById(q.params.id); if (!o) throw bad('Order not found', 404)
    const st = q.body.status; if (!Order.schema.path('status').enumValues.includes(st)) throw bad('Invalid status')
    if (st === 'Cancelled' && o.status !== 'Cancelled') await Promise.all(o.items.map(l => Product.updateOne({ _id: l.product }, { $inc: { stock: l.qty, sold: -l.qty } })))
    if (st === 'Delivered' && o.method === 'cod') o.paid = true
    o.status = st; await o.save(); s.json(o)
}))
app.get('/api/admin/users', protect, adminOnly, A(async (q, s) => s.json(await User.find().sort('-createdAt'))))

app.use('/api', (q, s) => s.status(404).json({ message: 'Not found' }))
app.use((e, q, s, n) => {
    const st = e.name === 'ValidationError' || e.name === 'CastError' ? 400 : e.status || 500
    if (st === 500) console.error(e)
    s.status(st).json({ message: st === 500 ? 'Server error' : e.message })
})
mongoose.connect(process.env.MONGO_URI).then(() => app.listen(process.env.PORT || 5000, () => console.log('API running'))).catch(e => { console.error(e); process.exit(1) })
