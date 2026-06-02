'use client'
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"

type Task = {
    id: number
    title: string
    description: string
    priority: "low" | "medium" | "high"
    status: "pending" | "in_progress" | "done"
    due_date: string
    project_id: number | null
    project_name: string | null
    stage_id: number | null
    stage_name: string | null
    assigned_to_id: number
    created_by_id: number
    created_at: string
    can_delete: boolean
}

type ActivityLog = {
    id: number
    action: string
    detail: string | null
    created_at: string
    user_name: string
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-amber-500', 'bg-cyan-500']
    const color = colors[name.charCodeAt(0) % colors.length]
    const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
    return (
        <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
            {name.charAt(0).toUpperCase()}
        </div>
    )
}

export default function TaskDetail() {
    const { id } = useParams()
    const router = useRouter()
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [assignedName, setAssignedName] = useState<string | null>(null)
    const [createdName, setCreatedName] = useState<string | null>(null)
    const [editingDesc, setEditingDesc] = useState(false)
    const [descValue, setDescValue] = useState('')
    const [savingDesc, setSavingDesc] = useState(false)
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [comment, setComment] = useState('')
    const [posting, setPosting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'

    async function handleDelete() {
        const token = localStorage.getItem('token')
        if (!token || !task) return
        setDeleting(true)
        try {
            await axios.delete(`${api_path}tasks/${task.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            router.back()   // go back to wherever they came from
        } catch (e) {
            console.error(e)
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    async function fetchTask(token: string) {
        try {
            const res = await axios.get(`${api_path}tasks/task/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            setTask(res.data)
            return res.data
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    async function fetchUser(token: string, uid: number) {
        try {
            const res = await axios.get(`${api_path}users/user/${uid}`, { headers: { Authorization: `Bearer ${token}` } })
            return res.data.name
        } catch { return null }
    }

    async function fetchactivity(token: string, tid: number) {
        try {
            const res = await axios.get(`${api_path}tasks/${tid}/activity`, { headers: { Authorization: `Bearer ${token}` } })
            setLogs(res.data)
        } catch (e) { console.error(e) }
    }

    async function postComment() {
        if (!comment.trim() || !task) return
        const token = localStorage.getItem('token')
        if (!token) return
        setPosting(true)
        try {
            await axios.post(`${api_path}tasks/${task.id}/comment`, { comment }, { headers: { Authorization: `Bearer ${token}` } })
            setComment('')
            await fetchactivity(token, task.id)
        } catch (e) { console.error(e) } finally { setPosting(false) }
    }

    async function updatetask(newsts: string) {
        const token = localStorage.getItem('token')
        if (!token || !task) return
        try {
            await axios.patch(`${api_path}tasks/${task.id}/status`, { status: newsts }, { headers: { Authorization: `Bearer ${token}` } })
            setTask({ ...task, status: newsts as Task['status'] })
            await fetchactivity(token, task.id)
        } catch (e) { console.error(e) }
    }

    async function saveDescription() {
        const token = localStorage.getItem('token')
        if (!token || !task) return
        setSavingDesc(true)
        try {
            await axios.patch(`${api_path}tasks/${task.id}/description`, { description: descValue }, { headers: { Authorization: `Bearer ${token}` } })
            setTask({ ...task, description: descValue })
            setEditingDesc(false)
        } catch (e) { console.error(e) } finally { setSavingDesc(false) }
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { router.push('/login'); return }
        fetchTask(token).then(async (t) => {
            if (!t) return
            setDescValue(t.description || '')
            const [a, c] = await Promise.all([fetchUser(token, t.assigned_to_id), fetchUser(token, t.created_by_id)])
            setAssignedName(a)
            setCreatedName(c)
            await fetchactivity(token, t.id)
        }).finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center"><p className="text-sm text-[#78767b]">Loading...</p></div>
    if (!task) return <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center"><p className="text-sm text-red-500">Task not found.</p></div>

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
    const priorityDot: Record<Task['priority'], string> = { high: 'bg-black', medium: 'bg-[#78767b]', low: 'bg-[#c8c5cb]' }

    return (
        <div className="min-h-screen bg-[#F9F7F2] px-10 " style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />

            {/* Top bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#fdf8f8] flex justify-between items-center px-10 z-40 border-b border-[#e5e2e1]">
                <div className="flex items-center gap-2 text-xs text-[#78767b]">
                    <button onClick={() => router.back()} className="hover:text-black transition ml-10">← Back</button>
                    <span className="text-[#c8c5cb]">/</span>
                    <span className="text-black font-semibold">Task Detail</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#e1dfdb] flex items-center justify-center text-xs font-bold text-[#5e5e5b]">U</div>
            </header>

            {/* Main — pt for topbar, pb for footer */}
            <main className="pt-24 px-10 pb-32 max-w-350 mx-auto">

                {/* Hero */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            {task.stage_name && (
                                <span className="px-3 py-1 bg-[#eae1d7] text-[#1f1b15] rounded-full text-xs font-semibold tracking-wide">
                                    {task.stage_name}
                                </span>
                            )}
                            <span className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
                            <span className="text-xs font-semibold text-[#47464b]">
                                Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-[#1c1b1c] leading-tight tracking-tight max-w-3xl">
                            {task.title}
                        </h1>
                    </div>

                    {/* Status segmented control */}
                    <div className="flex p-1 bg-[#f1eded] rounded-full shadow-sm w-fit shrink-0">
                        {(['pending', 'in_progress', 'done'] as Task['status'][]).map(s => (
                            <button
                                key={s}
                                onClick={() => updatetask(s)}
                                className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${task.status === s ? 'bg-white text-black shadow-sm' : 'text-[#78767b] hover:text-[#1c1b1c]'}`}
                            >
                                {s === 'pending' ? 'Pending' : s === 'in_progress' ? 'In Progress' : 'Done'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Two column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT — col-span-8 */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Meta 2x2 grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-black hover:-translate-y-0.5 transition-transform">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#78767b] mb-4">Assigned To</p>
                                <div className="flex items-center gap-3">
                                    {assignedName && <Avatar name={assignedName} size="lg" />}
                                    <p className="text-[16px] font-semibold text-[#1c1b1c]">{assignedName ?? '—'}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#5e5e5b] hover:-translate-y-0.5 transition-transform">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#78767b] mb-4">Created By</p>
                                <div className="flex items-center gap-3">
                                    {createdName && <Avatar name={createdName} size="lg" />}
                                    <div>
                                        <p className="text-[16px] font-semibold text-[#1c1b1c]">{createdName ?? '—'}</p>
                                        <p className="text-xs text-[#78767b] mt-0.5">
                                            {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 hover:-translate-y-0.5 transition-transform ${isOverdue ? 'border-[#ba1a1a]' : 'border-[#c8c5cb]'}`}>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#78767b] mb-4">Due Date</p>
                                <div className={`flex items-center gap-3 ${isOverdue ? 'text-[#ba1a1a]' : 'text-[#1c1b1c]'}`}>
                                    <span className="text-xl">📅</span>
                                    <div>
                                        <p className="text-[16px] font-semibold">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </p>
                                        {isOverdue && <p className="text-xs mt-0.5">Overdue</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#c8c5cb] hover:-translate-y-0.5 transition-transform">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#78767b] mb-4">Project</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">🗂</span>
                                    <div>
                                        <p className="text-[16px] font-semibold text-[#1c1b1c]">{task.project_name || 'Individual Task'}</p>
                                        {task.stage_name && <p className="text-xs text-[#78767b] mt-0.5">{task.stage_name}</p>}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Description */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-2xl font-semibold text-[#1c1b1c]">Description</h3>
                                {!editingDesc && (
                                    <button onClick={() => setEditingDesc(true)} className="text-xs font-semibold text-[#5f5e62] hover:text-black transition">
                                        ✎ Edit
                                    </button>
                                )}
                            </div>
                            {editingDesc ? (
                                <div>
                                    <textarea
                                        value={descValue}
                                        onChange={e => setDescValue(e.target.value)}
                                        rows={6}
                                        className="w-full border border-[#e5e2e1] rounded-xl p-4 text-sm text-[#47464b] outline-none focus:border-black resize-none transition"
                                    />
                                    <div className="flex gap-2 justify-end mt-3">
                                        <button onClick={() => { setEditingDesc(false); setDescValue(task.description || '') }} className="text-xs px-4 py-2 border border-[#e5e2e1] rounded-full text-[#78767b] hover:border-black transition">Cancel</button>
                                        <button onClick={saveDescription} disabled={savingDesc} className="text-xs px-4 py-2 bg-black text-white rounded-full hover:bg-[#313030] disabled:opacity-40 transition">{savingDesc ? 'Saving...' : 'Save'}</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-[#47464b] leading-7">{task.description || 'No description provided.'}</p>
                            )}
                        </div>

                        {/* Activity Log */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <h3 className="text-2xl font-semibold text-[#1c1b1c] mb-8">Activity Log</h3>
                            {logs.length === 0 && <p className="text-sm text-[#78767b]">No activity yet.</p>}
                            <div className="relative space-y-6">
                                {logs.length > 0 && <div className="absolute left-4.75 top-2 bottom-2 w-0.5 bg-[#f1eded]" />}
                                {logs.map(log => (
                                    <div key={log.id} className="relative pl-12 flex gap-0 items-start">
                                        <div className="absolute left-0 top-0 w-10 h-10 bg-white border-2 border-[#f1eded] rounded-full flex items-center justify-center z-10 text-sm">
                                            {log.action === 'comment' ? '💬' : log.action === 'status_changed' ? '✓' : '•'}
                                        </div>
                                        {log.action === 'comment' ? (
                                            <div className="flex-1 bg-[#f7f3f2] rounded-xl p-4">
                                                <p className="text-[13px] text-[#1c1b1c]">
                                                    <span className="font-bold">{log.user_name}</span>
                                                    <span className="text-[#78767b]"> added a comment</span>
                                                </p>
                                                <p className="text-sm text-[#47464b] mt-2 leading-relaxed">"{log.detail}"</p>
                                                <p className="text-[11px] text-[#78767b]/60 mt-3">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 py-2">
                                                <p className="text-[13px] text-[#1c1b1c]">
                                                    <span className="font-bold">{log.user_name}</span>
                                                    <span className="text-[#78767b]"> {log.action === 'status_changed' ? 'changed status to' : 'created this task'}</span>
                                                    {log.action === 'status_changed' && (
                                                        <span className="bg-[#e1dfdb] px-2 py-0.5 rounded text-xs ml-2 text-[#47464b]">{log.detail}</span>
                                                    )}
                                                </p>
                                                <p className="text-[11px] text-[#78767b]/60 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT — col-span-4 */}
                    <div className="lg:col-span-4 space-y-5">
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <h4 className="text-[16px] font-semibold text-[#1c1b1c] mb-4">Add Comment</h4>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
                                placeholder="Write a comment..."
                                rows={5}
                                className="w-full border border-[#e5e2e1] rounded-xl p-3 text-sm text-[#47464b] placeholder-[#c8c5cb] resize-none outline-none focus:border-black transition"
                            />
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={postComment}
                                    disabled={!comment.trim() || posting}
                                    className="text-xs px-5 py-2 bg-black text-white rounded-full hover:bg-[#313030] disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                                >
                                    {posting ? 'Posting...' : 'Comment'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Sticky footer — offset left to clear sidebar */}
            {/* Sticky footer — offset left to clear sidebar */}
            <footer
                className="fixed bottom-0 right-0 h-20 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 border-t border-[#f1eded] z-40 gap-4"
                style={{ left: '50px' }}
            >
                {/* LEFT — delete (only if allowed) */}
                <div>
                    {task.can_delete && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" />
                                <path d="M10 11v6M14 11v6" />
                            </svg>
                            Delete
                        </button>
                    )}
                </div>

                {/* RIGHT — your existing status button */}
                {task.status !== 'done' ? (
                    <button
                        onClick={() => updatetask(task.status === 'pending' ? 'in_progress' : 'done')}
                        className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full text-xs font-semibold hover:bg-[#313030] transition shadow-lg"
                    >
                        ✓ {task.status === 'pending' ? 'Start Working' : 'Mark as Complete'}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 px-8 py-3 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-100">
                        ✓ Completed
                    </div>
                )}
            </footer>
            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
                    onClick={() => !deleting && setShowDeleteModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Red icon */}
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" />
                                <path d="M10 11v6M14 11v6" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-bold text-[#1c1b1c] text-center mb-2">Delete task?</h3>
                        <p className="text-sm text-[#78767b] text-center leading-relaxed mb-7">
                            <span className="font-semibold text-[#47464b]">"{task.title}"</span> will be permanently removed. This cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="flex-1 px-5 py-3 border border-[#e5e2e1] rounded-full text-sm font-semibold text-[#78767b] hover:border-black hover:text-black transition disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-5 py-3 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}