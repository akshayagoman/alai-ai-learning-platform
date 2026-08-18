import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ClientLayout } from "./client-layout"
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
