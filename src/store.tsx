import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react'
import { api, type ApiIssue, type ApiProject, type ApiSprint } from './api'

export type Status='Backlog'|'To Do'|'In Progress'|'Done'
export type Priority='Low'|'Medium'|'High'|'Critical'
export type IssueType='Bug'|'Feature'|'Task'
export type Theme='light'|'dark'

export interface Issue{ id:string; repo:string; title:string; description:string; status:Status; priority:Priority; type:IssueType; assignee:string; labels:string[]; due:string; updated:string }
export interface Sprint{ id:string; repo:string; name:string; goal:string; startDate:string; endDate:string; status:'Current'|'Upcoming'|'Completed'; issueIds:string[] }
export interface ActivityPoint{ date:string; opened:number; closed:number }
export interface AppSettings{ theme:Theme; notifications:{mentions:boolean;comments:boolean;reminders:boolean}; defaultPriority:Priority; defaultStatus:Status; defaultType:IssueType; workspace:{compactMode:boolean;showDemoBadge:boolean}; profile:{name:string;role:string;email:string} }

export const STATUSES:Status[]=['Backlog','To Do','In Progress','Done']
export const PRIORITIES:Priority[]=['Low','Medium','High','Critical']
export const USERS=['Maya Chen','Arjun Rao','Lena Fischer','Tom Okafor']
export const LABELS=['auth','ui','api','perf','docs','a11y']
export const REPOS=['acme/issueflow-web','acme/api-gateway','acme/design-system']
export const REPO_META=[{name:'acme/issueflow-web',summary:'Customer portal'}, {name:'acme/api-gateway',summary:'Gateway operations'}, {name:'acme/design-system',summary:'Shared component library'}] as const
export const day=(n:number)=>new Date(Date.now()+n*864e5).toISOString().slice(0,10)
export const defaultSettings:AppSettings={theme:'light',notifications:{mentions:true,comments:true,reminders:false},defaultPriority:'Medium',defaultStatus:'To Do',defaultType:'Task',workspace:{compactMode:false,showDemoBadge:true},profile:{name:'Maya Chen',role:'Product lead',email:'maya@acme.example'}}

type RepoOption={name:string;summary:string}
type RepoState={issues:Issue[];sprints:Sprint[];history:ActivityPoint[]}
type DataMode='api'|'demo'

const EMPTY_REPO_STATE: RepoState = { issues: [], sprints: [], history: [] }

const defaultRepoOptions:RepoOption[] = REPOS.map((name) => ({ name, summary: REPO_META.find((repo) => repo.name === name)?.summary ?? 'Repository' }))

const toRepoKey=(project:Pick<ApiProject,'repository_owner'|'repository_name'|'name'>):string => {
  if (project.repository_owner && project.repository_name) return `${project.repository_owner}/${project.repository_name}`
  return project.name
}

const toIssue=(projectKey:string, issue:ApiIssue):Issue => ({
  id:String(issue.id),
  repo:projectKey,
  title:issue.title,
  description:issue.description ?? '',
  status:issue.status as Status,
  priority:issue.priority as Priority,
  type:issue.type as IssueType,
  assignee:issue.assignee ?? USERS[0],
  labels:issue.labels ?? [],
  due:issue.due_date ?? '',
  updated:issue.updated_at,
})

const toSprint=(projectKey:string, sprint:ApiSprint):Sprint => ({
  id:String(sprint.id),
  repo:projectKey,
  name:sprint.name,
  goal:sprint.goal ?? '',
  startDate:sprint.start_date,
  endDate:sprint.end_date,
  status:(sprint.status === 'Current' || sprint.status === 'Completed' ? sprint.status : 'Upcoming') as Sprint['status'],
  issueIds:[],
})

const makeIssue=(repo:string,index:number,title:string,type:IssueType,priority:Priority,status:Status,assigneeIndex:number,labels:string[],dueOffset:number):Issue => ({id:`IF-${100+index}` ,repo,title,description:'Sample demo issue generated for this repository.',type,priority,status,assignee:USERS[assigneeIndex],labels,due:day(dueOffset),updated:new Date(Date.now()-index*3.6e6).toISOString()})

const seedIssuesByRepo:Record<string,Issue[]>={
  'acme/issueflow-web':[makeIssue('acme/issueflow-web',0,'Login redirect loops on expired token','Bug','Critical','In Progress',0,['auth'],-2),makeIssue('acme/issueflow-web',1,'Add keyboard navigation to dropdowns','Task','Medium','To Do',1,['a11y','ui'],5),makeIssue('acme/issueflow-web',2,'Paginate issues endpoint response','Feature','High','To Do',2,['api','perf'],3),makeIssue('acme/issueflow-web',3,'Dark mode contrast audit','Task','Low','Backlog',3,['ui','a11y'],14),makeIssue('acme/issueflow-web',4,'Table rows flicker on resize','Bug','Medium','Done',0,['ui'],-6),makeIssue('acme/issueflow-web',5,'Document webhook retry policy','Task','Low','Done',1,['docs'],-9),makeIssue('acme/issueflow-web',6,'Cache repository metadata','Feature','High','In Progress',2,['perf'],2),makeIssue('acme/issueflow-web',7,'Rate limiter ignores burst header','Bug','High','To Do',3,['api'],-1),makeIssue('acme/issueflow-web',8,'Add OpenAPI schema validation','Feature','Medium','Backlog',0,['api','docs'],10),makeIssue('acme/issueflow-web',9,'Button focus ring clipped in toolbar','Bug','Medium','Done',1,['ui','a11y'],-4),makeIssue('acme/issueflow-web',10,'Token color scale for charts','Task','Low','In Progress',2,['ui'],6)],
  'acme/api-gateway':[makeIssue('acme/api-gateway',20,'Retry cache policy for upstream 429s','Bug','Critical','In Progress',2,['api','perf'],-1),makeIssue('acme/api-gateway',21,'Add tenant-aware log sampling','Feature','High','To Do',3,['api'],3),makeIssue('acme/api-gateway',22,'Support mTLS certificate rotation','Task','Medium','Backlog',1,['auth','docs'],9),makeIssue('acme/api-gateway',23,'Expose route health checks','Feature','Medium','In Progress',0,['api'],2),makeIssue('acme/api-gateway',24,'Investigate async queue lag','Bug','High','To Do',2,['perf'],-5),makeIssue('acme/api-gateway',25,'Document adapter contract','Task','Low','Done',1,['docs'],-8),makeIssue('acme/api-gateway',26,'Throttle duplicate webhook retries','Bug','High','In Progress',3,['api'],1),makeIssue('acme/api-gateway',27,'Add rate limit alerts','Feature','Medium','To Do',0,['a11y','perf'],7),makeIssue('acme/api-gateway',28,'Normalize service errors','Bug','Medium','Done',2,['api'],-12),makeIssue('acme/api-gateway',29,'Ship gateway metrics dashboard','Task','Low','Backlog',1,['ui','docs'],15)],
  'acme/design-system':[makeIssue('acme/design-system',40,'Refine button focus states','Task','Medium','In Progress',0,['ui','a11y'],1),makeIssue('acme/design-system',41,'Add toggle patterns for cards','Feature','High','To Do',3,['ui'],4),makeIssue('acme/design-system',42,'Audit color contrast on dark cards','Bug','Critical','To Do',1,['ui','a11y'],-3),makeIssue('acme/design-system',43,'Document tooltip motion rules','Task','Low','Done',2,['docs'],-7),makeIssue('acme/design-system',44,'Support split labels in form fields','Feature','Medium','Backlog',0,['ui'],12),makeIssue('acme/design-system',45,'Fix motion jitter on popovers','Bug','High','In Progress',3,['ui','perf'],2),makeIssue('acme/design-system',46,'Create icon legend for statuses','Task','Low','Done',1,['docs'],-10),makeIssue('acme/design-system',47,'Improve mobile nav spacing','Task','Medium','Backlog',2,['ui'],6),makeIssue('acme/design-system',48,'Add responsive card header variants','Feature','Medium','To Do',0,['ui','docs'],8),makeIssue('acme/design-system',49,'Normalize tokens for success states','Bug','High','Done',3,['ui'],-5)]}

const createSprints=(repo:string,issues:Issue[]):Sprint[]=>{
  const base=[...issues].sort((a,b)=>new Date(a.updated).getTime()-new Date(b.updated).getTime())
  const withCurrent=base.slice(0,4).map(i=>i.id)
  const upcoming=base.slice(4,7).map(i=>i.id)
  const complete=base.slice(7,10).map(i=>i.id)
  const start = new Date(); const offset=(d:number)=>new Date(start.getTime()+d*86400000).toISOString().slice(0,10)
  return [
    {id:`SPR-${repo.slice(-3).toUpperCase()}-01`,repo,name:'Sprint 31',goal:'Ship the polished issue dashboard and repo workflow improvements.',startDate:offset(-14),endDate:offset(7),status:'Current',issueIds:withCurrent},
    {id:`SPR-${repo.slice(-3).toUpperCase()}-02`,repo,name:'Sprint 32',goal:'Reduce support scuffles and clean up create/edit flows.',startDate:offset(8),endDate:offset(21),status:'Upcoming',issueIds:upcoming},
    {id:`SPR-${repo.slice(-3).toUpperCase()}-03`,repo,name:'Sprint 30',goal:'Close remaining polish and migration bugs before handoff.',startDate:offset(-28),endDate:offset(-14),status:'Completed',issueIds:complete}
  ]
}

const baseHistory=(repo:string):ActivityPoint[]=>{const base=new Date(); return Array.from({length:7},(_,i)=>{const d=new Date(base.getTime()-(6-i)*86400000); const date=d.toISOString().slice(0,10); return {date,opened:4+i%3,closed:3+i%2};}) }
const buildState=(repo:string):RepoState=>{const issues=seedIssuesByRepo[repo] ?? []; return {issues, sprints:createSprints(repo,issues), history:baseHistory(repo)} }
const load=<T,>(k:string,d:T):T=>{try{const v=localStorage.getItem(k); return v ? JSON.parse(v) as T : d}catch{return d}}

type Modal={open:boolean;issue?:Issue;status?:Status}

interface Ctx{
  all:Issue[]
  issues:Issue[]
  repo:string
  repoOptions:RepoOption[]
  loading:boolean
  error:string | null
  setRepo:(r:string)=>void
  save:(i:Partial<Issue>&{title:string},id?:string)=>Promise<void>
  remove:(id:string)=>Promise<void>
  move:(id:string,s:Status)=>Promise<void>
  modal:Modal
  setModal:(m:Modal)=>void
  reset:()=>void
  settings:AppSettings
  setSettings:(updater:(prev:AppSettings)=>AppSettings|AppSettings)=>void
  sprints:Sprint[]
  history:ActivityPoint[]
  createSprint:(s:Sprint)=>Promise<void>
  updateSprint:(id:string,next:Partial<Sprint>)=>Promise<void>
  deleteSprint:(id:string)=>Promise<void>
}

const C=createContext<Ctx>(null!)
export const useStore=()=>useContext(C)

export function Provider({children}:{children:ReactNode}){
  const [repo,setRepo]=useState<string>(()=>{const saved=load<string>('if-repo',defaultRepoOptions[0]?.name ?? ''); return defaultRepoOptions.some(r=>r.name===saved) ? saved : defaultRepoOptions[0]?.name ?? ''})
  const [settings,setSettings]=useState<AppSettings>(()=>load('if-settings',defaultSettings))
  const [repoOptions,setRepoOptions]=useState<RepoOption[]>(defaultRepoOptions)
  const [projectLookup,setProjectLookup]=useState<Record<string,number>>({})
  const [issueSprintLookup,setIssueSprintLookup]=useState<Record<string,number|null>>({})
  const [dataMode,setDataMode]=useState<DataMode>('demo')
  const [repoState,setRepoState]=useState<Record<string,RepoState>>(()=>{
    const raw=load<Record<string,RepoState>>('if-repo-state-v2', {})
    const merged:Record<string,RepoState>={}
    for (const option of defaultRepoOptions){ merged[option.name]=raw[option.name] ?? buildState(option.name) }
    return merged
  })
  const [modal,setModal]=useState<Modal>({open:false})
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string | null>(null)

  const current=repoState[repo] ?? buildState(repo)
  const visibleSprints = current.sprints.map((sprint) => ({
    ...sprint,
    issueIds: dataMode === 'api'
      ? current.issues.filter((issue) => issueSprintLookup[issue.id] === Number(sprint.id)).map((issue) => issue.id)
      : sprint.issueIds,
  }))

  useEffect(()=>{try{localStorage.setItem('if-repo',JSON.stringify(repo));localStorage.setItem('if-settings',JSON.stringify(settings));localStorage.setItem('if-repo-state-v2',JSON.stringify(repoState))}catch{/* storage unavailable */}},[repo,settings,repoState])

  useEffect(()=>{
    let active=true

    async function hydrateProjectList(){
      try {
        const projects = await api.listProjects()
        if (!active) return
        if (projects.length === 0) {
          setRepoOptions(defaultRepoOptions)
          setProjectLookup({})
          setDataMode('demo')
          setError('No projects returned by the backend. Using demo data for local inspection only.')
          return
        }

        const nextOptions = projects.map((project) => ({
          name: toRepoKey(project),
          summary: project.description || project.repository_name || 'Project repository',
        }))
        const lookup = Object.fromEntries(projects.map((project) => [toRepoKey(project), project.id]))
        setRepoOptions(nextOptions)
        setProjectLookup(lookup)
        setDataMode('api')
        setError(null)
        setRepo((currentRepo) => (nextOptions.some((option) => option.name === currentRepo) ? currentRepo : nextOptions[0].name))
      } catch (err) {
        if (!active) return
        setRepoOptions(defaultRepoOptions)
        setProjectLookup({})
        setDataMode('demo')
        setError(err instanceof Error ? err.message : 'Unable to reach the API. Demo data is shown for local inspection only.')
      }
    }

    void hydrateProjectList()

    return () => { active=false }
  }, [])

  useEffect(()=>{
    const projectId = projectLookup[repo]
    if (!projectId) {
      setLoading(false)
      return
    }

    let active=true
    setLoading(true)
    setError(null)

    Promise.all([
      api.listProjectIssues(projectId),
      api.listProjectSprints(projectId),
    ])
      .then(([issues, sprints]) => {
        if (!active) return
        const mappedIssues = issues.map((issue) => toIssue(repo, issue))
        const mappedSprints = sprints.map((sprint) => toSprint(repo, sprint))
        setIssueSprintLookup((prev) => {
          const next = { ...prev }
          for (const issue of issues) next[String(issue.id)] = issue.sprint_id
          return next
        })
        setRepoState((prev) => ({
          ...prev,
          [repo]: {
            issues: mappedIssues,
            sprints: mappedSprints,
            history: prev[repo]?.history ?? buildState(repo).history,
          },
        }))
        setDataMode('api')
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load project data.')
        setDataMode('demo')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active=false }
  }, [projectLookup, repo])

  const v=useMemo<Ctx>(() => ({
    all:Object.values(repoState).flatMap((r) => r.issues),
    repo,
    repoOptions,
    loading,
    error,
    setRepo:(next)=>{ if (repoOptions.some((item) => item.name === next)) setRepo(next) },
    issues:current.issues,
    modal,
    setModal,
    sprints:visibleSprints,
    history:current.history,
    settings,
    setSettings:(updater)=>setSettings((prev) => (typeof updater === 'function' ? updater(prev) : updater)),
    createSprint: async (s) => {
      const projectId = projectLookup[repo]
      if (!projectId) {
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, sprints:[...current.sprints,{...s,repo}] } }))
        return
      }

      try {
        const created = await api.createSprint(projectId, { name:s.name, goal:s.goal, start_date:s.startDate, end_date:s.endDate, status:s.status })
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, sprints:[...current.sprints, toSprint(repo, created)] } }))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to create sprint.')
      }
    },
    updateSprint: async (id,next) => {
      const projectId = projectLookup[repo]
      const sprintToUpdate = current.sprints.find((sprint) => sprint.id === id)
      if (!projectId || !sprintToUpdate) {
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, sprints: current.sprints.map((sprint) => sprint.id === id ? { ...sprint, ...next } : sprint) } }))
        return
      }

      try {
        const updated = await api.updateSprint(Number(id), {
          ...(next.name !== undefined ? { name: next.name } : {}),
          ...(next.goal !== undefined ? { goal: next.goal } : {}),
          ...(next.startDate !== undefined ? { start_date: next.startDate } : {}),
          ...(next.endDate !== undefined ? { end_date: next.endDate } : {}),
          ...(next.status !== undefined ? { status: next.status } : {}),
        })
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, sprints: current.sprints.map((sprint) => sprint.id === id ? toSprint(repo, updated) : sprint) } }))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update sprint.')
      }
    },
    deleteSprint: async (id) => {
      const projectId = projectLookup[repo]
      if (!projectId) {
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, sprints: current.sprints.filter((sprint) => sprint.id !== id) } }))
        return
      }

      try {
        await api.deleteSprint(Number(id))
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, sprints: current.sprints.filter((sprint) => sprint.id !== id) } }))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete sprint.')
      }
    },
    save: async (p,id) => {
      const projectId = projectLookup[repo]
      if (!projectId) {
        setRepoState((prev) => {
          const base=prev[repo] ?? buildState(repo)
          const nextIssues = id ? base.issues.map((issue) => issue.id === id ? { ...issue, ...p, updated:new Date().toISOString() } : issue) : [{ id:`IF-${Math.max(100,...base.issues.map((issue) => Number(issue.id.replace(/\D/g,''))))+1}`, repo, description:'', status:settings.defaultStatus, priority:settings.defaultPriority, type:settings.defaultType, assignee:USERS[0], labels:[], due:'', ...p, updated:new Date().toISOString() } as Issue, ...base.issues]
          return { ...prev, [repo]: { ...base, issues: nextIssues } }
        })
        setModal({open:false})
        return
      }

      try {
        const payload = {
          title:p.title,
          description:p.description ?? '',
          status:p.status ?? settings.defaultStatus,
          priority:p.priority ?? settings.defaultPriority,
          type:p.type ?? settings.defaultType,
          assignee:p.assignee ?? USERS[0],
          labels:p.labels ?? [],
          due_date:p.due ? p.due : null,
        }

        const saved = id
          ? await api.updateIssue(Number(id), payload)
          : await api.createIssue(projectId, payload)

        const issue = toIssue(repo, saved)
        setIssueSprintLookup((prev) => ({ ...prev, [String(saved.id)]: saved.sprint_id }))
        setRepoState((prev) => {
          const base=prev[repo] ?? buildState(repo)
          const nextIssues = id ? base.issues.map((item) => item.id === String(saved.id) ? issue : item) : [issue, ...base.issues]
          return { ...prev, [repo]: { ...base, issues: nextIssues } }
        })
        setError(null)
        setModal({open:false})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save issue.')
      }
    },
    remove: async (id) => {
      const projectId = projectLookup[repo]
      if (!projectId) {
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, issues: current.issues.filter((issue) => issue.id !== id) } }))
        return
      }

      try {
        await api.deleteIssue(Number(id))
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, issues: current.issues.filter((issue) => issue.id !== id) } }))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete issue.')
      }
    },
    move: async (id,s) => {
      const projectId = projectLookup[repo]
      if (!projectId) {
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, issues: current.issues.map((issue) => issue.id === id ? { ...issue, status:s, updated:new Date().toISOString() } : issue) } }))
        return
      }

      try {
        const updated = await api.updateIssue(Number(id), { status: s })
        const issue = toIssue(repo, updated)
        setIssueSprintLookup((prev) => ({ ...prev, [String(updated.id)]: updated.sprint_id }))
        setRepoState((prev) => ({ ...prev, [repo]: { ...current, issues: current.issues.map((item) => item.id === id ? issue : item) } }))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to move issue.')
      }
    },
    reset: () => setRepoState((prev) => ({ ...prev, [repo]: buildState(repo) })),
  }),[current,error,issueSprintLookup,loading,projectLookup,repo,repoOptions,repoState,settings])

  return <C.Provider value={v}>{children}</C.Provider>
}

export const isDemoMode = (mode: DataMode) => mode === 'demo'

