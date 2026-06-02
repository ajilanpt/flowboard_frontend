'use client'
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from 'next/navigation'

type project = {
  "id": number,
  "name": string,
  "description": string,
  "visibility": string,
  "created_at": string,
  "updated_at": string,
  "completed_at": string,
  "total_tasks": number,
  "completed_tasks": number
}

export default function Projects() {
    const [token, settoken] = useState('')
    const [projects, setprojects] = useState<project[]>([])
    const [loading, setloading] = useState(true)
    const [hideCompleted, setHideCompleted] = useState(true)
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'
    const router = useRouter()

    async function fetchprojects(token: string) {
        try {
            const repsonse = await axios.get(`${api_path}projects/my_projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            setprojects(repsonse.data)
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setloading(false)
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            settoken(token)
            fetchprojects(token)
        } else {
            setloading(false)
        }
    }, [])

    const colors = ['#4C6FFF', '#A163F1', '#1EB972', '#FF6B6B', '#F59E0B']

    const visibleProjects = hideCompleted
        ? projects.filter(p => !(p.total_tasks > 0 && p.completed_tasks === p.total_tasks))
        : projects

    return (
        <div className="min-h-screen bg-[#f7f3f2]">

            {/* FIXED TOP HEADER BAR */}
            <header className="fixed top-0 right-0 left-18 h-16 bg-white flex justify-between items-center px-8 border-b border-gray-100 z-40">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Projects</span>
                    <span className="text-gray-300 text-sm">›</span>
                    <span className="text-sm font-bold text-gray-900">Active Workspace</span>
                </div>
            </header>

            {/* PAGE CONTENT */}
            <div className="mt-16 px-20 py-10">

                {/* PAGE TITLE + ACTIONS */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-5xl font-bold text-gray-900 mb-1">Projects</h1>
                        <p className="text-gray-500 text-sm">Manage your active workstreams and high-output teams.</p>
                    </div>
                    <div className="flex items-center gap-4">

                        {/* HIDE COMPLETED TOGGLE */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-sm text-gray-500">Hide completed</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={hideCompleted}
                                    onChange={(e) => setHideCompleted(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                            </div>
                        </label>

                        {/* NEW PROJECT BUTTON */}
                        <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-all shadow-md" onClick={() => router.push('/projects/create_project')}>
                            <span className="text-base leading-none">+</span>
                            New Project
                        </button>
                    </div>
                </div>

                {/* PROJECTS LIST */}
                <div className="flex flex-col gap-4">
                    {
                        loading ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : visibleProjects.length === 0 ? (
                            <p className="text-sm text-gray-500">No projects to show.</p>
                        ) : (
                            visibleProjects.map((project, index) => {
                                const color = colors[index % colors.length]
                                const progress = project.total_tasks === 0
                                    ? 0
                                    : Math.round((project.completed_tasks / project.total_tasks) * 100)

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                        className="bg-white rounded-2xl px-8 py-5 cursor-pointer relative overflow-hidden border border-transparent hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group shadow-sm"
                                    >
                                        {/* LEFT COLOR STRIP */}
                                        <div
                                            className="absolute left-0 top-0 h-full w-1.5"
                                            style={{ backgroundColor: color }}
                                        />

                                        {/* CARD CONTENT */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">

                                                {/* PROJECT NAME WITH DOT */}
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                    <h2 className="text-lg font-bold text-gray-900">{project.name}</h2>
                                                </div>

                                                {/* DESCRIPTION */}
                                                <p className="text-sm text-gray-700 mb-4 max-w-2xl">{project?.description?.slice(0, 100) + '...'}</p>

                                                {/* BOTTOM ROW */}
                                                <div className="flex items-center gap-8">

                                                    {/* PROGRESS BAR */}
                                                    <div className="w-72">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-xs text-gray-700">Progress</span>
                                                            <span className="text-xs font-bold" style={{ color }}>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{ width: `${progress}%`, backgroundColor: color }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* TASKS COUNT */}
                                                    <span className="text-xs text-gray-400">
                                                        {project.completed_tasks} of {project.total_tasks} tasks done
                                                    </span>

                                                </div>
                                            </div>

                                            {/* CHEVRON */}
                                            <span className="text-gray-300 group-hover:text-gray-500 transition-colors ml-6 text-xl">›</span>
                                        </div>
                                    </div>
                                )
                            })
                        )
                    }
                </div>
            </div>
        </div>
    )
}