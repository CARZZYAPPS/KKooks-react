import { useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from './firebase'
import { createMenu, createRecipe, deleteRecipe, getRecipes, getSiteContent, getUserProfile, saveSiteContent, saveUserFavorites, subscribeToNewsletter } from './firestore'

const recipes = [
  { title: 'Bakoola', chef: 'Zineb Hattab', mood: 'Holiday', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85' },
  { title: 'Gem Lettuce Hearts with Mandarin and Poppy Seeds', chef: 'Zineb Hattab', mood: 'Salads', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85' },
  { title: 'Roasted Tomato and Leek Couscous', chef: 'Miriam (Pascal) Cohen', mood: 'Weeknight', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85' },
  { title: 'Razzle Bundt', chef: 'Miriam (Pascal) Cohen', mood: 'Desserts', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85' },
  { title: 'Cookie Dough Swirled Fudge Bundt Cake', chef: 'Esty Wolbe', mood: 'Desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85' }
]

const chefs = [
  ['Esty Wolbe', 'Home-style classics', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=85'],
  ['Yussi Weisz', 'Holiday mains', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=85'],
  ['Miriam Cohen', 'Baking & desserts', 'https://images.unsplash.com/photo-1556911073-52527ac43761?auto=format&fit=crop&w=500&q=85'],
  ['Elizabeth Kurtz', 'Weeknight dinners', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=85']
]

const products = [
  ['Elegant Brown Paper Baking Loaf Pans 10 Pk', '$25.99', 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=85', 'https://www.amazon.com/dp/B08RPCY8BL'],
  ['The Challah Bowl with Lid', '$34.99', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=85', 'https://www.amazon.com/dp/B0CN3QMSNB'],
  ['Classic Red Microplane', '$15.95', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=85', 'https://www.amazon.com/dp/B001C2FEGA'],
  ['Mueller 6qt Enameled Cast Iron Dutch Oven', '$52.97', 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=85', 'https://www.amazon.com/dp/B0B4Q1S93K']
]

const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)

function App() {
  const [page, setPage] = useState('home')
  const [createdRecipes, setCreatedRecipes] = useState(() => JSON.parse(localStorage.getItem('kkooks-created-recipes') || '[]'))
  const [menus, setMenus] = useState(() => JSON.parse(localStorage.getItem('kkooks-menus') || '[]'))
  const [siteContent, setSiteContent] = useState(() => JSON.parse(localStorage.getItem('kkooks-site-content') || '{"brand":"KKooks","heroLead":"Cook kosher.","heroAccent":"Boldly.","heroDescription":"Fresh recipes, smart menus, and a community of home chefs — all in one dark, delicious place."}'))
  const [search, setSearch] = useState('')
  const [heroSearch, setHeroSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('kkooks-favorites') || '[]'))
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [newsletter, setNewsletter] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')
  const [notice, setNotice] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const isAdmin = Boolean(user?.email && profile?.role === 'admin' && (!adminEmails.length || adminEmails.includes(user.email.toLowerCase())))

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser && db) setProfile(await getUserProfile(currentUser.uid).catch(() => null))
      else setProfile(null)
    })
  }, [])

  useEffect(() => localStorage.setItem('kkooks-favorites', JSON.stringify(favorites)), [favorites])

  const toggleFavorite = (title) => setFavorites((current) => {
    const next = current.includes(title) ? current.filter((item) => item !== title) : [...current, title]
    if (user && db) saveUserFavorites(user.uid, next).catch((error) => console.error('Unable to save favorites:', error))
    return next
  })
  const go = (nextPage) => {
    const validPages = ['home', 'recipes', 'shop', 'account', 'create', 'favorites', 'menus', 'admin']
    if (!validPages.includes(nextPage)) {
      setNotice(`${nextPage || 'This section'} is coming soon.`)
      window.setTimeout(() => setNotice(''), 2400)
      return
    }
    setPage(nextPage)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  useEffect(() => localStorage.setItem('kkooks-created-recipes', JSON.stringify(createdRecipes)), [createdRecipes])
  useEffect(() => localStorage.setItem('kkooks-menus', JSON.stringify(menus)), [menus])
  useEffect(() => localStorage.setItem('kkooks-site-content', JSON.stringify(siteContent)), [siteContent])
  useEffect(() => {
    if (!db) return
    getSiteContent().then((content) => {
      if (content) setSiteContent((current) => ({ ...current, ...content }))
    }).catch((error) => console.error('Unable to load admin content:', error))
  }, [])
  useEffect(() => {
    if (!db) return
    getRecipes().then(setCreatedRecipes).catch((error) => console.error('Unable to load published recipes:', error))
  }, [])
  const displayedRecipes = useMemo(() => recipes.filter((recipe) => {
    const matchesFilter = filter === 'All' || recipe.mood === filter
    const query = (page === 'recipes' ? search : heroSearch).toLowerCase()
    return matchesFilter && (!query || `${recipe.title} ${recipe.chef} ${recipe.mood}`.toLowerCase().includes(query))
  }), [filter, heroSearch, page, search])

  if (page === 'recipes') return <RecipesPage recipes={createdRecipes} search={search} setSearch={setSearch} onHome={() => go('home')} onAccount={() => go('account')} onCreate={() => go('create')} user={user} favorites={favorites} />
  if (page === 'shop') return <ShopPage onHome={() => go('home')} onAccount={() => go('account')} />
  if (page === 'create') return <CreateRecipePage onCancel={() => go('recipes')} onSave={(recipe) => { setCreatedRecipes((current) => [recipe, ...current]); go('recipes') }} />
  if (page === 'favorites') return <FavoritesPage favorites={favorites} recipes={createdRecipes} onHome={() => go('home')} />
  if (page === 'menus') return <MenusPage menus={menus} setMenus={setMenus} recipes={createdRecipes} user={user} onHome={() => go('home')} onCreate={() => go('create')} />
  if (page === 'admin') return isAdmin ? <AdminPage recipes={createdRecipes} setRecipes={setCreatedRecipes} content={siteContent} setContent={setSiteContent} user={user} onHome={() => go('home')} /> : <ComingSoonPage title="Admin access required." text="Sign in with an approved administrator account to manage KKooks content." action="Go to account" onAction={() => go('account')} onHome={() => go('home')} />
  if (page === 'account') return <AccountPage mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} error={authError} setError={setAuthError} user={user} onHome={() => go('home')} />

  return (
    <div className="site-shell">
      {notice && <div className="action-notice" role="status">{notice}</div>}
      <Header page={page} onNavigate={go} user={user} isAdmin={isAdmin} onSignOut={() => signOut(auth)} favorites={favorites.length} brand={siteContent.brand} />
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="eyebrow">✧ KOSHER COOKING, REIMAGINED</div>
          <h1>{siteContent.heroLead}<br /><span>{siteContent.heroAccent}</span></h1>
          <p>{siteContent.heroDescription}</p>
          <form className="hero-search" onSubmit={(event) => { event.preventDefault(); go('recipes') }}>
            <span>⌕</span><input aria-label="Search 5,000+ recipes" value={heroSearch} onChange={(event) => setHeroSearch(event.target.value)} placeholder="Search 5,000+ recipes" /><button type="submit">Search</button>
          </form>
          <div className="hero-traits"><span>♨ Trending now</span><span>◷ 30-min meals</span><span>♧ Chef-tested</span></div>
        </section>

        <section className="empty-listing content-section">
          <span className="eyebrow">Your kitchen starts here</span>
          <h2>No recipes published yet.</h2>
          <p>Search and saved recipes will appear here when your collection is ready.</p>
          <button className="secondary-button" type="button" onClick={() => go('recipes')}>Browse recipes</button>
        </section>

        <section className="make-section"><div><h2>Make KKooks yours</h2><p>Save favorites, build menus, and share your own recipes with the community.</p></div><div className="make-grid"><button type="button" onClick={() => go('create')}><span>♨</span><h3>Upload your recipes</h3><p>Keep family favorites in one place — private or published to inspire others.</p></button><button type="button" onClick={() => go('menus')}><span>▦</span><h3>Plan your menus</h3><p>Design personalized meal menus for Shabbat, holidays, or everyday planning.</p></button></div></section>

        <section className="newsletter"><span className="eyebrow">✉ NEWSLETTER</span><h2>Tasty recipes, straight to your inbox</h2><p>Get our newest recipes, tips, and picks — no spam, just good food.</p><form onSubmit={async (event) => { event.preventDefault(); try { if (db) await subscribeToNewsletter(newsletter); setNewsletterStatus('You are on the list.') } catch (error) { setNewsletterStatus(error.message) } }}><input type="email" aria-label="Your email" placeholder="Your email" value={newsletter} onChange={(event) => setNewsletter(event.target.value)} required /><button type="submit">Subscribe</button></form>{newsletterStatus && <small>{newsletterStatus}</small>}</section>
      </main>
      <Footer onNavigate={go} />
    </div>
  )
}

function Header({ onNavigate, user, isAdmin, onSignOut, favorites, brand = 'KKooks' }) {
  const links = [['Recipes', 'recipes'], ['Menus', 'menus'], ['Shows', 'home'], ['Kitchen & Living', 'home'], ['Holidays', 'recipes'], ['Kids', 'home'], ['Shoppables', 'shop']]
  return <header className="site-header"><div className="header-main"><button className="logo" type="button" onClick={() => onNavigate('home')}><span>♨</span>{brand}</button><form className="header-search" onSubmit={(event) => { event.preventDefault(); onNavigate('recipes') }}><span>⌕</span><input aria-label="Search KKooks" placeholder="Search KKooks" /></form><div className="header-actions"><button type="button" title="Favorites" onClick={() => onNavigate('favorites')}>♡<b>{favorites || ''}</b></button>{isAdmin && <button type="button" title="Admin" onClick={() => onNavigate('admin')}>⚙</button>}{user ? <button type="button" title="Log out" onClick={onSignOut}>⇥</button> : <button type="button" title="Account" onClick={() => onNavigate('account')}>♙</button>}</div></div><nav>{links.map(([label, target]) => <button type="button" key={label} onClick={() => onNavigate(target)}>{label}</button>)}</nav></header>
}

function SectionHeading({ eyebrow, title, description, action, onAction }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <button type="button" onClick={onAction}>{action} <span>→</span></button>}</div> }
function RecipeCard({ recipe, favorite, onFavorite }) { return <article className="recipe-card"><div className="image-wrap"><img src={recipe.image} alt={recipe.title} /><button type="button" onClick={onFavorite}>{favorite ? '♥' : '♡'}</button></div><span className="card-kicker">{recipe.mood}</span><h3>{recipe.title}</h3><p>♧ {recipe.chef}</p></article> }
function RecipeRow({ recipe, number, favorite, onFavorite }) { return <article className="recipe-row"><strong>{String(number).padStart(2, '0')}</strong><img src={recipe.image} alt="" /><div><h3>{recipe.title}</h3><p>♧ {recipe.chef}</p></div><button type="button" onClick={onFavorite}>{favorite ? '♥' : '♡'}</button></article> }
function RecipesPage({ recipes: userRecipes, search, setSearch, onHome, onAccount, onCreate, user, favorites }) { const shown = userRecipes.filter((recipe) => `${recipe.title} ${recipe.chef} ${recipe.mood}`.toLowerCase().includes(search.toLowerCase())); return <div className="site-shell"><Header onNavigate={(target) => target === 'home' ? onHome() : target === 'account' ? onAccount() : target === 'recipes' ? null : target === 'create' ? onCreate() : null} user={user} favorites={favorites.length} onSignOut={() => signOut(auth)} /><main className="recipes-page"><div className="recipes-heading"><span className="eyebrow">The collection</span><h1>Your recipe collection.</h1><p>Recipes you publish or save will appear here.</p><div className="recipe-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes" /></div><button className="primary-button create-button" type="button" onClick={onCreate}>Create a recipe</button></div>{shown.length ? <div className="recipe-grid user-recipe-grid">{shown.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.title)} onFavorite={() => {}} />)}</div> : <p className="empty-state">No recipes published yet. Create your first recipe to start your collection.</p>}</main><Footer onNavigate={onHome} /></div> }
function ShopPage({ onHome, onAccount }) { return <div className="site-shell"><Header onNavigate={(target) => target === 'account' ? onAccount() : onHome()} favorites={0} /><main className="recipes-page"><div className="recipes-heading"><span className="eyebrow">Shop</span><h1>Shoppables are coming soon.</h1><p>Your kitchen favorites will appear here.</p></div></main><Footer onNavigate={onHome} /></div> }
function CreateRecipePage({ onCancel, onSave }) { const [form, setForm] = useState({ title: '', chef: 'My kitchen', mood: 'Weeknight', description: '' }); const submit = (event) => { event.preventDefault(); onSave({ ...form, id: `recipe-${Date.now()}`, image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85' }) }; return <div className="site-shell"><main className="create-page"><button className="logo" type="button" onClick={onCancel}><span>♨</span>KKooks</button><section className="create-card"><span className="eyebrow">Your kitchen</span><h1>Share a recipe.</h1><p>Add a family favorite or something you just invented.</p><form onSubmit={submit}><label>Recipe name<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Sunday roast" /></label><label>By<input value={form.chef} onChange={(event) => setForm({ ...form, chef: event.target.value })} /></label><label>Category<select value={form.mood} onChange={(event) => setForm({ ...form, mood: event.target.value })}><option>Weeknight</option><option>Shabbat</option><option>Holiday</option><option>Dairy</option><option>Salads</option><option>Desserts</option></select></label><label>Description<textarea rows="5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What makes this recipe special?" /></label><div className="form-buttons"><button className="primary-button" type="submit">Publish recipe</button><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button></div></form></section></main></div> }
function FavoritesPage({ favorites, recipes: userRecipes, onHome }) { const saved = userRecipes.filter((recipe) => favorites.includes(recipe.title)); return <div className="site-shell"><main className="recipes-page"><button className="logo" type="button" onClick={onHome}><span>♨</span>KKooks</button><div className="recipes-heading"><span className="eyebrow">Saved by you</span><h1>Favorites.</h1><p>{saved.length ? `${saved.length} saved recipe${saved.length === 1 ? '' : 's'}.` : 'Your saved recipes will appear here.'}</p></div>{saved.length ? <div className="recipe-grid">{saved.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite onFavorite={() => {}} />)}</div> : <p className="empty-state">Nothing saved yet. Browse recipes and tap the heart to save one.</p>}</main><Footer onNavigate={onHome} /></div> }
function MenusPage({ menus, setMenus, recipes, user, onHome, onCreate }) {
  const [name, setName] = useState('')
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const toggleRecipe = (title) => setSelectedRecipes((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title])
  const saveMenu = async (event) => {
    event.preventDefault()
    if (!name.trim()) return
    const menu = { id: `menu-${Date.now()}`, name: name.trim(), recipes: selectedRecipes }
    if (user && db) {
      try { menu.id = await createMenu(menu, user.uid) } catch (error) { return }
    }
    setMenus((current) => [menu, ...current])
    setName('')
    setSelectedRecipes([])
  }
  return <div className="site-shell"><main className="recipes-page"><button className="logo" type="button" onClick={onHome}><span>♨</span>KKooks</button><div className="recipes-heading"><span className="eyebrow">Plan ahead</span><h1>Build your menus.</h1><p>Group recipes for Shabbat, holidays, or the week ahead.</p></div><form className="menu-form" onSubmit={saveMenu}><label>Menu name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Friday night dinner" required /></label><div className="menu-picker">{recipes.length ? recipes.map((recipe) => <label key={recipe.id} className="menu-option"><input type="checkbox" checked={selectedRecipes.includes(recipe.title)} onChange={() => toggleRecipe(recipe.title)} />{recipe.title}</label>) : <p className="empty-state">Create a recipe before adding it to a menu.</p>}</div><div className="form-buttons"><button className="primary-button" type="submit">Save menu</button><button className="secondary-button" type="button" onClick={onCreate}>Create recipe</button></div></form><div className="menu-list">{menus.map((menu) => <article key={menu.id}><h3>{menu.name}</h3><p>{menu.recipes.length ? menu.recipes.join(' · ') : 'No recipes added yet.'}</p><button className="text-button danger" type="button" onClick={() => setMenus((current) => current.filter((item) => item.id !== menu.id))}>Delete</button></article>)}</div></main></div>
}
function ComingSoonPage({ title, text, action, onAction, onHome }) { return <div className="site-shell"><main className="recipes-page coming-page"><button className="logo" type="button" onClick={onHome}><span>♨</span>KKooks</button><div className="recipes-heading"><span className="eyebrow">Coming soon</span><h1>{title}</h1><p>{text}</p><button className="primary-button" type="button" onClick={onAction}>{action}</button></div></main><Footer onNavigate={onHome} /></div> }
function AdminPage({ recipes: userRecipes, setRecipes, content, setContent, user, onHome }) {
  const [tab, setTab] = useState('content')
  const [recipe, setRecipe] = useState({ title: '', chef: '', mood: 'Weeknight', description: '' })
  const [status, setStatus] = useState('')
  const updateContent = (field, value) => setContent((current) => ({ ...current, [field]: value }))
  const saveContent = async () => {
    if (db) await saveSiteContent(content, user.uid)
    setStatus('Homepage content saved.')
  }
  const publish = async (event) => {
    event.preventDefault()
    if (!recipe.title.trim()) return
    const nextRecipe = { ...recipe, title: recipe.title.trim(), chef: recipe.chef || 'KKooks kitchen', id: `recipe-${Date.now()}`, image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85' }
    if (db) {
      try {
        nextRecipe.id = await createRecipe(nextRecipe, user.uid)
      } catch (error) {
        setStatus(error.message)
        return
      }
    }
    setRecipes((current) => [nextRecipe, ...current])
    setRecipe({ title: '', chef: '', mood: 'Weeknight', description: '' })
    setStatus('Recipe published.')
  }
  const removeRecipe = async (recipeId) => {
    if (db && !recipeId.startsWith('recipe-')) await deleteRecipe(recipeId)
    setRecipes((current) => current.filter((recipeItem) => recipeItem.id !== recipeId))
    setStatus('Recipe deleted.')
  }
  return <div className="site-shell"><main className="admin-page"><header className="admin-bar"><button className="logo" type="button" onClick={onHome}><span>♨</span>KKooks admin</button><button className="secondary-button" type="button" onClick={onHome}>View site</button></header><section className="admin-workspace"><span className="eyebrow">Private workspace</span><h1>Manage KKooks.</h1><p>Publish content and shape the homepage from one place.</p><div className="admin-tabs"><button className={tab === 'content' ? 'active' : ''} type="button" onClick={() => setTab('content')}>Homepage</button><button className={tab === 'recipes' ? 'active' : ''} type="button" onClick={() => setTab('recipes')}>Recipes</button></div>{tab === 'content' ? <div className="admin-form"><label>Brand<input value={content.brand} onChange={(event) => updateContent('brand', event.target.value)} /></label><label>Hero lead<input value={content.heroLead} onChange={(event) => updateContent('heroLead', event.target.value)} /></label><label>Hero accent<input value={content.heroAccent} onChange={(event) => updateContent('heroAccent', event.target.value)} /></label><label>Hero description<textarea rows="4" value={content.heroDescription} onChange={(event) => updateContent('heroDescription', event.target.value)} /></label><button className="primary-button" type="button" onClick={saveContent}>Save homepage</button></div> : <div className="admin-form"><form onSubmit={publish}><label>Recipe title<input required value={recipe.title} onChange={(event) => setRecipe({ ...recipe, title: event.target.value })} /></label><label>Chef<input value={recipe.chef} onChange={(event) => setRecipe({ ...recipe, chef: event.target.value })} /></label><label>Category<select value={recipe.mood} onChange={(event) => setRecipe({ ...recipe, mood: event.target.value })}><option>Weeknight</option><option>Shabbat</option><option>Holiday</option><option>Dairy</option><option>Salads</option><option>Desserts</option></select></label><label>Description<textarea rows="4" value={recipe.description} onChange={(event) => setRecipe({ ...recipe, description: event.target.value })} /></label><button className="primary-button" type="submit">Publish recipe</button></form><div className="admin-list">{userRecipes.map((item) => <div key={item.id}><span>{item.title}</span><button className="text-button danger" type="button" onClick={() => removeRecipe(item.id)}>Delete</button></div>)}{!userRecipes.length && <p className="empty-state">No recipes published yet.</p>}</div></div>}{status && <p className="admin-status">{status}</p>}</section></main></div>
}
function AccountPage({ mode, setMode, email, setEmail, password, setPassword, error, setError, user, onHome }) {
  const submit = async (event) => {
    event.preventDefault()
    if (!auth) {
      setError('Firebase Authentication is not configured.')
      return
    }
    setError('')
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, email, password)
      else await signInWithEmailAndPassword(auth, email, password)
      onHome()
    } catch (authError) {
      setError(authError.message)
    }
  }

  return <div className="site-shell"><main className="account-page"><button className="logo" type="button" onClick={onHome}><span>♨</span>KKooks</button><section className="account-card"><span className="eyebrow">Your kitchen</span><h1>{mode === 'signup' ? 'Create your account.' : 'Welcome back.'}</h1><p>Save favorites and build your own recipe collection.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" required /></label>{error && <small className="auth-error">{error}</small>}<button className="primary-button" type="submit">{mode === 'signup' ? 'Create account' : 'Log in'}</button></form><button className="account-switch" type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}</button>{user && <button className="secondary-button" type="button" onClick={() => signOut(auth)}>Log out</button>}</section></main></div>
}
function Footer({ onNavigate }) { return <footer><div className="footer-brand"><button className="logo" type="button" onClick={onNavigate}><span>♨</span>KKooks</button><h3>Get our app</h3><div className="app-links"><a href="https://apps.apple.com" target="_blank" rel="noreferrer">Download on the App Store</a><a href="https://play.google.com" target="_blank" rel="noreferrer">Get it on Google Play</a></div><h3>Follow us on social media</h3><div className="socials"><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></div></div><div><h4>Explore</h4><button onClick={() => onNavigate('recipes')}>Recipes</button><button onClick={onNavigate}>Menus</button><button onClick={onNavigate}>Shows</button><button onClick={onNavigate}>Lifestyle</button><button onClick={onNavigate}>Kids</button></div><div><h4>Company</h4><button onClick={onNavigate}>About KKooks</button><button onClick={onNavigate}>Contact</button><button onClick={onNavigate}>Partner with us</button><button onClick={onNavigate}>Privacy</button></div><div><h4>Legal</h4><button onClick={onNavigate}>Terms of use</button><button onClick={onNavigate}>Cookie policy</button><button onClick={onNavigate}>Accessibility</button></div><small className="copyright">© 2025 KKooks. Cook something good.</small></footer> }

export default App
