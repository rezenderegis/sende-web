'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
]

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#EEF2F6] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/sende-lockup.svg" alt="Sende" width={88} height={26} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-teal-600"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-pill px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-teal-600"
          >
            Entrar
          </Link>
          <Link
            href="#cta"
            className="rounded-pill bg-coral px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-coral-hover"
          >
            TESTE GRÁTIS
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded-lg p-2 text-ink-soft hover:bg-teal-50"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[#EEF2F6] bg-white px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-teal-50 hover:text-teal-600"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[#EEF2F6] pt-3">
              <Link
                href="/login"
                className="rounded-pill border border-[#EEF2F6] px-4 py-2.5 text-center text-sm font-medium text-ink-soft"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-pill bg-coral px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
