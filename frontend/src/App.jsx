import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Sprout, Search, Plus, Pencil, Trash2, X, Tractor, MapPin, Package,
  CheckCircle2, LogIn, UserPlus, LogOut, LoaderCircle, RefreshCw,
  ArrowUpRight, ShieldCheck, SlidersHorizontal, Image as ImageIcon
} from 'lucide-react'
import './style.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const emptyForm = { name: '', category: 'Other', price: '', unit: 'day', location: '', ownerName: '', phone: '', description: '' }
const categories = ['All', 'Spraying', 'Sowing', 'Cultivation', 'Harvesting', 'Irrigation', 'Tractor','Rotavator']

// Photos are selected by category, so the existing API/database schema does not need to change.
const equipmentPhotos = {
  Spraying: 'https://media.istockphoto.com/id/1385801180/photo/aerial-view-of-farming-tractor-plowing-and-spraying-on-field.jpg?s=170667a&w=0&k=20&c=2l5IAaKERE0KspB13G6hoy9lKeTQRTU37E2TJsRArKU=',
  Sowing: 'https://img.freepik.com/premium-photo/hand-sow-seeds-palm-soil-after-rain_1028938-182214.jpg?w=2000',
  Cultivation: 'https://blitzindiamedia.com/wp-content/uploads/2023/03/Over-1-cr-farmers-benefit-with-paddy-procurement.jpg',
  Harvesting: 'https://img.freepik.com/premium-photo/colors-harvesting-food-harvesting-fields-fruits_1036177-60.jpg?w=996',
  Irrigation: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1000&q=85',
  Tractor: 'https://tractor.info/media/John-Deere-7R-290-1536x926.jpg',
  Rotavator:'https://tractorkarvan.com/storage/images/Blogs/10-rotavator-models/Shaktiman-Champion-CH-190.jpg'
}
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

function readSavedUser() {
  try {
    const token = localStorage.getItem('krushishare-token')
    const user = JSON.parse(localStorage.getItem('krushishare-user') || 'null')
    return token && user ? { token, user } : null
  } catch { return null }
}

export default function App() {
  const [session, setSession] = useState(readSavedUser)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const apiRequest = useCallback(async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (session?.token) headers.Authorization = `Bearer ${session.token}`
    let response
    try {
      response = await fetch(`${API}${path}`, { ...options, headers })
    } catch {
      throw new Error('Cannot connect to backend. Start the backend and check MongoDB is running.')
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401 && session?.token) {
        localStorage.removeItem('krushishare-token')
        localStorage.removeItem('krushishare-user')
        setSession(null)
      }
      throw new Error(data.message || 'Something went wrong.')
    }
    return data
  }, [session])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (category !== 'All') params.set('category', category)
      const data = await apiRequest(`/equipment${params.size ? `?${params}` : ''}`, { method: 'GET' })
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e.message)
      setItems([])
    } finally { setLoading(false) }
  }, [apiRequest, search, category])

  useEffect(() => { loadItems() }, [loadItems])

  const ownedItems = useMemo(() => items.filter(x =>
    session?.user?.id && (x.owner?._id === session.user.id || x.owner === session.user.id)
  ), [items, session])
  const locations = new Set(items.map(x => x.location).filter(Boolean)).size
  const catCount = new Set(items.map(x => x.category).filter(Boolean)).size

  function showAuth(mode = 'login') {
    setAuthMode(mode)
    setAuthForm({ name: '', email: '', password: '' })
    setAuthOpen(true)
    setError('')
    setNotice('')
  }
  function logout() {
    localStorage.removeItem('krushishare-token')
    localStorage.removeItem('krushishare-user')
    setSession(null)
    setNotice('You have logged out.')
  }
  async function submitAuth(e) {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const data = await apiRequest(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(authForm) })
      localStorage.setItem('krushishare-token', data.token)
      localStorage.setItem('krushishare-user', JSON.stringify(data.user))
      setSession({ token: data.token, user: data.user })
      setAuthOpen(false)
      setNotice(data.message || (authMode === 'login' ? 'Login successful.' : 'Registration successful.'))
      await loadItems()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  function openAdd() {
    if (!session) {
      showAuth('login')
      setNotice('Please log in or register before adding equipment.')
      return
    }
    setEditingId(null)
    setForm({ ...emptyForm, ownerName: session.user.name || '' })
    setModal(true); setError('')
  }
  function openEdit(item) {
    setEditingId(item._id)
    setForm({
      name: item.name || '', category: item.category || 'Other', price: String(item.price ?? ''),
      unit: item.unit || 'day', location: item.location || '', ownerName: item.ownerName || '',
      phone: item.phone || '', description: item.description || ''
    })
    setModal(true); setError('')
  }
  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    const payload = { ...form, price: Number(form.price) }
    try {
      const data = await apiRequest(editingId ? `/equipment/${editingId}` : '/equipment', {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload)
      })
      setNotice(data.message || (editingId ? 'Equipment updated.' : 'Equipment added.'))
      setModal(false); setForm(emptyForm); setEditingId(null)
      await loadItems()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.name}"? This action cannot be undone.`)) return
    setError(''); setNotice('')
    try {
      const data = await apiRequest(`/equipment/${item._id}`, { method: 'DELETE' })
      setNotice(data.message || 'Equipment deleted.')
      await loadItems()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="KrushiShare home">
          <span className="brand-icon"><Sprout size={25} /></span>
          <span className="brand-copy">Krushi<span>Share</span><small>SHARE MORE. GROW MORE.</small></span>
        </a>
        <nav className="nav-links"><a href="#equipment">Explore equipment</a><a href="#how-it-works">How it works</a></nav>
        <div className="top-actions">
          <span className="api-status"><span className="online-dot" /> FARMER COMMUNITY</span>
          {session ? <>
            <span className="user-chip">{session.user.name || session.user.email}</span>
            <button className="button button-outline button-small" onClick={logout}><LogOut size={16} /> Logout</button>
          </> : <>
            <button className="button button-outline button-small" onClick={() => showAuth('login')}><LogIn size={16} /> Login</button>
            <button className="button button-primary button-small" onClick={() => showAuth('register')}><UserPlus size={16} /> Register</button>
          </>}
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-mark"><Sprout size={15} /></span> FARMING MADE EASIER</div>
            <h1>Share the tools.<br /><span>Grow together.</span></h1>
            <p className="hero-description">A community marketplace that brings farmers and useful agricultural equipment closer together.</p>
            <div className="hero-actions">
              <button className="button button-primary button-large" onClick={openAdd}><Plus size={18} /> List your equipment</button>
              <a className="text-link" href="#equipment">Explore listings <ArrowUpRight size={16} /></a>
            </div>
            <div className="hero-trust"><span><ShieldCheck size={17} /> Community-powered</span><span><CheckCircle2 size={17} /> Easy to use</span></div>
          </div>
          <div className="hero-visual">
            <img src="https://png.pngtree.com/thumb_back/fw800/background/20240522/pngtree-aerial-photograph-of-green-agricultural-plots-with-vacant-land-waiting-to-image_15688974.jpg" alt="Green agricultural fields" />
            <div className="hero-image-shade" />
          </div>
          <div className="hero-decor decor-one" /><div className="hero-decor decor-two" />
        </section>

        <section className="stats" aria-label="Marketplace statistics">
          <div className="stat"><span className="stat-icon"><Tractor size={21} /></span><div><b>{items.length}</b><small>Equipment listings</small></div></div>
          <div className="stat"><span className="stat-icon stat-icon-yellow"><Package size={21} /></span><div><b>{catCount}</b><small>Categories</small></div></div>
          <div className="stat"><span className="stat-icon stat-icon-blue"><MapPin size={21} /></span><div><b>{locations}</b><small>Locations covered</small></div></div>
          <div className="stat"><span className="stat-icon stat-icon-lilac"><ShieldCheck size={21} /></span><div><b>Simple</b><small>Secure sign-in</small></div></div>
        </section>

        <section className="listing-section" id="equipment">
          <div className="section-heading">
            <div><div className="eyebrow">THE COMMUNITY MARKETPLACE</div><h2>Find your farm essentials<span>.</span></h2><p>Explore equipment listings or sign in to manage your own.</p></div>
            <button className="button button-primary" onClick={openAdd}><Plus size={18} /> Add equipment</button>
          </div>

          {notice && <div className="notice"><CheckCircle2 size={18} /><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div>}
          {error && <div className="error-banner"><X size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}

          <div className="filter-panel">
            <label className="search-box"><Search size={19} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment, owner or location..." aria-label="Search equipment" /></label>
            <label className="category-select"><SlidersHorizontal size={17} /><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category">{categories.map(c => <option key={c}>{c}</option>)}</select></label>
            
          </div>
          <div className="result-line"><span>Showing <b>{items.length}</b> listing{items.length === 1 ? '' : 's'}</span><span className="my-listings">My listings <b>{ownedItems.length}</b></span></div>

          {loading ? <div className="empty-state"><LoaderCircle className="spin" size={30} /><h3>Finding farm equipment...</h3><p>Loading listings from the marketplace.</p></div>
          : items.length ? <div className="equipment-grid">{items.map(item => {
            const isOwner = !!session?.user?.id && (item.owner?._id === session.user.id || item.owner === session.user.id)
            return <article className="equipment-card" key={item._id}>
              <div className="card-visual">
                <img src={equipmentPhotos[item.category] || equipmentPhotos.Other} alt={`${item.name} equipment`} loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} />
                <span className="category-pill">{item.category || 'Equipment'}</span>
                <span className="photo-credit"><ImageIcon size={12} /> FARM EQUIPMENT</span>
              </div>
              <div className="card-body">
                <div className="card-title-row"><h3>{item.name}</h3><div className="price"><b>{money(item.price)}</b><small>/{item.unit || 'day'}</small></div></div>
                <p className="description">{item.description || 'Farm equipment available for sharing in your community.'}</p>
                <div className="meta"><span><MapPin size={15} />{item.location || 'Location not provided'}</span><span className="owner-meta"><span className="person-avatar">{(item.ownerName || 'F').charAt(0).toUpperCase()}</span>{item.ownerName || 'Farmer'}</span></div>
                {item.phone && <div className="phone-line">Contact: {item.phone}</div>}
                {isOwner ? <div className="card-actions"><button className="edit-button" onClick={() => openEdit(item)}><Pencil size={15} /> Edit</button><button className="delete-button" onClick={() => deleteItem(item)}><Trash2 size={15} /> Delete</button></div>
                : <div className="owner-note"><CheckCircle2 size={15} /> Community listing</div>}
              </div>
            </article>
          })}</div>
          : <div className="empty-state empty-state-box"><span className="empty-illustration"><Tractor size={32} /></span><h3>{error ? 'Marketplace connection needed' : 'No equipment found'}</h3><p>{error ? 'Check that the backend and MongoDB are running, then try again.' : 'Try another search or add the first equipment listing.'}</p><button className="button button-primary" onClick={error ? loadItems : openAdd}>{error ? <RefreshCw size={17} /> : <Plus size={17} />}{error ? ' Retry connection' : ' Add equipment'}</button></div>}
        </section>

        <section className="how-section" id="how-it-works">
          <div className="center-heading"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>From farm to farmer in <span>3 steps</span></h2><p>Getting the equipment you need can be straightforward.</p></div>
          <div className="steps">
            <article className="step"><span className="step-number">01</span><span className="step-icon"><UserPlus size={22} /></span><h3>Join the community</h3><p>Create an account to access your own equipment listings.</p></article>
            <article className="step"><span className="step-number">02</span><span className="step-icon"><Search size={22} /></span><h3>Find or list tools</h3><p>Search by name or category, or add equipment you want to share.</p></article>
            <article className="step"><span className="step-number">03</span><span className="step-icon"><Sprout size={22} /></span><h3>Grow together</h3><p>Keep equipment details up to date and support your community.</p></article>
          </div>
        </section>

        <section className="crud-note"><div className="crud-note-icon"><CheckCircle2 size={23} /></div><div><b>Built for simple equipment management</b><p>React frontend · Express REST API · MongoDB database · JWT authentication.</p></div><span className="storage-label"><span className="online-dot" /> API-powered</span></section>
      </main>

      <footer><a className="footer-brand" href="#home"><Sprout size={19} /> KrushiShare</a><span>Helping farmers share resources and grow together.</span><span>React · Express · MongoDB</span></footer>

      {authOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false) }}><section className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="modal-header"><div><div className="eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'JOIN THE COMMUNITY'}</div><h2 id="auth-title">{authMode === 'login' ? 'Farmer login' : 'Create your account'}</h2><p>{authMode === 'login' ? 'Log in to manage your equipment listings.' : 'Register to start sharing farm equipment.'}</p></div><button className="close-button" onClick={() => { setAuthOpen(false); setError('') }} aria-label="Close"><X size={20} /></button></div>
        <form onSubmit={submitAuth}><div className="form-grid">
          {authMode === 'register' && <label className="full">Full name *<input name="name" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" minLength="2" maxLength="80" required /></label>}
          <label className="full">Email address *<input name="email" type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required /></label>
          <label className="full">Password *<input name="password" type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} placeholder="At least 8 characters" minLength="8" required /></label>
        </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setAuthOpen(false); setError('') }}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : authMode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}{busy ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Register'}</button></div>
        </form>
        <div className="auth-switch">{authMode === 'login' ? "Don't have an account?" : 'Already registered?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthForm({ name: '', email: authForm.email, password: '' }); setError('') }}>{authMode === 'login' ? 'Register' : 'Login'}</button></div>
      </section></div>}

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="listing-title">
        <div className="modal-header"><div><div className="eyebrow">{editingId ? 'UPDATE LISTING' : 'NEW LISTING'}</div><h2 id="listing-title">{editingId ? 'Edit equipment' : 'Add equipment'}</h2><p>Enter the equipment details below.</p></div><button className="close-button" onClick={() => { setModal(false); setError('') }} aria-label="Close"><X size={20} /></button></div>
        <form onSubmit={handleSubmit}><div className="form-grid">
          <label className="full">Equipment name *<input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Power Sprayer" required maxLength="100" /></label>
          <label>Category<select name="category" value={form.category} onChange={handleChange}>{categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Rental price (₹) *<input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="e.g. 500" required /></label>
          <label>Price unit<select name="unit" value={form.unit} onChange={handleChange}><option value="day">per day</option><option value="hour">per hour</option><option value="week">per week</option></select></label>
          <label>Location *<input name="location" value={form.location} onChange={handleChange} placeholder="Village, District" required maxLength="120" /></label>
          <label>Owner / Farmer name *<input name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Your name" required maxLength="80" /></label>
          <label>Phone number<input name="phone" value={form.phone} onChange={handleChange} placeholder="Contact number" inputMode="tel" maxLength="25" /></label>
          <label className="full">Description<textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the equipment and its condition..." rows="3" maxLength="600" /></label>
        </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => { setModal(false); setError('') }}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}{busy ? 'Saving...' : editingId ? 'Save changes' : 'Add listing'}</button></div>
        </form>
      </section></div>}
    </div>
  )
}
