"use client"

import type React from "react"

import { TrainerAuthProvider } from "@/contexts/trainer-auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TrainerAuthProvider>
        {children}
        <Toaster position="top-right" />
      </TrainerAuthProvider>
    </ThemeProvider>
  )
}
