import {Link} from 'react-router-dom'
import {ArrowRight,CheckCircle2,FileText,FolderKanban} from 'lucide-react'
import {useStore} from '../store'
import {Avatar,PBadge,SBadge,isOverdue} from '../ui'

export default function Dashboard(){
  const {issues,repo,setModal,sprints}=useStore()

  const done=issues.filter(i=>i.status==='Done').length
  const open=issues.length-done
  const overdue=issues.filter(isOverdue).length
  const completion=issues.length ? Math.round((done / issues.length) * 100) : 0
  const currentSprint=sprints.find(s=>s.status==='Current') ?? sprints[0]
  const sprintDone = currentSprint ? currentSprint.issueIds.filter(id=>issues.some(i=>i.id===id && i.status==='Done')).length : 0
  const sprintProgress = currentSprint && currentSprint.issueIds.length ? Math.round((sprintDone / currentSprint.issueIds.length) * 100) : 0

  const onboarding=[
    {label:'Select a sample repository', done: repo.includes('acme')},
    {label:'Review open issues', done: open > 0},
    {label:'Organize the current sprint', done: Boolean(currentSprint)},
    {label:'Resolve a high-priority issue', done: issues.some(i=>i.priority==='Critical' && i.status!=='Done')}
  ]

  const overview=[
    {label:'Open Issues', value: open, note:'+2 this week'},
    {label:'Closed Issues', value: done, note:'4 resolved'},
    {label:'Overdue Issues', value: overdue, note:'Needs attention'},
    {label:'Sprint Completion', value: `${completion}%`, note:`${done}/${issues.length} done`}
  ]

  const recent=[...issues].sort((a,b)=>new Date(b.updated).getTime()-new Date(a.updated).getTime()).slice(0,5)

  return <div className="dashboard-layout pop">
    <div className="welcome-row">
      <div>
        <h1>Welcome Back, Vikas</h1>
        <p>Track issues, plan sprints, and keep your development workflow moving.</p>
      </div>
      <div className="action-group">
        <button className="mini-btn glass-btn" onClick={()=>setModal({open:true})}><FileText size={14} /> New Issue</button>
        <button className="mini-btn glass-btn"><FolderKanban size={14} /> Create Sprint</button>
        <Link to="/issues" className="mini-btn glass-btn"><ArrowRight size={14} /> Review Issues</Link>
      </div>
    </div>

    <div className="top-panels">
      <section className="panel glass-panel onboarding-panel">
        <div className="panel-top"><h2>Getting Started</h2></div>
        <p className="muted small">The list below highlights the most important workflow actions for the week.</p>
        <div className="progress-line"><div className="progress-fill" style={{width: `${Math.round((onboarding.filter(item=>item.done).length / onboarding.length) * 100)}%`}} /></div>
        <ul className="checklist">
          {onboarding.map((item,index)=><li key={item.label} className={item.done ? 'done' : ''}>
            <span className="checkmark"><CheckCircle2 size={15} /></span>
            <span>{item.label}</span>
            <span className="step-badge">{index + 1}</span>
          </li>)}
        </ul>
      </section>

      <section className="panel glass-panel health-panel">
        <div className="panel-top">
          <h2>Sprint Health</h2>
          <button className="more-btn">•••</button>
        </div>
        <div className="ring-wrap">
          <div className="ring" style={{background: `conic-gradient(#ffab61 0 ${Math.min(sprintProgress, 80)}%, #50d6ad ${Math.min(sprintProgress, 80)}% ${Math.min(sprintProgress + 18, 100)}%, #6fb8ff ${Math.min(sprintProgress + 18, 100)}% 100%)`}}>
            <div className="ring-inner">
              <div className="ring-label">Sprint</div>
              <div className="ring-value">{sprintProgress}%</div>
            </div>
          </div>
        </div>
        <div className="health-stats">
          <div><span>{open}</span> Open</div>
          <div><span>{overdue}</span> Overdue</div>
          <div><span>{currentSprint ? currentSprint.issueIds.length : 0}</span> Total</div>
        </div>
      </section>
    </div>

    <div className="stats-row">
      {overview.map((card)=><div key={card.label} className="panel glass-panel stat-card">
        <div className="stat-head"><span>{card.label}</span><button className="more-btn">•••</button></div>
        <div className="stat-number">{card.value}</div>
        <div className="stat-note">{card.note}</div>
        <div className="sparkline sparkline-a" />
      </div>)}
    </div>

    <div className="bottom-panels">
      <section className="panel glass-panel sprint-progress-panel">
        <div className="panel-top">
          <h2>Sprint Progress</h2>
          <span className="status-live"><span className="live-dot" /> Live</span>
        </div>
        <div className="sprint-headline">
          <div>
            <div className="mini-label">Active sprint</div>
            <div className="sprint-name">{currentSprint?.name ?? 'Sprint 31'}</div>
          </div>
          <div className="goal-value">{sprintProgress}%</div>
        </div>
        <p className="muted small">{currentSprint?.goal ?? 'Keep the core issue flow stable and close the high priority backlog.'}</p>
        <div className="bar-group">
          <div className="bar-line">
            <span className="segment blue" style={{width:'60%'}} />
            <span className="segment orange" style={{width:'30%'}} />
            <span className="segment green" style={{width:'10%'}} />
          </div>
        </div>
        <div className="legend-row"><span><i className="dot blue"/> Unused</span><span><i className="dot orange"/> Used</span><span><i className="dot green"/> Reserved</span></div>
      </section>

      <section className="panel glass-panel issues-panel">
        <div className="panel-top"><h2>Recent Issues</h2><button className="more-btn">•••</button></div>
        <table>
          <thead>
            <tr><th>Issue</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {recent.map(item=><tr key={item.id} onClick={()=>setModal({open:true,issue:item})}>
              <td>{item.title}</td>
              <td><PBadge p={item.priority} /></td>
              <td><SBadge s={item.status} /></td>
              <td><Avatar n={item.assignee}/></td>
              <td>{new Date(item.updated).toLocaleDateString()}</td>
            </tr>)}
          </tbody>
        </table>
      </section>
    </div>
  </div>
}

