import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'text-foreground',
        // Sende status badges
        success:     'border-transparent bg-teal-100 text-teal-700',   // resolvido/venda
        warning:     'border-transparent bg-yellow-100 text-yellow-800',
        human:       'border-transparent bg-coral-soft text-[#C2410C]', // com atendente
        bot:         'border-transparent bg-teal-100 text-teal-700',    // IA respondendo
        done:        'border-transparent bg-[#DCFCE7] text-[#15803D]',  // concluído
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
