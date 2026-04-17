'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, X, Minimize2, Maximize2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { clsx } from 'clsx'

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const { connectionStatus, rawStreamData } = useStore()

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-[#060B14] border border-slate-800 text-slate-500 hover:text-cyan-400 p-2 text-[10px] font-mono tracking-widest uppercase rounded shadow-lg flex items-center gap-2"
      >
        <Terminal size={12} /> Debug
      </button>
    )
  }

  return (
    <div className={clsx(
      "fixed left-4 z-50 bg-[#0a0f1a]/95 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-2xl flex flex-col font-mono text-xs overflow-hidden transition-all duration-300",
      isMinimized ? "bottom-4 w-64 h-10" : "bottom-4 w-96 h-96"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
         <div className="flex items-center gap-2">
            <Terminal size={12} className="text-cyan-400" />
            <span className="font-bold tracking-widest text-[#a6b2c6]">SYS_DEBUG_CORE</span>
         </div>
         <div className="flex gap-2 text-slate-500">
            <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-white transition-colors">
               {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:text-red-400 transition-colors">
               <X size={12} />
            </button>
         </div>
      </div>

      {!isMinimized && (
        <>
          {/* Status Bar */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 bg-slate-950/50">
            <span className="text-slate-500">Connection Status:</span>
            <span className={clsx(
              "font-bold uppercase flex items-center gap-1",
              connectionStatus === 'streaming' ? "text-cyan-400" :
              connectionStatus === 'connected' ? "text-amber-400" :
              connectionStatus === 'failed' ? "text-red-400" : "text-slate-500"
            )}>
              {connectionStatus === 'streaming' && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
              {connectionStatus}
            </span>
          </div>

          {/* Stream Data logs */}
          <div className="p-3 flex-1 overflow-y-auto space-y-1 text-slate-400/80 bg-black/40">
            <AnimatePresence>
               {rawStreamData.length === 0 && (
                  <div className="text-slate-600 italic">No incoming events...</div>
               )}
               {rawStreamData.map((line, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="break-all whitespace-pre-wrap border-b border-white/5 pb-1"
                  >
                     <span className="text-purple-400/50 mr-2">{'>'}</span>{line}
                  </motion.div>
               ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
