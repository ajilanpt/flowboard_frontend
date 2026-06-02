'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const STAGE_COLORS = [
  { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },
]

export default function CreateProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [visibility, setVisibility] = useState<'private' | 'transparent'>('transparent')
  const [members, setMembers] = useState<number[]>([])
  const [allUsers, setAllUsers] = useState<{ id: number; name: string; email: string; role: string }[]>([])
  const [search, setSearch] = useState('')

  // Step 3
  const [stages, setStages] = useState([{ name: '', stage_owner_id: 0 }])
  const [openOwnerDropdown, setOpenOwnerDropdown] = useState<number | null>(null)

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setAllUsers(data)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSubmit = async () => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    const projectRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/projects/`, { name, description, visibility }, { headers })
    const projectId = projectRes.data.id
    for (const userId of members) {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/projects/add_member`, { user_id: userId, project_id: projectId }, { headers })
    }
    for (let i = 0; i < stages.length; i++) {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/stages/`, {
        name: stages[i].name, description: '',
        project_id: projectId, stage_order: i + 1,
        stage_owner_id: stages[i].stage_owner_id,
      }, { headers })
    }
    router.push('/projects')
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectedMemberUsers = allUsers.filter(u => members.includes(u.id))
  const progressWidth = step === 1 ? '0%' : step === 2 ? '50%' : '100%'

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#fdf8f8', fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&display=swap');`}</style>

      <div className="w-full max-w-lg bg-white rounded-3xl p-8 relative"
        style={{ boxShadow: '0px 4px 40px rgba(0,0,0,0.06)' }}>

        {/* ── STEP INDICATORS ── */}
        <div className="flex items-center justify-center mb-8 relative">
          <div className="absolute top-4 left-1/4 right-1/4 h-[2px] bg-[#ebe7e7]" />
          <div className="absolute top-4 left-1/4 h-[2px] bg-black transition-all duration-500"
            style={{ width: progressWidth, maxWidth: '50%' }} />
          <div className="flex justify-between w-full max-w-xs z-10">
            {[{ n: 1, label: 'Details' }, { n: 2, label: 'Team' }, { n: 3, label: 'Stages' }].map(({ n, label }) => (
              <div key={n} className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-4 border-white"
                  style={{ background: n <= step ? '#000' : '#ebe7e7', color: n <= step ? '#fff' : '#78767b' }}>
                  {n < step ? (
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : n}
                </div>
                <span className="text-xs font-semibold" style={{ color: n <= step ? '#1c1b1c' : '#78767b' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: PROJECT DETAILS ── */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1c1b1c] mb-1" style={{ letterSpacing: '-0.01em' }}>
                Project Details
              </h2>
              <p className="text-sm text-[#47464b]">Give your project a name and define its scope.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide text-[#47464b] uppercase">Project Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Brand Refresh"
                  className="w-full h-12 px-5 border border-[#c8c5cb] text-sm transition-all"
                  style={{ borderRadius: '9999px', background: '#fdf8f8', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={(e) => (e.target.style.borderColor = '#000')}
                  onBlur={(e) => (e.target.style.borderColor = '#c8c5cb')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wide text-[#47464b] uppercase">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Define the core objectives..." rows={3}
                  className="w-full p-4 border border-[#c8c5cb] text-sm resize-none transition-all"
                  style={{ borderRadius: '1.25rem', background: '#fdf8f8', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={(e) => (e.target.style.borderColor = '#000')}
                  onBlur={(e) => (e.target.style.borderColor = '#c8c5cb')} />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => {
                if (name.trim() === '' || description.trim() === '') {
                  alert('Please fill in project name and description')
                  return
                }
                setStep(2)
              }}
                className="h-12 px-8 flex items-center gap-2 font-semibold text-sm transition-all active:scale-95"
                style={{ borderRadius: '9999px', background: '#000', color: '#fff', fontFamily: 'inherit' }}>
                Next: Team Setup
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: VISIBILITY + TEAM ── */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1c1b1c] mb-1" style={{ letterSpacing: '-0.01em' }}>
                Access &amp; Team
              </h2>
              <p className="text-sm text-[#47464b]">Set visibility and invite your collaborators.</p>
            </div>

            {/* Visibility */}
            <div className="flex flex-col gap-2 mb-5">
              <label className="text-xs font-semibold tracking-wide text-[#47464b] uppercase">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                {(['transparent', 'private'] as const).map((v) => (
                  <div key={v} onClick={() => setVisibility(v)}
                    className="p-4 cursor-pointer transition-all"
                    style={{
                      borderRadius: '1rem',
                      border: visibility === v ? '2px solid #000' : '2px solid #c8c5cb',
                      background: visibility === v ? 'rgba(0,0,0,0.02)' : '#fff',
                    }}>
                    <div className="mb-1.5">
                      {v === 'transparent' ? (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={visibility === v ? '#000' : '#78767b'} strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={visibility === v ? '#000' : '#78767b'} strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      )}
                    </div>
                    <p className="font-semibold text-xs capitalize" style={{ color: visibility === v ? '#000' : '#1c1b1c' }}>{v}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#78767b' }}>
                      {v === 'transparent' ? 'Everyone sees all tasks' : 'Members see own tasks only'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <label className="text-xs font-semibold tracking-wide text-[#47464b] uppercase mb-2 block">Team Members</label>
            <div className="relative mb-3">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#78767b" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full h-10 pl-10 pr-5 border border-[#c8c5cb] text-sm transition-all"
                style={{ borderRadius: '9999px', background: '#fdf8f8', outline: 'none', fontFamily: 'inherit' }}
                onFocus={(e) => (e.target.style.borderColor = '#000')}
                onBlur={(e) => (e.target.style.borderColor = '#c8c5cb')} />
            </div>

            {/* Members list */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {filteredUsers.map((user) => {
                const isSelected = members.includes(user.id)
                return (
                  <div key={user.id} onClick={() => {
                    if (isSelected) setMembers(members.filter(id => id !== user.id))
                    else setMembers([...members, user.id])
                  }}
                    className="flex items-center justify-between p-3 cursor-pointer transition-all"
                    style={{
                      borderRadius: '0.875rem',
                      border: isSelected ? '2px solid #000' : '2px solid #e5e2e1',
                      background: isSelected ? 'rgba(0,0,0,0.02)' : '#fff',
                    }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: '#e5e2e1', color: '#47464b' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1c1b1c]">{user.name}</p>
                        <p className="text-xs text-[#78767b]">{user.role}</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0"
                      style={{ background: isSelected ? '#000' : '#e5e2e1' }}>
                      {isSelected && (
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {members.length > 0 && (
              <p className="text-xs text-[#78767b] mt-2 font-semibold">
                {members.length} member{members.length > 1 ? 's' : ''} selected
              </p>
            )}

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)}
                className="h-12 px-6 font-semibold text-sm transition-all"
                style={{ borderRadius: '9999px', border: '1px solid #c8c5cb', color: '#47464b', background: 'transparent', fontFamily: 'inherit' }}>
                Back
              </button>
              <button onClick={() => setStep(3)}
                className="h-12 px-8 flex items-center gap-2 font-semibold text-sm transition-all active:scale-95"
                style={{ borderRadius: '9999px', background: '#000', color: '#fff', fontFamily: 'inherit' }}>
                Next: Stages
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: STAGES ── */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1c1b1c] mb-1" style={{ letterSpacing: '-0.01em' }}>
                Workflow Stages
              </h2>
              <p className="text-sm text-[#47464b]">Define the journey of a task from start to finish.</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {stages.map((stage, index) => {
                const color = STAGE_COLORS[index % STAGE_COLORS.length]
                const owner = allUsers.find(u => u.id === stage.stage_owner_id)
                const isOpen = openOwnerDropdown === index

                return (
                  <div key={index} className={`p-3 bg-white rounded-xl border-l-4 ${color.border}`}
                    style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' }}>

                    <div className="flex items-center gap-3">
                      {/* Number */}
                      <div className={`w-8 h-8 rounded-lg ${color.bg} ${color.text} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {index + 1}
                      </div>

                      {/* Name */}
                      <input type="text" value={stage.name}
                        onChange={(e) => {
                          const updated = [...stages]
                          updated[index].name = e.target.value
                          setStages(updated)
                        }}
                        placeholder="Stage name"
                        className="flex-1 bg-transparent border-none text-sm font-semibold text-[#1c1b1c] outline-none placeholder-[#c8c5cb]"
                        style={{ fontFamily: 'inherit' }} />

                      {/* Remove */}
                      {stages.length > 1 && (
                        <button onClick={() => setStages(stages.filter((_, i) => i !== index))}
                          className="p-1.5 rounded-full transition-all hover:bg-red-50 shrink-0">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ba1a1a" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Owner Picker — shown below the name row */}
                    <div className="mt-2 ml-11 relative">
                      <button onClick={() => setOpenOwnerDropdown(isOpen ? null : index)}
                        className="flex items-center gap-2 px-3 py-1.5 transition-all"
                        style={{
                          borderRadius: '9999px',
                          border: '1px solid #e5e2e1',
                          background: owner ? '#f1eded' : '#fdf8f8',
                          fontFamily: 'inherit',
                        }}>
                        {owner ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-[#c8c5cb] flex items-center justify-center text-xs font-bold text-[#47464b]">
                              {owner.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-[#1c1b1c]">{owner.name}</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#78767b" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span className="text-xs text-[#78767b]">Assign owner</span>
                          </>
                        )}
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#78767b" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      {isOpen && (
                        <div className="absolute top-9 left-0 z-20 bg-white rounded-xl overflow-hidden min-w-[180px]"
                          style={{ boxShadow: '0px 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e5e2e1' }}>
                          <div onClick={() => {
                            const updated = [...stages]
                            updated[index].stage_owner_id = 0
                            setStages(updated)
                            setOpenOwnerDropdown(null)
                          }}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#78767b] hover:bg-[#f7f3f2] cursor-pointer transition-all">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#78767b" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No owner
                          </div>
                          {selectedMemberUsers.map(user => (
                            <div key={user.id} onClick={() => {
                              const updated = [...stages]
                              updated[index].stage_owner_id = user.id
                              setStages(updated)
                              setOpenOwnerDropdown(null)
                            }}
                              className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-[#f7f3f2] transition-all">
                              <div className="w-6 h-6 rounded-full bg-[#e5e2e1] flex items-center justify-center text-xs font-bold text-[#47464b] shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#1c1b1c]">{user.name}</p>
                                <p className="text-xs text-[#78767b]">{user.role}</p>
                              </div>
                              {stage.stage_owner_id === user.id && (
                                <svg className="ml-auto" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          ))}
                          {selectedMemberUsers.length === 0 && (
                            <p className="px-4 py-3 text-xs text-[#78767b]">No members selected yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Stage */}
            <button onClick={() => setStages([...stages, { name: '', stage_owner_id: 0 }])}
              className="w-full h-12 mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-[#78767b] transition-all hover:text-black hover:border-black"
              style={{ border: '2px dashed #c8c5cb', borderRadius: '1rem' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add New Stage
            </button>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)}
                className="h-12 px-6 font-semibold text-sm transition-all"
                style={{ borderRadius: '9999px', border: '1px solid #c8c5cb', color: '#47464b', background: 'transparent', fontFamily: 'inherit' }}>
                Back
              </button>
              <button onClick={handleSubmit}
                className="h-12 px-8 flex items-center gap-2 font-semibold text-sm transition-all active:scale-95"
                style={{ borderRadius: '9999px', background: '#000', color: '#fff', fontFamily: 'inherit' }}>
                Complete Setup
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}