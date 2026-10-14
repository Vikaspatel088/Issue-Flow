import {useEffect,useMemo,useState} from 'react'
import {NavLink,Route,Routes,useLocation} from 'react-router-dom'
import {Activity,BarChart3,ChevronDown,FolderKanban,KanbanSquare,LayoutDashboard,ListChecks,Menu,Plus,Search,Settings,SlidersHorizontal,X} from 'lucide-react'
import {useStore} from './store'
import Dashboard from './pages/Dashboard'
import Issues from './pages/Issues'
import Board from './pages/Board'
import Sprints from './pages/Sprints'
import Analytics from './pages/Analytics'
import Repositories from './pages/Repositories'
import SettingsPage from './pages/Settings'
import IssueModal from './pages/IssueModal'

const nav=[{to:'/',l:'Dashboard',i:LayoutDashboard},{to:'/issues',l:'Issues',i:ListChecks},{to:'/board',l:'Board',i:KanbanSquare},{to:'/sprints',l:'Sprints',i:FolderKanban},{to:'/analytics',l:'Analytics',i:BarChart3},{to:'/repositories',l:'Repositories',i:Search},{to:'/settings',l:'Settings',i:Settings}]

export default function App(){
  const {repo,setRepo,repoOptions,setModal,modal,settings}=useStore();
  const [menuOpen,setMenuOpen]=useState(false);
  const [repoOpen,setRepoOpen]=useState(false);
  const [repoQuery,setRepoQuery]=useState('');
  const location=useLocation();

  useEffect(()=>{document.documentElement.dataset.theme=settings.theme; document.body.classList.toggle('theme-dark', settings.theme==='dark');},[settings.theme])
  useEffect(()=>{const map={'/':'Dashboard','/issues':'Issues','/board':'Board','/sprints':'Sprints','/analytics':'Analytics','/repositories':'Repositories','/settings':'Settings'}; const title=map[location.pathname as keyof typeof map] ?? 'IssueFlow'; document.title=`${title} · IssueFlow`;},[location.pathname])

  const filteredRepos=useMemo(()=>repoOptions.filter(r=>[r.name,r.summary].join(' ').toLowerCase().includes(repoQuery.trim().toLowerCase())),[repoOptions,repoQuery])

  return <>
    <div className="app-shell">
      <div className="app-surface glass">
        <header className="topbar">
          <div className="brand-wrap">
            <div className="brand-icon">◉</div>
            <span className="brand-text">IssueFlow</span>
          </div>

          <nav className="topnav" aria-label="Primary">
            {nav.map((n)=>(
              <NavLink key={n.to} to={n.to} end={n.to==='/'} onClick={()=>setMenuOpen(false)} className={({isActive})=>`nav-pill ${isActive ? 'active' : ''}`}>
                <n.i size={14} />
                <span>{n.l}</span>
              </NavLink>
            ))}
          </nav>

          <div className="top-actions">
            <button className="icon-btn" aria-label="Search"><Search size={15} /></button>
            <button className="icon-btn" aria-label="Settings"><SlidersHorizontal size={15} /></button>
            <div className="repo-select-wrap">
              <button aria-label="Open repository picker" className="repo-select" onClick={()=>setRepoOpen(v=>!v)}>
                <span className="truncate">{repo}</span>
                <ChevronDown size={15} className={repoOpen ? 'rotate-180' : ''} />
              </button>
              {repoOpen && <div className="repo-menu">
                <div className="repo-search">
                  <Search size={14} />
                  <input aria-label="Search repositories" value={repoQuery} onChange={e=>setRepoQuery(e.target.value)} placeholder="Search repos" />
                </div>
                <div className="repo-menu-list">
                  {filteredRepos.length ? filteredRepos.map(r=>(
                    <button key={r.name} type="button" onClick={()=>{setRepo(r.name);setRepoOpen(false);setRepoQuery('')}} className={`repo-item ${repo===r.name ? 'selected' : ''}`}>
                      <div>
                        <div className="repo-name">{r.name}</div>
                        <div className="repo-summary">{r.summary}</div>
                      </div>
                      {repo===r.name && <span className="repo-tag">Active</span>}
                    </button>
                  )) : <div className="repo-empty">No repositories match your search.</div>}
                </div>
              </div>}
            </div>
            <div className="profile-pill">
              <span className="profile-dot" />
              <span>Vikas</span>
            </div>
          </div>
        </header>

        <main className="page-shell">
          <Routes>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/issues" element={<Issues/>}/>
            <Route path="/board" element={<Board/>}/>
            <Route path="/sprints" element={<Sprints/>}/>
            <Route path="/analytics" element={<Analytics/>}/>
            <Route path="/repositories" element={<Repositories/>}/>
            <Route path="/settings" element={<SettingsPage/>}/>
            <Route path="*" element={<p>Page not found.</p>}/>
          </Routes>
        </main>
      </div>
    </div>
    {modal.open && <IssueModal/>}
  </>
}

