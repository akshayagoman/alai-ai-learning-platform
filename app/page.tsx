"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Sparkles, Zap, Target, ArrowRight, Atom, FlaskConical } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { TrainerSignupModal } from "@/components/trainer-signup-modal"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
// Type-safe dynamic imports for ParallaxProvider and Parallax
const ParallaxProvider = dynamic(
  () => import("react-scroll-parallax").then(mod => mod.ParallaxProvider as React.ComponentType<any>),
  { ssr: false }
)
const Parallax = dynamic(
  () => import("react-scroll-parallax").then(mod => mod.Parallax as React.ComponentType<any>),
  { ssr: false }
)

export default function Home() {
  const { user, userProfile } = useAuth()
  const { scrollYProgress } = useScroll()
  const containerRef = useRef<HTMLDivElement>(null)
  const voidSectionRef = useRef<HTMLDivElement>(null)
  const solarSystemRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 0.8])

  // Spring animations
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }
  const scaleSpring = useSpring(scale, springConfig)

  useEffect(() => {
    let gsap, ScrollTrigger
    let ctx
    let isMounted = true
    import("gsap").then((mod) => {
      gsap = mod.gsap || mod.default || mod
      return import("gsap/ScrollTrigger")
    }).then((mod) => {
      ScrollTrigger = mod.ScrollTrigger || mod.default || mod
      if (typeof window !== "undefined" && gsap && ScrollTrigger && isMounted) {
        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          // Void to Solar System transformation
          gsap.timeline({
            scrollTrigger: {
              trigger: voidSectionRef.current,
              start: "top center",
              end: "bottom center",
              scrub: 1,
              onUpdate: (self) => {
                const progress = self.progress

                // Transform void particles into atoms
                gsap.to(".void-particle", {
                  scale: 1 + progress * 2,
                  rotation: progress * 360,
                  opacity: 1 - progress * 0.5,
                  duration: 0.1,
                })

                // Create solar system
                gsap.to(".sun", {
                  scale: progress * 3,
                  opacity: progress,
                  rotation: progress * 180,
                  duration: 0.1,
                })

                // Animate planets
                gsap.to(".planet", {
                  scale: progress * 1.5,
                  opacity: progress,
                  rotation: progress * 720,
                  duration: 0.1,
                })
              },
            },
          })

          // Particle explosion effect
          gsap
            .timeline({
              scrollTrigger: {
                trigger: ".features-section",
                start: "top center",
                end: "bottom center",
                scrub: 1,
              },
            })
            .to(".explosion-particle", {
              scale: 2,
              rotation: 360,
              x: "random(-200, 200)",
              y: "random(-200, 200)",
              opacity: 0,
              duration: 2,
              stagger: 0.1,
            })

          // Meteor shower effect
          gsap
            .timeline({
              repeat: -1,
              repeatDelay: 3,
            })
            .to(".meteor", {
              x: "100vw",
              y: "100vh",
              opacity: 0,
              duration: 2,
              stagger: 0.2,
              ease: "power2.out",
            })
            .set(".meteor", {
              x: "-100px",
              y: "-100px",
              opacity: 1,
            })

          // Floating animation for hero elements
          gsap.to(".floating-element", {
            y: -20,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut",
            stagger: 0.3,
          })

          // Atom collision effect
          gsap
            .timeline({
              repeat: -1,
              repeatDelay: 5,
            })
            .to(".atom-1", {
              x: 100,
              duration: 1,
              ease: "power2.inOut",
            })
            .to(
              ".atom-2",
              {
                x: -100,
                duration: 1,
                ease: "power2.inOut",
              },
              "<",
            )
            .to([".atom-1", ".atom-2"], {
              scale: 1.5,
              opacity: 0.5,
              duration: 0.2,
            })
            .to([".atom-1", ".atom-2"], {
              scale: 1,
              opacity: 1,
              x: 0,
              duration: 1,
            })
        }, containerRef)
      }
    })
    return () => {
      isMounted = false
      if (ctx) ctx.revert()
    }
  }, [])

  return (
    <ParallaxProvider>
      <div ref={containerRef} className="relative overflow-hidden">
        {/* Meteors */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="meteor fixed w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            style={{
              top: `${Math.random() * 50}%`,
              left: "-100px",
              boxShadow: "0 0 10px rgba(255, 165, 0, 0.8)",
            }}
          />
        ))}

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white overflow-hidden">
          {/* Animated Background */}
          <motion.div className="absolute inset-0 opacity-30" style={{ y, opacity }}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          </motion.div>

          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="floating-element absolute top-20 left-10 opacity-20">
              <FlaskConical className="w-12 h-12 text-white" />
            </div>
            <div className="floating-element absolute top-32 right-16 opacity-20">
              <Atom className="w-10 h-10 text-white" />
            </div>
            <div className="floating-element absolute bottom-20 left-20 opacity-20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <motion.div className="mb-6">
                <motion.h1
                  className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  Learn Anything, Anytime, Anywhere
                </motion.h1>
              </motion.div>

              <motion.p
                className="text-lg md:text-xl mb-8 text-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                AllLearn provides comprehensive educational resources for students across different syllabi and
                languages.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="lg" variant="secondary" className="group">
                    <Link href="/subjects" className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                      Explore Subjects
                    </Link>
                  </Button>
                </motion.div>

                {!user && (
                  <TrainerSignupModal>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-transparent text-white border-white hover:bg-white/10 group"
                      >
                        <Zap className="w-5 h-5 group-hover:animate-pulse mr-2" />
                        Be a Trainer
                      </Button>
                    </motion.div>
                  </TrainerSignupModal>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Void to Solar System Section */}
        <section
          ref={voidSectionRef}
          className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Void Particles */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="void-particle absolute w-1 h-1 bg-white rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Solar System */}
          <div ref={solarSystemRef} className="relative">
            {/* Sun */}
            <div className="sun absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 scale-0">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-red-500 rounded-full animate-pulse" />
            </div>

            {/* Planets */}
            {[
              { size: "w-3 h-3", color: "bg-blue-400", distance: 60, speed: 10 },
              { size: "w-4 h-4", color: "bg-green-400", distance: 90, speed: 15 },
              { size: "w-5 h-5", color: "bg-red-400", distance: 120, speed: 20 },
              { size: "w-3 h-3", color: "bg-purple-400", distance: 150, speed: 25 },
            ].map((planet, i) => (
              <div
                key={i}
                className="planet absolute left-1/2 top-1/2 opacity-0 scale-0"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateX(${planet.distance}px)`,
                  animation: `orbit ${planet.speed}s linear infinite`,
                }}
              >
                <div className={`${planet.size} ${planet.color} rounded-full`} />
              </div>
            ))}
          </div>

          {/* Atoms for collision */}
          <div className="atom-1 absolute left-1/4 top-1/2 w-8 h-8 border-2 border-blue-400 rounded-full">
            <div className="absolute inset-1 bg-blue-400 rounded-full opacity-50" />
          </div>
          <div className="atom-2 absolute right-1/4 top-1/2 w-8 h-8 border-2 border-red-400 rounded-full">
            <div className="absolute inset-1 bg-red-400 rounded-full opacity-50" />
          </div>

          <Parallax speed={-20}>
            <motion.div className="text-center text-white z-10 relative" style={{ scale: scaleSpring }}>
              <h2 className="text-4xl md:text-6xl font-bold mb-4">From Void to Universe</h2>
              <p className="text-xl text-gray-300">Watch knowledge transform from nothing into everything</p>
            </motion.div>
          </Parallax>
        </section>

        {/* Features Section with Particle Explosion */}
        <section className="features-section py-16 bg-muted/50 relative overflow-hidden">
          {/* Explosion Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="explosion-particle absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <Parallax speed={-10}>
              <motion.h2
                className="text-3xl font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                Why Choose AllLearn?
              </motion.h2>
            </Parallax>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, staggerChildren: 0.2 }}
            >
              {[
                {
                  icon: BookOpen,
                  title: "Comprehensive Content",
                  description: "Access detailed notes, videos, quizzes, and Q&A for every topic.",
                  color: "text-blue-600",
                  bgColor: "bg-blue-100 dark:bg-blue-900/20",
                },
                {
                  icon: Users,
                  title: "Expert Trainers",
                  description: "Learn from industry-leading experts with years of experience.",
                  color: "text-green-600",
                  bgColor: "bg-green-100 dark:bg-green-900/20",
                },
                {
                  icon: Target,
                  title: "Personalized Learning",
                  description: "AI-powered recommendations tailored to your learning style.",
                  color: "text-purple-600",
                  bgColor: "bg-purple-100 dark:bg-purple-900/20",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Parallax speed={index * 5 - 10}>
                    <Card className="hover-lift group cursor-pointer border-0 shadow-lg h-full">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                          <motion.div
                            className={`${feature.bgColor} p-3 rounded-full mb-4 group-hover:scale-110 transition-transform`}
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                          >
                            <feature.icon className={`h-8 w-8 ${feature.color}`} />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Parallax>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Popular Subjects Section */}
        <section className="py-16 relative bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
          <div className="container mx-auto px-4">
            <Parallax speed={-5}>
              <motion.h2
                className="text-3xl font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                Popular Subjects
              </motion.h2>
            </Parallax>

            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, staggerChildren: 0.1 }}
            >
              {[
                { name: "Physics", icon: FlaskConical, color: "blue", href: "/subjects/1" },
                { name: "Chemistry", icon: FlaskConical, color: "green", href: "/subjects/2" },
                { name: "Mathematics", icon: Target, color: "purple", href: "/subjects/3" },
                { name: "Biology", icon: Sparkles, color: "red", href: "/subjects/4" },
              ].map((subject, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Parallax speed={index * 2 - 3}>
                    <Link href={subject.href}>
                      <Card className="hover-lift group cursor-pointer border-0 shadow-lg">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center p-4">
                            <motion.div
                              className={`bg-${subject.color}-100 dark:bg-${subject.color}-900/20 p-3 rounded-full mb-4 group-hover:scale-110 transition-transform`}
                              whileHover={{
                                rotate: [0, -10, 10, -10, 0],
                                scale: 1.2,
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <subject.icon className={`h-8 w-8 text-${subject.color}-600`} />
                            </motion.div>
                            <h3 className="text-xl font-semibold text-foreground">{subject.name}</h3>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </Parallax>
                </motion.div>
              ))}
            </motion.div>

            <Parallax speed={-2}>
              <motion.div
                className="text-center mt-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="lg" className="group">
                    <Link href="/subjects" className="flex items-center gap-2">
                      View All Subjects
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </Parallax>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary via-blue-600 to-purple-700 text-white py-16 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          <div className="container mx-auto px-4 text-center relative z-10">
            <Parallax speed={-8}>
              <motion.h2
                className="text-3xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                Ready to Start Learning?
              </motion.h2>

              <motion.p
                className="text-lg mb-8 max-w-2xl mx-auto text-blue-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Join thousands of students who are already using AllLearn to achieve academic excellence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild size="lg" variant="secondary" className="group">
                  <Link href={user ? "/subjects" : "/signup"} className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                    {user ? "Explore Subjects" : "Get Started Free"}
                  </Link>
                </Button>
              </motion.div>
            </Parallax>
          </div>
        </section>

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes orbit {
            from {
              transform: translate(-50%, -50%) rotate(0deg) translateX(var(--distance)) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotate(360deg) translateX(var(--distance)) rotate(-360deg);
            }
          }
          
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        `}</style>
      </div>
    </ParallaxProvider>
  )
}
