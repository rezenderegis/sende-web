'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#produtos', label: 'Produtos' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#contato', label: 'Contato' },
]

export default function GlobalSixNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F5F4F2]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="#" className="font-display text-lg font-extrabold text-black">
          GlobalSix
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-black/60 transition-colors hover:text-black"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#contato"
          className="hidden rounded-full bg-[#8257E5] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6f45cc] md:inline-flex"
        >
          Contato
        </Link>

        <button
          className="rounded-lg p-2 text-black/70 hover:bg-black/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-[#F5F4F2] px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="#contato"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-[#8257E5] px-4 py-2.5 text-center text-sm font-bold text-white"
            >
              Contato
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
