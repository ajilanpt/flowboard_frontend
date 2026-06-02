'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

type DueTask = {
    id: number
    title: string
    priority: string
    status: string
    is_done: boolean
    project_name: string
    stage_name: string | null
    assignee_name: string
    assignee_id: number
    due_date: string
}

type DueTodayData = {
    date: string
    total: number
    done: number
    pending: number
    tasks: DueTask[]
}

type Props = {
    open: boolean
    onClose: () => void
}

export default function DueTodayModal({ open, onClose }: Props) {
    const [data, setData] = useState<DueTodayData | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'

    useEffect(() => {
        if (!open) return
        const token = localStorage.getItem('token')
        if (!token) return
        setLoading(true)
        setData(null)
        axios.get(`${api_path}dashboard/due-today`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setData(res.data))
            .catch(err => console.error('Error loading due today:', err))
            .finally(() => setLoading(false))
    }, [open])

    if (!open) return null

    // ===== HELPERS =====
    function initials(name: string) {
        return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    }
    const avatarColors = ['#4C6FFF', '#8b5cf6', '#f59e0b', '#10b981', '#FF6B6B', '#06b6d4']
    function avatarColor(name: string) {
        return avatarColors[name.charCodeAt(0) % avatarColors.length]
    }
    function priorityDot(priority: string) {
        switch (priority) {
            case 'high': return 'bg-red-600'
            case 'medium': return 'bg-amber-500'
            case 'low': return 'bg-gray-400'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#f7f3f2] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ===== HEADER ===== */}
                <div className="flex items-start justify-between p-6 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Due Today</h2>
                        {data && (
                            <p className="text-sm text-gray-400 mt-0.5">
                                {data.done} of {data.total} completed
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl"
                    >×</button>
                </div>

                {/* ===== PROGRESS BAR ===== */}
                {data && data.total > 0 && (
                    <div className="px-6 pb-4">
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.round((data.done / data.total) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ===== BODY ===== */}
                <div className="px-6 pb-6 overflow-y-auto flex-1">
                    {loading && (
                        <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
                    )}

                    {!loading && data && data.tasks.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">No tasks due today 🎉</p>
                    )}

                    {!loading && data && data.tasks.length > 0 && (
                        <div className="space-y-2">
                            {data.tasks.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => router.push(`/dashboard/${t.id}`)}
                                    className={`rounded-2xl p-4 shadow-sm border cursor-pointer transition-all flex items-center gap-3
                                        ${t.is_done
                                            ? 'bg-white/60 border-gray-100 hover:bg-white'
                                            : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                >
                                    {/* status indicator */}
                                    {t.is_done ? (
                                        <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[11px] shrink-0">✓</span>
                                    ) : (
                                        <span className={`w-3 h-3 rounded-full shrink-0 ${priorityDot(t.priority)}`} />
                                    )}

                                    {/* task info */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-semibold text-sm truncate ${t.is_done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {t.title}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                            {t.project_name}{t.stage_name ? ` • ${t.stage_name}` : ''}
                                        </div>
                                    </div>

                                    {/* assignee */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                                        style={{ backgroundColor: avatarColor(t.assignee_name) }}
                                        title={t.assignee_name}
                                    >
                                        {initials(t.assignee_name)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}