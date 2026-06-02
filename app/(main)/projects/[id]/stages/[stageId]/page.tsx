'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const API = process.env.NEXT_PUBLIC_API_URL

type Task = {
  id: number
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'done'
  due_date: string | null
  created_at: string | null
  assigned_to_id: number | null
}

type Member = {
  user_id: number
  name: string
  role: string
}

type Stage = {
  id: number
  name: string
  stage_owner_id: number | null
  stage_owner_name: string | null
  project_id: number
}

const columns = [
  { key: 'pending', label: 'Pending', dot: '#5e5e5b' },
  { key: 'in_progress', label: 'In Progress', dot: '#000000' },
  { key: 'done', label: 'Done', dot: '#c8c5cb' },
]

// short date like "Aug 18"
const shortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function KanbanPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id
  const stageId = params.stageId

  const [stage, setStage] = useState<Stage | null>(null)
  const [projectName, setProjectName] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssignedTo, setTaskAssignedTo] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [showDeleteStage, setShowDeleteStage] = useState(false)
  const [deletingStage, setDeletingStage] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    setIsManager(localStorage.getItem('role') === 'manager')   // ← add this
    fetchAll(token)
  }, [])

  const fetchAll = async (token: string) => {
    const headers = { Authorization: `Bearer ${token}` }
    const [tasksRes, membersRes, userRes, stagesRes, projectRes] = await Promise.all([
      axios.get(`${API}/tasks/stage/${stageId}/kanban`, { headers }),
      axios.get(`${API}/projects/${projectId}/members`, { headers }),
      axios.get(`${API}/users/user`, { headers }),
      axios.get(`${API}/stages/${projectId}/stages`, { headers }),
      axios.get(`${API}/projects/project/${projectId}`, { headers }),
    ])
    const allTasks = [
      ...tasksRes.data.pending,
      ...tasksRes.data.in_progress,
      ...tasksRes.data.done,
    ]
    setTasks(allTasks)
    setMembers(membersRes.data)
    setCurrentUserId(userRes.data.id)
    setProjectName(projectRes.data.name)
    const currentStage = stagesRes.data.find((s: Stage) => s.id === Number(stageId))
    setStage(currentStage)
    setLoading(false)
  }

  const handleCreateTask = async () => {
    if (taskTitle.trim() === '') { alert('Please enter a task title'); return }
    setSubmitting(true)
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    try {
      await axios.post(`${API}/tasks/`, {
        title: taskTitle,
        description: taskDesc || null,
        priority: taskPriority,
        due_date: taskDueDate || null,
        project_id: Number(projectId),
        stage_id: Number(stageId),
        assigned_to_id: taskAssignedTo || null,
        created_by_id: currentUserId,
      }, { headers })
      setTaskTitle('')
      setTaskDesc('')
      setTaskPriority('medium')
      setTaskDueDate('')
      setTaskAssignedTo(0)
      setShowModal(false)
      fetchAll(token!)
    } catch (err: any) {
      console.error('Task creation failed:', err?.response?.data)
      alert('Failed to create task. Check console.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStage = async () => {
    setDeletingStage(true)
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API}/stages/${stageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      router.push(`/projects/${projectId}`)   // stage gone → back to project
    } catch (e) {
      console.error(e)
      setDeletingStage(false)
      setShowDeleteStage(false)
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const taskId = Number(draggableId)
    const newStatus = destination.droppableId as 'pending' | 'in_progress' | 'done'

    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    const token = localStorage.getItem('token')
    axios.patch(`${API}/tasks/${taskId}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8f8' }}>
      <p className="text-sm text-gray-400" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Loading...</p>
    </div>
  )

  const isOwner = currentUserId === stage?.stage_owner_id
  const memberName = (id: number | null) =>
    members.find(m => m.user_id === id)?.name ?? ''

  // ── DATE RANGE: earliest created_at → latest due_date ──
  const createdDates = tasks.map(t => t.created_at).filter(Boolean) as string[]
  const dueDates = tasks.map(t => t.due_date).filter(Boolean) as string[]
  const earliestCreated = createdDates.length
    ? new Date(Math.min(...createdDates.map(d => new Date(d).getTime())))
    : null
  const latestDue = dueDates.length
    ? new Date(Math.max(...dueDates.map(d => new Date(d).getTime())))
    : null
  const dateRange = earliestCreated && latestDue
    ? `${shortDate(earliestCreated.toISOString())} - ${shortDate(latestDue.toISOString())}`
    : 'No dates set'

  // overdue check
  const isOverdue = (d: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return new Date(d) < today
  }
  const isToday = (d: string) => {
    const today = new Date()
    const dd = new Date(d)
    return dd.toDateString() === today.toDateString()
  }

  return (
    <div className="min-h-screen" style={{ background: '#fdf8f8', fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&display=swap');`}</style>

      {/* TOP BAR */}
      <header className="fixed top-0 right-0 left-18 h-16 flex items-center justify-between px-8 z-40" style={{ background: '#fdf8f8' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm cursor-pointer hover:text-gray-700" style={{ color: '#78767b' }}
            onClick={() => router.push('/projects')}>Projects</span>
          <span style={{ color: '#c8c5cb' }}>›</span>
          <span className="text-sm cursor-pointer hover:text-gray-700" style={{ color: '#78767b' }}
            onClick={() => router.push(`/projects/${projectId}`)}>{projectName}</span>
          <span style={{ color: '#c8c5cb' }}>›</span>
          <span className="text-sm font-bold" style={{ color: '#1c1b1c' }}>{stage?.name}</span>
        </div>
      </header>

      {/* CONTENT */}
      <div className="ml-0 pt-16 min-h-screen">
        <div className="max-w-360 mx-auto px-8 py-8">

          {/* STAGE HEADER ROW */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#1c1b1c', letterSpacing: '-0.01em' }}>
                {stage?.name}
              </h1>
              <div className="flex items-center gap-4">
                {/* MEMBER STACK */}
                <div className="flex -space-x-2">
                  {members.slice(0, 3).map(m => (
                    <div key={m.user_id}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ borderColor: '#fdf8f8', background: '#e5e2e1', color: '#47464b' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {members.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                      style={{ borderColor: '#fdf8f8', background: '#ebe7e7', color: '#47464b' }}>
                      +{members.length - 3}
                    </div>
                  )}
                </div>
                <div className="h-4 w-px" style={{ background: '#c8c5cb' }} />
                {/* DATE RANGE */}
                <div className="flex items-center gap-2" style={{ color: '#47464b' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-xs font-semibold">{dateRange}</span>
                </div>
              </div>
            </div>

            {/* ADD TASK — owner only */}
            {/* ACTIONS */}
            <div className="flex items-center gap-3">
              {/* DELETE STAGE — managers only */}
              {isManager && (
                <button onClick={() => setShowDeleteStage(true)}
                  className="px-5 py-3 rounded-full flex items-center gap-2 transition-all active:scale-95"
                  style={{ background: '#ffdad6', color: '#ba1a1a' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  <span className="font-semibold text-sm">Delete Stage</span>
                </button>
              )}

              {/* ADD TASK — owner only */}
              {isOwner && (
                <button onClick={() => setShowModal(true)}
                  className="px-6 py-3 rounded-full flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg"
                  style={{ background: '#000', color: '#fff' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="font-semibold">Add task</span>
                </button>
              )}
            </div>
          </div>

          {/* KANBAN GRID */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((col) => {
                const colTasks = tasks.filter(t => t.status === col.key)
                const isDoneCol = col.key === 'done'
                return (
                  <div key={col.key} className="flex flex-col gap-4">

                    {/* COLUMN HEADER */}
                    <div className="flex items-center justify-between px-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(71,70,75,0.7)' }}>
                          {col.label}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ebe7e7', color: '#47464b' }}>
                          {colTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* DROPPABLE */}
                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex flex-col gap-4 rounded-3xl transition-colors"
                          style={{
                            minHeight: 'calc(100vh - 280px)',
                            background: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
                          }}>

                          {colTasks.map((task, index) => {
                            const mine = task.assigned_to_id === currentUserId
                            const overdue = task.due_date && !isDoneCol && isOverdue(task.due_date)
                            const today = task.due_date && !isDoneCol && isToday(task.due_date)

                            return (
                              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => router.push(`/dashboard/${task.id}`)}
                                    className="group relative p-6 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
                                    style={{
                                      ...provided.draggableProps.style,
                                      background: '#ffffff',
                                      boxShadow: snapshot.isDragging
                                        ? '0px 12px 32px rgba(0,0,0,0.12)'
                                        : '0px 4px 20px rgba(0,0,0,0.04)',
                                      opacity: isDoneCol ? 0.55 : 1,
                                      border: mine && !isDoneCol ? '2px solid rgba(0,0,0,0.06)' : '1px solid transparent',
                                    }}>

                                    {/* LEFT COLOR BAR */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5"
                                      style={{ background: isDoneCol ? '#c8c5cb' : mine ? '#5e5e5b' : '#c8c5cb' }} />

                                    {/* TOP ROW — badges + drag dots */}
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-2">
                                        {isDoneCol ? (
                                          <svg width="22" height="22" viewBox="0 0 24 24" fill="#16a34a">
                                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.3l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                                          </svg>
                                        ) : (
                                          <>
                                            {mine && (
                                              <span className="px-3 py-1 rounded-full text-[10px] font-semibold"
                                                style={{ background: '#e4e2dd', color: '#474744' }}>Yours</span>
                                            )}
                                            {/* PRIORITY BADGE */}
                                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize"
                                              style={{
                                                background: task.priority === 'high' ? '#ffdad6'
                                                  : task.priority === 'medium' ? '#fef3c7'
                                                  : '#dcfce7',
                                                color: task.priority === 'high' ? '#93000a'
                                                  : task.priority === 'medium' ? '#92660a'
                                                  : '#166534',
                                              }}>
                                              <span className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                  background: task.priority === 'high' ? '#ba1a1a'
                                                    : task.priority === 'medium' ? '#d97706'
                                                    : '#16a34a',
                                                }} />
                                              {task.priority}
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      {!isDoneCol && (
                                        <svg className="opacity-20 group-hover:opacity-60 transition-opacity" width="16" height="16" viewBox="0 0 24 24" fill="#47464b">
                                          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                                          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                                          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                                        </svg>
                                      )}
                                    </div>

                                    {/* TITLE */}
                                    <h4 className="text-lg font-semibold mb-4"
                                      style={{
                                        color: isDoneCol ? 'rgba(28,27,28,0.6)' : '#1c1b1c',
                                        textDecoration: isDoneCol ? 'line-through' : 'none',
                                      }}>
                                      {task.title}
                                    </h4>

                                    {/* FOOTER */}
                                    <div className="flex justify-between items-center">
                                      {/* date */}
                                      {isDoneCol ? (
                                        <div className="flex items-center gap-2" style={{ color: 'rgba(71,70,75,0.4)' }}>
                                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
                                          </svg>
                                          <span className="text-xs font-semibold">Completed</span>
                                        </div>
                                      ) : task.due_date ? (
                                        <div className="flex items-center gap-2"
                                          style={{ color: overdue || today ? '#ba1a1a' : 'rgba(71,70,75,0.6)' }}>
                                          {overdue || today ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M12 2L1 21h22L12 2zm0 15a1 1 0 110 2 1 1 0 010-2zm-1-7h2v5h-2v-5z" />
                                            </svg>
                                          ) : (
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
                                            </svg>
                                          )}
                                          <span className="text-xs font-semibold">
                                            {today ? 'Today' : shortDate(task.due_date)}
                                          </span>
                                        </div>
                                      ) : <div />}

                                      {/* assignee avatar */}
                                      {task.assigned_to_id && (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border"
                                          style={{ background: '#e5e2e1', color: '#47464b', borderColor: '#c8c5cb' }}>
                                          {memberName(task.assigned_to_id).charAt(0).toUpperCase() || '?'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}

                          {provided.placeholder}

                          {/* EMPTY STATE */}
                          {colTasks.length === 0 && (
                            <div className="border-2 border-dashed rounded-3xl h-32 flex flex-col items-center justify-center gap-2 transition-all"
                              style={{ borderColor: 'rgba(120,118,123,0.2)', color: 'rgba(120,118,123,0.4)' }}>
                              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-semibold">
                                {isDoneCol ? 'Drop here to finish' : 'No tasks'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#1c1b1c' }}>New Task</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
                style={{ background: '#f1eded' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* TITLE */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#47464b' }}>Title *</label>
                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full h-11 px-4 border text-sm transition-all"
                  style={{ borderRadius: '9999px', borderColor: '#c8c5cb', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#000')}
                  onBlur={(e) => (e.target.style.borderColor = '#c8c5cb')} />
              </div>

              {/* DESCRIPTION */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#47464b' }}>
                  Description <span className="normal-case font-normal" style={{ color: '#78767b' }}>(optional)</span>
                </label>
                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Add more details..." rows={3}
                  className="w-full p-4 border text-sm resize-none transition-all"
                  style={{ borderRadius: '1.25rem', borderColor: '#c8c5cb', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#000')}
                  onBlur={(e) => (e.target.style.borderColor = '#c8c5cb')} />
              </div>

              {/* PRIORITY */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#47464b' }}>Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button key={p} onClick={() => setTaskPriority(p)}
                      className="flex-1 h-9 text-xs font-semibold capitalize transition-all"
                      style={{
                        borderRadius: '9999px',
                        border: taskPriority === p ? '2px solid #000' : '2px solid #e5e2e1',
                        background: taskPriority === p ? '#000' : '#fff',
                        color: taskPriority === p ? '#fff' : '#47464b',
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* DUE DATE */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#47464b' }}>
                  Due Date <span className="normal-case font-normal" style={{ color: '#78767b' }}>(optional)</span>
                </label>
                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full h-11 px-4 border text-sm transition-all"
                  style={{ borderRadius: '9999px', borderColor: '#c8c5cb', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = '#000')}
                  onBlur={(e) => (e.target.style.borderColor = '#c8c5cb')} />
              </div>

              {/* ASSIGN TO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#47464b' }}>Assign To</label>
                <select value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(Number(e.target.value))}
                  className="w-full h-11 px-4 border text-sm transition-all"
                  style={{ borderRadius: '9999px', borderColor: '#c8c5cb', outline: 'none', background: '#fff' }}>
                  <option value={0}>Unassigned</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleCreateTask} disabled={submitting}
              className="w-full h-12 mt-6 font-semibold text-sm transition-all active:scale-95"
              style={{
                borderRadius: '9999px',
                background: submitting ? '#e5e2e1' : '#000',
                color: submitting ? '#78767b' : '#fff',
              }}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      )}

      {/* DELETE STAGE MODAL */}
      {showDeleteStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => !deletingStage && setShowDeleteStage(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}>

            {/* Red icon */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#ffdad6' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#1c1b1c' }}>Delete stage?</h3>
            <p className="text-sm text-center leading-relaxed mb-4" style={{ color: '#78767b' }}>
              <span className="font-semibold" style={{ color: '#47464b' }}>"{stage?.name}"</span> will be permanently deleted.
            </p>

            {/* Cascade warning */}
            <div className="rounded-2xl p-3 mb-6" style={{ background: '#ffdad6' }}>
              <p className="text-xs text-center leading-relaxed" style={{ color: '#93000a' }}>
                ⚠ This will also delete all <span className="font-bold">{tasks.length} tasks</span> in this stage. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteStage(false)} disabled={deletingStage}
                className="flex-1 px-5 py-3 rounded-full text-sm font-semibold border transition disabled:opacity-40"
                style={{ borderColor: '#e5e2e1', color: '#78767b' }}>
                Cancel
              </button>
              <button onClick={handleDeleteStage} disabled={deletingStage}
                className="flex-1 px-5 py-3 rounded-full text-sm font-semibold text-white transition disabled:opacity-40"
                style={{ background: '#ba1a1a' }}>
                {deletingStage ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}