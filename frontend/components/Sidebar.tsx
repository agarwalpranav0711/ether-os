'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Terminal, CopyMinus, Activity, History, User } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Sidebar() {
  const pathname = usePathname()

  const navs = [
    { name: 'COMMAND', icon: Terminal, href: '/' },
    { name: 'STRATEGY', icon: CopyMinus, href: '/manager' },
    { name: 'PULSE', icon: Activity, href: '/execution' },
    { name: 'ARCHIVE', icon: History, href: '/result' },
  ]

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#060B14]/90 backdrop-blur-lg border-t border-[#1e293b]/50 z-[60] flex items-center justify-around px-4">
        {navs.map((n) => {
          const isActive = pathname.startsWith(n.href) && n.href !== '/' || (pathname === '/' && n.href === '/')
          return (
            <Link key={n.name} href={n.href} className="flex flex-col items-center gap-1">
              <div className={cn(
                "p-2 rounded-lg transition-all",
                isActive ? "text-cyan-400 bg-cyan-900/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-500"
              )}>
                <n.icon size={20} />
              </div>
              <span className={cn("text-[7px] font-bold tracking-[0.1em]", isActive ? "text-cyan-400" : "text-slate-500")}>
                {n.name}
              </span>
            </Link>
          )
        })}
      </div>

      {pathname !== '/' && (
        <div className="hidden md:flex w-24 fixed left-0 top-0 bottom-0 bg-[#060B14] border-r border-[#1e293b] flex-col items-center py-6 z-50">
      
      <div className="flex flex-col gap-8 w-full mt-16">
        {navs.map((n) => {
          const isActive = pathname.startsWith(n.href) && n.href !== '/' || (pathname === '/' && n.href === '/')
          return (
            <Link key={n.name} href={n.href} className="flex flex-col items-center gap-2 group relative w-full">
              {isActive && (
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
              )}
              <div
                className={cn(
                  "p-3 rounded-xl transition-all duration-300",
                  isActive ? "text-cyan-400 bg-cyan-900/20 border border-cyan-500/20" : "text-slate-500 group-hover:text-cyan-300"
                )}
              >
                <n.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn("text-[9px] tracking-widest font-bold", isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-cyan-300")}>
                {n.name}
              </span>
            </Link>
          )
        })}
      </div>
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
            <User size={18} />
        </div>
      </div>
    </div>
  )}
</>
  )
}
