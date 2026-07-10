'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Upload, Plus, X, CheckCircle2, Clock, Filter, User, Phone, Mail, Building2, Package, Calendar, Hash, RefreshCw, FileText, Pencil } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { ProductPicker } from '@/components/sales/product-picker'
import { formatPhone } from '@/lib/utils'
import type { Contact, Product, Sale } from '@/types'

function SaleDetailModal({ sale, onClose, onMarkPaid, onDelete }: {
  sale: Sale
  onClose: () => void
  onMarkPaid: (id: string) => void
  onDelete: (id: string) => void
}) {
  const c = sale.contact
  const p = sale.product

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Detalhe da venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Cliente */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
            <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                  {c?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{c?.name || '—'}</p>
                  {c?.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />{formatPhone(c.phone)}
                    </p>
                  )}
                </div>
              </div>
              {c?.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />{c.email}
                </p>
              )}
              {c?.companyName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />{c.companyName}
                </p>
              )}
            </div>
          </div>

          {/* Produto e valores */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Produto</p>
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="font-medium text-sm text-gray-900">{p?.name || '—'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {sale.paymentStatus === 'paid' ? <><CheckCircle2 className="h-3 w-3" />Pago</> : <><Clock className="h-3 w-3" />Pendente</>}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><Calendar className="h-3 w-3" />Data da venda</p>
                  <p className="font-medium text-gray-900">{formatDate(sale.saleDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><Hash className="h-3 w-3" />Quantidade</p>
                  <p className="font-medium text-gray-900">{sale.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Valor unitário</p>
                  <p className="font-medium text-gray-900">{formatCurrency(Number(sale.unitPrice))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Valor total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(sale.totalValue))}</p>
                </div>
              </div>

              {sale.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><Calendar className="h-3 w-3" />Vencimento</p>
                  <p className="text-sm font-medium text-amber-700">{formatDate(sale.dueDate)}</p>
                </div>
              )}

              {p?.repurchaseIntervalDays && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><RefreshCw className="h-3 w-3" />Recorrência</p>
                  <p className="text-sm text-gray-700">A cada {p.repurchaseIntervalDays} dias</p>
                </div>
              )}

              {sale.notes && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><FileText className="h-3 w-3" />Observação</p>
                  <p className="text-sm text-gray-700">{sale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 border-t px-6 py-4">
          {sale.paymentStatus === 'pending' && (
            <button
              onClick={() => { onMarkPaid(sale.id); onClose() }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar como pago
            </button>
          )}
          <button
            onClick={() => { if (confirm('Excluir esta venda?')) { onDelete(sale.id); onClose() } }}
            className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Excluir
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string) {
  if (!d) return '—'
  return d.slice(0, 10).split('-').reverse().join('/')
}

export default function SalesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [contactFilter, setContactFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [showNewSale, setShowNewSale] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [saleForm, setSaleForm] = useState({
    contactPhone: '', productId: '', saleDate: new Date().toISOString().slice(0, 10),
    quantity: '1', unitPrice: '', totalValue: '', paymentStatus: 'pending', dueDate: '', notes: '',
  })

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales', statusFilter, productFilter, startDate, endDate],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.paymentStatus = statusFilter
      if (productFilter) params.productId = productFilter
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      return api.get('/sales', { params }).then((r) => r.data)
    },
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  })

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      const contact: Contact = await api.get('/contacts', { params: {} }).then(async (r) => {
        const all = r.data as Contact[]
        const phone = saleForm.contactPhone.replace(/\D/g, '')
        const found = all.find((c) => c.phone.endsWith(phone) || phone.endsWith(c.phone.slice(-8)))
        if (!found) throw new Error('Contato não encontrado para este número')
        return found
      })
      return api.post('/sales', {
        contactId: contact.id,
        productId: saleForm.productId,
        saleDate: saleForm.saleDate,
        quantity: parseInt(saleForm.quantity) || 1,
        unitPrice: parseFloat(saleForm.unitPrice.replace(',', '.')),
        totalValue: parseFloat(saleForm.totalValue.replace(',', '.')) || parseFloat(saleForm.unitPrice.replace(',', '.')) * (parseInt(saleForm.quantity) || 1),
        paymentStatus: saleForm.paymentStatus,
        dueDate: saleForm.dueDate || undefined,
        notes: saleForm.notes || undefined,
      }).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      setSaleForm({ contactPhone: '', productId: '', saleDate: new Date().toISOString().slice(0, 10), quantity: '1', unitPrice: '', totalValue: '', paymentStatus: 'pending', dueDate: '', notes: '' })
      setShowNewSale(false)
      toast({ title: 'Venda registrada', variant: 'success' })
    },
    onError: (err: any) => toast({ title: 'Erro ao registrar venda', description: err.message || err.response?.data?.message, variant: 'destructive' }),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/sales/${id}/mark-paid`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      toast({ title: 'Marcado como pago', variant: 'success' })
    },
  })

  const deleteSaleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      toast({ title: 'Venda excluída', variant: 'success' })
    },
  })

  const filtered = sales.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.contact?.name?.toLowerCase().includes(q) ||
      s.contact?.phone?.includes(q) ||
      s.product?.name?.toLowerCase().includes(q)
    )
  })

  const totalPaid = filtered.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.totalValue), 0)
  const totalPending = filtered.filter((s) => s.paymentStatus === 'pending').reduce((sum, s) => sum + Number(s.totalValue), 0)
  const hasFilters = statusFilter || productFilter || startDate || endDate

  return (
    <div className="p-4 md:p-8">
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onMarkPaid={(id) => markPaidMutation.mutate(id)}
          onDelete={(id) => deleteSaleMutation.mutate(id)}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-green-600" />
            Vendas
          </h1>
          <p className="text-sm text-muted-foreground">{filtered.length} venda{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/sales/import')}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar CSV</span>
          </Button>
          <Button className="gap-2" onClick={() => setShowNewSale((v) => !v)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova venda</span>
          </Button>
        </div>
      </div>

      {/* Totais */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPaid + totalPending)}</p>
          <p className="text-xs text-muted-foreground">{filtered.length} venda{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl border bg-green-50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Pago</p>
          <p className="text-lg font-semibold text-green-700">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-muted-foreground">{filtered.filter((s) => s.paymentStatus === 'paid').length} venda{filtered.filter((s) => s.paymentStatus === 'paid').length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl border bg-amber-50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Pendente</p>
          <p className="text-lg font-semibold text-amber-700">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-muted-foreground">{filtered.filter((s) => s.paymentStatus === 'pending').length} venda{filtered.filter((s) => s.paymentStatus === 'pending').length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground mb-1">Produtos</p>
          <p className="text-lg font-semibold text-gray-900">{products.length}</p>
          <p className="text-xs text-muted-foreground">cadastrados</p>
        </div>
      </div>

      {/* Formulário nova venda */}
      {showNewSale && (
        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Nova venda</h2>
            <button onClick={() => setShowNewSale(false)} className="text-muted-foreground hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Telefone do contato <span className="text-red-500">*</span></label>
              <Input placeholder="(61) 99999-9999" value={saleForm.contactPhone} onChange={(e) => setSaleForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Produto <span className="text-red-500">*</span></label>
              <ProductPicker
                value={saleForm.productId}
                onChange={(id, product) => setSaleForm((f) => ({
                  ...f,
                  productId: id,
                  unitPrice: product?.defaultPrice != null ? String(product.defaultPrice) : f.unitPrice,
                  totalValue: product?.defaultPrice != null ? String(Number(product.defaultPrice) * (parseInt(f.quantity) || 1)) : f.totalValue,
                }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Data da venda</label>
              <Input type="date" value={saleForm.saleDate} onChange={(e) => setSaleForm((f) => ({ ...f, saleDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Quantidade</label>
              <Input type="number" min="1" value={saleForm.quantity} onChange={(e) => setSaleForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Valor unitário</label>
              <Input placeholder="0,00" value={saleForm.unitPrice} onChange={(e) => setSaleForm((f) => ({ ...f, unitPrice: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Valor total</label>
              <Input placeholder="0,00" value={saleForm.totalValue} onChange={(e) => setSaleForm((f) => ({ ...f, totalValue: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
              <select value={saleForm.paymentStatus} onChange={(e) => setSaleForm((f) => ({ ...f, paymentStatus: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500">
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Vencimento</label>
              <Input type="date" value={saleForm.dueDate} onChange={(e) => setSaleForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Observação</label>
              <Input placeholder="Opcional" value={saleForm.notes} onChange={(e) => setSaleForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowNewSale(false)}>Cancelar</Button>
            <Button
              size="sm"
              className="gap-1"
              disabled={!saleForm.contactPhone || !saleForm.productId || !saleForm.unitPrice || createSaleMutation.isPending}
              onClick={() => createSaleMutation.mutate()}
            >
              {createSaleMutation.isPending ? 'Registrando...' : 'Registrar venda'}
            </Button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Input
            placeholder="Buscar contato ou produto..."
            className="w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos os status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </select>
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="rounded-md border border-input bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos os produtos</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 text-sm" placeholder="De" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 text-sm" placeholder="Até" />
          {hasFilters && (
            <button onClick={() => { setStatusFilter(''); setProductFilter(''); setStartDate(''); setEndDate('') }} className="text-gray-400 hover:text-gray-700 transition-colors" title="Limpar filtros">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando...</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col h-32 items-center justify-center text-muted-foreground gap-2">
              <ShoppingBag className="h-6 w-6 opacity-30" />
              <p>Nenhuma venda encontrada</p>
            </div>
          )}
          {filtered.map((sale) => (
            <div
              key={sale.id}
              onClick={() => setSelectedSale(sale)}
              className="flex items-center gap-4 border-b px-6 py-4 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              {/* Avatar do contato */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {sale.contact?.name?.charAt(0).toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-gray-900">{sale.contact?.name || '—'}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sale.paymentStatus === 'paid' ? <><CheckCircle2 className="h-3 w-3" />Pago</> : <><Clock className="h-3 w-3" />Pendente</>}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sale.product?.name || '—'}
                  <span className="mx-1.5 text-gray-300">·</span>
                  {formatDate(sale.saleDate)}
                  {sale.contact?.phone && <span className="ml-1.5 text-xs">· {formatPhone(sale.contact.phone)}</span>}
                </p>
                {sale.dueDate && sale.paymentStatus === 'pending' && (
                  <p className="text-xs text-amber-600 mt-0.5">Vence {formatDate(sale.dueDate)}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                <p className="text-base font-semibold text-gray-900">{formatCurrency(Number(sale.totalValue))}</p>
                <div className="flex items-center gap-1">
                  {sale.paymentStatus === 'pending' && (
                    <button
                      onClick={() => markPaidMutation.mutate(sale.id)}
                      className="rounded-md border px-2 py-1 text-xs text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                      disabled={markPaidMutation.isPending}
                      title="Marcar como pago"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Excluir esta venda?')) deleteSaleMutation.mutate(sale.id) }}
                    className="rounded-md border px-2 py-1 text-xs text-red-400 hover:bg-red-50 transition-colors"
                    title="Excluir"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
