'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Globe, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import type { Site } from '@/types'

const TEMPLATES: { key: string; label: string; html: string }[] = [
  {
    key: 'blank',
    label: 'Em branco',
    html: '',
  },
  {
    key: 'vendas',
    label: 'Landing page de vendas',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nome do Produto</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#0f172a; }
  .hero { background:linear-gradient(135deg,#0f172a,#1e293b); color:#fff; padding:80px 24px 96px; text-align:center; }
  .hero h1 { font-size:36px; max-width:680px; margin:0 auto 16px; line-height:1.25; }
  .hero p { font-size:17px; color:#cbd5e1; max-width:560px; margin:0 auto 28px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 32px; background:#22c55e; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; font-size:16px; }
  .section { max-width:960px; margin:0 auto; padding:64px 24px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:32px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr; } }
  .card { background:#f8fafc; border-radius:16px; padding:28px; text-align:center; }
  .card .emoji { font-size:32px; margin-bottom:12px; }
  .card h3 { font-size:17px; margin:0 0 8px; }
  .card p { font-size:14px; color:#475569; line-height:1.5; margin:0; }
  .quote { max-width:640px; margin:0 auto; text-align:center; font-size:19px; font-style:italic; color:#1e293b; line-height:1.6; }
  .quote span { display:block; margin-top:14px; font-size:14px; font-style:normal; color:#64748b; }
  .final { background:#0f172a; color:#fff; text-align:center; padding:64px 24px; }
  .final h2 { font-size:26px; margin:0 0 20px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#94a3b8; }
</style>
</head>
<body>
<section class="hero">
  <h1>O título que resolve o problema do seu cliente em uma frase</h1>
  <p>Explique em uma ou duas frases o que você vende e por que isso importa pra quem está lendo agora.</p>
  <a class="cta" href="https://wa.me/5500000000000">Quero saber mais</a>
</section>

<section class="section">
  <div class="grid">
    <div class="card"><div class="emoji">⚡</div><h3>Benefício 1</h3><p>Descreva rapidamente o primeiro grande benefício do seu produto ou serviço.</p></div>
    <div class="card"><div class="emoji">🎯</div><h3>Benefício 2</h3><p>Descreva o segundo benefício — o que torna sua solução diferente das outras.</p></div>
    <div class="card"><div class="emoji">🤝</div><h3>Benefício 3</h3><p>Descreva o terceiro benefício, reforçando confiança e resultado.</p></div>
  </div>
</section>

<section class="section">
  <p class="quote">"Coloque aqui um depoimento real de um cliente satisfeito — isso gera muito mais confiança do que qualquer texto de venda."<span>Nome do Cliente, Empresa</span></p>
</section>

<section class="final">
  <h2>Pronto pra começar?</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp agora</a>
</section>

<footer>© Nome da Empresa — todos os direitos reservados</footer>
</body>
</html>`,
  },
  {
    key: 'odonto',
    label: 'Clínica odontológica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clínica Odontológica</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#0c4a6e; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #e0f2fe; }
  nav .logo { font-weight:800; font-size:18px; color:#0369a1; }
  nav a.phone { color:#0369a1; text-decoration:none; font-weight:600; font-size:14px; }
  .hero { background:#f0f9ff; padding:64px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:600px; margin:0 auto 14px; color:#0c4a6e; }
  .hero p { font-size:16px; color:#0369a1; max-width:520px; margin:0 auto 26px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#0ea5e9; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:960px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#0c4a6e; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border:1px solid #e0f2fe; border-radius:14px; padding:22px; text-align:center; }
  .card .emoji { font-size:28px; margin-bottom:8px; }
  .card h3 { font-size:15px; margin:0; color:#0c4a6e; }
  .why { background:#f0f9ff; }
  .why ul { max-width:480px; margin:0 auto; padding:0; list-style:none; }
  .why li { padding:8px 0; font-size:15px; }
  .why li::before { content:"✓ "; color:#0ea5e9; font-weight:800; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#64748b; border-top:1px solid #e0f2fe; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">(00) 00000-0000</a>
</nav>

<section class="hero">
  <h1>Sorria com confiança</h1>
  <p>Cuidado odontológico completo, com atendimento humano e tecnologia de ponta pra sua família.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar consulta</a>
</section>

<section class="section">
  <h2>Nossos tratamentos</h2>
  <div class="grid">
    <div class="card"><div class="emoji">✨</div><h3>Clareamento</h3></div>
    <div class="card"><div class="emoji">🦷</div><h3>Ortodontia</h3></div>
    <div class="card"><div class="emoji">🔧</div><h3>Implantes</h3></div>
    <div class="card"><div class="emoji">🪥</div><h3>Limpeza</h3></div>
    <div class="card"><div class="emoji">👑</div><h3>Próteses</h3></div>
    <div class="card"><div class="emoji">🚨</div><h3>Urgência</h3></div>
  </div>
</section>

<section class="section why">
  <h2>Por que escolher a gente</h2>
  <ul>
    <li>Equipe especializada e atualizada</li>
    <li>Equipamentos modernos e esterilização rigorosa</li>
    <li>Atendimento acolhedor, sem pressa</li>
    <li>Facilidade de agendamento pelo WhatsApp</li>
  </ul>
</section>

<section class="final">
  <h2>Marque sua avaliação</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
  {
    key: 'medica',
    label: 'Clínica médica',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clínica Médica</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#134e4a; }
  nav { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #ccfbf1; }
  nav .logo { font-weight:800; font-size:18px; color:#0f766e; }
  nav a.phone { color:#0f766e; text-decoration:none; font-weight:600; font-size:14px; }
  .hero { background:#f0fdfa; padding:64px 24px; text-align:center; }
  .hero h1 { font-size:34px; max-width:600px; margin:0 auto 14px; color:#134e4a; }
  .hero p { font-size:16px; color:#0f766e; max-width:520px; margin:0 auto 26px; line-height:1.6; }
  .cta { display:inline-block; padding:14px 30px; background:#14b8a6; color:#fff; text-decoration:none; border-radius:999px; font-weight:700; }
  .section { max-width:960px; margin:0 auto; padding:56px 24px; }
  .section h2 { text-align:center; font-size:26px; margin-bottom:32px; color:#134e4a; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  @media (max-width:720px) { .grid { grid-template-columns:1fr 1fr; } }
  .card { background:#fff; border:1px solid #ccfbf1; border-radius:14px; padding:20px; text-align:center; }
  .card .emoji { font-size:26px; margin-bottom:8px; }
  .card h3 { font-size:14px; margin:0; color:#134e4a; }
  .team { background:#f0fdfa; text-align:center; }
  .team p { max-width:560px; margin:0 auto; line-height:1.6; color:#0f766e; }
  .final { text-align:center; padding:56px 24px; }
  footer { text-align:center; padding:24px; font-size:13px; color:#64748b; border-top:1px solid #ccfbf1; }
</style>
</head>
<body>
<nav>
  <span class="logo">Nome da Clínica</span>
  <a class="phone" href="https://wa.me/5500000000000">(00) 00000-0000</a>
</nav>

<section class="hero">
  <h1>Cuidado médico que você pode confiar</h1>
  <p>Atendimento humanizado, diagnóstico preciso e acompanhamento completo da sua saúde.</p>
  <a class="cta" href="https://wa.me/5500000000000">Agendar consulta</a>
</section>

<section class="section">
  <h2>Especialidades</h2>
  <div class="grid">
    <div class="card"><div class="emoji">🩺</div><h3>Clínico Geral</h3></div>
    <div class="card"><div class="emoji">❤️</div><h3>Cardiologia</h3></div>
    <div class="card"><div class="emoji">🧒</div><h3>Pediatria</h3></div>
    <div class="card"><div class="emoji">🩹</div><h3>Dermatologia</h3></div>
    <div class="card"><div class="emoji">🦴</div><h3>Ortopedia</h3></div>
    <div class="card"><div class="emoji">🧠</div><h3>Neurologia</h3></div>
    <div class="card"><div class="emoji">🤰</div><h3>Ginecologia</h3></div>
    <div class="card"><div class="emoji">👁️</div><h3>Oftalmologia</h3></div>
  </div>
</section>

<section class="section team">
  <h2>Nossa equipe</h2>
  <p>Médicos experientes e comprometidos em oferecer o melhor cuidado em cada consulta, com estrutura completa pra exames e procedimentos no mesmo local.</p>
</section>

<section class="final">
  <h2>Marque sua consulta</h2>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</section>

<footer>Nome da Clínica — Endereço, Cidade/UF</footer>
</body>
</html>`,
  },
]

function SitePreview({ html }: { html: string }) {
  return (
    <iframe
      title="Preview"
      srcDoc={html || '<p style="font-family:sans-serif;color:#9ca3af;padding:24px;">Cole o HTML pra ver o preview aqui.</p>'}
      sandbox=""
      className="h-full w-full rounded-lg border bg-white"
    />
  )
}

function SiteForm({
  initial,
  onCancel,
  onSubmit,
  isPending,
}: {
  initial?: { name: string; slug: string; content: string }
  onCancel: () => void
  onSubmit: (data: { name: string; slug: string; content: string }) => void
  isPending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [content, setContent] = useState(initial?.content ?? '')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      const res = await api.post('/sites-mine/generate', { prompt: aiPrompt })
      setContent(res.data.html)
      toast({ title: 'Página gerada — revise o conteúdo antes de salvar', variant: 'success' })
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Erro ao gerar com IA', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      )
    }
  }

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Nome da página</Label>
          <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Loja da Maria" />
        </div>
        <div>
          <Label>Slug (identificador interno)</Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="loja-da-maria"
          />
        </div>
      </div>

      {!initial && (
        <div className="mt-4">
          <Label>Começar a partir de um modelo</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <Button key={t.key} type="button" size="sm" variant="outline" onClick={() => setContent(t.html)}>
                {t.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-dashed border-teal-200 bg-teal-50/40 p-4">
        <Label>Ou gerar com IA</Label>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          Descreva o negócio e o que a página deve ter — a IA gera um HTML completo pra você revisar e ajustar.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ex: página de vendas pra uma barbearia masculina, tom moderno, com seção de serviços (corte, barba, combo) e botão de agendar no WhatsApp"
            className="h-20 flex-1 text-xs sm:h-10"
          />
          <Button
            type="button"
            className="shrink-0 bg-teal-600 text-white hover:bg-teal-700"
            disabled={!aiPrompt.trim() || generating}
            onClick={handleGenerate}
          >
            {generating ? 'Gerando...' : 'Gerar com IA'}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <Label>Código HTML da página</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o HTML completo da página..."
            className="mt-1.5 h-80 font-mono text-xs"
          />
        </div>
        <div>
          <Label>Preview</Label>
          <div className="mt-1.5 h-80">
            <SitePreview html={content} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          className="bg-teal-600 text-white hover:bg-teal-700"
          disabled={!name.trim() || !slug.trim() || isPending}
          onClick={() => onSubmit({ name, slug, content })}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}

export default function MyPagePage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ['my-sites'],
    queryFn: () => api.get('/sites-mine').then((r) => r.data),
  })

  const editingSite = useMemo(() => sites.find((s) => s.id === editingId) ?? null, [sites, editingId])

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; content: string }) => api.post('/sites-mine', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sites'] })
      setShowCreate(false)
      toast({ title: 'Página criada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: err?.response?.data?.message || 'Erro ao criar página', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; content: string }) =>
      api.patch(`/sites-mine/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sites'] })
      setEditingId(null)
      toast({ title: 'Página atualizada', variant: 'success' })
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sites-mine/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sites'] })
      toast({ title: 'Página removida' })
    },
    onError: () => toast({ title: 'Erro ao remover', variant: 'destructive' }),
  })

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Minha Página</h1>
          <p className="text-sm text-muted-foreground">Crie e edite o conteúdo da sua página — o domínio é configurado pela nossa equipe depois que você cria.</p>
        </div>
        {!showCreate && (
          <Button className="bg-teal-600 text-white hover:bg-teal-700" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova página
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6">
          <SiteForm
            onCancel={() => setShowCreate(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : sites.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-dashed bg-gray-50/60 p-8 text-center">
          <Globe className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-700">Você ainda não tem nenhuma página criada</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
            Clique em "Nova página", cole o HTML (ou comece de um modelo pronto) e salve. Depois de criar, fale com a
            gente pra configurarmos o domínio próprio da sua página — até lá, ela fica salva mas sem endereço público.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site) =>
            editingSite?.id === site.id ? (
              <SiteForm
                key={site.id}
                initial={{ name: site.name, slug: site.slug, content: site.content }}
                onCancel={() => setEditingId(null)}
                onSubmit={(data) => updateMutation.mutate({ id: site.id, name: data.name, content: data.content })}
                isPending={updateMutation.isPending}
              />
            ) : (
              <div key={site.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{site.name}</p>
                    <span className={site.isActive ? 'rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700' : 'rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600'}>
                      {site.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  {site.domain ? (
                    <a
                      href={`https://${site.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-xs text-teal-600 hover:underline"
                    >
                      {site.domain} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <a
                      href={`/sites/${site.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 hover:underline"
                    >
                      Link temporário de preview (sem domínio ainda) <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(site.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Remover a página "${site.name}"? Essa ação não pode ser desfeita.`)) {
                        deleteMutation.mutate(site.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
