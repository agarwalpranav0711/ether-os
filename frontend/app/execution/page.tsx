'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, Pause, Play, CheckCircle2, AlertTriangle, CircleDashed, Network, Cpu, Activity, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export default function ExecutionPage() {
  const { 
    executionLogs, isStreaming, planTasks, taskId, 
    connectionStatus, startStream, userInput, isPaused, 
    pauseTask, resumeTask, cancelTask, isAborting
  } = useStore()
  const router = useRouter()

  const handlePause = async () => {
    await pauseTask()
  }

  const handleResume = async () => {
    await resumeTask()
  }

  const completedCount = useMemo(() => {
    return planTasks.filter(t => executionLogs.some(l => l.text.includes(`Finished task ${t.id}`))).length
  }, [planTasks, executionLogs])

  let progress = planTasks.length > 0 ? (completedCount / planTasks.length) * 100 : 0
  if (!isStreaming && executionLogs.some(l => l.text.includes('Aggregating results'))) progress = 100

  const getLogIcon = (status: string, text: string) => {
    if (status === 'error' || text.includes('[ERROR]')) return <AlertTriangle size={16} className="text-red-400" />
    if (text.includes('[RETRY]')) return <Loader2 size={16} className="text-amber-400 animate-spin" />
    if (text.includes('search_tool') || text.includes('search')) return <span className="text-sm">🔍</span>
    if (text.includes('llm_tool') || text.includes('llm')) return <span className="text-sm">🧠</span>
    if (text.includes('[TOOL]')) return <Cpu size={16} className="text-cyan-400" />
    if (text.includes('Finished task')) return <CheckCircle2 size={16} className="text-green-400" />
    return <CircleDashed size={16} className="text-purple-400 animate-spin" />
  }

  return (
    <div className="px-4 md:pl-32 md:pr-12 pt-20 md:pt-16 pb-40 min-h-[100vh] relative flex flex-col w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4 mb-8">
        <div className="text-[10px] tracking-widest text-cyan-400 font-bold uppercase select-none">Execution Core</div>
        <div className="w-px h-6 bg-slate-700" />
        <h1 className="text-lg md:text-3xl font-semibold tracking-tight">Active Operations</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8 text-slate-400 text-[10px] md:text-sm">
        <span>Session: <span className="text-cyan-400 font-mono bg-cyan-900/20 px-2 py-0.5 rounded">{taskId?.substring(0, 8) || 'ETH-STREAM-LIVE'}</span></span>
        <span className="hidden md:inline">•</span>
        <span className="hidden xs:inline">System Log</span>
        
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden md:block border border-slate-700 bg-slate-800/40 rounded-full py-1.5 px-4 text-[10px] font-bold tracking-widest uppercase text-slate-400 select-none">Global Sync</div>
          <div className="border border-slate-700 bg-slate-800/40 rounded-full py-1.5 md:px-4 px-3 text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2 select-none">
            <span className={clsx("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", isStreaming ? "bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-slate-500")} /> {isStreaming ? "Streaming" : "Idle"}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {connectionStatus === 'failed' && (
           <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl mb-6 mx-auto w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4"
           >
              <div className="flex items-center gap-3">
                 <AlertTriangle size={18} className="text-red-400" />
                 <span className="text-red-200 text-xs md:text-sm">Connection lost. Check backend server.</span>
              </div>
              <button onClick={() => startStream(userInput, router)} className="bg-red-900/60 hover:bg-red-800 text-white px-6 py-2 rounded-lg font-medium text-xs transition-colors border border-red-700/50 w-full md:w-auto">
                 Retry Connection
              </button>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12 flex-1 w-full max-w-7xl">
        {/* TIMELINE / VISUALIZATION LEFT */}
        <div className="flex-1 flex flex-col relative w-full overflow-hidden">
          
          {/* TRUE TASK GRAPH */}
          <div className="mb-8 relative z-10 glass p-5 md:p-6 rounded-2xl border border-white/10 shadow-lg">
            <h3 className="text-[10px] md:text-sm font-medium tracking-widest text-purple-400 uppercase mb-6 flex items-center gap-2">
              <Network size={16} /> Orchestration Graph
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-purple-500 bg-purple-900/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)] z-10 relative">
                 <Rocket size={18} className="text-purple-300" />
                </div>
                <div className="bg-purple-900/10 border border-purple-500/30 px-3 py-1 md:py-1.5 rounded-lg relative">
                   <span className="text-purple-300 font-bold tracking-widest text-[10px] md:text-xs">MANAGER NODE</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pl-4 md:pl-5 relative">
                <div className="absolute left-4 md:left-5 top-0 bottom-4 w-px bg-purple-500/30" />
                {planTasks.map((t) => {
                  const isDone = executionLogs.some(l => l.text.includes(`Finished task ${t.id} with status completed`))
                  const isRetrying = executionLogs.some(l => l.text.includes(`[RETRY] Task ${t.id}`)) && !isDone
                  const isFailed = executionLogs.some(l => l.text.includes(`[ERROR] Task ${t.id}`))
                  const isActive = executionLogs.some(l => l.text.includes(`Started task ${t.id}`)) && !isDone && !isFailed
                  
                  const workerLog = executionLogs.find(l => l.text.includes(`Started task ${t.id}`))
                  const workerName = workerLog ? (workerLog.text.match(/\[(WORKER_\d+)]/i)?.[1] || 'WORKER') : null

                  return (
                    <div key={t.id} className="flex gap-3 md:gap-4 items-center relative pl-5 md:pl-6">
                       <div className="absolute left-0 top-1/2 w-5 md:w-6 h-px bg-purple-500/30" />
                       <div className={clsx("w-2.5 h-2.5 md:w-3 md:h-3 rounded-full z-10 mt-0.5 shrink-0", 
                          isFailed ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" :
                          isRetrying ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse" :
                          isActive ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" : 
                          isDone ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" : "bg-slate-700"
                       )} />
                       <div className={clsx("px-3 md:px-4 py-2 md:py-2.5 rounded-xl flex-1 transition-all border min-w-0", 
                          isFailed ? "bg-red-950/40 border-red-500/50 shadow-lg" :
                          isRetrying ? "bg-amber-950/40 border-amber-500/50 shadow-lg" :
                          isActive ? "bg-cyan-950/40 border-cyan-500/30 shadow-lg" : 
                          isDone ? "bg-green-950/20 border-green-500/20" : "bg-slate-800/20 border-slate-700/30"
                       )}>
                         <div className="flex flex-col md:flex-row justify-between md:items-center gap-1.5 md:gap-2">
                           <div className="flex flex-col min-w-0">
                             <span className={clsx("font-semibold text-[11px] md:text-sm truncate", 
                                isFailed ? "text-red-200" :
                                isRetrying ? "text-amber-200" :
                                isActive ? "text-cyan-100" : 
                                isDone ? "text-green-100" : "text-slate-400"
                             )}>{t.title}</span>
                             <span className="text-[9px] md:text-[10px] text-slate-500 truncate">{t.description}</span>
                           </div>
                           <span className={clsx("text-[9px] md:text-[10px] tracking-wider uppercase opacity-80 flex items-center gap-1.5 font-bold shrink-0", 
                              isFailed ? "text-red-400" :
                              isRetrying ? "text-amber-400" :
                              isActive ? "text-cyan-300" : 
                              isDone ? "text-green-400" : "text-slate-500"
                           )}>
                             {isStreaming && !isDone && !isFailed && !isRetrying && !isActive ? (
                                <><Loader2 className="animate-spin" size={10} /> Queued</>
                             ) : isRetrying ? <><Loader2 size={10} className="animate-spin" /> Retrying</> :
                              isActive ? <><Loader2 size={10} className="animate-spin" /> Live</> : 
                              isFailed ? 'Failed' :
                              isDone ? 'Complete' : 'Pending'}
                           </span>
                         </div>
                       </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* PARALLEL WORKER TIMELINE (GANTT) */}
          <div className="mb-0 relative z-10 glass p-5 md:p-6 rounded-2xl border border-white/10 shadow-lg">
            <h3 className="text-[11px] md:text-sm font-medium tracking-widest text-cyan-400 uppercase mb-6 flex items-center gap-2">
              <Activity size={16} /> Parallel Execution
            </h3>
            <div className="flex flex-col gap-4">
              {['worker_1', 'worker_2'].map(worker => {
                const workerLogs = executionLogs.filter(l => l.text.toLowerCase().includes(worker.toLowerCase()) || l.text.toLowerCase().includes(`[${worker.toLowerCase()}]`))
                const isWorking = workerLogs.some(l => l.text.includes('Started')) && !workerLogs.some(l => l.text.includes('Finished') && l.id === workerLogs[0]?.id) 
                
                const startLog = workerLogs.find(l => l.text.includes('Started task'))
                const activeIdMatch = startLog?.text.match(/task (\d+)/i)
                const activeId = activeIdMatch ? activeIdMatch[1] : null
                const taskObj = planTasks.find(t => String(t.id) === activeId)
                
                return (
                  <div key={worker} className="flex gap-3 md:gap-4 items-center">
                    <div className="w-16 md:w-24 shrink-0 text-right">
                       <span className="font-bold tracking-widest text-slate-300 uppercase text-[9px] md:text-xs">{worker}</span>
                       <div className="text-[8px] md:text-[9px] text-slate-500 uppercase mt-0.5">{isWorking ? 'Active' : 'Idle'}</div>
                    </div>
                    
                    <div className="flex-1 bg-[#03060c] border border-slate-700/60 rounded-xl h-10 md:h-12 relative overflow-hidden flex items-center px-1">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_infinite] pointer-events-none" />
                       
                       {isWorking && taskObj ? (
                          <div className="bg-cyan-900/40 border-l-2 border-cyan-400 border border-slate-700 h-7 md:h-8 rounded px-2 md:px-3 flex flex-col justify-center min-w-[120px] md:min-w-[200px] shadow-[0_0_10px_rgba(34,211,238,0.1)] transition-all animate-pulse">
                             <div className="text-[9px] md:text-[10px] font-bold text-cyan-300 truncate">T-{taskObj.id}: {taskObj.title}</div>
                          </div>
                       ) : workerLogs.some(l => l.text.includes('Finished')) ? (
                          <div className="flex gap-2 w-full px-2 opacity-50">
                             <div className="bg-green-900/40 border-l-2 border-green-500 border border-slate-700 h-7 md:h-8 rounded px-3 flex flex-col justify-center w-[120px]">
                               <div className="text-[10px] font-bold text-green-300">Complete</div>
                             </div>
                          </div>
                       ) : (
                          <div className="text-slate-600 text-xs italic px-3">Waiting for queue...</div>
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Compute Progress Bar */}
            <div className="mt-8">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">System Compute</span>
                 <span className="text-[10px] font-bold tracking-widest text-cyan-400">{Math.round(progress)}%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-cyan-400 box-shadow-[0_0_15px_rgba(34,211,238,1)]"
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                 />
               </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK STREAM RIGHT */}
        <div className="w-full lg:w-[480px] shrink-0 flex flex-col z-10 glass rounded-2xl border border-white/5 p-6 h-[80vh]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
              <Activity size={14} className="text-green-400"/> Live Event Stream
            </h3>
            <div className="text-[10px] font-bold text-slate-500 tracking-widest flex items-center gap-2">
              {isPaused ? <span className="text-yellow-400">PAUSED</span> : (isStreaming && <span className="text-green-400">SYNC OK <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1"/></span>)}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {executionLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={clsx(
                    "p-3.5 rounded-lg flex items-start gap-4 transition-all duration-300 border backdrop-blur-md shadow-sm",
                    log.status === 'error' || log.text.includes('[ERROR]') ? "bg-red-950/40 border-red-900/80 shadow-red-900/20" : 
                    log.text.includes('[RETRY]') ? "bg-amber-950/40 border-amber-900/80 shadow-amber-900/20" :
                    log.text.includes('[TOOL]') ? "bg-cyan-950/20 border-cyan-900/50 text-cyan-50 shadow-cyan-900/20" : 
                    log.text.includes('[MANAGER]') ? "bg-purple-950/20 border-purple-900/50 shadow-purple-900/20" : 
                    "bg-slate-800/30 border-slate-700/50 text-slate-300"
                  )}
                >
                  <div className="mt-0.5 opacity-100 flex-shrink-0">
                    {getLogIcon(log.status, log.text)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-medium leading-relaxed break-words">{log.text}</h4>
                    <span className="text-[10px] block mt-1.5 opacity-60 font-mono tracking-wider">{log.time}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* PAUSE OVERLAY */}
      <AnimatePresence>
        {isPaused && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center pointer-events-none"
           >
             <div className="flex flex-col items-center">
                 <Pause size={64} className="text-slate-500 mb-6 drop-shadow-2xl" />
                 <h2 className="text-4xl font-black tracking-[0.2em] text-slate-400 uppercase px-8 py-4 border-y-2 border-slate-700">System Paused</h2>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col md:flex-row gap-4 z-50">
          {!isPaused && taskId && (
              <button 
                  onClick={handlePause}
                  disabled={!taskId || !isStreaming}
                  className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-xl disabled:opacity-50 border border-slate-600 backdrop-blur-md text-sm"
              >
                  <Pause size={16} className="fill-slate-400 text-slate-400" />
                  Pause Execution
              </button>
          )}
          {isPaused && (
              <button 
                  onClick={handleResume}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] text-sm"
              >
                  <Play size={16} className="fill-black text-black" />
                  Resume System
              </button>
          )}
          {taskId && (
            <button 
                onClick={() => cancelTask()}
                disabled={isAborting}
                className={clsx(
                  "bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-all border border-red-500/30 text-sm shadow-xl",
                  isAborting && "opacity-50 cursor-not-allowed"
                )}
            >
                {isAborting ? (
                  <><Loader2 className="animate-spin" size={16} /> Cancelling...</>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Cancel Orchestration
                  </>
                )}
            </button>
          )}
      </div>
    </div>
  )
}
