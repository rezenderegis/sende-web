'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  companyName: z.string().min(2, 'Nome da empresa obrigatório'),
  companyEmail: z.string().email('Email da empresa inválido'),
  userName: z.string().min(2, 'Seu nome é obrigatório'),
  userEmail: z.string().email('Seu email é inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post('/auth/register', data)
      setAuth(res.data.user, res.data.accessToken)
      router.push('/dashboard')
    } catch (err: any) {
      toast({
        title: 'Erro ao criar conta',
        description: err.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-whatsapp">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Configure sua empresa no Sendi</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input placeholder="GlobalSix Tecnologia" {...register('companyName')} />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email da empresa</Label>
              <Input type="email" placeholder="contato@empresa.com" {...register('companyEmail')} />
              {errors.companyEmail && <p className="text-sm text-destructive">{errors.companyEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Seu nome</Label>
              <Input placeholder="João Silva" {...register('userName')} />
              {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Seu email</Label>
              <Input type="email" placeholder="joao@empresa.com" {...register('userEmail')} />
              {errors.userEmail && <p className="text-sm text-destructive">{errors.userEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
