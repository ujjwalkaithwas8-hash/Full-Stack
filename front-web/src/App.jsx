import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, User, Heart, ShoppingBag, Menu, X, Minus, Plus, Instagram, Twitter, Youtube } from 'lucide-react'
import { loadMe, logout, setQty, removeItem, openDrawer, closeDrawer } from './store'
import { Home, Shop, ProductPage, Cart, Wishlist, About } from './Storefront'
import { Checkout, Auth, Orders, Admin, Missing } from './pages'
import { Img, inr, totals, btn, ghost } from './ui'

const LINKS = [['/shop', 'Shop'], ['/shop?sort=new', 'New Arrivals'], ['/#collections', 'Collections'], ['/about', 'About']]
const Protected = ({ children, admin }) => {
  const { user, ready } = useSelector(s => s.auth)
  if (!ready) return <p className="p-10">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => { hash ? setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120) : scrollTo(0, 0) }, [pathname, hash])
  return null
}
function Header({ onSearch }) {
  const { pathname } = useLocation(), d = useDispatch(), [sc, setSc] = useState(false), [menu, setMenu] = useState(false)
  const user = useSelector(s => s.auth.user), n = useSelector(s => s.cart.items.reduce((t, i) => t + i.qty, 0)), w = useSelector(s => s.wish.ids.length)
  useEffect(() => { const f = () => setSc(scrollY > 40); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  useEffect(() => setMenu(false), [pathname])
  const clear = pathname === '/' && !sc && !menu
  const badge = c => c > 0 && <b className="absolute -top-2 -right-2 bg-gold text-white text-[10px] w-4 h-4 grid place-items-center rounded-full">{c}</b>
  return <header className={`sticky top-0 z-40 h-20 transition-all duration-500 ${clear ? 'bg-transparent text-white' : 'bg-ivory/90 backdrop-blur border-b border-line text-ink'}`}>
    <nav className="max-w-7xl mx-auto px-5 md:px-10 h-full flex items-center justify-between" aria-label="Main">
      <button className="md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X /> : <Menu />}</button>
      <Link to="/" className="font-serif text-3xl tracking-[.2em]">MY<span className="text-gold">-</span>STORE</Link>
      <ul className="hidden md:flex gap-10 text-[11px] tracking-[.25em] uppercase">{LINKS.map(([to, l]) => <li key={l}><Link to={to} className="ulink">{l}</Link></li>)}</ul>
      <div className="flex items-center gap-5">
        <button onClick={onSearch} aria-label="Search"><Search size={19} /></button>
        <Link to={user ? '/orders' : '/login'} aria-label="Account" className="hidden sm:block"><User size={19} /></Link>
        <Link to="/wishlist" aria-label="Wishlist" className="relative hidden sm:block"><Heart size={19} />{badge(w)}</Link>
        <button onClick={() => d(openDrawer())} aria-label="Bag" className="relative"><ShoppingBag size={19} />{badge(n)}</button></div></nav>
    <AnimatePresence>{menu && <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="md:hidden fixed inset-x-0 top-20 bottom-0 bg-ivory text-ink px-8 py-10 flex flex-col gap-6 font-serif text-4xl">
      {LINKS.map(([to, l]) => <Link key={l} to={to}>{l}</Link>)}<Link to="/wishlist">Wishlist</Link><Link to={user ? '/orders' : '/login'}>{user ? 'My orders' : 'Login'}</Link>{user && <button className="text-left" onClick={() => d(logout())}>Logout</button>}</motion.div>}</AnimatePresence>
  </header>
}
function SearchOverlay({ open, onClose }) {
  const nav = useNavigate(), [q, setQ] = useState('')
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ivory px-6 pt-32" role="dialog" aria-label="Search">
    <button onClick={onClose} aria-label="Close search" className="absolute top-8 right-8"><X /></button>
    <form className="max-w-3xl mx-auto" onSubmit={e => { e.preventDefault(); nav('/shop?q=' + encodeURIComponent(q)); onClose() }}><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="!border-0 !border-b !border-ink !bg-transparent font-serif !text-4xl md:!text-6xl !px-0" /></form></motion.div>}</AnimatePresence>
}
function Drawer() {
  const d = useDispatch(), open = useSelector(s => s.ui.drawer), items = useSelector(s => s.cart.items), t = totals(items)
  return <AnimatePresence>{open && <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => d(closeDrawer())} className="fixed inset-0 z-50 bg-ink/50" />
    <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }} className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-ivory flex flex-col" aria-label="Shopping bag">
      <div className="flex justify-between items-center p-6 border-b border-line"><h2 className="font-serif text-3xl">Your bag</h2><button onClick={() => d(closeDrawer())} aria-label="Close"><X /></button></div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">{!items.length && <p className="text-muted">Your bag is empty.</p>}{items.map(i => <div key={i.id} className="flex gap-4"><Img src={i.image} alt={i.name} className="w-20 aspect-[4/5] object-cover bg-sand" />
        <div className="flex-1 text-sm"><p className="font-serif text-lg">{i.name}</p><p className="text-muted">{inr(i.price)}</p><div className="flex items-center gap-3 mt-2"><button aria-label="Less" onClick={() => d(setQty({ id: i.id, qty: i.qty - 1 }))}><Minus size={13} /></button>{i.qty}<button aria-label="More" onClick={() => d(setQty({ id: i.id, qty: i.qty + 1 }))}><Plus size={13} /></button><button onClick={() => d(removeItem(i.id))} className="ulink ml-3 text-xs text-muted">Remove</button></div></div></div>)}</div>
      <div className="p-6 border-t border-line space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted">Subtotal</span>{inr(t.sub)}</div><div className="flex justify-between"><span className="text-muted">Shipping</span>{t.ship ? inr(t.ship) : 'Free'}</div><div className="flex justify-between text-lg"><span>Total</span>{inr(t.total)}</div>
        <Link to="/cart" onClick={() => d(closeDrawer())} className={`${ghost} block`}>View bag</Link><Link to={items.length ? '/checkout' : '/shop'} onClick={() => d(closeDrawer())} className={`${btn} block`}>{items.length ? 'Checkout' : 'Start shopping'}</Link></div>
    </motion.aside></>}</AnimatePresence>
}
function Footer() {
  const col = (t, l) => <div><h3 className="text-[11px] tracking-[.25em] uppercase text-white mb-5">{t}</h3><ul className="space-y-3 text-sm">{l.map(([to, x]) => <li key={x}><Link to={to} className="ulink">{x}</Link></li>)}</ul></div>
  return <footer className="bg-ink text-white/60 mt-10 px-5 md:px-10 pt-20 pb-8"><div className="max-w-7xl mx-auto grid gap-12 md:grid-cols-4">
    <div><p className="font-serif text-3xl text-white tracking-[.2em]">MY<span className="text-gold">-</span>STORE</p><p className="text-sm mt-4 max-w-xs">Thoughtfully selected essentials designed to elevate your everyday lifestyle.</p>
      <div className="flex gap-4 mt-6 text-white">{[[Instagram, 'https://instagram.com', 'Instagram'], [Twitter, 'https://x.com', 'X'], [Youtube, 'https://youtube.com', 'YouTube']].map(([I, h, l]) => <a key={l} href={h} target="_blank" rel="noreferrer" aria-label={l}><I size={18} /></a>)}</div></div>
    {col('Shop', [['/shop', 'All products'], ['/shop?sort=new', 'New arrivals'], ['/#collections', 'Collections'], ['/wishlist', 'Wishlist']])}
    {col('Customer service', [['/orders', 'My orders'], ['/login', 'Account'], ['/cart', 'Shopping bag']])}
    {col('About', [['/about', 'Our story'], ['/#newsletter', 'Newsletter']])}</div>
    <div className="max-w-7xl mx-auto border-t border-white/10 mt-14 pt-6 flex flex-wrap justify-between gap-4 text-xs"><span>© {new Date().getFullYear()} MY-STORE. All rights reserved.</span><span className="flex gap-2">{['VISA', 'UPI', 'RAZORPAY', 'COD'].map(x => <b key={x} className="border border-white/25 px-2 py-0.5 text-[10px] tracking-widest font-medium">{x}</b>)}</span></div></footer>
}
export default function App() {
  const d = useDispatch(), [search, setSearch] = useState(false)
  useEffect(() => { d(loadMe()) }, [d])
  return <>
    <ScrollManager /><Header onSearch={() => setSearch(true)} /><SearchOverlay open={search} onClose={() => setSearch(false)} /><Drawer />
    <Routes>
      <Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/product/:id" element={<ProductPage />} /><Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} /><Route path="/about" element={<About />} /><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth reg />} />
      <Route path="/checkout" element={<Protected><Checkout /></Protected>} /><Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/admin" element={<Protected admin><Admin /></Protected>} /><Route path="*" element={<Missing />} />
    </Routes><Footer />
  </>
}