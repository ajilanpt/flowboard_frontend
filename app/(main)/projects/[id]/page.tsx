'use client'
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter, useParams } from 'next/navigation'

type Stage = {
    id: number
    name: string
    description: string | null
    project_id: number
    stage_order: number
    stage_owner_id: number | null
    stage_owner_name: string | null
    total_tasks: number
    in_progress_tasks: number
    completed_tasks: number
}

type Project = {
    id: number
    name: string
    description: string | null
    total_tasks: number
    completed_tasks: number
}

type Member = {
    id: number
    user_id: number
    name: string
    role: string
    project_id: number
    joined_at: string
    status: string
}

// small reusable chevron icon
function Chevron({ up = false }: { up?: boolean }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}

export default function StagePage() {
    const [stages, setStages] = useState<Stage[]>([])
    const [project, setProject] = useState<Project | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [showFullDesc, setShowFullDesc] = useState(false)
    const [completedOpen, setCompletedOpen] = useState(false)
    const [upcomingOpen, setUpcomingOpen] = useState(false)
    const [showTeam, setShowTeam] = useState(false)
    const [isManager, setIsManager] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()
    const params = useParams()
    const projectId = params.id
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/')
            return
        }
        setIsManager(localStorage.getItem('role') === 'manager')   // ← add this
        fetchData(token)
    }, [])

    async function deleteProject() {
        const token = localStorage.getItem('token')
        if (!token) return
        setDeleting(true)
        try {
            await axios.delete(`${api_path}projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            router.push('/projects')   // project gone → leave the page
        } catch (e) {
            console.error(e)
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    async function fetchData(token: string) {
        try {
            const [projectRes, stagesRes, membersRes] = await Promise.all([
                axios.get(`${api_path}projects/project/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${api_path}stages/${projectId}/stages`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${api_path}projects/${projectId}/members`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])
            setProject(projectRes.data)
            setStages(stagesRes.data)
            setMembers(membersRes.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    function getStageStatus(stage: Stage) {
        if (stage.total_tasks === 0) return { label: 'Upcoming', color: 'bg-gray-100 text-gray-500' }
        if (stage.completed_tasks === stage.total_tasks) return { label: 'Completed', color: 'bg-green-100 text-green-700' }
        if (stage.completed_tasks > 0 || stage.in_progress_tasks > 0) return { label: 'In Progress', color: 'bg-blue-100 text-blue-700' }
        return { label: 'Upcoming', color: 'bg-gray-100 text-gray-500' }
    }

    const overallProgress = project?.total_tasks === 0
        ? 0
        : Math.round(((project?.completed_tasks ?? 0) / (project?.total_tasks ?? 1)) * 100)

    const completedStages = stages.filter(s => getStageStatus(s).label === 'Completed')
    const activeStages = stages.filter(s => getStageStatus(s).label === 'In Progress')
    const upcomingStages = stages.filter(s => getStageStatus(s).label === 'Upcoming')

    function stageProgress(stage: Stage) {
        return stage.total_tasks === 0
            ? 0
            : Math.round((stage.completed_tasks / stage.total_tasks) * 100)
    }

    // avatar color from name
    const avatarColors = ['#4C6FFF', '#8b5cf6', '#f59e0b', '#10b981', '#FF6B6B', '#06b6d4']
    function avatarColor(name: string) {
        const i = name.charCodeAt(0) % avatarColors.length
        return avatarColors[i]
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f3f2] flex items-center justify-center">
                <p className="text-sm text-gray-400">Loading...</p>
            </div>
        )
    }

    const visibleAvatars = members.slice(0, 3)
    const extraCount = members.length - visibleAvatars.length

    return (
        <div className="min-h-screen bg-[#f7f3f2]">

            {/* FIXED HEADER */}
            {/* FIXED HEADER */}
            <header className="fixed top-0 right-0 left-18 h-16 bg-[#f7f3f2] flex justify-between items-center px-8 z-40">
                <div className="flex items-center gap-2">
                    <span
                        className="text-gray-400 text-sm cursor-pointer hover:text-gray-600"
                        onClick={() => router.push('/projects')}
                    >
                        Projects
                    </span>
                    <span className="text-gray-300 text-sm">›</span>
                    <span className="text-sm font-bold text-gray-900">{project?.name}</span>
                </div>

                {/* Project delete — managers only */}
                {isManager && (
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" />
                            <path d="M10 11v6M14 11v6" />
                        </svg>
                        Delete Project
                    </button>
                )}
            </header>

            {/* PAGE CONTENT */}
            <div className="mt-16 px-8 py-6">

                {/* ===== TOP ROW: NAME | PROGRESS | TEAM ===== */}
                <div className="flex items-center justify-between gap-8 mb-2 pb-5 border-b border-gray-200">

                    {/* LEFT — PROJECT NAME */}
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white text-xl shrink-0">🚀</div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#4C6FFF]" />
                                <span className="text-xs font-bold tracking-wider text-[#4C6FFF] uppercase">Active Sprint</span>
                            </div>
                            <p className="text-gray-500 text-sm max-w-md">
                                {showFullDesc || (project?.description ?? '').length <= 80
                                    ? project?.description
                                    : project?.description?.slice(0, 80) + '...'}
                                {(project?.description ?? '').length > 80 && (
                                    <button
                                        onClick={() => setShowFullDesc(!showFullDesc)}
                                        className="ml-2 text-blue-500 hover:underline text-xs font-semibold"
                                    >
                                        {showFullDesc ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* CENTER — PROGRESS */}
                    <div className="w-80 shrink-0">
                        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Progress</span>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-4xl font-black text-gray-900">{overallProgress}%</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="h-full bg-black rounded-full transition-all duration-500"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — TEAM AVATARS (deck) */}
                    <div
                        className="flex items-center cursor-pointer shrink-0"
                        onClick={() => setShowTeam(true)}
                    >
                        <div className="flex -space-x-3">
                            {visibleAvatars.map(m => (
                                <div
                                    key={m.id}
                                    className="w-10 h-10 rounded-full border-2 border-[#f7f3f2] flex items-center justify-center text-white text-sm font-bold"
                                    style={{ backgroundColor: avatarColor(m.name) }}
                                    title={m.name}
                                >
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {extraCount > 0 && (
                                <div className="w-10 h-10 rounded-full border-2 border-[#f7f3f2] bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                                    +{extraCount}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* JOURNEY TITLE */}
                <div className="text-center my-8">
                    <h2 className="text-2xl font-bold text-gray-900">Development Journey</h2>
                    <p className="text-sm text-gray-400">Track progress across key development stages</p>
                </div>

                {/* ===== JOURNEY GRID ===== */}
                <div className="relative w-full">

                    {/* STITCH CONNECTORS */}
                    <svg className="absolute hidden lg:block pointer-events-none" style={{ left: '30%', top: '50px', width: '160px', height: '170px', zIndex: 0 }} viewBox="0 0 160 170" preserveAspectRatio="none">
                        <circle cx="5" cy="10" r="4" fill="#94a3b8" />
                        <path d="M 5 10 C 90 10, 70 160, 155 160" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,6" />
                        <circle cx="155" cy="160" r="4" fill="#94a3b8" />
                    </svg>
                    <svg className="absolute hidden lg:block pointer-events-none" style={{ left: '63%', top: '50px', width: '160px', height: '170px', zIndex: 0 }} viewBox="0 0 160 170" preserveAspectRatio="none">
                        <circle cx="5" cy="10" r="4" fill="#94a3b8" />
                        <path d="M 5 10 C 90 10, 70 155, 155 155" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,6" />
                        <circle cx="155" cy="155" r="4" fill="#94a3b8" />
                    </svg>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start relative" style={{ zIndex: 1 }}>

                        {/* ===== COMPLETED DECK ===== */}
                        <div className="relative mt-0">
                            <div className="absolute -top-2 left-3 right-3 h-full bg-white rounded-3xl shadow-sm opacity-60" />
                            <div className="absolute -top-1 left-1.5 right-1.5 h-full bg-white rounded-3xl shadow-sm opacity-80" />

                            <div className="relative bg-white rounded-3xl p-7 shadow-md border-l-4 border-green-500">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl shrink-0">✓</div>
                                        <div>
                                            <span className="text-xs font-bold tracking-wider text-green-600 uppercase">Completed</span>
                                            <h3 className="text-lg font-bold text-gray-900">{completedStages.length} Stages Completed</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCompletedOpen(!completedOpen)}
                                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
                                    >
                                        <Chevron up={completedOpen} />
                                    </button>
                                </div>

                                <div
                                    className="overflow-hidden transition-all duration-300"
                                    style={{ maxHeight: completedOpen ? `${completedStages.length * 44 + 20}px` : '0px' }}
                                >
                                    <div className="mt-4 flex flex-col gap-1">
                                        {completedStages.map(stage => (
                                            <div
                                                key={stage.id}
                                                onClick={() => router.push(`/projects/${projectId}/stages/${stage.id}`)}
                                                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>
                                                <span className="text-sm text-gray-700">{stage.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== ACTIVE HERO DECK ===== */}
                        <div className="relative lg:mt-14">
                            <div className="absolute -top-2 left-3 right-3 h-full bg-blue-50 rounded-3xl shadow-sm opacity-60" />
                            <div className="absolute -top-1 left-1.5 right-1.5 h-full bg-blue-50 rounded-3xl shadow-sm opacity-80" />

                            <div className="relative bg-white rounded-3xl p-7 shadow-xl border border-blue-100">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="w-12 h-12 rounded-2xl bg-[#4C6FFF] flex items-center justify-center text-white text-xl">🧭</div>
                                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">CURRENT FOCUS</span>
                                </div>
                                <span className="text-xs font-bold tracking-wider text-[#4C6FFF] uppercase">Active Stages</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{activeStages.length} Stages In Progress</h3>
                                <p className="text-sm text-gray-400 mb-5">Currently being built and actively tracked by development teams.</p>

                                <div className="flex flex-col gap-3">
                                    {activeStages.length === 0 ? (
                                        <p className="text-sm text-gray-400">No active stages right now.</p>
                                    ) : (
                                        activeStages.map(stage => (
                                            <div
                                                key={stage.id}
                                                onClick={() => router.push(`/projects/${projectId}/stages/${stage.id}`)}
                                                className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-gray-700 text-xs shrink-0">
                                                        {String(stage.stage_order).padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-bold text-gray-900">{stage.name}</span>
                                                            <span className="text-sm font-bold text-gray-900">{stageProgress(stage)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                            <div className="h-full bg-[#4C6FFF] rounded-full" style={{ width: `${stageProgress(stage)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => activeStages[0] && router.push(`/projects/${projectId}/stages/${activeStages[0].id}`)}
                                    className="w-full mt-5 bg-black text-white py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                                    Open Board
                                </button>
                            </div>
                        </div>

                        {/* ===== UPCOMING DECK (expands UPWARD) ===== */}
                        <div className="relative lg:mt-36">
                            <div className="absolute -bottom-2 left-3 right-3 h-full bg-white rounded-3xl shadow-sm opacity-60" />
                            <div className="absolute -bottom-1 left-1.5 right-1.5 h-full bg-white rounded-3xl shadow-sm opacity-80" />

                            <div className="relative bg-white rounded-3xl p-7 shadow-md border-l-4 border-amber-400 flex flex-col">

                                {/* expandable list — ABOVE header so it grows upward */}
                                <div
                                    className="overflow-hidden transition-all duration-300"
                                    style={{ maxHeight: upcomingOpen ? `${upcomingStages.length * 44 + 20}px` : '0px' }}
                                >
                                    <div className="mb-4 flex flex-col gap-1">
                                        {upcomingStages.map(stage => (
                                            <div
                                                key={stage.id}
                                                onClick={() => router.push(`/projects/${projectId}/stages/${stage.id}`)}
                                                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                            >
                                                <span className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold">
                                                    {String(stage.stage_order).padStart(2, '0')}
                                                </span>
                                                <span className="text-sm text-gray-700">{stage.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl shrink-0">⏱</div>
                                        <div>
                                            <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">Upcoming</span>
                                            <h3 className="text-lg font-bold text-gray-900">{upcomingStages.length} Upcoming Stages</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setUpcomingOpen(!upcomingOpen)}
                                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
                                    >
                                        <Chevron up={!upcomingOpen} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ===== TEAM POPUP MODAL ===== */}
            {showTeam && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => setShowTeam(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-6 w-96 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Team Members ({members.length})</h3>
                            <button
                                onClick={() => setShowTeam(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {members.length === 0 ? (
                                <p className="text-sm text-gray-400">No members yet.</p>
                            ) : (
                                members.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 py-2">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: avatarColor(m.name) }}
                                        >
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                                            <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE PROJECT MODAL ===== */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
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

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete project?</h3>
                        <p className="text-sm text-gray-500 text-center leading-relaxed mb-4">
                            <span className="font-semibold text-gray-700">"{project?.name}"</span> will be permanently deleted.
                        </p>

                        {/* Cascade warning */}
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-3 mb-6">
                            <p className="text-xs text-red-600 text-center leading-relaxed">
                                ⚠ This will also delete all <span className="font-bold">{stages.length} stages</span> and every task inside this project. This cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="flex-1 px-5 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:border-black hover:text-black transition disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteProject}
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