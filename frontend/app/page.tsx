'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, Search, ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function HeroPage() {
  const router = useRouter()
  const { userInput, setUserInput, startStream, isStreaming, resetSystem, taskId } = useStore()
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleRun = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    
    // Detailed validation
    const trimmedInput = userInput.trim()
    if (!trimmedInput) {
      setError("Please enter a valid mission objective.")
      return
    }
    
    if (trimmedInput.length < 5) {
      setError("Objective is too short. Please provide more detail.")
      return
    }
    
    if (/^[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/:~` -]+$/.test(trimmedInput)) {
      setError("Invalid input format. Mission parameters must contain alphanumeric characters.")
      return
    }

    if (isStreaming) return
    startStream(userInput, router)
  }

  const suggestions = [
    { text: "Build a startup plan", icon: <Sparkles size={12} /> },
    { text: "Analyze market trends", icon: <Search size={12} /> },
    { text: "Design a portfolio", icon: <ArrowRight size={12} /> }
  ]

  return (
    <div className="px-6 md:pl-24 pt-20 md:pt-32 pb-40 min-h-screen relative overflow-hidden w-full flex flex-col items-center">

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center w-full max-w-3xl mx-auto"
      >
        <h1 className="text-4xl md:text-6xl font-light text-center tracking-tight leading-[1.1]">
          <span className="text-white brightness-110 font-medium">Command intelligence.</span> <br/>
          <span className="font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Execute anything.</span>
        </h1>
        <p className="mt-5 text-sm md:text-base text-slate-400 opacity-70 text-center max-w-[600px] leading-relaxed mb-12">
          Ether turns complex goals into coordinated AI execution.
        </p>

        <form onSubmit={handleRun} className="w-full relative group">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-red-400 text-[10px] md:text-xs font-bold tracking-widest whitespace-nowrap bg-red-950/40 px-4 py-1.5 rounded-full border border-red-500/30 w-fit"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="glass-premium ambient-pulse rounded-3xl md:rounded-full flex flex-col md:flex-row items-center p-2 md:pl-6 md:pr-2 focus-within:ring-2 focus-within:ring-cyan-400/30 transition-all duration-500 relative gap-3 md:gap-0">
            {/* Inner highlight reflection */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            
            <div className="flex items-center w-full md:w-auto flex-1 px-4 md:px-0">
              <Sparkles className="text-cyan-400/60 mr-4 shrink-0" size={20} />
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="System command or task query..."
                disabled={isStreaming}
                className="flex-1 bg-transparent border-none outline-none text-base md:text-xl text-white placeholder-slate-600 font-light py-3 md:py-0 w-full selection:bg-cyan-500/30"
              />
            </div>
            <button 
              type="submit"
              disabled={isStreaming}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="bg-gradient-btn text-blue-950 font-black px-6 md:px-10 py-3 md:py-4 rounded-full flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] cursor-pointer disabled:opacity-70 disabled:hover:scale-100 w-full md:w-auto text-sm md:text-base whitespace-nowrap overflow-hidden relative"
            >
              {/* Premium Bloom Glow Effect */}
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              
              {isStreaming ? (
                <><Loader2 className="animate-spin" size={18} /> Starting...</>
              ) : (
                <>
                  Run System
                  <motion.span 
                    initial={{ x: 0 }}
                    animate={{ x: isHovered ? 4 : 0 }}
                    className="font-bold text-lg"
                  >→</motion.span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3 mt-12 w-full">
          {suggestions.map((s, i) => (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              key={i}
              type="button"
              disabled={isStreaming}
              onClick={() => {
                setUserInput(s.text)
              }}
              className="px-5 py-2.5 rounded-full border border-slate-700/50 bg-slate-900/40 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/30 hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1 text-[12px] md:text-sm font-semibold disabled:opacity-50 whitespace-nowrap flex items-center gap-2 shadow-lg shadow-black/20"
            >
              <span className="opacity-50 group-hover:opacity-100 transition-opacity">{s.icon}</span>
              {s.text}
            </motion.button>
          ))}
        </div>
      </motion.div>
      
      <div className="absolute bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-mono font-bold tracking-[0.3em] text-slate-500 whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity cursor-default">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        ETHER INTELLIGENCE ACTIVE
      </div>
    </div>
  )
}
