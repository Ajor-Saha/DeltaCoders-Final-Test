"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
}

export default function EducationalHeroSection() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const stats = [
    { value: "25,000+", label: "Active Learners" },
    { value: "94%", label: "Success Rate" },
    { value: "150+", label: "Institutions" },
    { value: "4.9/5", label: "Platform Rating" }
  ]

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Subtle Background Pattern */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_50%)]" />
      </motion.div>

      {/* Animated Grid */}
      <motion.div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 50]) }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp}>
            <Badge className="mb-8 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 px-6 py-3 text-lg font-medium">
              Advanced Learning Analytics Platform
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-bold mb-8 text-slate-900 dark:text-white tracking-tight"
          >
            StudyFlow
          </motion.h1>

          <motion.div
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-light text-slate-600 dark:text-slate-300 mb-12 tracking-wide"
          >
            Intelligent Learning Analytics
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-16 leading-relaxed max-w-4xl mx-auto font-light"
          >
            Advanced cognitive assessment and personalized learning paths powered by
            machine learning algorithms and educational psychology research.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-lg text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link href="/sign-up">
                  Get Started
                  <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 px-10 py-6 rounded-lg text-xl font-medium transition-all duration-300 group"
              >
                <Link href="/dashboard">
                  <GraduationCap className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  View Platform
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-slate-400 dark:border-slate-600 rounded-full flex justify-center cursor-pointer"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-1 h-3 bg-slate-400 dark:bg-slate-600 rounded-full mt-2"
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Scroll to explore</p>
      </motion.div>
    </section>
  )
}
