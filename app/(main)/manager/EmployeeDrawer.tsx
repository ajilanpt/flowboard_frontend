'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

// ===== TYPES (match GET /dashboard/employee/{id}) =====
type EmployeeDetail = {
    profile: {
        user_id: number
        name: string
        role: string
        is_stage_owner: boolean
        owned_stages: number
    }
    score: {
        total: number
        performance_label: string
        breakdown: {
            on_time_rate: number
            completion_speed: number
            consistency: number
            stage_leadership: number
            stage_contribution: number
        }
    }
    task_stats: {
        total_assigned: number
        active: number
        completed: number
        overdue: number
        on_time_rate: number
        avg_days_early: number
    }
    owned_stages_detail: {
        stage_id: number
        stage_name: string
        project_name: string
        tasks_total: number
        tasks_done: number
        overdue_count: number
        progress_pct: number
        health: string
    }[]
    overdue_tasks: {
        id: number
        title: string
        priority: string
        project_name: string
        stage_name: string | null
        due_date: string
        days_overdue: number
    }[]
    recent_completed: {
        id: number
        title: string
        project_name: string
        completed_on: string
    }[]
}

type Props = {
    userId: number | null
    onClose: () => void
}

export default function EmployeeDrawer({ userId, onClose }: Props) {
    const [detail, setDetail] = useState<EmployeeDetail | null>(null)
    const [loading, setLoading] = useState(false)
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'
    const open = userId !== null

    useEffect(() => {
        if (userId === null) return
        const token = localStorage.getItem('token')
        if (!token) return
        setLoading(true)
        setDetail(null)
        axios.get(`${api_path}dashboard/employee/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setDetail(res.data))
            .catch(err => console.error('Error loading employee detail:', err))
            .finally(() => setLoading(false))
    }, [userId])

    // ===== HELPERS =====
    function initials(name: string) {
        return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    }
    const avatarColors = ['#4C6FFF', '#8b5cf6', '#f59e0b', '#10b981', '#FF6B6B', '#06b6d4']
    function avatarColor(name: string) {
        return avatarColors[name.charCodeAt(0) % avatarColors.length]
    }
    function healthBadge(health: string) {
        switch (health) {
            case 'on_track': return { label: 'On Track', cls: 'bg-green-100 text-green-700' }
            case 'off_track': return { label: 'Off Track', cls: 'bg-yellow-100 text-yellow-700' }
            case 'at_risk': return { label: 'At Risk', cls: 'bg-orange-100 text-orange-700' }
            case 'behind_schedule': return { label: 'Behind', cls: 'bg-red-100 text-red-700' }
            default: return { label: health, cls: 'bg-gray-100 text-gray-600' }
        }
    }
    function priorityDot(priority: string) {
        switch (priority) {
            case 'high': return 'bg-red-600'
            case 'medium': return 'bg-amber-500'
            case 'low': return 'bg-gray-400'
            default: return 'bg-gray-400'
        }
    }
    function labelInfo(label: string) {
        switch (label) {
            case 'high_performer': return { text: 'High Performer', cls: 'bg-green-100 text-green-700' }
            case 'meets_expectations': return { text: 'Meets Expectations', cls: 'bg-gray-100 text-gray-800' }
            case 'needs_improvement': return { text: 'Needs Improvement', cls: 'bg-orange-100 text-orange-700' }
            case 'underperforming': return { text: 'Underperforming', cls: 'bg-red-100 text-red-700' }
            default: return { text: label, cls: 'bg-gray-100 text-gray-600' }
        }
    }
    function formatDate(d: string) {
        return d.split(' ')[0]?.split('T')[0] ?? d
    }

    return (
        <div
            className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
            aria-hidden={!open}
        >
            {/* BACKDROP */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* PANEL */}
            <div
                className={`absolute top-0 right-0 h-full w-full max-w-md bg-[#f7f3f2] shadow-2xl
                    transition-transform duration-300 ease-out overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {loading && (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-gray-400">Loading...</p>
                    </div>
                )}

                {!loading && detail && (
                    <div className="p-6 space-y-6">

                        {/* ===== HEADER ===== */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                                    style={{ backgroundColor: avatarColor(detail.profile.name) }}>
                                    {initials(detail.profile.name)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{detail.profile.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 capitalize">{detail.profile.role}</span>
                                        {detail.profile.is_stage_owner && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                ★ {detail.profile.owned_stages} stages
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xl"
                            >×</button>
                        </div>

                        {/* ===== SCORE ===== */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-5 mb-5">
                                <div className="text-5xl font-black text-gray-900">{Math.round(detail.score.total)}</div>
                                <div>
                                    <div className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">KPI Score</div>
                                    <span className={`text-[12px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${labelInfo(detail.score.performance_label).cls}`}>
                                        {labelInfo(detail.score.performance_label).text}
                                    </span>
                                </div>
                            </div>

                           {/* breakdown bar */}
<div className="flex gap-1 h-2.5 w-full rounded-full overflow-hidden mb-4">
    {[
        { earned: detail.score.breakdown.on_time_rate,       max: 25, dark: 'bg-black' },
        { earned: detail.score.breakdown.completion_speed,   max: 20, dark: 'bg-black/70' },
        { earned: detail.score.breakdown.consistency,        max: 15, dark: 'bg-black/50' },
        { earned: detail.score.breakdown.stage_leadership,   max: 25, dark: 'bg-gray-500' },
        { earned: detail.score.breakdown.stage_contribution, max: 15, dark: 'bg-gray-400' },
    ].map((seg, i) => (
        <div key={i} className="flex rounded-full overflow-hidden" style={{ width: `${seg.max}%` }}>
            <div className={seg.dark} style={{ width: `${(seg.earned / seg.max) * 100}%` }} />
            <div className="bg-gray-200 flex-1" />
        </div>
    ))}
</div>

{/* breakdown legend */}
<div className="space-y-1.5">
    {[
        { c: 'bg-black',    label: 'On-time rate',        v: detail.score.breakdown.on_time_rate,       max: 25 },
        { c: 'bg-black/70', label: 'Completion speed',    v: detail.score.breakdown.completion_speed,   max: 20 },
        { c: 'bg-black/50', label: 'Consistency',         v: detail.score.breakdown.consistency,        max: 15 },
        { c: 'bg-gray-500', label: 'Stage leadership',    v: detail.score.breakdown.stage_leadership,   max: 25 },
        { c: 'bg-gray-400', label: 'Stage contribution',  v: detail.score.breakdown.stage_contribution, max: 15 },
    ].map(item => (
        <div key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.c}`} />
                <span className="text-gray-600">{item.label}</span>
            </div>
            <span className="font-bold text-gray-900">
                {item.v}
                <span className="font-normal text-gray-300"> / {item.max}</span>
            </span>
        </div>
    ))}
</div>
                        {/* ===== TASK STATS ===== */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">Task Stats</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <StatBox label="Assigned" value={detail.task_stats.total_assigned} />
                                <StatBox label="Active" value={detail.task_stats.active} />
                                <StatBox label="Completed" value={detail.task_stats.completed} />
                                <StatBox label="Overdue" value={detail.task_stats.overdue} danger={detail.task_stats.overdue > 0} />
                                <StatBox label="On-Time" value={`${detail.task_stats.on_time_rate}%`} />
                                <DaysEarlyBox value={detail.task_stats.avg_days_early} />
                            </div>
                        </div>

                        {/* ===== OWNED STAGES ===== */}
                        {detail.owned_stages_detail.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">
                                    Owned Stages ({detail.owned_stages_detail.length})
                                </h3>
                                <div className="space-y-2">
                                    {detail.owned_stages_detail.map(s => {
                                        const badge = healthBadge(s.health)
                                        return (
                                            <div key={s.stage_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{s.stage_name}</div>
                                                        <div className="text-[11px] text-gray-400">{s.project_name}</div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                                                    <div className="h-full bg-black rounded-full" style={{ width: `${s.progress_pct}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[11px] text-gray-400">
                                                    <span>{s.tasks_done}/{s.tasks_total} tasks</span>
                                                    {s.overdue_count > 0 && <span className="text-red-600 font-bold">{s.overdue_count} overdue</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===== OVERDUE TASKS ===== */}
                        {detail.overdue_tasks.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">
                                    Overdue Tasks ({detail.overdue_tasks.length})
                                </h3>
                                <div className="space-y-2">
                                    {detail.overdue_tasks.map(t => (
                                        <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot(t.priority)}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 text-sm truncate">{t.title}</div>
                                                <div className="text-[11px] text-gray-400">
                                                    {t.project_name}{t.stage_name ? ` • ${t.stage_name}` : ''}
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">
                                                {t.days_overdue === 0 ? 'Due today' : `${t.days_overdue}d overdue`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ===== RECENT COMPLETED ===== */}
                        {detail.recent_completed.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">Recently Completed</h3>
                                <div className="space-y-2">
                                    {detail.recent_completed.map(t => (
                                        <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] shrink-0">✓</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 text-sm truncate">{t.title}</div>
                                                <div className="text-[11px] text-gray-400">{t.project_name}</div>
                                            </div>
                                            <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(t.completed_on)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    )
}

// ===== SMALL HELPER COMPONENTS =====
function StatBox({ label, value, danger = false }: { label: string, value: string | number, danger?: boolean }) {
    return (
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <div className={`text-lg font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
            <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{label}</div>
        </div>
    )
}

function DaysEarlyBox({ value }: { value: number }) {
    const text = value > 0 ? `${value}d early` : value < 0 ? `${Math.abs(value)}d late` : 'On time'
    const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-900'
    return (
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <div className={`text-lg font-bold ${color}`}>{text}</div>
            <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Avg Speed</div>
        </div>
    )
}
