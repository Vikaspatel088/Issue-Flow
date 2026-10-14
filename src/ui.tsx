import type {Priority,Status} from './store'
const P:Record<Priority,string>={Low:'bg-slate-100 text-slate-600',Medium:'bg-sky-100 text-sky-700',High:'bg-amber-100 text-amber-800',Critical:'bg-rose-100 text-rose-700'}
const S:Record<Status,string>={Backlog:'bg-slate-100 text-slate-600','To Do':'bg-indigo-100 text-indigo-700','In Progress':'bg-violet-100 text-violet-700',Done:'bg-emerald-100 text-emerald-700'}
const b='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap'
export const PBadge=({p}:{p:Priority})=><span className={`${b} ${P[p]}`}>{p}</span>
export const SBadge=({s}:{s:Status})=><span className={`${b} ${S[s]}`}>{s}</span>
export const Label=({l}:{l:string})=><span className={`${b} bg-[#C8B8FF]/30 text-[#4b3fd1]`}>{l}</span>
export const Avatar=({n}:{n:string})=><span title={n} aria-label={n} className="inline-grid h-6 w-6 place-items-center rounded-full bg-[#B9E8FF] text-[10px] font-semibold text-[#18213A]">{n.split(' ').map(x=>x[0]).join('')}</span>
export const isOverdue=(i:{due:string;status:Status})=>!!i.due&&i.status!=='Done'&&i.due<new Date().toISOString().slice(0,10)
