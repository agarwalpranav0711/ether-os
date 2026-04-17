'use client'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Database, RefreshCcw, ShieldCheck, ActivitySquare, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export default function ManagerPage() {
  const router = useRouter()
  const { planTasks, thinkingLogs, isStreaming } = useStore()

  const getIcon = (title: string) => {
    const ltitle = title.toLowerCase()
    if (ltitle.includes('database')) return <Database size={20} className="text-cyan-400" />
    if (ltitle.includes('traffic') || ltitle.includes('reroute')) return <RefreshCcw size={20} className="text-cyan-400" />
    if (ltitle.includes('sec')) return <ShieldCheck size={20} className="text-cyan-400" />
    return <ActivitySquare size={20} className="text-slate-500" />
  }

  return (
    <div className="px-6 md:pl-32 md:pr-12 pt-24 md:pt-20 pb-40 min-h-screen relative overflow-hidden">
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 h-full min-h-[85vh] relative z-10 w-full max-w-[1600px] mx-auto">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[380px] flex flex-col shrink-0">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-widest text-cyan-400 font-bold mb-2 uppercase select-none">Neural Engine Reasoning</div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">AI Manager</h1>
            </div>
            <div className="w-10 h-10 rounded-full border border-cyan-800 bg-cyan-950/30 flex items-center justify-center text-cyan-50 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <BrainCircuit size={20} />
            </div>
          </div>

          <div className="glass flex-1 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col border border-white/5">
            <div className="text-[10px] tracking-widest text-cyan-500 font-bold mb-8 uppercase select-none flex items-center gap-2">
              Cognitive Link Active {isStreaming && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
            </div>
            
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-12">
              <AnimatePresence>
                {thinkingLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex gap-4"
                  >
                    <div className="text-[10px] font-mono text-slate-600 pt-1 block shrink-0 w-4">
                       {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="w-6 border-t border-slate-700/50 mt-2 shrink-0 hidden sm:block"></div>
                    <div className={clsx(
                      "text-[13px] md:text-sm font-light leading-relaxed",
                      log.status === 'italic' ? "text-cyan-600 italic mt-2" :
                      log.status === 'bold' ? "text-cyan-400 font-medium mt-2" : "text-slate-300"
                    )}>
                      {log.text}
                      {i === thinkingLogs.length - 1 && log.status !== 'bold' && isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Bottom Progress blocks */}
            <div className="absolute bottom-6 left-8 right-8 flex gap-2">
              {[1,2,3,4,5].map(i => (
                 <div key={i} className={clsx("h-1 flex-1 rounded-full transition-colors duration-1000", i <= Math.ceil(thinkingLogs.length / 1.5) ? "bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "bg-slate-800")} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col relative w-full pt-1">
           <div className="mb-6 flex justify-between items-end">
            <div>
              <div className="text-[10px] tracking-widest text-slate-500 font-bold mb-2 uppercase select-none">Execution Pipeline</div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Generated Plan</h1>
            </div>
            <div className="flex flex-col items-end gap-1.5">
               <div className="text-[10px] tracking-[0.1em] text-slate-500 font-mono hidden xs:block">ID: {planTasks.length > 0 ? planTasks[0].id : 'WAITING'}</div>
               <div className="text-[9px] tracking-widest text-cyan-400 border border-cyan-800 bg-cyan-950/20 px-3 py-1 rounded-full uppercase">Optimizing Path</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <AnimatePresence>
              {planTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={clsx(
                    "glass p-4 md:p-5 rounded-2xl flex items-center justify-between transition-all duration-300 border-l-4",
                    task.status === 'PROCESSING' ? "border-l-cyan-400 bg-cyan-950/10 shadow-[0_0_20px_rgba(34,211,238,0.05)] border-white/5" :
                    task.status === 'COMPLETED' ? "border-l-green-400 bg-green-950/10 border-white/5 shadow-[0_0_20px_rgba(74,222,128,0.05)]" :
                    task.status === 'FAILED' ? "border-l-red-500 bg-red-950/10 border-white/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]" :
                    "border-l-slate-800 border-white/5 opacity-50 grayscale"
                  )}
                >
                  <div className="flex items-center gap-4 md:gap-6 relative flex-1 min-w-0">
                    <div className={clsx("w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center border",
                      task.status === 'PROCESSING' ? "bg-cyan-900/30 border-cyan-700/50" :
                      task.status === 'READY' ? "bg-slate-800/50 border-slate-700" :
                      "bg-transparent border-slate-800"
                    )}>
                      {getIcon(task.title)}
                    </div>
                    <div className="min-w-0 pr-4">
                      <h3 className="text-sm md:text-lg font-medium text-white flex items-center gap-2 truncate">
                        {task.title}
                        {task.status === 'PROCESSING' && (
                          <span className="flex space-x-1 opacity-80 shrink-0">
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] md:text-sm text-slate-400 mt-0.5 md:mt-1 font-light leading-snug truncate md:whitespace-normal">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 md:gap-2 shrink-0">
                     <div className={clsx(
                       "text-[8px] md:text-[9px] font-bold tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-sm",
                       task.status === 'PROCESSING' ? "bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]" :
                       task.status === 'READY' ? "bg-cyan-950/40 text-cyan-400 border border-cyan-900/50" :
                       "bg-slate-800/50 text-slate-500 border border-slate-700"
                     )}>
                       {task.status}
                     </div>
                     <div className={clsx("text-[10px] md:text-xs font-mono", task.status === 'PROCESSING' ? "text-cyan-600 italic" : "text-slate-600")}>
                       {task.latency || '0ms'}
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="fixed bottom-20 lg:bottom-12 right-6 lg:right-12 z-50 flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
             <AnimatePresence>
                {planTasks.length > 0 && !isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 bg-[#0a0f1a]/80 backdrop-blur-md px-6 py-4 rounded-xl border border-cyan-900/50"
                  >
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      Estimation
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex gap-4 text-sm font-mono text-cyan-400">
                      <span>~{planTasks.length} TASKS</span>
                      <span className="text-white/20">|</span>
                      <span>2 WORKERS</span>
                      <span className="text-white/20">|</span>
                      <span>~{(planTasks.length * 1.5).toFixed(1)} SEC</span>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
             <AnimatePresence>
                {planTasks.length > 0 && !isStreaming && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (planTasks.length > 0) {
                             router.push('/execution')
                        }
                    }}
                    className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]"
                  >
                    Continue Execution Phase
                    <Zap size={18} className="fill-black" />
                  </motion.button>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
