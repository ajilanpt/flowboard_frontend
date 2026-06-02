'use client'
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

type Task = {
    id: number
    title: string
    description: string
    priority: "low" | "medium" | "high"
    status: "pending" | "in_progress" | "done"
    due_date: string
    project_id: number
    project_name: string
    stage_id: number
    stage_name: string
    assigned_to_id: number
    created_by_id: number
    created_at: string
}

type User = {
    id: number
    name: string
}

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<Task['status']>('pending')
    const [usr, setUsr] = useState<User | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [users, setUsers] = useState<{ id: number, name: string }[]>([])
    const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to_id: '',
    assigned_name: '',
    assign_to_self: true,   // ✅ new
})
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'
    const router = useRouter()

    const pendingCount = tasks.filter(t => t.status === 'pending').length
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
    const doneCount = tasks.filter(t => t.status === 'done').length

    function getPriorityBar(priority: Task['priority']) {
        if (priority === 'high') return 'border-orange-400'
        if (priority === 'medium') return 'border-blue-400'
        return 'border-green-400'
    }

    function getPriorityDot(priority: Task['priority']) {
        if (priority === 'high') return 'bg-red-400'
        if (priority === 'medium') return 'bg-blue-400'
        return 'bg-green-400'
    }

    function getPriorityText(priority: Task['priority']) {
        if (priority === 'high') return 'text-orange-500'
        if (priority === 'medium') return 'text-blue-500'
        return 'text-green-500'
    }

    function getPriorityLabel(priority: Task['priority']) {
        if (priority === 'high') return 'High Priority'
        if (priority === 'medium') return 'Medium'
        return 'Low'
    }

    async function fetchUser(token: string) {
        try {
            const response = await axios.get(`${api_path}users/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setUsr(response.data)
        } catch (error) {
            console.error('Error fetching user:', error)
        }
    }

    async function fetchTasks(token: string) {
        try {
            const response = await axios.get(`${api_path}tasks/my_work`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setTasks(response.data)
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchUsers(token: string) {
        try {
            const response = await axios.get(`${api_path}users/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setUsers(response.data)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    async function createTask() {
        const token = localStorage.getItem('token')
        if (!token || !usr) return
        setCreating(true)
        try {
            await axios.post(`${api_path}tasks/`, {
                title: form.title,
                description: form.description,
                priority: form.priority,
                due_date: form.due_date || null,
                assigned_to_id: form.assign_to_self ? usr.id : Number(form.assigned_to_id),
                created_by_id: usr.id
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setShowModal(false)
            setForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to_id: '', assigned_name: '',assign_to_self: true })
            fetchTasks(token)
        } catch (error) {
            console.error('Error creating task:', error)
        } finally {
            setCreating(false)
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            fetchTasks(token)
            fetchUser(token)
            fetchUsers(token)
        } else {
            setLoading(false)
        }
    }, [])

    const filteredTasks = tasks.filter(task => task.status === filter)

    return (
        <div className="min-h-screen bg-[#F6F1EE] mr-0 px-10">

            <div className="px-8 py-8">

                {/* Greeting */}
                <h1 className="text-3xl font-bold text-gray-900">
                    Good morning, {usr?.name}
                </h1>
                <p className="text-gray-500 mt-1 mb-6">
                    You have <span className="font-semibold text-gray-800">{pendingCount} tasks</span> pending for today.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 my-6">
                    <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-red-400">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Pending</p>
                        <p className="text-4xl font-bold text-gray-900">{String(pendingCount).padStart(2, '0')}</p>
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-yellow-400">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">In Progress</p>
                        <p className="text-4xl font-bold text-gray-900">{String(inProgressCount).padStart(2, '0')}</p>
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-green-400">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Done</p>
                        <p className="text-4xl font-bold text-gray-900">{String(doneCount).padStart(2, '0')}</p>
                    </div>
                </div>
                {/* Filter tabs */}
                <div className="flex gap-2 bg-[#ECE7E3] p-1 rounded-full w-fit mb-8">
                    {[
                        ['pending', 'Pending'],
                        ['in_progress', 'In Progress'],
                        ['done', 'Completed']
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value as Task['status'])}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                                filter === value
                                    ? 'bg-white text-black'
                                    : 'text-gray-500 hover:text-black'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Task list */}
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-gray-400 text-sm">Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-gray-400 text-sm">No tasks assigned to you.</p>
                    ) : filteredTasks.length === 0 ? (
                        <p className="text-gray-400 text-sm">No {filter.replace('_', ' ')} tasks.</p>
                    ) : (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => router.push(`/dashboard/${task.id}`)}
                                className={`bg-white rounded-3xl px-5 py-4 shadow-sm border-0 flex items-center gap-4 cursor-pointer hover:shadow-md transition border-l-4 ${getPriorityBar(task.priority)}`}
                            >
                                {/* colored left bar */}
                                
                                {/* checkbox */}
                                <div className="w-4 h-4 rounded border border-gray-300 shrink-0" />

                                {/* content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        {task.project_name && (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                                                {task.project_name}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            Due {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* priority + arrow */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
                                    <span className={`text-sm font-medium ${getPriorityText(task.priority)}`}>
                                        {getPriorityLabel(task.priority)}
                                    </span>
                                    <span className="text-gray-300 text-lg">›</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* + FAB */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 text-white rounded-full text-3xl shadow-lg hover:bg-gray-700 transition flex items-center justify-center"
            >
                +
            </button>

            {/* Create task modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">New Task</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
                        </div>
                        <div className="space-y-3">
                            <input
                                placeholder="Title"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-gray-400"
                            />
                            <textarea
                                placeholder="Description"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-gray-400 resize-none"
                            />
                            <select
                                value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-gray-400"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={e => setForm({ ...form, due_date: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-gray-400"
                            />
                            {/* Assignment toggle */}
                            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, assign_to_self: true, assigned_to_id: '', assigned_name: '' })}
                                    className={`flex-1 py-2 rounded-full text-sm font-medium transition ${form.assign_to_self ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Assign to Myself
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, assign_to_self: false })}
                                    className={`flex-1 py-2 rounded-full text-sm font-medium transition ${!form.assign_to_self ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Delegate to Team
                                </button>
                            </div>

                            {/* Person selector — only visible when Delegate is selected */}
                            {!form.assign_to_self && (
                                <select
                                    value={form.assigned_to_id}
                                    onChange={e => {
                                        const selectedUser = users.find(u => u.id === Number(e.target.value))
                                        setForm({ ...form, assigned_to_id: e.target.value, assigned_name: selectedUser?.name || '' })
                                    }}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-gray-400"
                                >
                                    <option value="">Select team member...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createTask}
                                disabled={!form.title.trim() || (!form.assign_to_self && !form.assigned_to_id) || creating}
                                className="text-sm px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                {creating ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}