'use client'
import { useState} from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
export default function SignIn() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name , setname] = useState('')
    const [role, setrole]= useState('')
    const [error, setError] = useState('')
    const api_path = process.env.NEXT_PUBLIC_API_URL + '/'
    const router = useRouter()

    async function createuser() {
        try {
            const response = await axios.post(`${api_path}users`,{
                email: email,
                password: password,
                name: name,
                role: role
            })
            router.push("/")
        } catch (error) {
            setError('Error creating user')
        }
    }
    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 w-96">
            <h1 className="text-3xl font-bold text-red-600">ENTER YOUR DEATILS</h1>
            <input
                type="text"
                placeholder='Name'
                value={name}
                onChange={(e)=>setname(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-2 outline-none"
                />
            <input
                type="email"
                placeholder='Email'
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-2 outline-none"
                />
            <input
                type="password"
                placeholder='Password'
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-4 outline-none"
                />
            <select
                value={role}
                onChange={(e) => setrole(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-4 outline-none"
                >
            <option value="">Select a role</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
            </select>
            <button onClick={createuser} className='bg-red-700 rounded-xl text-white font-semibold px-29 py-3 active:scale-95 transition-transform'>Create User</button>
            {error && <p className='text-red-500'>{error}</p>}
        </div>
        </div>
            
    )
}



