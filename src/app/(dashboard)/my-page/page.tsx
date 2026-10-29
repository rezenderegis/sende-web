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
    key: 'simples',
    label: 'Página simples',
    html: `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Minha Empresa</title>
<style>
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#111; }
  header { padding:24px; text-align:center; background:#0f172a; color:#fff; }
  main { max-width:720px; margin:0 auto; padding:32px 24px; }
  h1 { font-size:28px; margin-bottom:8px; }
  p { line-height:1.6; color:#374151; }
  .cta { display:inline-block; margin-top:16px; padding:12px 24px; background:#16a34a; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; }
</style>
</head>
<body>
<header><h1>Nome da Empresa</h1></header>
<main>
  <h1>Título chamativo aqui</h1>
  <p>Descreva seu produto ou serviço em algumas frases. Fale o que o cliente ganha ao te contratar.</p>
  <a class="cta" href="https://wa.me/5500000000000">Falar no WhatsApp</a>
</main>
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
