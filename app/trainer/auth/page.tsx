"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TrainerAuth() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new signup page
    router.push("/trainer/signup")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-red-700 dark:text-red-400">Redirecting...</p>
      </div>
    </div>
  )
}
