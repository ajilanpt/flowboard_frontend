'use client'
import { useState} from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const api_path = process.env.NEXT_PUBLIC_API_URL + '/'
  const router = useRouter()
  async function handlelogin() {

    try {
      const reponse = await axios.post(`${api_path}auth/login`, {
        email: email,
        password: password
      })
      localStorage.setItem('token', reponse.data.access_token)
      localStorage.setItem('role', reponse.data.role)
      router.push("/dashboard")
    } catch (error) {
      setError('Login failed')
    }
    
  }
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 w-96">
        <h1 className="text-3xl font-bold text-red-600">
          FlowBoard
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Sign in to your account</p>
        <input 
        type="email"
        placeholder="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-2 outline-none">
        </input>
        <input 
        type="password"
        placeholder="password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm mb-4 outline-none">
        </input>
        <button
         onClick={handlelogin}
        className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
      >
        Sign in
      </button>
      <p className="text-sm text-gray-500 mt-4">Don't have an account? <a href="/sign_in" className="text-red-600 font-semibold">Sign up</a></p>
      {error && (
  <p className="text-red-500 text-sm mt-2">
    {error}
  </p>
)}
      </div>
    </div>
  )
}