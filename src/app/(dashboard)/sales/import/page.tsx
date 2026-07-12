'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, ArrowLeft, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface ImportResult {
  created: number
  updated: number
  failed: number
  errors: { row: number; externalId: string; reason: string }[]
}

const CSV_EXAMPLE = `id_externo;telefone;produto;data_venda;quantidade;valor_unitario;valor_total;status;data_vencimento;observacao
VND-001;5561983115333;Botox;2026-07-10;1;350,00;350,00;pendente;2026-07-25;
VND-002;5561999887766;Preenchimento;2026-07-08;1;500,00;500,00;pago;;Cliente VIP`

export default function SalesImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post('/sales/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
    },
    onSuccess: (data: ImportResult) => {
      setResult(data)
      toast({
        title: 'Importação concluída',
        description: `${data.created} criadas · ${data.updated} atualizadas · ${data.failed} erros`,
        variant: data.failed > 0 ? 'destructive' : 'success',
      })
    },
    onError: (err: any) => toast({
      title: 'Erro na importação',
      description: err.response?.data?.message || 'Verifique o arquivo e tente novamente.',
      variant: 'destructive',
    }),
  })

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.push('/sales')} className="text-muted-foreground hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-teal-900">Importar Vendas</h1>
          <p className="text-sm text-muted-foreground">CSV ou XLSX com histórico de vendas</p>
        </div>
      </div>

      {/* Instruções */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900">Formato esperado</p>
              <p className="text-muted-foreground">O arquivo deve ter as seguintes colunas (separadas por <code className="bg-gray-100 px-1 rounded">;</code> no CSV):</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  ['id_externo', 'opcional — usado para upsert'],
                  ['telefone', 'obrigatório'],
                  ['produto', 'obrigatório — cria se não existir'],
                  ['data_venda', 'AAAA-MM-DD'],
                  ['quantidade', 'padrão: 1'],
                  ['valor_unitario', 'obrigatório'],
                  ['valor_total', 'opcional — calculado se omitido'],
                  ['status', 'pendente ou pago'],
                  ['data_vencimento', 'AAAA-MM-DD, opcional'],
                  ['observacao', 'opcional'],
                ].map(([col, desc]) => (
                  <div key={col} className="flex gap-1">
                    <code className="text-blue-600 shrink-0">{col}</code>
                    <span className="text-muted-foreground truncate">— {desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Se <code className="bg-gray-100 px-1 rounded">id_externo</code> estiver preenchido e já existir, a venda será atualizada. Sem id_externo, sempre cria.
              </p>
            </div>
          </div>

          {/* Exemplo */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-700 mb-1.5">Exemplo de CSV:</p>
            <pre className="overflow-x-auto rounded-lg bg-gray-50 border p-3 text-xs text-gray-600 whitespace-pre">{CSV_EXAMPLE}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 p-8 text-center transition-colors hover:border-teal-600 hover:bg-teal-50/30"
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-teal-600" />
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · Clique para trocar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-gray-700">Clique para selecionar arquivo</p>
                <p className="text-xs text-muted-foreground">CSV ou XLSX, até 10 MB</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/sales')}>Cancelar</Button>
            <Button
              className="flex-1 gap-2"
              disabled={!file || importMutation.isPending}
              onClick={() => file && importMutation.mutate(file)}
            >
              {importMutation.isPending ? (
                <><Upload className="h-4 w-4 animate-bounce" />Importando...</>
              ) : (
                <><FileSpreadsheet className="h-4 w-4" />Importar</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Resultado da importação</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border bg-teal-50 p-3 text-center">
                <p className="text-2xl font-bold text-teal-700">{result.created}</p>
                <p className="text-xs text-muted-foreground">Criadas</p>
              </div>
              <div className="rounded-xl border bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
                <p className="text-xs text-muted-foreground">Atualizadas</p>
              </div>
              <div className="rounded-xl border bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Erros detalhados:</p>
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-red-700">
                      Linha {e.row}{e.externalId && ` (${e.externalId})`}: {e.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {result.failed === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-teal-50 p-2.5 text-sm text-teal-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Todos os registros foram importados com sucesso!
              </div>
            )}

            <Button className="mt-4 w-full" onClick={() => router.push('/sales')}>
              Ver vendas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
