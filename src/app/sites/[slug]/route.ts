const UNAVAILABLE_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Página indisponível</title>
<style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:#fff; color:#111; text-align:center; padding:24px; }
  p { margin-top:8px; color:#6b7280; font-size:14px; }
</style>
</head>
<body>
<h1 style="font-size:20px;font-weight:600;margin:0;">Página temporariamente indisponível</h1>
<p>Volte mais tarde ou entre em contato pra mais informações.</p>
</body>
</html>`

// Serve o HTML colado pelo cliente como está — não passa pela árvore React
// (o conteúdo é um documento HTML completo, não um fragmento pra injetar em
// componente). Isso também dá controle total do status HTTP: 404 de
// verdade quando o site está desativado ou não existe, igual decidimos pras
// landing pages fixas (notFound()) — aqui simplesmente devolvendo status 404.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sites/${encodeURIComponent(params.slug)}`, {
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return new Response(UNAVAILABLE_HTML, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    const site = await res.json()
    if (!site.isActive) {
      return new Response(UNAVAILABLE_HTML, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    return new Response(site.content, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
  } catch {
    return new Response(UNAVAILABLE_HTML, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }
}
