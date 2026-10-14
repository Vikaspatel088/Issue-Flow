import {useMemo,useState} from 'react'
import {ArrowDownUp,Search,Trash2} from 'lucide-react'
import {PRIORITIES,STATUSES,USERS,useStore,type Issue} from '../store'
import {Avatar,Label,PBadge,SBadge,isOverdue} from '../ui'
type K='id'|'title'|'status'|'priority'|'due'|'updated'
export default function Issues(){
  const {issues,setModal,remove}=useStore()
  const [q,setQ]=useState(''),[st,setSt]=useState(''),[pr,setPr]=useState(''),[as,setAs]=useState('')
  const [sort,setSort]=useState<{k:K;d:1|-1}>({k:'updated',d:-1})
  const rows=useMemo(()=>issues.filter(i=>(!q||(i.title+i.id+i.labels.join()).toLowerCase().includes(q.toLowerCase()))&&(!st||i.status===st)&&(!pr||i.priority===pr)&&(!as||i.assignee===as))
    .sort((a,b)=>{const f=(i:Issue)=>sort.k==='priority'?PRIORITIES.indexOf(i.priority):sort.k==='status'?STATUSES.indexOf(i.status):i[sort.k];const x=f(a),y=f(b);return(x>y?1:x<y?-1:0)*sort.d}),[issues,q,st,pr,as,sort])
  const sel=(v:string,s:(v:string)=>void,o:readonly string[],l:string)=><select aria-label={l} className="inp w-auto" value={v} onChange={e=>s(e.target.value)}><option value="">{l}</option>{o.map(x=><option key={x}>{x}</option>)}</select>
  const th=(k:K,l:string)=><th scope="col" className="p-3 font-medium"><button className="inline-flex items-center gap-1" onClick={()=>setSort(s=>({k,d:s.k===k?(-s.d as 1|-1):1}))}>{l}<ArrowDownUp size={12}/></button></th>
  const filtered=q||st||pr||as
  return <div className="space-y-4 pop"><h1 className="text-xl font-semibold">Issues</h1>
    <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-3">
      <div className="relative min-w-[12rem] flex-1"><Search size={14} className="absolute left-3 top-3 text-[#5F6B83]"/><input aria-label="Search issues" className="inp pl-8" placeholder="Search issues" value={q} onChange={e=>setQ(e.target.value)}/></div>
      {sel(st,setSt,STATUSES,'Status')}{sel(pr,setPr,PRIORITIES,'Priority')}{sel(as,setAs,USERS,'Assignee')}
      {filtered&&<button className="btn" onClick={()=>{setQ('');setSt('');setPr('');setAs('')}}>Clear filters</button>}</div>
    <div className="card overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="text-xs text-[#5F6B83]"><tr>{th('id','ID')}{th('title','Title')}{th('status','Status')}{th('priority','Priority')}<th className="p-3 font-medium">Labels</th><th className="p-3 font-medium">Owner</th>{th('due','Due')}{th('updated','Updated')}<th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{rows.map(i=><tr key={i.id} className="border-t border-[var(--line)] hover:bg-[#f6f7ff]">
        <td className="p-3 text-[#5F6B83]">{i.id}</td>
        <td className="p-3 font-medium"><button className="text-left hover:text-[#6558F5]" onClick={()=>setModal({open:true,issue:i})}>{i.title}</button></td>
        <td className="p-3"><SBadge s={i.status}/></td><td className="p-3"><PBadge p={i.priority}/></td>
        <td className="p-3"><div className="flex gap-1">{i.labels.map(l=><Label key={l} l={l}/>)}</div></td><td className="p-3"><Avatar n={i.assignee}/></td>
        <td className={`p-3 ${isOverdue(i)?'font-medium text-rose-600':''}`}>{i.due||'—'}</td><td className="p-3 text-[#5F6B83]">{new Date(i.updated).toLocaleDateString()}</td>
        <td className="p-3"><button aria-label={`Delete ${i.id}`} className="text-[#5F6B83] hover:text-rose-600" onClick={()=>confirm(`Delete ${i.id}? This cannot be undone.`)&&remove(i.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table>
      {rows.length===0&&<p className="p-8 text-center text-[#5F6B83]">{filtered?'No issues match these filters.':'No issues yet. Create your first one.'}</p>}</div></div>
}
