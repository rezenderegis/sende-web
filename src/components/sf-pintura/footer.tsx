export default function SfPinturaFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#F5C451] to-[#D4932A] font-display text-xs font-extrabold text-black">
              SF
            </span>
            <span className="font-display text-sm font-bold text-white">
              Funilaria e Pintura Automotiva
            </span>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} SF Funilaria e Pintura Automotiva. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
