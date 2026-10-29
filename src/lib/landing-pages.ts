// Checagem server-side (sem auth) se uma landing page está ativa — consultado
// direto pelo page.tsx de cada uma (globalsix, sende, sf-pintura) antes de
// renderizar. Cache curto (60s) pra não bater no backend em toda visita, mas
// ainda refletir um toggle feito no admin rapidamente. Falha "aberta" (assume
// ativa) se o backend estiver fora do ar — um problema de rede não deveria
// tirar do ar uma página de um cliente que está pagando.
export async function isLandingPageActive(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/landing-pages`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return true
    const pages: { slug: string; isActive: boolean }[] = await res.json()
    const page = pages.find((p) => p.slug === slug)
    return page?.isActive ?? true
  } catch {
    return true
  }
}
