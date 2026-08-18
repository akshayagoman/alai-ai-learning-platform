"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { gsap } from "gsap"
import { Book, LogIn, LogOut, Menu, Settings, User, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Enhanced header animation
    gsap.fromTo(
      ".header-content",
      {
        y: -100,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
      },
    )

    // Animate logo
    gsap.fromTo(
      ".logo",
      {
        scale: 0,
        rotation: -180,
      },
      {
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 0.3,
      },
    )

    // Animate navigation items
    gsap.fromTo(
      ".nav-item",
      {
        y: -20,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.5,
      },
    )
  }, [])

  useEffect(() => {
    // Animate hamburger icon
    if (hamburgerRef.current) {
      const lines = hamburgerRef.current.querySelectorAll("path")
      if (lines.length >= 3) {
        if (isSidebarOpen) {
          gsap.to(lines[0], { rotation: 45, y: 6, duration: 0.3, transformOrigin: "center" })
          gsap.to(lines[1], { opacity: 0, duration: 0.3 })
          gsap.to(lines[2], { rotation: -45, y: -6, duration: 0.3, transformOrigin: "center" })
        } else {
          gsap.to(lines, { rotation: 0, y: 0, opacity: 1, duration: 0.3, transformOrigin: "center" })
        }
      }
    }
  }, [isSidebarOpen])

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 header-content">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu - Only show when user is logged in */}
            {user && onToggleSidebar && (
              <Button
                ref={hamburgerRef}
                variant="ghost"
                size="sm"
                className="nav-item bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-lg hover:bg-blue-50 transition-all duration-300"
                onClick={onToggleSidebar}
              >
                <Menu className="h-5 w-5 text-blue-600" />
              </Button>
            )}

            <Link href="/" className="flex items-center space-x-2 logo">
              <div className="relative">
                <Book className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                AllLearn
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-item relative group">
              <span className="text-foreground/80 hover:text-foreground transition-colors duration-200">Home</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link href="/subjects" className="nav-item relative group">
              <span className="text-foreground/80 hover:text-foreground transition-colors duration-200">Subjects</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
            {user && (
              <>
                <Link href="/profile" className="nav-item relative group">
                  <span className="text-foreground/80 hover:text-foreground transition-colors duration-200">
                    Profile
                  </span>
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 group-hover:w-full transition-all duration-300"></div>
                </Link>
                <Link href="/settings" className="nav-item relative group">
                  <span className="text-foreground/80 hover:text-foreground transition-colors duration-200">
                    Settings
                  </span>
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 group-hover:w-full transition-all duration-300"></div>
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth & Theme */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="nav-item relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <User className="h-5 w-5 mr-2" />
                    <span className="relative z-10">{user.user_metadata.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" className="nav-item relative overflow-hidden group">
                  <Link href="/login">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <LogIn className="h-5 w-5 mr-2" />
                    <span className="relative z-10">Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className="nav-item relative overflow-hidden group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Link href="/signup">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Sign Up</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              className="text-foreground p-2 rounded-md hover:bg-muted transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-3 border-t border-border/40 mt-3">
            <Link
              href="/"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/subjects"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Subjects
            </Link>
            {user && (
              <>
                <Link
                  href="/profile"
                  className="block py-2 px-3 rounded-md hover:bg-muted transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block py-2 px-3 rounded-md hover:bg-muted transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className="block w-full text-left py-2 px-3 rounded-md hover:bg-muted transition-colors duration-200 text-red-600"
                  onClick={() => {
                    signOut()
                    setIsMenuOpen(false)
                  }}
                >
                  <LogOut className="h-5 w-5 mr-2 inline" />
                  Logout
                </button>
              </>
            )}
            {!user && (
              <div className="space-y-2 pt-2">
                <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                  <Link href="/login">
                    <LogIn className="h-5 w-5 mr-2" />
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-primary to-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
