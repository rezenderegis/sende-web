import type { Metadata } from 'next'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import SfPinturaNav from '@/components/sf-pintura/nav'
import SfPinturaFooter from '@/components/sf-pintura/footer'
import SfPinturaWhatsAppFloat from '@/components/sf-pintura/whatsapp-float'
import { isLandingPageActive } from '@/lib/landing-pages'

const GOOGLE_ADS_ID = 'AW-16505662855'

export const metadata: Metadata = {
  title: 'SF Funilaria e Pintura Automotiva',
  description:
    'Funilaria, pintura automotiva, polimento cristalizado e martelinho de ouro. Soluções completas para restaurar a beleza e a integridade do seu veículo.',
}

export default async function SfPinturaLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLandingPageActive('sf-pintura'))) notFound()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Google tag (gtag.js) — escopado só nessa rota, não afeta Sende/GlobalSix */}
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init-sfpintura" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>

      <SfPinturaNav />
      <main>{children}</main>
      <SfPinturaFooter />
      <SfPinturaWhatsAppFloat />
    </div>
  )
}
