import {useState} from 'react'
import {STATUSES,useStore,type Status} from '../store'
import {Avatar,Label,PBadge} from '../ui'
export default function Board(){
  const {issues,move,save,setModal}=useStore()
  const [over,setOver]=useState<Status|null>(null),[q,setQ]=useState(''),[add,setAdd]=useState<Status|null>(null),[t,setT]=useState('')
  const vis=issues.filter(i=>!q||i.title.toLowerCase().includes(q.toLowerCase()))
  return <div className="space-y-4 pop"><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-semibold">Board</h1>
    <input aria-label="Filter board" className="inp max-w-xs bg-white/80" placeholder="Filter cards" value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="flex gap-4 overflow-x-auto pb-3">{STATUSES.map(s=><section key={s} aria-label={s} onDragOver={e=>{e.preventDefault();setOver(s)}} onDragLeave={()=>setOver(null)} onDrop={e=>{move(e.dataTransfer.getData('id'),s);setOver(null)}}
      className={`glass w-72 shrink-0 rounded-2xl p-3 transition ${over===s?'ring-2 ring-[#6558F5] bg-[#C8B8FF]/30':''}`}>
      <h2 className="mb-3 flex justify-between px-1 font-medium">{s}<span className="rounded-full bg-white px-2 text-xs leading-5">{vis.filter(i=>i.status===s).length}</span></h2>
      <div className="min-h-12 space-y-2">{vis.filter(i=>i.status===s).map(i=><article key={i.id} draggable onDragStart={e=>e.dataTransfer.setData('id',i.id)} className="card cursor-grab space-y-2 p-3 transition hover:-translate-y-0.5 active:cursor-grabbing">
        <button className="text-left font-medium" onClick={()=>setModal({open:true,issue:i})}>{i.title}</button>
        <div className="flex flex-wrap gap-1">{i.labels.map(l=><Label key={l} l={l}/>)}</div>
        <div className="flex items-center justify-between text-xs text-[#5F6B83]"><span>{i.id}</span><span className="flex items-center gap-2"><PBadge p={i.priority}/><Avatar n={i.assignee}/></span></div>
        <label className="sr-only" htmlFor={'m'+i.id}>Move {i.id}</label><select id={'m'+i.id} className="inp h-7 text-xs" value={i.status} onChange={e=>move(i.id,e.target.value as Status)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></article>)}</div>
      {add===s?<form className="mt-2" onSubmit={e=>{e.preventDefault();if(t.trim().length>=3){save({title:t.trim(),status:s});setT('');setAdd(null)}}}><input autoFocus aria-label={`New issue in ${s}`} className="inp" placeholder="Title, then Enter" value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>e.key==='Escape'&&setAdd(null)}/></form>
        :<button className="mt-2 w-full rounded-lg py-1.5 text-[#5F6B83] hover:bg-white/70" onClick={()=>setAdd(s)}>+ Add issue</button>}</section>)}</div></div>
}
