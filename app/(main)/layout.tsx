'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isManager, setIsManager] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) router.push('/')

        // Read role from localStorage
        // (we'll store it during login — see note below)
        const role = localStorage.getItem('role')
        if (role === 'manager') setIsManager(true)
    }, [])

    function navClass(href: string) {
        return pathname === href
            ? 'bg-white/20 text-white p-3 rounded-xl transition-all'
            : 'text-white/60 p-3 rounded-xl hover:text-white hover:bg-white/10 transition-all'
    }

    return (
        <div className="flex min-h-screen">

            {/* SIDEBAR */}
            <div className="w-18 bg-black text-white flex flex-col items-center py-8 gap-6 fixed h-full z-50">
                <div className="text-white font-bold text-4xl mb-4">FB</div>

                {/* My Work */}
                <Link href="/dashboard" className={navClass('/dashboard')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V20a1 1 0 001 1h4v-5h5v5h4a1 1 0 001-1V10.5" />
                    </svg>
                </Link>

                {/* Projects */}
                <Link href="/projects" className={navClass('/projects')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                </Link>

                {/* Create Project */}
                <Link href="/projects/create_project" className={navClass('/projects/create_project')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </Link>

                {/* Manager Dashboard — only visible to managers */}
                {isManager && (
                    <Link href="/manager" className={navClass('/manager')}>
                        {/* Bar chart icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V19a1 1 0 001 1h3V13.5M9 8.25V20h4V8.25M15 11.5V20h4a1 1 0 001-1v-7.5M3 13.5l4.5-5 4.5 3.5 4.5-4 4.5-3" />
                        </svg>
                    </Link>
                )}

            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 ml-18 bg-[#f7f3f2] min-h-screen">
                {children}
            </div>

        </div>
    )
}