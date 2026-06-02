'use client'
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from 'next/navigation'
import EmployeeDrawer from './EmployeeDrawer'
import DueTodayModal from './DueTodayModal'
// ===== TYPES (match your /dashboard/manager response) =====
type Stats = {
    active_projects: number
    completed_projects: number
    active_tasks: number
    overdue_tasks: number
    total_members: number
}

type ProjectHealth = {
    id: number
    name: string
    description: string | null
    stages_total: number
    stages_done: number
    tasks_total: number
    tasks_done: number
    overdue_count: number
    progress_pct: number
    health: string
    completed: boolean
}

type TeamMember = {
    user_id: number
    name: string
    role: string
    assigned_tasks: number
    completed_this_week: number
    overdue_tasks: number
    on_time_rate: number
    active_projects: number
    workload_pct: number
    status: string
}

type EmployeeScore = {
    user_id: number
    name: string
    role: string
    is_stage_owner: boolean
    owned_stages: number
    score: number
    performance_label: string
    score_breakdown: {
        on_time_rate: number
        completion_speed: number
        consistency: number
        stage_leadership: number
        stage_contribution: number
    }
}

type OverdueTask = {
    id: number
    title: string
    priority: string
    project_name: string
    stage_name: string | null
    assignee_name: string
    assignee_id: number
    due_date: string
    days_overdue: number
}

type DashboardData = {
    stats: Stats
    projects: ProjectHealth[]
    team_performance: TeamMember[]
    employee_performance: EmployeeScore[]
    overdue_tasks: OverdueTask[]
}

// ===== SMALL INLINE ICONS (matches your inline-SVG style) =====
function Icon({ name }: { name: string }) {
    const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    switch (name) {
        case 'folder': return <svg {...common}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
        case 'check': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
        case 'clipboard': return <svg {...common}><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 4h6v3H9z" /></svg>
        case 'alert': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></svg>
        case 'group': return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 15c3 0 5 2 5 5" /></svg>
        default: return null
    }
}

function Star({ filled }: { filled: boolean }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24"
            fill={filled ? '#000000' : 'none'}
            stroke={filled ? '#000000' : '#c8c5cb'} strokeWidth="1.6">
            <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
        </svg>
    )
}

export default function ManagerDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
    const [showDueToday, setShowDueToday] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false)
    const router = useRouter()
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/')
            return
        }
        fetchData(token)
    }, [])

    async function fetchData(token: string) {
        try {
            const res = await axios.get(`${api_path}dashboard/manager`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setData(res.data)
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

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

    function statusInfo(status: string) {
        switch (status) {
            case 'available': return { label: 'Available', bar: 'bg-green-500', dot: 'bg-green-500' }
            case 'at_capacity': return { label: 'At Capacity', bar: 'bg-orange-500', dot: 'bg-orange-500' }
            case 'overloaded': return { label: 'Overloaded', bar: 'bg-red-500', dot: 'bg-red-500' }
            default: return { label: status, bar: 'bg-gray-400', dot: 'bg-gray-400' }
        }
    }

    function priorityBadge(priority: string) {
        switch (priority) {
            case 'high': return { label: 'High', cls: 'bg-red-600 text-white' }
            case 'medium': return { label: 'Med', cls: 'bg-amber-500 text-white' }
            case 'low': return { label: 'Low', cls: 'bg-gray-300 text-gray-700' }
            default: return { label: priority, cls: 'bg-gray-300 text-gray-700' }
        }
    }

    function labelInfo(label: string) {
        switch (label) {
            case 'high_performer': return { text: 'High Performer', cls: 'text-green-700' }
            case 'meets_expectations': return { text: 'Meets Expectations', cls: 'text-gray-900' }
            case 'needs_improvement': return { text: 'Needs Improvement', cls: 'text-orange-600' }
            case 'underperforming': return { text: 'Underperforming', cls: 'text-red-600' }
            default: return { text: label, cls: 'text-gray-600' }
        }
    }

    function scoreCircle(score: number) {
        if (score >= 80) return 'bg-green-50 text-green-700 border border-green-200'
        if (score >= 60) return 'bg-gray-100 text-gray-800 border border-gray-200'
        if (score >= 40) return 'bg-amber-50 text-amber-700 border border-amber-200'
        return 'bg-red-50 text-red-700 border border-red-200'
    }

    function formatDate(d: string) {
        const datePart = d.split(' ')[0]?.split('T')[0] ?? d
        return datePart
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f3f2] flex items-center justify-center">
                <p className="text-sm text-gray-400">Loading dashboard...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#f7f3f2] flex items-center justify-center">
                <p className="text-sm text-gray-400">Could not load dashboard.</p>
            </div>
        )
    }

    const { stats, projects, team_performance, employee_performance, overdue_tasks } = data

    const visibleProjects = showCompleted
    ? projects
    : projects.filter(p => !p.completed)

    const completedCount = projects.filter(p => p.completed).length

    const statCards = [
        { icon: 'folder', value: stats.active_projects, label: 'Active Projects', danger: false },
        { icon: 'check', value: stats.completed_projects, label: 'Completed', danger: false },
        { icon: 'clipboard', value: stats.active_tasks, label: 'Active Tasks', danger: false },
        { icon: 'alert', value: stats.overdue_tasks, label: 'Overdue Tasks', danger: true },
        { icon: 'group', value: stats.total_members, label: 'Total Team', danger: false },
    ]

    return (
        <div className="min-h-screen bg-[#f7f3f2]">

            {/* FIXED HEADER */}
            <header className="fixed top-0 right-0 left-18 h-16 bg-[#f7f3f2] flex justify-between items-center px-8 z-40">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm cursor-pointer hover:text-gray-600" onClick={() => router.push('/projects')}>Projects</span>
                    <span className="text-gray-300 text-sm">›</span>
                    <span className="text-gray-400 text-sm">FlowBoard</span>
                    <span className="text-gray-300 text-sm">›</span>
                    <span className="text-sm font-bold text-gray-900">Manager Dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowDueToday(true)}
                        className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        Due Today
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">👤</div>
                </div>
            </header>

            {/* PAGE CONTENT */}
            <div className="mt-16 px-8 py-6 max-w-7xl mx-auto space-y-8">

                {/* ===== 1. HEADER STATS ===== */}
                <section className="flex gap-4 overflow-x-auto pb-1">
                    {statCards.map(card => (
                        <div
                            key={card.label}
                            className={`min-w-45 flex-1 rounded-[28px] p-5 flex flex-col items-center text-center shadow-sm border
                                ${card.danger ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}
                        >
                            <div className={`mb-2 ${card.danger ? 'text-red-600' : 'text-gray-500'}`}>
                                <Icon name={card.icon} />
                            </div>
                            <div className={`text-4xl font-black mb-1 ${card.danger ? 'text-red-600' : 'text-gray-900'}`}>
                                {String(card.value).padStart(2, '0')}
                            </div>
                            <div className={`text-[11px] font-bold uppercase tracking-wider ${card.danger ? 'text-red-600' : 'text-gray-400'}`}>
                                {card.label}
                            </div>
                        </div>
                    ))}
                </section>

                {/* ===== 2. PROJECTS HEALTH + TEAM WORKLOAD ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* PROJECTS HEALTH */}
                    <section className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl font-bold text-gray-900">Projects Health</h2>
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <span className={`w-9 h-5 rounded-full transition-colors relative ${showCompleted ? 'bg-black' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${showCompleted ? 'left-4.5' : 'left-0.5'}`} />
                                </span>
                                {showCompleted ? 'Hiding nothing' : `Hidden: ${completedCount} done`}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {visibleProjects.length === 0 ? (
                                <div className="bg-white rounded-3xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
                                    No active projects to show.
                                </div>
                            ) : visibleProjects.map(p => {
                                const badge = healthBadge(p.health)
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => router.push(`/projects/${p.id}/stages`)}
                                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-gray-300 transition-all cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start gap-4 mb-5">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                                                <p className="text-sm text-gray-400 max-w-md line-clamp-1">
                                                    {p.description || 'No description'}
                                                </p>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mb-4">
                                            <div className="h-full bg-black rounded-full transition-all duration-500" style={{ width: `${p.progress_pct}%` }} />
                                        </div>

                                        <div className="grid grid-cols-3 text-center pt-3 border-t border-gray-100">
                                            <div>
                                                <div className="font-bold text-gray-900">{p.stages_done}/{p.stages_total}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">Stages</div>
                                            </div>
                                            <div className="border-x border-gray-100">
                                                <div className="font-bold text-gray-900">{p.tasks_done}/{p.tasks_total}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">Tasks</div>
                                            </div>
                                            <div>
                                                <div className={`font-bold ${p.overdue_count > 0 ? 'text-red-600' : 'text-gray-900'}`}>{p.overdue_count}</div>
                                                <div className={`text-[10px] uppercase font-bold ${p.overdue_count > 0 ? 'text-red-600' : 'text-gray-400'}`}>Overdue</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* TEAM WORKLOAD */}
                    <section className="lg:col-span-4 space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 px-1">Team Workload</h2>
                        <div className="space-y-4">
                            {team_performance.map(m => {
                                const s = statusInfo(m.status)
                                return (
                                    <div key={m.user_id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                                    style={{ backgroundColor: avatarColor(m.name) }}>
                                                    {initials(m.name)}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${s.dot}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{m.name}</h4>
                                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">{m.role}</span>
                                            </div>
                                        </div>

                                        <div className="mb-5">
                                            <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1.5">
                                                <span>Workload Capacity</span>
                                                <span>{m.workload_pct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${m.workload_pct}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#f7f3f2] p-3 rounded-2xl text-center">
                                                <div className="font-bold text-gray-900">{m.assigned_tasks}</div>
                                                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Assigned</div>
                                            </div>
                                            <div className="bg-[#f7f3f2] p-3 rounded-2xl text-center">
                                                <div className="font-bold text-gray-900">{m.on_time_rate}%</div>
                                                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">On-Time</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                </div>

                {/* ===== 3. OVERDUE TASKS ===== */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-bold text-gray-900">Critical Overdue Tasks</h2>
                        {overdue_tasks.length > 0 && (
                            <span className="text-red-600 font-bold text-sm flex items-center gap-1">
                                ⚠ {overdue_tasks.length} Action Required
                            </span>
                        )}
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-175">
                                <thead className="bg-[#f7f3f2] border-b border-gray-200">
                                    <tr>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Priority</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Task Details</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Assignee</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Delay</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {overdue_tasks.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">No overdue tasks 🎉</td></tr>
                                    ) : (
                                        overdue_tasks.map(t => {
                                            const pri = priorityBadge(t.priority)
                                            return (
                                                <tr
                                                    key={t.id}
                                                    onClick={() => router.push(`/tasks/${t.id}`)}
                                                    className="hover:bg-red-50/40 transition-colors cursor-pointer"
                                                >
                                                    <td className="p-5">
                                                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${pri.cls}`}>{pri.label}</span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="font-bold text-gray-900">{t.title}</div>
                                                        <div className="text-[12px] text-gray-400">
                                                            {t.project_name}{t.stage_name ? ` • ${t.stage_name}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                                                                style={{ backgroundColor: avatarColor(t.assignee_name) }}>
                                                                {initials(t.assignee_name)}
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-700">{t.assignee_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <span className="px-4 py-1 bg-red-100 text-red-600 rounded-full font-bold text-[12px] whitespace-nowrap">
                                                            {t.days_overdue} {t.days_overdue === 1 ? 'day' : 'days'} overdue
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ===== 4. EMPLOYEE PERFORMANCE KPI (LAST) ===== */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 px-1">Employee Performance KPIs</h2>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-200">
                                <thead className="bg-[#f7f3f2] border-b border-gray-200">
                                    <tr>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Name &amp; Role</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">Owner</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">KPI Score</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Score Breakdown</th>
                                        <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employee_performance.map(e => {
                                        const lbl = labelInfo(e.performance_label)
                                        const b = e.score_breakdown
                                        const segments = [
                                            { v: b.on_time_rate, cls: 'bg-black', label: 'On-time' },
                                            { v: b.completion_speed, cls: 'bg-black/70', label: 'Speed' },
                                            { v: b.consistency, cls: 'bg-black/50', label: 'Consistency' },
                                            { v: b.stage_leadership, cls: 'bg-gray-500', label: 'Leadership' },
                                            { v: b.stage_contribution, cls: 'bg-gray-400', label: 'Contribution' },
                                        ]
                                        return (
                                            <tr
                                                key={e.user_id}
                                                onClick={() => setSelectedEmployee(e.user_id)}
                                                className="hover:bg-[#f7f3f2] transition-colors cursor-pointer group"
                                            >
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                            style={{ backgroundColor: avatarColor(e.name) }}>
                                                            {initials(e.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-black">{e.name}</div>
                                                            <div className="text-[12px] text-gray-400 capitalize">{e.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex justify-center" title={e.is_stage_owner ? `${e.owned_stages} stages owned` : 'Not a stage owner'}>
                                                        <Star filled={e.is_stage_owner} />
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full font-bold ${scoreCircle(e.score)}`}>
                                                        {Math.round(e.score)}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex gap-0.5 h-2 w-48 rounded-full overflow-hidden bg-gray-200">
                                                        {segments.map((seg, i) => (
                                                            <div key={i} className={seg.cls} style={{ width: `${seg.v}%` }} title={`${seg.label}: ${seg.v}`} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`text-[12px] font-bold uppercase tracking-wide ${lbl.cls}`}>{lbl.text}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                {/* Employee detail drawer */}
            <EmployeeDrawer
                userId={selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
            />
            {/* Due today modal */}
                <DueTodayModal
                    open={showDueToday}
                    onClose={() => setShowDueToday(false)}
                />
            </div>
        </div>
    )
}