import { useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ChefHat, Clock3, Flame, Heart, LogOut, Mail, Menu, Search, Settings, Sparkles, UserRound, X } from 'lucide-react'
import { auth, db } from './firebase'
import { createMenu, createRecipe, createUserProfile, deleteMenu, deleteRecipe, getMenus, getPendingRecipes, getRecipes, getSiteContent, getUserProfile, saveSiteContent, saveUserFavorites, subscribeToNewsletter, updateRecipe } from './firestore'

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
  const isContributor = profile?.role === 'contributor'
  const availableRecipes = createdRecipes.filter((recipe) => isAdmin || recipe.status !== 'pending')

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (!currentUser || !db) {
        setProfile(null)
        return
      }
      const currentProfile = await getUserProfile(currentUser.uid).catch(() => null)
      if (!currentProfile) await createUserProfile(currentUser).catch((error) => console.error('Unable to create user profile:', error))
      setProfile(currentProfile)
      const storedFavorites = JSON.parse(localStorage.getItem('kkooks-favorites') || '[]')
      const syncedFavorites = [...new Set([...(currentProfile?.favorites || []), ...storedFavorites])]
      setFavorites(syncedFavorites)
      await saveUserFavorites(currentUser.uid, syncedFavorites).catch((error) => console.error('Unable to sync favorites:', error))
      setMenus(await getMenus(currentUser.uid).catch((error) => {
        console.error('Unable to load menus:', error)
        return []
      }))
    })
  }, [])

  useEffect(() => localStorage.setItem('kkooks-favorites', JSON.stringify(favorites)), [favorites])

  const toggleFavorite = (recipeId) => setFavorites((current) => {
    const next = current.includes(recipeId) ? current.filter((item) => item !== recipeId) : [...current, recipeId]
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
  const displayedRecipes = useMemo(() => availableRecipes.filter((recipe) => {
    const matchesFilter = filter === 'All' || recipe.mood === filter
    const query = (page === 'recipes' ? search : heroSearch).toLowerCase()
    return matchesFilter && (!query || `${recipe.title} ${recipe.chef} ${recipe.mood}`.toLowerCase().includes(query))
  }), [availableRecipes, filter, heroSearch, page, search])

  if (page === 'recipes') return <RecipesPage recipes={availableRecipes} search={search} setSearch={setSearch} onHome={() => go('home')} onCreate={() => go('create')} onNavigate={go} user={user} favorites={favorites} onFavorite={toggleFavorite} />
  if (page === 'shop') return <ShopPage onNavigate={go} />
  if (page === 'create') return <CreateRecipePage user={user} contributor={isContributor} onCancel={() => go('recipes')} onSave={(recipe) => { setCreatedRecipes((current) => [recipe, ...current]); go('recipes') }} />
  if (page === 'favorites') return <FavoritesPage favorites={favorites} recipes={availableRecipes} onHome={() => go('home')} onNavigate={go} onFavorite={toggleFavorite} />
  if (page === 'menus') return <MenusPage menus={menus} setMenus={setMenus} recipes={availableRecipes} user={user} onHome={() => go('home')} onCreate={() => go('create')} onNavigate={go} />
  if (page === 'admin') return isAdmin ? <AdminPage recipes={createdRecipes} setRecipes={setCreatedRecipes} content={siteContent} setContent={setSiteContent} user={user} onHome={() => go('home')} /> : <ComingSoonPage title="Admin access required." text="Sign in with an approved administrator account to manage KKooks content." action="Go to account" onAction={() => go('account')} onHome={() => go('home')} />
  if (page === 'account') return <AccountPage mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} error={authError} setError={setAuthError} user={user} onHome={() => go('home')} />

  return (
    <div className="site-shell">
      {notice && <div className="action-notice" role="status">{notice}</div>}
      <Header page={page} onNavigate={go} user={user} isAdmin={isAdmin} onSignOut={() => signOut(auth)} favorites={favorites.length} brand={siteContent.brand} />
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="eyebrow"><Sparkles size={15} aria-hidden="true" /> KOSHER COOKING, REIMAGINED</div>
          <h1>{siteContent.heroLead}<br /><span>{siteContent.heroAccent}</span></h1>
          <p>{siteContent.heroDescription}</p>
          <form className="hero-search" onSubmit={(event) => { event.preventDefault(); go('recipes') }}>
            <Search size={22} aria-hidden="true" /><input aria-label="Search 5,000+ recipes" value={heroSearch} onChange={(event) => setHeroSearch(event.target.value)} placeholder="Search 5,000+ recipes" /><button type="submit">Search</button>
          </form>
          <div className="hero-traits"><span><Flame size={16} aria-hidden="true" /> Trending now</span><span><Clock3 size={16} aria-hidden="true" /> 30-min meals</span><span><ChefHat size={16} aria-hidden="true" /> Chef-tested</span></div>
        </section>

        <section className="content-section">
          <div className="section-heading"><div><span className="eyebrow">Your kitchen starts here</span><h2>Find your next favorite.</h2><p>Browse recipes, save the ones you love, and build a menu around them.</p></div><button type="button" onClick={() => go('recipes')}>Browse all <span aria-hidden="true">→</span></button></div>
          {displayedRecipes.length ? <div className="recipe-grid">{displayedRecipes.slice(0, 5).map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onFavorite={() => toggleFavorite(recipe.id)} />)}</div> : <p className="empty-state">No recipes published yet. An admin can import or publish the first recipe.</p>}
        </section>

        <section className="make-section"><div><h2>Make KKooks yours</h2><p>Save favorites, build menus, and share your own recipes with the community.</p></div><div className="make-grid"><button type="button" onClick={() => go('create')}><span><ChefHat size={26} aria-hidden="true" /></span><h3>Upload your recipes</h3><p>Keep family favorites in one place — private or published to inspire others.</p></button><button type="button" onClick={() => go('menus')}><span><Menu size={26} aria-hidden="true" /></span><h3>Plan your menus</h3><p>Design personalized meal menus for Shabbat, holidays, or everyday planning.</p></button></div></section>

        <section className="newsletter"><span className="eyebrow"><Mail size={15} aria-hidden="true" /> NEWSLETTER</span><h2>Tasty recipes, straight to your inbox</h2><p>Get our newest recipes, tips, and picks — no spam, just good food.</p><form onSubmit={async (event) => { event.preventDefault(); try { if (db) await subscribeToNewsletter(newsletter); setNewsletterStatus('You are on the list.') } catch (error) { setNewsletterStatus(error.message) } }}><input type="email" aria-label="Your email" placeholder="Your email" value={newsletter} onChange={(event) => setNewsletter(event.target.value)} required /><button type="submit">Subscribe</button></form>{newsletterStatus && <small>{newsletterStatus}</small>}</section>
      </main>
      <Footer onNavigate={go} />
    </div>
  )
}

function Header({ onNavigate, user, isAdmin, onSignOut, favorites, brand = 'KKooks' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [['Recipes', 'recipes'], ['Menus', 'menus'], ['Shop', 'shop']]
  const navigate = (target) => { setMenuOpen(false); onNavigate(target) }
  return <header className="site-header"><div className="header-main"><button className="logo" type="button" onClick={() => navigate('home')}><span><ChefHat size={25} aria-hidden="true" /></span>{brand}</button><form className="header-search" onSubmit={(event) => { event.preventDefault(); navigate('recipes') }}><Search size={22} aria-hidden="true" /><input aria-label="Search KKooks" placeholder="Search KKooks" /></form><div className="header-actions"><button type="button" title="Favorites" aria-label="Favorites" onClick={() => navigate('favorites')}><Heart size={23} aria-hidden="true" /><b>{favorites || ''}</b></button>{isAdmin && <button type="button" title="Admin" aria-label="Admin" onClick={() => navigate('admin')}><Settings size={22} aria-hidden="true" /> <span className="action-label">Admin</span></button>}{user ? <button type="button" title="Log out" aria-label="Log out" onClick={onSignOut}><LogOut size={22} aria-hidden="true" /> <span className="action-label">Log out</span></button> : <button type="button" title="Account" aria-label="Account" onClick={() => navigate('account')}><UserRound size={22} aria-hidden="true" /> <span className="action-label">Account</span></button>}<button className="menu-toggle" type="button" title={menuOpen ? 'Close menu' : 'Open menu'} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}</button></div></div><nav className={menuOpen ? 'open' : ''}>{links.map(([label, target]) => <button type="button" key={label} onClick={() => navigate(target)}>{label}</button>)}</nav></header>
}

function SectionHeading({ eyebrow, title, description, action, onAction }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <button type="button" onClick={onAction}>{action} <span>→</span></button>}</div> }
function RecipeCard({ recipe, favorite, onFavorite }) { return <article className="recipe-card"><div className="image-wrap"><img src={recipe.image} alt={recipe.title} /><button type="button" aria-label={favorite ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title} to favorites`} title={favorite ? 'Remove from favorites' : 'Save to favorites'} onClick={onFavorite}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" /></button></div><span className="card-kicker">{recipe.mood}</span><h3>{recipe.title}</h3><p><ChefHat size={14} aria-hidden="true" /> {recipe.chef}</p>{recipe.description && <p className="recipe-description">{recipe.description}</p>}{recipe.ingredients?.length || recipe.instructions?.length || recipe.notes?.length ? <details className="recipe-details"><summary>View full recipe</summary>{recipe.ingredients?.length ? <section><h4>Ingredients</h4><ul>{recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul></section> : null}{recipe.instructions?.length ? <section><h4>Instructions</h4><ol>{recipe.instructions.map((step) => <li key={step.text}>{step.text}{step.substeps?.length ? <ol type="a">{step.substeps.map((substep) => <li key={substep}>{substep}</li>)}</ol> : null}</li>)}</ol></section> : null}{recipe.notes?.length ? <section><h4>Notes</h4><ul>{recipe.notes.map((note, index) => <li key={`${note.heading}-${index}`}><strong>{note.heading}</strong><p>{note.text}</p></li>)}</ul></section> : null}</details> : null}{recipe.sourceUrl && <a className="recipe-source" href={recipe.sourceUrl} target="_blank" rel="noreferrer">View original source</a>}</article> }
function RecipeRow({ recipe, number, favorite, onFavorite }) { return <article className="recipe-row"><strong>{String(number).padStart(2, '0')}</strong><img src={recipe.image} alt="" /><div><h3>{recipe.title}</h3><p><ChefHat size={14} aria-hidden="true" /> {recipe.chef}</p></div><button type="button" aria-label={favorite ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title} to favorites`} title={favorite ? 'Remove from favorites' : 'Save to favorites'} onClick={onFavorite}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" /></button></article> }
function RecipesPage({ recipes: userRecipes, search, setSearch, onHome, onCreate, onNavigate, user, favorites, onFavorite }) { const shown = userRecipes.filter((recipe) => `${recipe.title} ${recipe.chef} ${recipe.mood}`.toLowerCase().includes(search.toLowerCase())); return <div className="site-shell"><Header onNavigate={onNavigate} user={user} favorites={favorites.length} onSignOut={() => signOut(auth)} /><main className="recipes-page"><div className="recipes-heading"><span className="eyebrow">The collection</span><h1>Your recipe collection.</h1><p>Recipes you publish or save will appear here.</p><div className="recipe-search"><Search size={22} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes" /></div><button className="primary-button create-button" type="button" onClick={onCreate}>Create a recipe</button></div>{shown.length ? <div className="recipe-grid user-recipe-grid">{shown.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite={favorites.includes(recipe.id)} onFavorite={() => onFavorite(recipe.id)} />)}</div> : <p className="empty-state">No recipes published yet. Create your first recipe to start your collection.</p>}</main><Footer onNavigate={onNavigate} /></div> }
function ShopPage({ onNavigate }) { return <div className="site-shell"><Header onNavigate={onNavigate} favorites={0} /><main className="recipes-page"><div className="recipes-heading"><span className="eyebrow">Shop</span><h1>Shoppables are coming soon.</h1><p>Your kitchen favorites will appear here.</p></div></main><Footer onNavigate={onNavigate} /></div> }
function CreateRecipePage({ user, contributor, onCancel, onSave }) {
  const submit = async (recipe) => {
    if (contributor) {
      const pendingRecipe = { ...recipe, status: 'pending' }
      if (user && db) pendingRecipe.id = await createRecipe(pendingRecipe, user.uid)
      onSave(pendingRecipe)
      return
    }
    onSave(recipe)
  }
  return <LegacyCreateRecipePage onCancel={onCancel} onSave={submit} contributor={contributor} />
}

function parseInstructions(value) {
  const steps = []
  value.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const substep = line.match(/^[a-z]\)\s*(.+)$/i)
    if (substep && steps.length) steps[steps.length - 1].substeps.push(substep[1])
    else steps.push({ text: line.replace(/^\d+[.)]\s*/, ''), substeps: [] })
  })
  return steps
}

function parseNotes(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const note = line.match(/^([^:]+):\s*(.+)$/)
    return { heading: note ? note[1].trim() : 'Note', text: note ? note[2].trim() : line }
  })
}

function LocalCreateRecipePage({ onCancel, onSave, contributor }) {
  const [tab, setTab] = useState('details')
  const [form, setForm] = useState({ title: '', chef: 'My kitchen', mood: 'Weeknight', description: '', image: '', ingredientsText: '', instructionsText: '', notesText: '' })
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = (event) => {
    event.preventDefault()
    onSave({ title: form.title.trim(), chef: form.chef.trim() || 'My kitchen', mood: form.mood, description: form.description.trim(), image: form.image.trim() || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85', ingredients: form.ingredientsText.split('\n').map((item) => item.trim()).filter(Boolean), instructions: parseInstructions(form.instructionsText), notes: parseNotes(form.notesText), id: `recipe-${Date.now()}` })
  }
  return <div className="site-shell"><main className="create-page"><button className="logo" type="button" onClick={onCancel}><span><ChefHat size={22} aria-hidden="true" /></span>KKooks</button><section className="create-card"><span className="eyebrow">Your kitchen</span><h1>{contributor ? 'Submit a recipe.' : 'Share a recipe.'}</h1><p>{contributor ? 'Your recipe will be reviewed by an admin before it is published.' : 'Add a complete recipe for the community.'}</p><form onSubmit={submit}><div className="recipe-editor-tabs"><button className={tab === 'details' ? 'active' : ''} type="button" onClick={() => setTab('details')}>Details</button><button className={tab === 'ingredients' ? 'active' : ''} type="button" onClick={() => setTab('ingredients')}>Ingredients</button><button className={tab === 'instructions' ? 'active' : ''} type="button" onClick={() => setTab('instructions')}>Instructions</button><button className={tab === 'notes' ? 'active' : ''} type="button" onClick={() => setTab('notes')}>Notes</button></div>{tab === 'details' && <div className="recipe-editor-panel"><label>Recipe name<input required value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Sunday roast" /></label><label>By<input value={form.chef} onChange={(event) => update('chef', event.target.value)} /></label><label>Category<select value={form.mood} onChange={(event) => update('mood', event.target.value)}><option>Weeknight</option><option>Shabbat</option><option>Holiday</option><option>Dairy</option><option>Salads</option><option>Desserts</option></select></label><label>Image URL<input type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="Optional image URL" /></label><label>Description<textarea rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Short introduction" /></label></div>}{tab === 'ingredients' && <div className="recipe-editor-panel"><label>Ingredients<textarea rows="12" value={form.ingredientsText} onChange={(event) => update('ingredientsText', event.target.value)} placeholder={'2 cups flour\n1 tsp salt\n3 eggs'} required /></label><small>Enter one ingredient per line. They will display as bullet points.</small></div>}{tab === 'instructions' && <div className="recipe-editor-panel"><label>Instructions<textarea rows="12" value={form.instructionsText} onChange={(event) => update('instructionsText', event.target.value)} placeholder={'Mix the dry ingredients.\na) Sift the flour.\nb) Add the salt.\nBake until golden.'} required /></label><small>Use one numbered step per line. Start substeps with a), b), and so on.</small></div>}{tab === 'notes' && <div className="recipe-editor-panel"><label>Notes<textarea rows="12" value={form.notesText} onChange={(event) => update('notesText', event.target.value)} placeholder={'Make ahead: Prepare up to one day early.\nServing: Serve warm.'} /></label><small>Use <strong>Bold heading: text</strong> on each line. Notes display as bold headers with bulleted paragraphs.</small></div>}<div className="form-buttons"><button className="primary-button" type="submit">{contributor ? 'Submit for review' : 'Publish recipe'}</button><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button></div></form></section></main></div>
}
function FavoritesPage({ favorites, recipes: userRecipes, onHome, onNavigate, onFavorite }) { const saved = userRecipes.filter((recipe) => favorites.includes(recipe.id)); return <div className="site-shell"><main className="recipes-page"><button className="logo" type="button" onClick={onHome}><span><ChefHat size={22} aria-hidden="true" /></span>KKooks</button><div className="recipes-heading"><span className="eyebrow">Saved by you</span><h1>Favorites.</h1><p>{saved.length ? `${saved.length} saved recipe${saved.length === 1 ? '' : 's'}.` : 'Your saved recipes will appear here.'}</p></div>{saved.length ? <div className="recipe-grid">{saved.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} favorite onFavorite={() => onFavorite(recipe.id)} />)}</div> : <p className="empty-state">Nothing saved yet. Browse recipes and tap the heart to save one.</p>}</main><Footer onNavigate={onNavigate} /></div> }
function MenusPage({ menus, setMenus, recipes, user, onHome, onCreate, onNavigate }) {
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
  return <div className="site-shell"><main className="recipes-page"><button className="logo" type="button" onClick={onHome}><span><ChefHat size={22} aria-hidden="true" /></span>KKooks</button><div className="recipes-heading"><span className="eyebrow">Plan ahead</span><h1>Build your menus.</h1><p>Group recipes for Shabbat, holidays, or the week ahead.</p></div><form className="menu-form" onSubmit={saveMenu}><label>Menu name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Friday night dinner" required /></label><div className="menu-picker">{recipes.length ? recipes.map((recipe) => <label key={recipe.id} className="menu-option"><input type="checkbox" checked={selectedRecipes.includes(recipe.title)} onChange={() => toggleRecipe(recipe.title)} />{recipe.title}</label>) : <p className="empty-state">Create a recipe before adding it to a menu.</p>}</div><div className="form-buttons"><button className="primary-button" type="submit">Save menu</button><button className="secondary-button" type="button" onClick={onCreate}>Create recipe</button></div></form><div className="menu-list">{menus.map((menu) => <article key={menu.id}><h3>{menu.name}</h3><p>{menu.recipes.length ? menu.recipes.join(' · ') : 'No recipes added yet.'}</p><button className="text-button danger" type="button" onClick={async () => { if (user && db && !menu.id.startsWith('menu-')) await deleteMenu(menu.id); setMenus((current) => current.filter((item) => item.id !== menu.id)) }}>Delete</button></article>)}</div></main><Footer onNavigate={onNavigate} /></div>
}
function ComingSoonPage({ title, text, action, onAction, onHome }) { return <div className="site-shell"><main className="recipes-page coming-page"><button className="logo" type="button" onClick={onHome}><span><ChefHat size={22} aria-hidden="true" /></span>KKooks</button><div className="recipes-heading"><span className="eyebrow">Coming soon</span><h1>{title}</h1><p>{text}</p><button className="primary-button" type="button" onClick={onAction}>{action}</button></div></main><Footer onNavigate={onHome} /></div> }
function ImportRecipePanel({ setRecipes, user }) {
  const [form, setForm] = useState({ sourceUrl: '', title: '', chef: '', mood: 'Weeknight', image: '', description: '' })
  const [status, setStatus] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    let source
    try {
      source = new URL(form.sourceUrl)
    } catch {
      setStatus('Enter a valid recipe URL from kosher.com or kosherkitchenai.com.')
      return
    }
    const host = source.hostname.toLowerCase().replace(/^www\./, '')
    if (!['kosher.com', 'kosherkitchenai.com'].includes(host)) {
      setStatus('Only kosher.com and kosherkitchenai.com recipe URLs are supported.')
      return
    }
    if (!form.title.trim()) {
      setStatus('Add a recipe title before importing.')
      return
    }
    const importedRecipe = { ...form, title: form.title.trim(), chef: form.chef.trim() || 'Source recipe', sourceUrl: source.toString(), sourceName: host, imported: true, id: `recipe-${Date.now()}`, image: form.image.trim() || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85' }
    try {
      if (db) importedRecipe.id = await createRecipe(importedRecipe, user.uid)
      setRecipes((current) => [importedRecipe, ...current])
      setForm({ sourceUrl: '', title: '', chef: '', mood: 'Weeknight', image: '', description: '' })
      setStatus('Recipe imported and published with source attribution.')
    } catch (error) {
      setStatus(error.message)
    }
  }
  return <section className="admin-import-panel"><span className="eyebrow">Source import</span><h2>Import a recipe.</h2><p>Bring in recipe metadata from an approved source and keep the original attribution visible.</p><form className="admin-form" onSubmit={submit}><label>Recipe URL<input type="url" required value={form.sourceUrl} onChange={(event) => update('sourceUrl', event.target.value)} placeholder="https://www.kosher.com/recipe/..." /></label><label>Recipe title<input required value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Recipe title" /></label><label>Chef or source author<input value={form.chef} onChange={(event) => update('chef', event.target.value)} placeholder="Author name" /></label><label>Category<select value={form.mood} onChange={(event) => update('mood', event.target.value)}><option>Weeknight</option><option>Shabbat</option><option>Holiday</option><option>Dairy</option><option>Salads</option><option>Desserts</option></select></label><label>Image URL<input type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="Optional image URL" /></label><label>Description<textarea rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Short description you have permission to publish" /></label><button className="primary-button" type="submit">Import recipe</button></form>{status && <p className="admin-status" role="status">{status}</p>}<small className="import-note">Use only content you have permission to republish. The original source URL is stored with the recipe.</small></section>
}

function AdminPage(props) {
  return <><RecipeAdminPage {...props} /><AdminReviewPanel setRecipes={props.setRecipes} user={props.user} /><ImportRecipePanel setRecipes={props.setRecipes} user={props.user} /></>
}

function AdminReviewPanel({ setRecipes, user }) {
  const [pendingRecipes, setPendingRecipes] = useState([])
  const [status, setStatus] = useState('')
  useEffect(() => {
    if (!db) return
    getPendingRecipes().then(setPendingRecipes).catch((error) => setStatus(error.message))
  }, [])
  const approve = async (recipe) => {
    try {
      await updateRecipe(recipe.id, { status: 'published', approvedBy: user.uid })
      setPendingRecipes((current) => current.filter((item) => item.id !== recipe.id))
      setRecipes((current) => [{ ...recipe, status: 'published', approvedBy: user.uid }, ...current])
      setStatus('Recipe approved and published.')
    } catch (error) {
      setStatus(error.message)
    }
  }
  const reject = async (recipe) => {
    try {
      await deleteRecipe(recipe.id)
      setPendingRecipes((current) => current.filter((item) => item.id !== recipe.id))
      setStatus('Pending recipe deleted.')
    } catch (error) {
      setStatus(error.message)
    }
  }
  return <section className="admin-review-panel"><span className="eyebrow">Review queue</span><h2>Contributor submissions.</h2>{pendingRecipes.length ? pendingRecipes.map((recipe) => <article key={recipe.id}><div><h3>{recipe.title}</h3><p>{recipe.chef} · {recipe.mood}</p>{recipe.description && <p>{recipe.description}</p>}</div><div className="form-buttons"><button className="primary-button" type="button" onClick={() => approve(recipe)}>Approve</button><button className="secondary-button" type="button" onClick={() => reject(recipe)}>Delete</button></div></article>) : <p className="empty-state">No contributor recipes are waiting for review.</p>}{status && <p className="admin-status" role="status">{status}</p>}</section>
}

function RecipeAdminPage({ recipes: userRecipes, setRecipes, content, setContent, user, onHome }) {
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
function Footer({ onNavigate }) { return <footer><div className="footer-brand"><button className="logo" type="button" onClick={() => onNavigate('home')}><span><ChefHat size={22} aria-hidden="true" /></span>KKooks</button><h3>Get our app</h3><div className="app-links"><a href="https://apps.apple.com" target="_blank" rel="noreferrer">Download on the App Store</a><a href="https://play.google.com" target="_blank" rel="noreferrer">Get it on Google Play</a></div><h3>Follow us on social media</h3><div className="socials"><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></div></div><div><h4>Explore</h4><button type="button" onClick={() => onNavigate('recipes')}>Recipes</button><button type="button" onClick={() => onNavigate('menus')}>Menus</button><button type="button" onClick={() => onNavigate('shop')}>Shop</button><button type="button" onClick={() => onNavigate('favorites')}>Favorites</button></div><div><h4>Account</h4><button type="button" onClick={() => onNavigate('account')}>Account</button><button type="button" onClick={() => onNavigate('create')}>Create a recipe</button><button type="button" onClick={() => onNavigate('menus')}>Plan menus</button></div><small className="copyright">© 2025 KKooks. Cook something good.</small></footer> }

export default App
