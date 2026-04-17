'use client'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { useRouter } from 'next/navigation'
import { useStore } from '../../store/useStore'
import { Sparkles, Copy, Share2, RefreshCcw, Download, Trash2, ArrowRight } from 'lucide-react'

export default function ResultPage() {
  const router = useRouter()
  const { finalResult, userInput, planTasks, executionLogs, resetSystem } = useStore()
  
  const handleBack = () => {
    resetSystem()
    router.push('/')
  }

  const processFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  if (!finalResult) {
    const isActuallyFailed = !finalResult && executionLogs.some(l => l.text.toLowerCase().includes('abort') || l.text.toLowerCase().includes('fail'))
    return (
      <div className="px-6 md:pl-32 md:pr-12 pt-16 pb-12 min-h-screen flex flex-col items-center justify-center text-center">
        {isActuallyFailed ? (
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 rounded-full border-2 border-red-500/50 flex items-center justify-center mb-6">
                <div className="w-8 h-8 rounded-full bg-red-500 animate-pulse" />
             </div>
             <h2 className="text-2xl font-bold text-red-400 uppercase tracking-widest">Orchestration Aborted</h2>
             <p className="text-slate-500 mt-2 max-w-md">The process was terminated. You can still view logs in the Pulse page or start a new mission.</p>
             <button onClick={handleBack} className="mt-8 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl transition-all font-bold uppercase tracking-widest text-xs">Back to Command</button>
           </div>
        ) : (
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 rounded-full border-t-2 border-cyan-400 animate-spin mb-6" />
             <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-widest">Awaiting Synthesis...</h2>
             <p className="text-slate-500 mt-2">The system is still aggregating parallel task outputs.</p>
             <button onClick={handleBack} className="mt-8 opacity-50 hover:opacity-100 transition-opacity text-slate-500 text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                <span className="text-lg">←</span> Return to command
             </button>
           </div>
        )}
      </div>
    )
  }

  const result = finalResult

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.summary || JSON.stringify(result));
      alert('Copied to clipboard!');
    } catch (e) {
      console.error('Failed to copy', e);
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: result.title || 'Ether OS Result',
          text: result.summary || 'Task completed successfully',
        });
      } else {
        handleCopy();
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  }

  return (
    <div className="px-6 md:pl-32 md:pr-12 pt-24 md:pt-20 pb-40 min-h-screen relative flex flex-col items-center overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mb-12 md:mb-16 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 text-[10px] font-bold tracking-widest text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {result.alignment} ALIGNMENT
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
          {result.title?.includes('Aborted') ? 'Orchestration' : 'Result'} <span className={clsx("text-transparent bg-clip-text bg-gradient-to-r", result.title?.includes('Aborted') ? "from-red-400 to-amber-500" : "from-cyan-300 to-purple-400")}>
            {result.title?.includes('Aborted') ? 'Aborted' : 'Ready'}
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg font-light leading-relaxed">
          {result.title?.includes('Aborted') 
            ? "The operation was terminated. Analysis of the partial execution data is provided below."
            : "Synthesis complete. The intelligence has processed your request and generated a high-fidelity output."}
        </p>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1200px] relative z-10">
        
        {/* LEFT CARD - VIRAL SHAREABLE OUTPUT */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 glass rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 border border-white/10 relative overflow-hidden flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] -z-10" />
          
          <div className="flex items-center justify-between mb-8 md:mb-10 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] text-cyan-400 uppercase">
               <Sparkles size={16} className="text-cyan-400 animate-pulse" />
               <span className="hidden xs:inline">INTELLIGENCE SYNTHESIS READY</span>
               <span className="xs:hidden">READY</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono font-bold tracking-widest">v1.2 // CORE-GEN</div>
          </div>

          <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-white leading-[1.1] tracking-tight">
            {result.title || 'Strategic Framework Analysis'}
          </h2>

          <div className="prose prose-invert max-w-none">
            <div className="text-slate-200 font-light leading-relaxed text-sm md:text-lg mb-8 md:mb-10 selection:bg-cyan-500/30">
              {(result.summary || 'Operation completed with high fidelity.').split('\n').map((line, i) => {
                // 1. Handle Headings
                if (line.startsWith('###') || line.match(/^\d+\.\s+[A-Z\s]+$/)) {
                  const cleanHeading = line.replace('###', '').replace(/^\d+\.\s+/, '').trim()
                  return <h3 key={i} className="text-xl md:text-2xl font-bold text-cyan-400 mt-8 mb-4 tracking-tight uppercase border-b border-cyan-900/30 pb-2">{cleanHeading}</h3>
                }
                
                // 2. Handle Bullets
                if (line.startsWith('-') || line.startsWith('•')) {
                  return <div key={i} className="flex gap-3 mb-2 ml-2">
                    <span className="text-cyan-500 mt-1.5">•</span>
                    <span className="opacity-90">{processFormatting(line.substring(1).trim())}</span>
                  </div>
                }
                
                if (line.trim() === '') return <div key={i} className="h-4" />
                
                // 3. Handle Standard Paragraphs with formatting
                return <p key={i} className="mb-4 opacity-90">{processFormatting(line)}</p>
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="bg-white/5 border border-white/5 p-5 md:p-6 rounded-2xl group hover:border-cyan-500/30 transition-colors">
               <div className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-3">PRIMARY VECTOR</div>
               <div className="text-sm md:text-base text-cyan-100 font-medium">{result.primaryVector || 'Cognitive Logic'}</div>
            </div>
            <div className="bg-white/5 border border-white/5 p-5 md:p-6 rounded-2xl group hover:border-purple-500/30 transition-colors">
               <div className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-3">SECONDARY VECTOR</div>
               <div className="text-sm md:text-base text-purple-100 font-medium">{result.secondaryVector || 'Parallel Inference'}</div>
            </div>
          </div>

          <blockquote className="border-l-4 border-cyan-400 pl-6 md:pl-8 py-4 mb-8 md:mb-10 text-slate-200 italic font-light text-base md:text-xl leading-relaxed bg-gradient-to-r from-cyan-950/30 to-transparent rounded-r-2xl">
            "The boundary between mechanical execution and creative orchestration has been bridged."
          </blockquote>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
            <button onClick={handleCopy} className="bg-cyan-400 hover:bg-white text-black px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-sm">
               <Copy size={18} /> COPY PROTOCOL
            </button>
            <button onClick={handleShare} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 text-sm">
               <Share2 size={18} /> SHARE TRACE
            </button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6">
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass rounded-3xl p-6 md:p-8 border border-white/10"
          >
            <h3 className="text-xs font-bold tracking-widest text-white uppercase mb-8">INTELLIGENCE METRICS</h3>
            <div className="space-y-5 md:space-y-6">
              <div>
                <div className="flex justify-between text-xs md:text-sm mb-3">
                  <span className="text-slate-400 font-medium">System Confidence</span>
                  <span className="font-mono text-cyan-300">{result.confidence}</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 w-[95%] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                </div>
              </div>
              <div className="border-t border-white/5 pt-5 md:pt-6 flex justify-between items-center text-xs md:text-sm">
                 <span className="text-slate-400 font-medium">Nodes</span>
                 <span className="font-mono text-white">{planTasks.length} Units</span>
              </div>
              <div className="border-t border-white/5 pt-5 md:pt-6 flex justify-between items-center text-xs md:text-sm">
                 <span className="text-slate-400 font-medium">Retries</span>
                 <span className="font-mono text-red-300">{executionLogs.filter(l => l.text.includes('[RETRY]')).length} Recoveries</span>
              </div>
              <div className="border-t border-white/5 pt-5 md:pt-6 flex justify-between items-center text-xs md:text-sm">
                 <span className="text-slate-400 font-medium">Tokens</span>
                 <span className="font-mono text-white">{result.tokens?.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-purple-950/30 border border-purple-500/20 rounded-3xl p-6 md:p-8 hover:bg-purple-900/30 transition-colors cursor-pointer group"
          >
            <h4 className="font-semibold text-white mb-2 text-sm md:text-base">Deep Dive?</h4>
            <p className="text-[12px] md:text-sm text-purple-200/60 font-light leading-relaxed mb-6">Request a detailed analysis on specific points.</p>
            <div className="text-xs md:text-sm font-semibold text-purple-300 flex items-center gap-2 group-hover:text-purple-200 transition-colors">
              Run Detail Protocol <ArrowRight size={16} />
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-8 md:mt-12 w-full max-w-[1200px] z-10"
      >
        <div className="glass rounded-2xl p-4 md:p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group gap-6">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            <button className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-cyan-400 text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              <RefreshCcw size={18} className="font-bold -ml-0.5" />
            </button>
            <div className="min-w-0">
              <h4 className="text-[10px] md:text-sm font-bold tracking-widest text-white uppercase mb-1 flex items-center gap-2">
                Replay <span className="text-[8px] md:text-[9px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">BETA</span>
              </h4>
              <p className="text-[10px] md:text-xs text-slate-400 truncate">Scrub through cognitive steps.</p>
            </div>
          </div>

          <div className="flex-1 w-full md:max-w-[500px]">
            <div className="w-full h-1 bg-slate-800 rounded-full cursor-pointer relative group/scrub">
               <div className="absolute left-0 top-0 bottom-0 bg-cyan-500 rounded-full w-[100%] group-hover/scrub:shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-shadow" />
            </div>
            <div className="flex justify-between text-[8px] md:text-[9px] font-mono text-slate-500 uppercase font-bold mt-2">
               <span>T-00:00:00</span>
               <span>T-00:00:{(planTasks.length * 1.5).toFixed(1)}</span>
            </div>
          </div>

          <button className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2 border border-slate-700 hover:border-cyan-500/50 px-3 md:px-4 py-2 rounded-lg w-full md:w-auto justify-center">
             <Share2 size={14} /> EXPORT
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-[9px] md:text-[10px] tracking-widest font-bold uppercase text-slate-500 z-10"
      >
        <button onClick={handleBack} className="flex items-center gap-2 hover:text-cyan-400 transition-colors group">
          <RefreshCcw size={14} className="group-hover:-rotate-90 transition-transform duration-500" /> NEW MISSION
        </button>
        <button className="flex items-center gap-2 hover:text-white transition-colors">
          <Download size={14} /> DOWNLOAD
        </button>
        <button className="flex items-center gap-2 hover:text-red-400 transition-colors">
          <Trash2 size={14} /> SCRUB DATA
        </button>
      </motion.div>
    </div>
  )
}
