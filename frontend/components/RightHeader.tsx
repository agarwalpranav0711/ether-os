'use client'
import { Wifi, Cpu, User, Circle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { clsx } from 'clsx'

export function RightHeader() {
  const { connectionStatus, isStreaming, planTasks, isPaused } = useStore()
  
  const connected = connectionStatus === 'connected' || connectionStatus === 'streaming'
  const activeWorkers = isStreaming && planTasks.length > 0 && !isPaused
  
  return (
    <div className="flex fixed top-0 left-0 right-0 h-14 bg-[#0a0f1a]/80 backdrop-blur-md border-b border-white/5 items-center justify-between px-4 md:px-8 z-50">
      <div className="flex items-center gap-4">
        <span className="text-cyan-400 font-bold tracking-widest text-[10px] md:text-sm select-none">ETHER OS v1.0</span>
      </div>
      <div className="flex items-center gap-3 md:gap-8 text-[8px] md:text-[10px] uppercase tracking-widest font-bold">
        {isPaused && (
          <div className="flex items-center gap-2 bg-amber-500/10 px-2 md:px-3 py-1 rounded border border-amber-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="text-amber-500 hidden xs:inline">System Paused</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer">
          <div className={clsx("w-1.5 h-1.5 rounded-full transition-all duration-500", connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-slate-600")} />
          <span className={clsx("hidden sm:inline transition-colors duration-300", connected ? "text-slate-300 group-hover:text-green-400" : "text-slate-600")}>Connected</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer">
          <div className={clsx("w-1.5 h-1.5 rounded-full transition-all duration-500", (isStreaming && !isPaused) ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-[ping_2s_infinite]" : "bg-slate-600")} />
          <span className={clsx("hidden sm:inline transition-colors duration-300", (isStreaming && !isPaused) ? "text-slate-300 group-hover:text-cyan-400" : "text-slate-600")}>Streaming</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer">
          <div className={clsx("w-1.5 h-1.5 rounded-full transition-all duration-500", activeWorkers ? "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] animate-bounce" : "bg-slate-600")} />
          <span className={clsx("hidden sm:inline transition-colors duration-300", activeWorkers ? "text-slate-300 group-hover:text-purple-400" : "text-slate-600")}>Workers Active</span>
        </div>
      </div>
    </div>
  )
}
