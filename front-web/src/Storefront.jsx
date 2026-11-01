import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Minus, Plus, Star, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import api from './api'
import { fetchProducts, fetchProduct, addToCart, setQty, removeItem, openDrawer } from './store'
import { Img, Card, Reveal, Title, Page, Skeleton, btn, ghost, inr, eff, totals } from './ui'

const Line = ({ children, d }) => <span className="block overflow-hidden"><motion.span className="block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: d, ease: [.22, 1, .36, 1] }}>{children}</motion.span></span>
const Wrap = ({ children, className = '' }) => <div className={`max-w-7xl mx-auto px-5 md:px-10 ${className}`}>{children}</div>
const pic = (s, w = 1600, h = 1000) => `https://picsum.photos/seed/${s}/${w}/${h}`
const REVIEWS = [{ n: 'Aarav M.', s: 5, t: 'Beautifully made and exactly as pictured. The quality is obvious the moment you open the box.' }, { n: 'Sneha R.', s: 5, t: 'Clean design, fast delivery, and packaging that feels truly premium.' }, { n: 'Kabir S.', s: 4, t: 'A rare store where everything feels considered. Already planning my next order.' }]
const Stars = ({ n }) => <span className="flex gap-0.5" aria-label={`${n} out of 5`}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} fill={i <= Math.round(n) ? '#B69A70' : 'none'} stroke="#B69A70" />)}</span>

export function Home() {
  const [list, setList] = useState(null), [rv, setRv] = useState(0), [em, setEm] = useState(''), rail = useRef(null)
  useEffect(() => { api.get('/products', { params: { limit: 50 } }).then(r => setList(r.data.items)).catch(() => setList([])) }, [])
  const cats = list ? [...new Set(list.map(p => p.category))].slice(0, 4).map(c => ({ c, img: list.find(p => p.category === c).images[0] })) : []
  const featured = list ? [...list].sort((a, b) => b.sold - a.sold).slice(0, 8) : [], fresh = list ? list.slice(0, 10) : []
  const sub = e => { e.preventDefault(); /^\S+@\S+\.\S+$/.test(em) ? (toast.success('Thank you — you are on the list (demo, not stored)'), setEm('')) : toast.error('Please enter a valid email') }
  return <Page title="Home">
    <section className="relative h-screen min-h-[620px] -mt-20 overflow-hidden bg-ink text-white flex items-end">
      <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 10, ease: 'easeOut' }}><Img src={pic('mystore-hero', 2000, 1200)} alt="MY-STORE campaign" className="w-full h-full object-cover opacity-70" /></motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
      <Wrap className="relative pb-20 w-full"><h1 className="font-serif text-5xl md:text-8xl leading-[.95] max-w-4xl"><Line d={.3}>STYLE THAT SPEAKS.</Line><Line d={.5}><i className="text-gold">QUALITY THAT LASTS.</i></Line></h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="max-w-md mt-6 text-white/80">Discover thoughtfully selected essentials designed to elevate your everyday lifestyle.</motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex flex-wrap gap-4 mt-8"><Link to="/shop" className={`${btn} !bg-white !text-ink hover:!bg-gold`}>Explore collection</Link><Link to="/about" className={ghost}>Discover more</Link></motion.div></Wrap>
    </section>
    <section id="collections" className="py-24"><Wrap><Reveal><Title eyebrow="Collections">Shop by category</Title></Reveal>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">{cats.map((c, i) => <Reveal key={c.c} d={i * .08}><Link to={`/shop?category=${encodeURIComponent(c.c)}`} className="group relative block aspect-[3/4] overflow-hidden bg-sand">
        <Img src={c.img} alt={c.c} className="absolute inset-0 w-full h-full object-cover transition duration-[1100ms] group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
        <div className="absolute bottom-0 p-5 text-white"><h3 className="font-serif text-3xl">{c.c}</h3><span className="ulink text-[11px] tracking-[.25em] uppercase">Discover</span></div></Link></Reveal>)}</div></Wrap></section>
    <section className="pb-24"><Wrap><Reveal className="flex justify-between items-end mb-10"><Title eyebrow="Curated">Featured pieces</Title><Link to="/shop?sort=popular" className="ulink text-[11px] tracking-[.25em] uppercase hidden sm:block">View all</Link></Reveal>{list ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">{featured.map((p, i) => <Card key={p._id} p={p} i={i} />)}</div> : <Skeleton />}</Wrap></section>
    <section className="py-24 bg-sand"><Wrap><div className="flex justify-between items-end mb-10"><Title eyebrow="Just landed">New arrivals</Title>
      <div className="flex items-center gap-4"><Link to="/shop?sort=new" className="ulink text-[11px] tracking-[.25em] uppercase hidden sm:block">View all</Link>
        {[[ArrowLeft, -1, 'Previous'], [ArrowRight, 1, 'Next']].map(([I, dir, l]) => <button key={l} aria-label={l} onClick={() => rail.current.scrollBy({ left: dir * rail.current.clientWidth * .8, behavior: 'smooth' })} className="w-11 h-11 border border-ink/30 grid place-items-center hover:bg-ink hover:text-white transition"><I size={16} /></button>)}</div></div>
      <div ref={rail} className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory">{fresh.map((p, i) => <div key={p._id} className="snap-start shrink-0 w-[68%] sm:w-[36%] lg:w-[23.5%] relative"><span className="absolute top-3 left-3 z-10 bg-gold text-white text-[10px] tracking-widest px-2 py-1 pointer-events-none">NEW</span><Card p={p} i={i} /></div>)}</div></Wrap></section>
    <section className="relative py-40 text-center text-white overflow-hidden bg-ink"><Img src={pic('mystore-promo', 1800, 900)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <Reveal className="relative px-5"><h2 className="font-serif text-5xl md:text-8xl">LESS, <i className="text-gold">BUT BETTER.</i></h2><p className="mt-5 text-white/80">Discover a collection where design meets everyday comfort.</p><Link to="/shop" className={`${btn} !bg-white !text-ink hover:!bg-gold mt-8`}>Shop the edit</Link></Reveal></section>
    <section className="py-24"><Wrap className="grid md:grid-cols-2 gap-14 items-center"><Reveal><Img src={pic('mystore-story', 900, 1100)} alt="Lifestyle" className="w-full aspect-[4/5] object-cover bg-sand" /></Reveal>
      <Reveal d={.12}><Title eyebrow="Our philosophy">DESIGNED FOR THE WAY YOU LIVE.</Title><p className="text-muted mt-6 max-w-md leading-relaxed">We believe in fewer, better things. Every piece is chosen for its materials, its craft and how well it ages — so it earns a place in your life, not just your cart.</p><Link to="/about" className={`${ghost} mt-8`}>Discover our story</Link></Reveal></Wrap></section>
    <section className="py-24 bg-sand text-center"><Wrap><Reveal><Title eyebrow="Reviews">Loved by customers</Title></Reveal>
      <div className="max-w-2xl mx-auto mt-10 min-h-[170px]"><AnimatePresence mode="wait"><motion.div key={rv} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4"><Stars n={REVIEWS[rv].s} /><p className="font-serif text-2xl md:text-3xl italic">“{REVIEWS[rv].t}”</p><p className="text-[11px] tracking-[.25em] uppercase text-muted">{REVIEWS[rv].n}</p></motion.div></AnimatePresence></div>
      <div className="flex justify-center gap-2 mt-6">{REVIEWS.map((_, i) => <button key={i} aria-label={`Review ${i + 1}`} onClick={() => setRv(i)} className={`h-1.5 transition-all ${rv === i ? 'w-8 bg-ink' : 'w-3 bg-ink/25'}`} />)}</div></Wrap></section>
    <section id="newsletter" className="py-24 text-center"><Wrap><Title eyebrow="Newsletter">BE THE FIRST TO KNOW.</Title><p className="text-muted mt-4 max-w-md mx-auto">Join our community for exclusive collections, new arrivals, and special updates.</p>
      <form onSubmit={sub} noValidate className="flex max-w-md mx-auto mt-8"><label htmlFor="nl" className="sr-only">Email</label><input id="nl" value={em} onChange={e => setEm(e.target.value)} placeholder="Your email address" /><button className={btn}>Subscribe</button></form></Wrap></section>
  </Page>
}

export function Shop() {
  const d = useDispatch(), { items, pages, total, loading } = useSelector(s => s.products), [sp, setSp] = useSearchParams(), [cats, setCats] = useState([]), [open, setOpen] = useState(false)
  const g = k => sp.get(k) || '', set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n) }, page = +g('page') || 1
  useEffect(() => { api.get('/categories').then(r => setCats(r.data)) }, [])
  useEffect(() => { d(fetchProducts({ q: g('q'), category: g('category'), max: g('max'), sort: g('sort'), page })) }, [sp])
  const opt = (on, f, t) => <button key={t} onClick={f} className={`block text-left text-sm py-1 ${on ? 'text-ink font-semibold' : 'text-muted hover:text-ink'}`}>{t}</button>
  return <Page title="Shop"><Wrap className="py-14">
    <nav className="text-[11px] tracking-[.2em] uppercase text-muted" aria-label="Breadcrumb"><Link to="/" className="ulink">Home</Link> / Shop{g('category') && ` / ${g('category')}`}</nav>
    <div className="flex flex-wrap justify-between items-end gap-4 mt-4 mb-10 border-b border-line pb-6"><div><h1 className="font-serif text-5xl md:text-7xl">{g('category') || (g('q') ? `“${g('q')}”` : 'All products')}</h1><p className="text-sm text-muted mt-2">{total} products</p></div>
      <div className="flex gap-3"><button onClick={() => setOpen(!open)} className="lg:hidden border border-line px-4 flex items-center gap-2 text-xs"><SlidersHorizontal size={14} />Filters</button>
        <select aria-label="Sort" className="!w-auto" value={g('sort')} onChange={e => set('sort', e.target.value)}><option value="">Newest</option><option value="popular">Popularity</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></div></div>
    <div className="grid lg:grid-cols-[220px_1fr] gap-12">
      <aside className={`${open ? 'block' : 'hidden'} lg:block lg:sticky lg:top-28 h-fit space-y-8`} aria-label="Filters">
        <input aria-label="Search" placeholder="Search…" defaultValue={g('q')} onKeyDown={e => e.key === 'Enter' && set('q', e.target.value)} />
        <div><h3 className="text-[11px] tracking-[.25em] uppercase mb-3">Category</h3>{opt(!g('category'), () => set('category', ''), 'All')}{cats.map(c => opt(g('category') === c, () => set('category', c), c))}</div>
        <div><h3 className="text-[11px] tracking-[.25em] uppercase mb-3">Max price: {g('max') ? inr(g('max')) : 'Any'}</h3><input type="range" min="1000" max="10000" step="500" value={g('max') || 10000} onChange={e => set('max', +e.target.value === 10000 ? '' : e.target.value)} className="!p-0 !border-0 accent-[#B69A70]" aria-label="Max price" /></div>
        <button onClick={() => setSp({})} className="ulink text-xs">Clear filters</button></aside>
      <div>{loading ? <Skeleton n={6} /> : !items.length ? <p className="text-muted">No products match your filters.</p> : <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-12">{items.map((p, i) => <Card key={p._id} p={p} i={i} />)}</div>}
        {pages > 1 && <div className="flex gap-2 justify-center mt-14">{[...Array(pages)].map((_, i) => <button key={i} onClick={() => set('page', i + 1)} aria-current={page === i + 1} className={`w-10 h-10 border text-sm ${page === i + 1 ? 'bg-ink text-white border-ink' : 'border-line hover:border-ink'}`}>{i + 1}</button>)}</div>}</div></div></Wrap></Page>
}

export function ProductPage() {
  const { id } = useParams(), d = useDispatch(), nav = useNavigate(), p = useSelector(s => s.products.current), [img, setImg] = useState(0), [qty, setQ] = useState(1), [rel, setRel] = useState([])
  useEffect(() => { d(fetchProduct(id)); setImg(0); setQ(1) }, [id])
  useEffect(() => { if (p) api.get('/products', { params: { category: p.category, limit: 5 } }).then(r => setRel(r.data.items.filter(x => x._id !== p._id).slice(0, 4))) }, [p?._id])
  if (!p) return <Page title="Product"><Wrap className="py-24"><Skeleton n={2} /></Wrap></Page>
  const add = () => d(addToCart({ id: p._id, name: p.name, price: eff(p), image: p.images[0], stock: p.stock, qty }))
  return <Page title={p.name}><Wrap className="py-14">
    <nav className="text-[11px] tracking-[.2em] uppercase text-muted mb-8"><Link to="/" className="ulink">Home</Link> / <Link to="/shop" className="ulink">Shop</Link> / {p.name}</nav>
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-12">
      <div className="flex flex-col-reverse lg:flex-row gap-4"><div className="flex lg:flex-col gap-3">{p.images.map((s, i) => <button key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={`w-20 h-24 overflow-hidden border ${img === i ? 'border-ink' : 'border-transparent opacity-70'}`}><Img src={s} alt="" className="w-full h-full object-cover" /></button>)}</div>
        <div className="relative flex-1 aspect-[4/5] bg-sand overflow-hidden"><AnimatePresence mode="wait"><motion.div key={img} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .35 }} className="absolute inset-0"><Img src={p.images[img]} alt={p.name} className="w-full h-full object-cover hover:scale-110 transition duration-700 cursor-zoom-in" /></motion.div></AnimatePresence></div></div>
      <div className="space-y-6 md:sticky md:top-28 h-fit"><p className="text-[11px] tracking-[.3em] uppercase text-gold">{p.category}</p><h1 className="font-serif text-5xl">{p.name}</h1><div className="flex items-center gap-3"><Stars n={p.rating} /><span className="text-sm text-muted">{p.rating.toFixed(1)}</span></div>
        <p className="text-2xl">{inr(eff(p))} {p.discount > 0 && <><s className="text-muted text-base ml-2">{inr(p.price)}</s><span className="text-gold text-sm ml-2">{p.discount}% off</span></>}</p>
        <p className={`text-sm ${p.stock ? 'text-muted' : 'text-red-700'}`}>{p.stock ? (p.stock < 6 ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}</p>
        <div className="flex items-center border border-line w-fit"><button aria-label="Less" onClick={() => setQ(Math.max(1, qty - 1))} className="w-11 h-11 grid place-items-center"><Minus size={14} /></button><span className="w-10 text-center">{qty}</span><button aria-label="More" onClick={() => setQ(Math.min(p.stock, qty + 1))} className="w-11 h-11 grid place-items-center"><Plus size={14} /></button></div>
        <div className="flex gap-3"><button disabled={!p.stock} className={`${btn} flex-1`} onClick={() => { add(); d(openDrawer()) }}>Add to bag</button><button disabled={!p.stock} className={`${ghost} flex-1`} onClick={() => { add(); nav('/checkout') }}>Buy now</button></div>
        {[['Description', p.description || 'Thoughtfully designed and built to last.'], ['Shipping & returns', 'Free shipping above ₹1,999, otherwise ₹99. Delivered in 3–5 business days.']].map(([t, b], i) => <details key={t} open={!i} className="border-t border-line py-4"><summary className="cursor-pointer text-[11px] tracking-[.25em] uppercase">{t}</summary><p className="text-muted text-sm mt-3 leading-relaxed">{b}</p></details>)}</div></div>
    {rel.length > 0 && <section className="mt-28"><Title eyebrow="You may also like">Related pieces</Title><div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 mt-10">{rel.map((x, i) => <Card key={x._id} p={x} i={i} />)}</div></section>}</Wrap></Page>
}

export function Cart() {
  const d = useDispatch(), items = useSelector(s => s.cart.items), t = totals(items)
  if (!items.length) return <Page title="Bag"><Wrap className="py-32 text-center"><h1 className="font-serif text-5xl">Your bag is empty</h1><p className="text-muted mt-3">Discover something you'll love.</p><Link to="/shop" className={`${btn} mt-8`}>Continue shopping</Link></Wrap></Page>
  return <Page title="Bag"><Wrap className="py-14"><h1 className="font-serif text-5xl md:text-7xl mb-10">Your bag</h1><div className="grid lg:grid-cols-[1fr_380px] gap-14"><div>
    {items.map(i => <div key={i.id} className="flex gap-5 py-6 border-b border-line"><Img src={i.image} alt={i.name} className="w-28 aspect-[4/5] object-cover bg-sand" /><div className="flex-1"><p className="font-serif text-2xl">{i.name}</p><p className="text-sm text-muted">{inr(i.price)}</p>
      <div className="flex items-center gap-4 mt-4"><div className="flex items-center border border-line"><button aria-label="Less" onClick={() => d(setQty({ id: i.id, qty: i.qty - 1 }))} className="w-9 h-9 grid place-items-center"><Minus size={13} /></button><span className="w-8 text-center text-sm">{i.qty}</span><button aria-label="More" onClick={() => d(setQty({ id: i.id, qty: i.qty + 1 }))} className="w-9 h-9 grid place-items-center"><Plus size={13} /></button></div><button onClick={() => d(removeItem(i.id))} className="ulink text-xs text-muted">Remove</button></div></div><p>{inr(i.price * i.qty)}</p></div>)}</div>
    <aside className="bg-sand p-8 h-fit space-y-3 text-sm"><h2 className="font-serif text-3xl mb-2">Summary</h2>
      {t.sub < 1999 && <p className="text-xs text-muted">Add {inr(1999 - t.sub)} more for free shipping.<span className="block h-px bg-line mt-2"><span className="block h-px bg-gold" style={{ width: `${Math.min(100, t.sub / 19.99)}%` }} /></span></p>}
      <div className="flex justify-between"><span className="text-muted">Subtotal</span>{inr(t.sub)}</div><div className="flex justify-between"><span className="text-muted">Shipping</span>{t.ship ? inr(t.ship) : 'Free'}</div><div className="flex justify-between text-lg border-t border-line pt-3"><span>Total</span>{inr(t.total)}</div>
      <Link to="/checkout" className={`${btn} block mt-4`}>Checkout</Link><Link to="/shop" className="ulink text-xs block text-center pt-2">Continue shopping</Link></aside></div></Wrap></Page>
}

export function Wishlist() {
  const ids = useSelector(s => s.wish.ids), [list, setList] = useState(null)
  useEffect(() => { api.get('/products', { params: { limit: 50 } }).then(r => setList(r.data.items.filter(p => ids.includes(p._id)))) }, [ids])
  return <Page title="Wishlist"><Wrap className="py-14"><h1 className="font-serif text-5xl md:text-7xl mb-10">Wishlist</h1>{!list ? <Skeleton /> : !list.length ? <><p className="text-muted">Nothing saved yet.</p><Link to="/shop" className={`${btn} mt-6`}>Discover</Link></> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">{list.map((p, i) => <Card key={p._id} p={p} i={i} />)}</div>}</Wrap></Page>
}

export function About() {
  return <Page title="About"><Wrap className="py-24 grid md:grid-cols-2 gap-14 items-center"><Reveal><Title eyebrow="Our story">More than a store.</Title><p className="text-muted mt-6 leading-relaxed max-w-md">MY-STORE began with a simple idea: fewer, better things. We curate essentials for their materials, craft and longevity, then deliver them with the care you'd expect from a boutique.</p><Link to="/shop" className={`${btn} mt-8`}>Shop the collection</Link></Reveal>
    <Reveal d={.1}><Img src={pic('mystore-about', 900, 1100)} alt="MY-STORE" className="w-full aspect-[4/5] object-cover bg-sand" /></Reveal></Wrap></Page>
}