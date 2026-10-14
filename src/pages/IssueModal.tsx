import {useEffect,useState} from 'react'
import {LABELS,PRIORITIES,STATUSES,USERS,useStore,type Issue} from '../store'
export default function IssueModal(){
  const {modal,setModal,save,settings}=useStore();const e0=modal.issue
  const [f,setF]=useState({title:e0?.title??'',description:e0?.description??'',status:e0?.status??modal.status??settings.defaultStatus,priority:e0?.priority??settings.defaultPriority,type:e0?.type??settings.defaultType,assignee:e0?.assignee??USERS[0],labels:e0?.labels??[] as string[],due:e0?.due??''})
  const [err,setErr]=useState('');const [saving,setSaving]=useState(false);const close=()=>setModal({open:false})
  useEffect(()=>{const k=(e:KeyboardEvent)=>e.key==='Escape'&&close();addEventListener('keydown',k);return()=>removeEventListener('keydown',k)})
  const set=<K extends keyof typeof f>(k:K,v:(typeof f)[K])=>setF(p=>({...p,[k]:v}))
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(f.title.trim().length<3)return setErr('Title must be at least 3 characters.');setSaving(true);await save({...f,title:f.title.trim()} as Partial<Issue>&{title:string},e0?.id);setSaving(false)}
  const sel=<T extends string>(l:string,k:'status'|'priority'|'type'|'assignee',o:readonly T[])=><label className="block text-xs font-medium">{l}<select className="inp mt-1" value={f[k]} onChange={e=>set(k,e.target.value as never)}>{o.map(x=><option key={x}>{x}</option>)}</select></label>
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#18213A]/30 p-4 backdrop-blur-sm" onMouseDown={e=>e.target===e.currentTarget&&close()}>
    <form role="dialog" aria-modal="true" aria-labelledby="mt" onSubmit={submit} className="card pop max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto p-5">
      <h2 id="mt" className="text-lg font-semibold">{e0?`Edit ${e0.id}`:'New issue'}</h2>
      <label className="block text-xs font-medium">Title<input autoFocus className="inp mt-1" aria-invalid={!!err} aria-describedby="terr" value={f.title} onChange={e=>{set('title',e.target.value);setErr('')}}/></label>
      {err&&<p id="terr" role="alert" className="text-xs text-rose-600">{err}</p>}
      <label className="block text-xs font-medium">Description<textarea rows={3} className="inp mt-1 h-auto py-2" value={f.description} onChange={e=>set('description',e.target.value)}/></label>
      <div className="grid grid-cols-2 gap-3">{sel('Status','status',STATUSES)}{sel('Priority','priority',PRIORITIES)}{sel('Type','type',['Bug','Feature','Task'] as const)}{sel('Assignee','assignee',USERS)}</div>
      <label className="block text-xs font-medium">Due date<input type="date" className="inp mt-1" value={f.due} onChange={e=>set('due',e.target.value)}/></label>
      <fieldset><legend className="text-xs font-medium">Labels</legend><div className="mt-1 flex flex-wrap gap-2">{LABELS.map(l=><label key={l} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${f.labels.includes(l)?'border-[#6558F5] bg-[#C8B8FF]/40':'border-[var(--line)]'}`}><input type="checkbox" className="sr-only" checked={f.labels.includes(l)} onChange={()=>set('labels',f.labels.includes(l)?f.labels.filter(x=>x!==l):[...f.labels,l])}/>{l}</label>)}</div></fieldset>
      <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn" onClick={close}>Cancel</button><button disabled={saving} className="btn btn-p">{saving?'Saving…':e0?'Save changes':'Create issue'}</button></div></form></div>
}
