import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import api from './api'
import { login, register, fetchProducts, fetchProduct, addToCart, setQty, removeItem, clearCart, placeOrder, fetchMyOrders } from './store'

const inr = n => '₹' + Number(n).toLocaleString('en-IN')
const eff = p => Math.round(p.price * (1 - p.discount / 100))
const btn = 'bg-[#111827] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#D4AF37] hover:text-[#111827] transition disabled:opacity-40'
const FB = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="#F3F4F6"/></svg>')
const Img = ({ src, alt, className }) => <img src={src} alt={alt} loading="lazy" className={className} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = FB }} />
const Wrap = ({ children, title }) => { useEffect(() => { document.title = title + ' — MY-STORE'; scrollTo(0, 0) }, [title]); return <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto px-4 py-10 min-h-[60vh]">{children}</motion.main> }
export const Missing = () => <Wrap title="Not found"><h1 className="text-3xl font-bold">404 — page not found</h1><Link to="/" className={btn + ' inline-block mt-6'}>Go home</Link></Wrap>

const Card = ({ p }) => <Link to={`/product/${p._id}`} className="group block">
  <div className="relative overflow-hidden rounded-xl bg-[#F9FAFB] aspect-square"><Img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
    {p.discount > 0 && <span className="absolute top-3 left-3 bg-[#D4AF37] text-[#111827] text-xs font-bold px-2 py-1 rounded">-{p.discount}%</span>}
    {p.stock === 0 && <span className="absolute inset-0 bg-white/70 grid place-items-center text-sm font-semibold">Out of stock</span>}</div>
  <p className="mt-3 text-xs text-[#6B7280]">{p.category}</p><p className="font-medium">{p.name}</p>
  <p>{inr(eff(p))} {p.discount > 0 && <s className="text-[#6B7280] text-sm ml-1">{inr(p.price)}</s>}</p></Link>
const Grid = ({ list, loading }) => loading ? <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-[#F3F4F6] animate-pulse rounded-xl" />)}</div>
  : <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{list.map(p => <Card key={p._id} p={p} />)}</div>

export function Home() {
  const d = useDispatch(), { items, loading } = useSelector(s => s.products), [em, setEm] = useState('')
  useEffect(() => { d(fetchProducts({ sort: 'popular', limit: 8 })) }, [d])
  return <Wrap title="Home">
    <section className="rounded-2xl bg-[#111827] text-white p-10 md:p-20"><p className="text-[#D4AF37] tracking-[.3em] text-xs mb-3">NEW SEASON</p><h1 className="text-4xl md:text-6xl font-bold max-w-2xl">Everyday essentials, elevated.</h1>
      <Link to="/shop" className="inline-block mt-8 bg-[#D4AF37] text-[#111827] px-7 py-3 rounded-lg font-semibold">Shop now</Link></section>
    <h2 className="text-2xl font-bold mt-14 mb-5">Best sellers</h2><Grid list={items} loading={loading} />
    <section className="bg-[#F9FAFB] rounded-2xl p-10 mt-16 text-center"><h2 className="text-2xl font-bold">Join our newsletter</h2>
      <form onSubmit={e => { e.preventDefault(); /^\S+@\S+\.\S+$/.test(em) ? (toast.success('Subscribed (demo — not stored)'), setEm('')) : toast.error('Enter a valid email') }} className="flex gap-2 max-w-md mx-auto mt-4"><input aria-label="Email" value={em} onChange={e => setEm(e.target.value)} placeholder="you@email.com" /><button className={btn}>Join</button></form></section>
  </Wrap>
}

export function Shop() {
  const d = useDispatch(), { items, pages, total, loading } = useSelector(s => s.products), [sp, setSp] = useSearchParams(), [cats, setCats] = useState([])
  const g = k => sp.get(k) || '', set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n) }
  useEffect(() => { api.get('/categories').then(r => setCats(r.data)) }, [])
  useEffect(() => { d(fetchProducts({ q: g('q'), category: g('category'), max: g('max'), sort: g('sort'), page: g('page') || 1 })) }, [sp])
  const page = +g('page') || 1
  return <Wrap title="Shop"><div className="flex flex-wrap gap-3 mb-6">
    <input aria-label="Search" className="!w-56" placeholder="Search products…" defaultValue={g('q')} onKeyDown={e => e.key === 'Enter' && set('q', e.target.value)} />
    <select aria-label="Category" className="!w-44" value={g('category')} onChange={e => set('category', e.target.value)}><option value="">All categories</option>{cats.map(c => <option key={c}>{c}</option>)}</select>
    <select aria-label="Max price" className="!w-40" value={g('max')} onChange={e => set('max', e.target.value)}><option value="">Any price</option><option value="1500">Up to ₹1,500</option><option value="3000">Up to ₹3,000</option><option value="5000">Up to ₹5,000</option></select>
    <select aria-label="Sort" className="!w-44" value={g('sort')} onChange={e => set('sort', e.target.value)}><option value="">Newest</option><option value="popular">Popularity</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></div>
    <p className="text-sm text-[#6B7280] mb-4">{total} products</p>
    {!loading && !items.length ? <p>No products found.</p> : <Grid list={items} loading={loading} />}
    <div className="flex gap-2 justify-center mt-10">{[...Array(pages)].map((_, i) => <button key={i} onClick={() => set('page', i + 1)} className={`w-9 h-9 rounded border ${page === i + 1 ? 'bg-[#111827] text-white' : ''}`}>{i + 1}</button>)}</div></Wrap>
}

export function ProductPage() {
  const { id } = useParams(), d = useDispatch(), nav = useNavigate(), p = useSelector(s => s.products.current), [img, setImg] = useState(0), [qty, setQ] = useState(1)
  useEffect(() => { d(fetchProduct(id)); setImg(0); setQ(1) }, [id])
  if (!p) return <Wrap title="Product"><p>Loading…</p></Wrap>
  const add = () => d(addToCart({ id: p._id, name: p.name, price: eff(p), image: p.images[0], stock: p.stock, qty }))
  return <Wrap title={p.name}><div className="grid md:grid-cols-2 gap-10">
    <div><Img src={p.images[img]} alt={p.name} className="w-full aspect-square object-cover rounded-xl bg-[#F9FAFB]" /><div className="flex gap-3 mt-3">{p.images.map((s, i) => <button key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={`w-20 h-20 rounded border-2 overflow-hidden ${img === i ? 'border-[#D4AF37]' : 'border-transparent'}`}><Img src={s} alt="" className="w-full h-full object-cover" /></button>)}</div></div>
    <div className="space-y-4"><p className="text-xs text-[#6B7280] uppercase">{p.category}</p><h1 className="text-3xl font-bold">{p.name}</h1><p>★ {p.rating.toFixed(1)}</p>
      <p className="text-2xl">{inr(eff(p))} {p.discount > 0 && <><s className="text-[#6B7280] text-base ml-2">{inr(p.price)}</s> <span className="text-[#D4AF37] text-sm">{p.discount}% off</span></>}</p>
      <p className="text-[#6B7280]">{p.description}</p><p className={p.stock ? 'text-green-600' : 'text-red-600'}>{p.stock ? `${p.stock} in stock` : 'Out of stock'}</p>
      <div className="flex items-center gap-3"><button aria-label="Less" onClick={() => setQ(Math.max(1, qty - 1))} className="w-9 h-9 border rounded">−</button>{qty}<button aria-label="More" onClick={() => setQ(Math.min(p.stock, qty + 1))} className="w-9 h-9 border rounded">+</button></div>
      <div className="flex gap-3"><button disabled={!p.stock} className={btn} onClick={() => { add(); toast.success('Added to cart') }}>Add to cart</button><button disabled={!p.stock} className={btn} onClick={() => { add(); nav('/checkout') }}>Buy now</button></div></div></div></Wrap>
}

const totals = items => { const sub = items.reduce((t, i) => t + i.price * i.qty, 0), ship = sub === 0 || sub >= 1999 ? 0 : 99; return { sub, ship, total: sub + ship } }
export function Cart() {
  const d = useDispatch(), items = useSelector(s => s.cart.items), t = totals(items)
  if (!items.length) return <Wrap title="Cart"><h1 className="text-3xl font-bold">Your cart is empty</h1><Link to="/shop" className={btn + ' inline-block mt-6'}>Start shopping</Link></Wrap>
  return <Wrap title="Cart"><h1 className="text-3xl font-bold mb-6">Your cart</h1><div className="grid md:grid-cols-[1fr_320px] gap-10"><div className="space-y-4">
    {items.map(i => <div key={i.id} className="flex gap-4 border-b pb-4"><Img src={i.image} alt={i.name} className="w-24 h-24 object-cover rounded" /><div className="flex-1"><p className="font-medium">{i.name}</p><p className="text-sm text-[#6B7280]">{inr(i.price)}</p>
      <div className="flex items-center gap-3 mt-2"><button aria-label="Less" onClick={() => d(setQty({ id: i.id, qty: i.qty - 1 }))}>−</button>{i.qty}<button aria-label="More" onClick={() => d(setQty({ id: i.id, qty: i.qty + 1 }))}>+</button><button onClick={() => d(removeItem(i.id))} className="ml-4 text-sm underline text-red-600">Remove</button></div></div><p>{inr(i.price * i.qty)}</p></div>)}</div>
    <aside className="bg-[#F9FAFB] rounded-xl p-6 h-fit space-y-2"><div className="flex justify-between"><span>Subtotal</span>{inr(t.sub)}</div><div className="flex justify-between"><span>Shipping</span>{t.ship ? inr(t.ship) : 'FREE'}</div><div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span>{inr(t.total)}</div><Link to="/checkout" className={btn + ' block text-center mt-3'}>Checkout</Link></aside></div></Wrap>
}

const loadRzp = () => new Promise(r => { if (window.Razorpay) return r(true); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => r(true); s.onerror = () => r(false); document.body.appendChild(s) })
export function Checkout() {
  const d = useDispatch(), nav = useNavigate(), items = useSelector(s => s.cart.items), user = useSelector(s => s.auth.user), t = totals(items)
  const [a, setA] = useState({ name: user.name, phone: '', line: '', city: '', state: '', pin: '' }), [method, setMethod] = useState('razorpay'), [busy, setBusy] = useState(false)
  if (!items.length) return <Wrap title="Checkout"><p>Your cart is empty.</p></Wrap>
  const submit = async e => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(a.phone) || !/^[1-9]\d{5}$/.test(a.pin)) return toast.error('Enter a valid 10-digit phone and 6-digit PIN')
    setBusy(true)
    try {
      const { order, rz } = await d(placeOrder({ items: items.map(i => ({ id: i.id, qty: i.qty })), address: a, method })).unwrap()
      if (!rz) { d(clearCart()); toast.success('Order placed'); return nav('/orders') }
      if (!(await loadRzp())) throw 'Could not load payment gateway'
      new window.Razorpay({ key: rz.keyId, amount: rz.amount, currency: 'INR', name: 'MY-STORE', order_id: rz.orderId, prefill: { name: a.name, email: user.email, contact: a.phone },
        handler: async r => { try { await api.post(`/orders/${order._id}/verify`, r); d(clearCart()); toast.success('Payment verified'); nav('/orders') } catch (er) { toast.error(er.response?.data?.message || 'Verification failed') } },
        modal: { ondismiss: () => { toast.error('Payment not completed — order is unpaid'); nav('/orders') } } }).open()
    } catch (er) { toast.error(typeof er === 'string' ? er : 'Could not place order') } finally { setBusy(false) }
  }
  const f = (k, l) => <div><label className="text-xs text-[#6B7280]" htmlFor={k}>{l}</label><input id={k} required value={a[k]} onChange={e => setA({ ...a, [k]: e.target.value })} /></div>
  return <Wrap title="Checkout"><h1 className="text-3xl font-bold mb-6">Checkout</h1><form onSubmit={submit} className="grid md:grid-cols-[1fr_320px] gap-10">
    <div className="grid sm:grid-cols-2 gap-4 content-start">{f('name', 'Full name')}{f('phone', 'Phone')}<div className="sm:col-span-2">{f('line', 'Address')}</div>{f('city', 'City')}{f('state', 'State')}{f('pin', 'PIN code')}
      <fieldset className="sm:col-span-2"><legend className="font-semibold mb-2">Payment</legend>{[['razorpay', 'Razorpay (test mode)'], ['cod', 'Cash on delivery']].map(([v, l]) => <label key={v} className="flex gap-2 py-1"><input type="radio" className="!w-auto" checked={method === v} onChange={() => setMethod(v)} />{l}</label>)}</fieldset></div>
    <aside className="bg-[#F9FAFB] rounded-xl p-6 h-fit space-y-2 text-sm">{items.map(i => <div key={i.id} className="flex justify-between"><span>{i.name} × {i.qty}</span>{inr(i.price * i.qty)}</div>)}<div className="flex justify-between"><span>Shipping</span>{t.ship ? inr(t.ship) : 'FREE'}</div><div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span>{inr(t.total)}</div><p className="text-xs text-[#6B7280]">Final prices are confirmed by the server.</p><button disabled={busy} className={btn + ' w-full'}>{busy ? 'Please wait…' : 'Place order'}</button></aside></form></Wrap>
}

export function Auth({ reg }) {
  const d = useDispatch(), nav = useNavigate(), err = useSelector(s => s.auth.error), [f, setF] = useState({ name: '', email: '', password: '' })
  const submit = async e => { e.preventDefault(); const r = await d((reg ? register : login)(f)); if (r.meta.requestStatus === 'fulfilled') nav('/') }
  return <Wrap title={reg ? 'Register' : 'Login'}><form onSubmit={submit} className="max-w-sm mx-auto space-y-4"><h1 className="text-3xl font-bold">{reg ? 'Create account' : 'Welcome back'}</h1>
    {reg && <input required aria-label="Name" placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}
    <input required type="email" aria-label="Email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
    <input required type="password" minLength={6} aria-label="Password" placeholder="Password (6+ chars)" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
    {err && <p className="text-red-600 text-sm" role="alert">{err}</p>}<button className={btn + ' w-full'}>{reg ? 'Register' : 'Login'}</button>
    <p className="text-sm text-center">{reg ? <Link to="/login" className="underline">Have an account? Login</Link> : <Link to="/register" className="underline">New here? Register</Link>}</p></form></Wrap>
}

export function Orders() {
  const d = useDispatch(), list = useSelector(s => s.orders.mine)
  useEffect(() => { d(fetchMyOrders()) }, [d])
  return <Wrap title="My orders"><h1 className="text-3xl font-bold mb-6">My orders</h1>{!list.length && <p>No orders yet.</p>}<div className="space-y-4">{list.map(o => <div key={o._id} className="border rounded-xl p-5">
    <div className="flex flex-wrap justify-between gap-2 text-sm"><span>#{o._id.slice(-8)} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</span><span className="font-semibold">{o.status} · {o.paid ? 'Paid' : o.method === 'cod' ? 'Pay on delivery' : 'Unpaid'}</span></div>
    <ul className="text-sm text-[#6B7280] my-2">{o.items.map(i => <li key={i._id}>{i.name} × {i.qty}</li>)}</ul><p className="font-bold">{inr(o.total)}</p></div>)}</div></Wrap>
}

export function Admin() {
  const [tab, setTab] = useState('dash'), [dash, setDash] = useState(null), [prods, setProds] = useState([]), [ords, setOrds] = useState([]), [users, setUsers] = useState([])
  const empty = { name: '', category: '', price: '', discount: 0, stock: 0, image: '', description: '' }, [pf, setPf] = useState(empty), [eid, setEid] = useState(null)
  const load = () => { api.get('/admin/dashboard').then(r => setDash(r.data)); api.get('/products?limit=50').then(r => setProds(r.data.items)); api.get('/admin/orders').then(r => setOrds(r.data)); api.get('/admin/users').then(r => setUsers(r.data)) }
  useEffect(load, [])
  const save = async e => { e.preventDefault(); const body = { ...pf, price: +pf.price, discount: +pf.discount, stock: +pf.stock, images: pf.image ? [pf.image] : [] }
    try { eid ? await api.put('/products/' + eid, body) : await api.post('/products', body); toast.success('Saved'); setPf(empty); setEid(null); load() } catch (er) { toast.error(er.response?.data?.message || 'Failed') } }
  const del = async id => { if (confirm('Delete this product?')) { await api.delete('/products/' + id); load() } }
  const status = async (id, s) => { try { await api.put('/admin/orders/' + id, { status: s }); load() } catch (er) { toast.error(er.response?.data?.message || 'Failed') } }
  const max = Math.max(1, ...(dash?.daily || []).map(x => x.t))
  return <Wrap title="Admin"><div className="flex gap-2 mb-6">{[['dash', 'Dashboard'], ['products', 'Products'], ['orders', 'Orders'], ['users', 'Users']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-sm ${tab === k ? 'bg-[#111827] text-white' : 'bg-[#F9FAFB]'}`}>{l}</button>)}</div>
    {tab === 'dash' && dash && <><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[['Revenue (paid)', inr(dash.revenue)], ['Orders', dash.orders], ['Customers', dash.customers], ['Products', dash.products]].map(([l, v]) => <div key={l} className="bg-[#F9FAFB] rounded-xl p-5"><p className="text-xs text-[#6B7280]">{l}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>
      <h2 className="font-bold mt-8 mb-3">Revenue, last 7 days</h2><div className="flex items-end gap-3 h-40">{dash.daily.length ? dash.daily.map(x => <div key={x._id} className="flex-1 text-center text-xs"><div className="bg-[#D4AF37] rounded-t" style={{ height: `${(x.t / max) * 100}%` }} title={inr(x.t)} />{x._id.slice(5)}</div>) : <p className="text-sm text-[#6B7280]">No paid orders yet.</p>}</div>
      <h2 className="font-bold mt-8 mb-3">Recent orders</h2>{dash.recent.map(o => <p key={o._id} className="text-sm">#{o._id.slice(-8)} · {o.user?.name} · {inr(o.total)} · {o.status}</p>)}</>}
    {tab === 'products' && <><form onSubmit={save} className="grid sm:grid-cols-3 gap-3 mb-8">{[['name', 'Name'], ['category', 'Category'], ['price', 'Price'], ['discount', 'Discount %'], ['stock', 'Stock'], ['image', 'Image URL']].map(([k, l]) => <input key={k} aria-label={l} placeholder={l} required={['name', 'category', 'price'].includes(k)} value={pf[k]} onChange={e => setPf({ ...pf, [k]: e.target.value })} />)}
      <textarea aria-label="Description" placeholder="Description" className="sm:col-span-3" value={pf.description} onChange={e => setPf({ ...pf, description: e.target.value })} /><button className={btn}>{eid ? 'Update' : 'Add'} product</button></form>
      {prods.map(p => <div key={p._id} className="flex items-center gap-3 border-b py-2 text-sm"><span className="flex-1">{p.name} · {inr(p.price)} · stock {p.stock}</span><button className="underline" onClick={() => { setEid(p._id); setPf({ ...p, image: p.images[0] || '' }); scrollTo(0, 0) }}>Edit</button><button className="underline text-red-600" onClick={() => del(p._id)}>Delete</button></div>)}</>}
    {tab === 'orders' && ords.map(o => <div key={o._id} className="flex flex-wrap items-center gap-3 border-b py-3 text-sm"><span className="flex-1">#{o._id.slice(-8)} · {o.user?.name} · {inr(o.total)} · {o.paid ? 'Paid' : 'Unpaid'}</span>
      <select aria-label="Status" className="!w-40" value={o.status} onChange={e => status(o._id, e.target.value)}>{['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select></div>)}
    {tab === 'users' && users.map(u => <p key={u._id} className="border-b py-2 text-sm">{u.name} · {u.email} · {u.role}</p>)}</Wrap>
}