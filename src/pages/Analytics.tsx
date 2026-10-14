import {useMemo,useState} from 'react'
import {Bar,BarChart,CartesianGrid,Cell,Legend,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import {useStore} from '../store'
const palette=['#C8B8FF','#B9E8FF','#FFD3E5','#BFEFDC','#FDE68A']
export default function Analytics(){
  const {issues,history}=useStore()
  const [range,setRange]=useState<'7d'|'30d'|'90d'>('7d')
  const slice = range==='7d'?history.slice(-7):range==='30d'?history.slice(-30):history.slice(-90)
  const statusData=useMemo(()=>[
    {name:'Backlog',value:issues.filter(i=>i.status==='Backlog').length},
    {name:'To Do',value:issues.filter(i=>i.status==='To Do').length},
    {name:'In Progress',value:issues.filter(i=>i.status==='In Progress').length},
    {name:'Done',value:issues.filter(i=>i.status==='Done').length}
  ],[issues])
  const priorityData=useMemo(()=>[
    {name:'Low',value:issues.filter(i=>i.priority==='Low').length},
    {name:'Medium',value:issues.filter(i=>i.priority==='Medium').length},
    {name:'High',value:issues.filter(i=>i.priority==='High').length},
    {name:'Critical',value:issues.filter(i=>i.priority==='Critical').length}
  ],[issues])
  const trendData=useMemo(()=>slice.map(point=>({date:point.date.slice(5), opened:point.opened, closed:point.closed})),[slice])
  const totalOpen=issues.filter(i=>i.status!=='Done').length
  const totalClosed=issues.filter(i=>i.status==='Done').length
  const summary=[['Open issues',totalOpen],['Closed issues',totalClosed],['Average throughput',`${Math.round((totalClosed+totalOpen)/Math.max(slice.length,1))}/day`],['Saved time',`${Math.round(totalOpen*1.8)}h`]]
  return <div className="space-y-4 pop"><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-semibold">Analytics</h1><div className="btn-group inline-flex rounded-xl border border-[var(--line)] bg-white/60 p-1"><button className={`rounded-lg px-3 py-1.5 text-sm ${range==='7d'?'bg-[#6558F5] text-white':'text-[#5F6B83]'}`} onClick={()=>setRange('7d')}>7d</button><button className={`rounded-lg px-3 py-1.5 text-sm ${range==='30d'?'bg-[#6558F5] text-white':'text-[#5F6B83]'}`} onClick={()=>setRange('30d')}>30d</button><button className={`rounded-lg px-3 py-1.5 text-sm ${range==='90d'?'bg-[#6558F5] text-white':'text-[#5F6B83]'}`} onClick={()=>setRange('90d')}>90d</button></div></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{summary.map(([label,value])=><div key={label} className="card p-4"><div className="text-xs text-[#5F6B83]">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></div>)}</div>{slice.length===0 ? <div className="card p-8 text-center text-[#5F6B83]">No demo activity history yet for this repository.</div> : <div className="grid gap-4 xl:grid-cols-2"><div className="card p-4"><h2 className="mb-2 font-medium">Issue distribution</h2><div className="h-64"><ResponsiveContainer><BarChart data={statusData}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(99,115,150,.18)"/><XAxis dataKey="name" tickLine={false}/><YAxis allowDecimals={false} width={28}/><Tooltip/><Bar dataKey="value" radius={[8,8,0,0]} fill="#6558F5"/></BarChart></ResponsiveContainer></div></div><div className="card p-4"><h2 className="mb-2 font-medium">Priority distribution</h2><div className="h-64"><ResponsiveContainer><PieChart><Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>{priorityData.map((_,index)=><Cell key={index} fill={palette[index]} stroke="#f8faff"/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div></div><div className="card p-4 xl:col-span-2"><h2 className="mb-2 font-medium">Opened vs closed</h2><div className="h-72"><ResponsiveContainer><LineChart data={trendData}><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(99,115,150,.18)"/><XAxis dataKey="date" tickLine={false}/><YAxis allowDecimals={false} width={28}/><Tooltip/><Legend/><Line type="monotone" dataKey="opened" stroke="#6558F5" strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="closed" stroke="#34d399" strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div></div></div>}</div>
}
