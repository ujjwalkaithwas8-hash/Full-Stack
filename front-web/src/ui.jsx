import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWish, addToCart, openDrawer } from './store'

export const inr = n => '₹' + Number(n).toLocaleString('en-IN')
export const eff = p => Math.round(p.price * (1 - p.discount / 100))
export const totals = items => { const sub = items.reduce((t, i) => t + i.price * i.qty, 0), ship = sub === 0 || sub >= 1999 ? 0 : 99; return { sub, ship, total: sub + ship } }
const FB = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#F0EEE9"/><text x="200" y="258" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="6" fill="#B69A70">MY-STORE</text></svg>')
export const Img = ({ src, alt, className = '', eager }) => <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={className} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = FB }} />
export const btn = 'inline-block bg-ink text-white px-8 py-4 text-[11px] tracking-[.25em] uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-40 text-center'
export const ghost = 'inline-block border border-current px-8 py-4 text-[11px] tracking-[.25em] uppercase hover:bg-ink hover:text-white hover:border-ink transition-colors duration-300 text-center'
export const Reveal = ({ children, d = 0, className = '' }) => <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .8, delay: d, ease: [.22, 1, .36, 1] }}>{children}</motion.div>
export const Title = ({ eyebrow, children, className = '' }) => <div className={className}><p className="text-[11px] tracking-[.3em] uppercase text-gold mb-3">{eyebrow}</p><h2 className="font-serif text-4xl md:text-6xl leading-[1.05]">{children}</h2></div>
export const Page = ({ title, children, className = '' }) => {
  useEffect(() => { document.title = title + ' — MY-STORE' }, [title])
  return <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className={`min-h-[60vh] ${className}`}>{children}</motion.main>
}
export const Skeleton = ({ n = 4 }) => <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">{[...Array(n)].map((_, i) => <div key={i} className="aspect-[4/5] bg-sand animate-pulse" />)}</div>

export function Card({ p, i = 0 }) {
  const d = useDispatch(), on = useSelector(s => s.wish.ids.includes(p._id))
  const quick = () => { d(addToCart({ id: p._id, name: p.name, price: eff(p), image: p.images[0], stock: p.stock, qty: 1 })); d(openDrawer()) }
  return <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .7, delay: (i % 4) * .08 }} className="group">
    <div className="relative overflow-hidden bg-sand aspect-[4/5]">
      <Link to={`/product/${p._id}`} aria-label={p.name}>
        <Img src={p.images[0]} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition duration-[900ms] group-hover:scale-105" />
        {p.images[1] && <Img src={p.images[1]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-700" />}
      </Link>
      {p.discount > 0 && <span className="absolute top-3 left-3 bg-ink text-white text-[10px] tracking-widest px-2 py-1">-{p.discount}%</span>}
      <button onClick={() => d(toggleWish(p._id))} aria-label="Wishlist" aria-pressed={on} className="absolute top-3 right-3 w-9 h-9 grid place-items-center bg-ivory/80 hover:bg-ivory transition"><Heart size={16} fill={on ? '#B69A70' : 'none'} stroke={on ? '#B69A70' : '#171717'} /></button>
      {p.stock > 0 ? <button onClick={quick} className="absolute inset-x-0 bottom-0 bg-ivory/95 py-3.5 text-[11px] tracking-[.25em] uppercase translate-y-full group-hover:translate-y-0 focus:translate-y-0 max-md:translate-y-0 transition-transform duration-500">Quick add</button>
        : <span className="absolute inset-x-0 bottom-0 bg-ivory/90 py-3 text-center text-[11px] tracking-[.25em] uppercase text-muted">Sold out</span>}
    </div>
    <div className="pt-4"><p className="text-[10px] tracking-[.25em] uppercase text-muted">{p.category}</p>
      <Link to={`/product/${p._id}`} className="font-serif text-xl block mt-1">{p.name}</Link>
      <p className="text-sm mt-1">{inr(eff(p))} {p.discount > 0 && <s className="text-muted ml-2">{inr(p.price)}</s>}</p></div>
  </motion.article>
}