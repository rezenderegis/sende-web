import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import LandingNav from '@/components/landing/nav'
import LandingFooter from '@/components/landing/footer'
import WhatsAppFloat from '@/components/landing/whatsapp-float'
import { isLandingPageActive } from '@/lib/landing-pages'

export default async function LandingLayout({ children }: { children: ReactNode }) {
  if (!(await isLandingPageActive('sende'))) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
      <WhatsAppFloat />
    </div>
  )
}
