'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#oficina', label: 'Nossa Oficina' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#onde-estamos', label: 'Onde Estamos' },
]

export default function SfPinturaNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="#" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-[#F5C451] to-[#D4932A] font-display text-sm font-extrabold text-black">
            SF
          </span>
          <span className="font-display text-sm font-bold leading-tight text-white">
            Funilaria e<br className="sm:hidden" /> Pintura Automotiva
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-[#F5C451]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#contato"
          className="hidden rounded-full bg-gradient-to-r from-[#F5C451] to-[#D4932A] px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 md:inline-flex"
        >
          Contato
        </Link>

        <button
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-black px-6 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="#contato"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gradient-to-r from-[#F5C451] to-[#D4932A] px-4 py-2.5 text-center text-sm font-bold text-black"
            >
              Contato
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
