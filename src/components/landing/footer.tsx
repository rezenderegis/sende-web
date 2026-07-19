import Link from 'next/link'
import Image from 'next/image'

const product = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
]

const company = [
  { href: '/login', label: 'Entrar' },
  { href: '/register', label: 'Criar conta' },
  { href: '/politica-privacidade', label: 'Política de Privacidade' },
  { href: '/termos-de-servico', label: 'Termos de Serviço' },
  { href: '/delete-account', label: 'Excluir minha conta' },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-[#EEF2F6] bg-teal-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <Image
              src="/brand/sende-lockup.svg"
              alt="Sende"
              width={88}
              height={26}
              className="brightness-0 invert"
            />
            <p className="text-sm leading-relaxed text-teal-100/70">
              CRM conversacional para WhatsApp. Atenda, automatize e cresça.
            </p>
            <p className="text-xs text-teal-100/40">
              GlobalSix Technology · CNPJ 53.843.384/0001-70
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-teal-100/50">
              Produto
            </p>
            <ul className="space-y-2">
              {product.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-teal-100/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-teal-100/50">
              Acesso
            </p>
            <ul className="space-y-2">
              {company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-teal-100/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-teal-100/40">
          © {new Date().getFullYear()} Sende — sende.app.br. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
