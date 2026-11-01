import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from './api'
const msg = e => e.response?.data?.message || e.message
const thunk = (name, fn) => createAsyncThunk(name, async (a, { rejectWithValue }) => { try { return await fn(a) } catch (e) { return rejectWithValue(msg(e)) } })

export const login = thunk('auth/login', async b => (await api.post('/auth/login', b)).data)
export const register = thunk('auth/register', async b => (await api.post('/auth/register', b)).data)
export const loadMe = thunk('auth/me', async () => (await api.get('/auth/me')).data)
export const logout = thunk('auth/logout', async () => { await api.post('/auth/logout') })
export const fetchProducts = thunk('products/list', async p => (await api.get('/products', { params: p })).data)
export const fetchProduct = thunk('products/one', async id => (await api.get('/products/' + id)).data)
export const placeOrder = thunk('orders/place', async b => (await api.post('/orders', b)).data)
export const fetchMyOrders = thunk('orders/mine', async () => (await api.get('/orders/my-orders')).data)

const auth = createSlice({ name: 'auth', initialState: { user: null, ready: false, error: null }, reducers: {}, extraReducers: b => {
  [login, register, loadMe].forEach(t => b.addCase(t.fulfilled, (s, a) => { s.user = a.payload; s.ready = true; s.error = null }))
  b.addCase(loadMe.rejected, s => { s.ready = true })
  ;[login, register].forEach(t => b.addCase(t.rejected, (s, a) => { s.error = a.payload }))
  b.addCase(logout.fulfilled, s => { s.user = null })
} })
const products = createSlice({ name: 'products', initialState: { items: [], total: 0, pages: 1, current: null, loading: false }, reducers: {}, extraReducers: b => {
  b.addCase(fetchProducts.pending, s => { s.loading = true })
  b.addCase(fetchProducts.fulfilled, (s, a) => { Object.assign(s, a.payload, { loading: false }) })
  b.addCase(fetchProducts.rejected, s => { s.loading = false })
  b.addCase(fetchProduct.pending, s => { s.current = null })
  b.addCase(fetchProduct.fulfilled, (s, a) => { s.current = a.payload })
} })
const cart = createSlice({ name: 'cart', initialState: { items: JSON.parse(localStorage.getItem('ms-cart') || '[]') }, reducers: {
  addToCart: (s, { payload: p }) => { const f = s.items.find(i => i.id === p.id); if (f) f.qty = Math.min(f.qty + p.qty, p.stock); else s.items.push(p) },
  setQty: (s, { payload: { id, qty } }) => { const f = s.items.find(i => i.id === id); if (f) f.qty = Math.max(1, Math.min(qty, f.stock)) },
  removeItem: (s, { payload }) => { s.items = s.items.filter(i => i.id !== payload) },
  clearCart: s => { s.items = [] }
} })
const orders = createSlice({ name: 'orders', initialState: { mine: [] }, reducers: {}, extraReducers: b => { b.addCase(fetchMyOrders.fulfilled, (s, a) => { s.mine = a.payload }) } })
const wish = createSlice({ name: 'wish', initialState: { ids: JSON.parse(localStorage.getItem('ms-wish') || '[]') }, reducers: {
  toggleWish: (s, { payload }) => { s.ids = s.ids.includes(payload) ? s.ids.filter(x => x !== payload) : [...s.ids, payload] } } })
const ui = createSlice({ name: 'ui', initialState: { drawer: false }, reducers: {
  openDrawer: s => { s.drawer = true }, closeDrawer: s => { s.drawer = false } } })
export const { toggleWish } = wish.actions
export const { openDrawer, closeDrawer } = ui.actions

export const { addToCart, setQty, removeItem, clearCart } = cart.actions
export const store = configureStore({ reducer: { auth: auth.reducer, products: products.reducer, cart: cart.reducer, orders: orders.reducer, wish: wish.reducer, ui: ui.reducer } })
store.subscribe(() => { const s = store.getState(); localStorage.setItem('ms-cart', JSON.stringify(s.cart.items)); localStorage.setItem('ms-wish', JSON.stringify(s.wish.ids)) })