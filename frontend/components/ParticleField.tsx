'use client'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'

export function ParticleField() {
  const { isStreaming, isPaused } = useStore()
  
  if (isPaused) {
    return <div className="fixed inset-0 bg-[#020617] pointer-events-none -z-50 transition-colors duration-1000" />
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#020617]">
      {/* Subtle Neural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      
      {/* Vertical Ambient Light Beam */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[1px] h-screen bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent opacity-20" />

      {/* Atmospheric Glows */}
      <motion.div
        animate={{
          opacity: isStreaming ? [0.15, 0.25, 0.15] : 0.08,
          scale: isStreaming ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-cyan-900/40 rounded-full blur-[140px]"
      />
      <motion.div
        animate={{
          opacity: isStreaming ? [0.1, 0.2, 0.1] : 0.04,
          scale: isStreaming ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/30 rounded-full blur-[120px]"
      />
      
      {isStreaming && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" 
        />
      )}
    </div>
  )
}
