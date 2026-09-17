import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarCheck, Check, ChevronRight, Circle, ExternalLink, Flame, LayoutDashboard, RotateCcw, Route, Trophy } from 'lucide-react'
import problemsData from './problems.json'
import planData from './plan.json'

type Problem = {
  id: number; slug: string; topic: string; title: string; difficulty: string;
  concepts: string[]; approaches: string; source: string;
}
type DayPlan = { day: number; week: number; focus: string; problemIds: number[]; review: string; block: string; dayType?: string; conceptLesson?: string; learningGoals?: string; reviewPlan?: string; problems?: { id: number; title: string; mode: string }[] }
type ProblemProgress = {
  completed?: boolean; completedAt?: string; mastery?: number; checklist?: Record<string, boolean>;
  reviews?: { due: string; kind: string; done?: boolean }[];
}
type Progress = Record<string, ProblemProgress>

const problems = problemsData as Problem[]
const plan = planData as DayPlan[]
const STORAGE = 'neetcode-study-progress-v1'
const DAY = 24 * 60 * 60 * 1000
const steps = [
  'Understand the problem and constraints',
  'Derive a brute-force approach',
  'Analyze time and space complexity',
  'Identify the bottleneck',
  'Study and compare alternative approaches',
  'Implement independently in Python',
  'Test edge cases and explain correctness',
  'Write the transferable pattern in your own words',
]

function datePlus(iso: string, days: number) {
  const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10)
}
function todayISO() { return new Date().toISOString().slice(0, 10) }

export default function App() {
  const [page, setPage] = useState<'today'|'study'|'review'|'roadmap'|'progress'>('today')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [progress, setProgress] = useState<Progress>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') } catch { return {} }
  })
  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(progress)) }, [progress])

  const completedCount = problems.filter(p => progress[p.id]?.completed).length
  const currentProblem = problems.find(p => !progress[p.id]?.completed) ?? problems[problems.length - 1]
  const currentDay = plan.find(d => d.problemIds.some(id => !progress[id]?.completed)) ?? plan[plan.length - 1]
  const dueReviews = useMemo(() => problems.flatMap(p =>
    (progress[p.id]?.reviews || [])
      .filter(r => !r.done && r.due <= todayISO())
      .map(r => ({...r, problem: p}))
  ), [progress])

  function openStudy(id: number) { setSelectedId(id); setPage('study') }
  function toggleStep(id: number, step: string) {
    setProgress(prev => {
      const pp = prev[id] || {}
      return {...prev, [id]: {...pp, checklist: {...(pp.checklist || {}), [step]: !pp.checklist?.[step]}}}
    })
  }
  function completeProblem(id: number) {
    const now = new Date().toISOString()
    const base = now.slice(0,10)
    setProgress(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}), completed: true, completedAt: now,
        mastery: Math.max(prev[id]?.mastery || 0, 2),
        reviews: prev[id]?.reviews?.length ? prev[id].reviews : [
          {due: datePlus(base, 2), kind: 'D+2 conceptual review'},
          {due: datePlus(base, 7), kind: 'D+7 independent re-derivation'},
        ],
      }
    }))
    setPage('today')
  }
  function markReview(problemId: number, due: string, mastery: number) {
    setProgress(prev => {
      const pp = prev[problemId] || {}
      return {...prev, [problemId]: {...pp, mastery, reviews: (pp.reviews || []).map(r => r.due === due ? {...r, done: true} : r)}}
    })
  }

  const selected = problems.find(p => p.id === selectedId) || currentProblem

  return <div className="app">
    <aside>
      <div className="brand"><div className="brandmark">N</div><div><b>NeetCode Study</b><small>DSA rebuild curriculum</small></div></div>
      <nav>
        <Nav active={page==='today'} icon={<LayoutDashboard size={18}/>} label="Today" onClick={()=>setPage('today')}/>
        <Nav active={page==='review'} icon={<RotateCcw size={18}/>} label="Review" badge={dueReviews.length} onClick={()=>setPage('review')}/>
        <Nav active={page==='roadmap'} icon={<Route size={18}/>} label="Roadmap" onClick={()=>setPage('roadmap')}/>
        <Nav active={page==='progress'} icon={<Trophy size={18}/>} label="Progress" onClick={()=>setPage('progress')}/>
      </nav>
      <div className="side-progress">
        <div><span>Overall</span><strong>{completedCount}/150</strong></div>
        <div className="bar"><i style={{width:`${completedCount/150*100}%`}}/></div>
        <small>{Math.round(completedCount/150*100)}% studied</small>
      </div>
    </aside>

    <main>
      {page === 'today' && <Today currentDay={currentDay} currentProblem={currentProblem} due={dueReviews.length} openStudy={openStudy} progress={progress}/>}
      {page === 'study' && <Study p={selected} pp={progress[selected.id] || {}} toggleStep={toggleStep} complete={()=>completeProblem(selected.id)} back={()=>setPage('today')}/>}
      {page === 'review' && <Review due={dueReviews} mark={markReview}/>}
      {page === 'roadmap' && <Roadmap progress={progress} openStudy={openStudy}/>}
      {page === 'progress' && <ProgressView progress={progress}/>}
    </main>
  </div>
}

function Nav({active, icon, label, badge, onClick}:{active:boolean,icon:any,label:string,badge?:number,onClick:()=>void}) {
  return <button className={active?'nav active':'nav'} onClick={onClick}>{icon}<span>{label}</span>{!!badge && <em>{badge}</em>}</button>
}

function Today({currentDay,currentProblem,due,openStudy,progress}:{currentDay:DayPlan,currentProblem:Problem,due:number,openStudy:(id:number)=>void,progress:Progress}) {
  const dayProblems = currentDay.problemIds.map(id=>problems.find(p=>p.id===id)!).filter(Boolean)
  return <>
    <header><div><p className="eyebrow">WEEK {currentDay.week} · DAY {currentDay.day}</p><h1>Today's study</h1><p>{currentDay.focus} · Build understanding before speed.</p></div><div className="streak"><Flame size={18}/> Keep the chain going</div></header>
    <section className="hero">
      <div><span className="pill">CURRENT STEP</span><h2>{currentProblem.title}</h2><p>{currentProblem.concepts.join(' · ')}</p></div>
      <button className="primary" onClick={()=>openStudy(currentProblem.id)}>Continue study <ChevronRight size={18}/></button>
    </section>
    <div className="grid2">
      <section className="card"><div className="section-title"><BookOpen size={19}/><h3>Learn today</h3></div>
        {dayProblems.map(p=><button className="problem-row" key={p.id} onClick={()=>openStudy(p.id)}>
          {progress[p.id]?.completed ? <Check className="done" size={20}/> : <Circle size={20}/>}
          <div><b>{p.title}</b><small>{p.topic} · {p.difficulty}</small></div><ChevronRight size={17}/>
        </button>)}
      </section>
      <section className="card"><div className="section-title"><CalendarCheck size={19}/><h3>Reviews due</h3></div>
        {due ? <><div className="big-number">{due}</div><p>Conceptual or independent reviews are ready.</p></> :
        <div className="empty"><Check size={24}/><b>You're caught up</b><p>No reviews due today.</p></div>}
      </section>
    </div>
    <section className="card schedule"><h3>Suggested 4–5 hour block</h3><p>{currentDay.block}</p><div className="note"><b>Today's reminder</b> The goal is not to memorize code. Derive the brute force, find the bottleneck, then understand why the better data structure or algorithm removes it.</div></section>
  </>
}

function Study({p,pp,toggleStep,complete,back}:{p:Problem,pp:ProblemProgress,toggleStep:(id:number,s:string)=>void,complete:()=>void,back:()=>void}) {
  const doneSteps = steps.filter(s=>pp.checklist?.[s]).length
  return <>
    <button className="back" onClick={back}>← Today</button>
    <header><div><p className="eyebrow">{p.topic} · {p.difficulty}</p><h1>{p.title}</h1><p>Learn the reasoning, not the final code.</p></div>
      <a className="secondary" href={p.source} target="_blank" rel="noreferrer">Open NeetCode <ExternalLink size={16}/></a>
    </header>
    <div className="study-layout">
      <section className="card">
        <div className="section-title"><BookOpen size={19}/><h3>Learning workflow</h3><span>{doneSteps}/{steps.length}</span></div>
        {steps.map((s,i)=><label className="check-row" key={s}><input type="checkbox" checked={!!pp.checklist?.[s]} onChange={()=>toggleStep(p.id,s)}/><span><small>STEP {i+1}</small>{s}</span></label>)}
      </section>
      <div>
        <section className="card"><h3>Concepts to learn</h3><div className="chips">{p.concepts.map(c=><span key={c}>{c}</span>)}</div></section>
        <section className="card"><h3>Approaches & complexity</h3><p className="approaches">{p.approaches}</p><p className="hint">Before reading this, try to state the brute-force method and its bottleneck yourself.</p></section>
        <section className="card finish"><h3>Ready to complete?</h3><p>Complete only when you can explain the approaches and complexity without relying on memorized code.</p><button className="primary" onClick={complete}>Complete problem <Check size={17}/></button></section>
      </div>
    </div>
  </>
}

function Review({due,mark}:{due:any[],mark:(id:number,due:string,m:number)=>void}) {
  return <><header><div><p className="eyebrow">SPACED REVIEW</p><h1>Review queue</h1><p>Re-derive the reasoning. Do not start by rewriting memorized code.</p></div></header>
    {due.length===0 ? <section className="card empty"><Check size={28}/><h3>No reviews due</h3><p>Your queue is clear.</p></section> :
    due.map(x=><section className="card review-card" key={`${x.problem.id}-${x.due}`}><div><span className="pill">{x.kind}</span><h3>{x.problem.title}</h3><p>Explain brute force → bottleneck → better approach → complexity → transferable signal.</p></div><div className="mastery">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>mark(x.problem.id,x.due,n)}>{n}</button>)}</div></section>)}
  </>
}

function Roadmap({progress,openStudy}:{progress:Progress,openStudy:(id:number)=>void}) {
  const topics=[...new Set(problems.map(p=>p.topic))]
  return <><header><div><p className="eyebrow">150 PROBLEMS</p><h1>Roadmap</h1><p>Use this to inspect the curriculum; Today decides what comes next.</p></div></header>
    {topics.map(t=>{const ps=problems.filter(p=>p.topic===t); const done=ps.filter(p=>progress[p.id]?.completed).length; return <section className="card topic" key={t}><div className="topic-head"><div><h3>{t}</h3><p>{done}/{ps.length} studied</p></div><div className="bar small"><i style={{width:`${done/ps.length*100}%`}}/></div></div>
      <div className="topic-problems">{ps.map(p=><button key={p.id} onClick={()=>openStudy(p.id)} className={progress[p.id]?.completed?'mini done-bg':'mini'}>{progress[p.id]?.completed?<Check size={15}/>:<Circle size={15}/>}<span>{p.title}</span><small>{p.difficulty}</small></button>)}</div>
    </section>})}
  </>
}

function ProgressView({progress}:{progress:Progress}) {
  const completed=problems.filter(p=>progress[p.id]?.completed)
  const mastered=problems.filter(p=>(progress[p.id]?.mastery||0)>=4)
  const topics=[...new Set(problems.map(p=>p.topic))]
  return <><header><div><p className="eyebrow">LEARNING, NOT CHECKBOXES</p><h1>Progress</h1><p>Track what you can independently derive, not only what you have seen.</p></div></header>
    <div className="stats"><Stat n={completed.length} label="Studied"/><Stat n={mastered.length} label="Independent / mastered"/><Stat n={150-completed.length} label="Remaining"/></div>
    <section className="card"><h3>Topic mastery</h3>{topics.map(t=>{const ps=problems.filter(p=>p.topic===t);const d=ps.filter(p=>progress[p.id]?.completed).length;return <div className="progress-row" key={t}><span>{t}</span><div className="bar"><i style={{width:`${d/ps.length*100}%`}}/></div><b>{d}/{ps.length}</b></div>})}</section>
  </>
}
function Stat({n,label}:{n:number,label:string}) { return <section className="stat"><strong>{n}</strong><span>{label}</span></section> }
