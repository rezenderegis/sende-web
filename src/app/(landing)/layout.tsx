import type { ReactNode } from 'react'
import LandingNav from '@/components/landing/nav'
import LandingFooter from '@/components/landing/footer'

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
