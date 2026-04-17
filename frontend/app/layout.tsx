import './globals.css'
import type { Metadata } from 'next'
import { Sidebar } from '../components/Sidebar'
import { RightHeader } from '../components/RightHeader'
import DebugPanel from '../components/DebugPanel'
import { ParticleField } from '../components/ParticleField'

export const metadata: Metadata = {
  title: 'Ether OS',
  description: 'AI Operating System Interface',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-foreground bg-background font-sans overflow-x-hidden">
        <ParticleField />
        <Sidebar />
        <RightHeader />
        <DebugPanel />
        {children}
      </body>
    </html>
  )
}
