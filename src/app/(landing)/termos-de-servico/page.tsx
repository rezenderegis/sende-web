import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço — Sende',
  description: 'Termos e condições de uso da plataforma Sende.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-xl font-bold text-teal-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  )
}

export default function TermosDeServicoPage() {
  const updated = '19 de julho de 2026'

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      {/* Cabeçalho */}
      <div className="mb-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-600">
          Documento legal
        </p>
        <h1 className="mb-4 font-display text-4xl font-bold text-teal-900">
          Termos de Serviço
        </h1>
        <p className="text-sm text-ink-soft">
          Última atualização: <span className="font-medium text-ink">{updated}</span>
        </p>
        <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 text-sm text-teal-800">
          Estes Termos de Serviço regem a utilização da plataforma <strong>Sende</strong>, operada pela{' '}
          <strong>GlobalSix Technology LTDA</strong>. Ao criar uma conta ou utilizar o serviço, você
          concorda integralmente com estes Termos e com nossa{' '}
          <a href="/politica-privacidade" className="underline">Política de Privacidade</a>.
        </div>
      </div>

      <Section title="1. Aceitação dos Termos">
        <p>
          Ao acessar ou usar a plataforma Sende, você declara ter capacidade legal para contratar em
          nome próprio ou da empresa que representa, e aceita se vincular a estes Termos de Serviço. Se
          você não concorda com algum destes termos, não deve utilizar a plataforma.
        </p>
      </Section>

      <Section title="2. Quem somos">
        <p>
          <strong className="text-ink">GlobalSix Technology LTDA</strong>, inscrita no CNPJ
          53.843.384/0001-70, é a empresa responsável pelo desenvolvimento, operação e manutenção da
          plataforma Sende, um sistema de CRM conversacional que integra o WhatsApp Business Platform
          (API oficial da Meta) para gestão de atendimento, broadcasts, automações e vendas.
        </p>
      </Section>

      <Section title="3. Descrição do serviço">
        <p>O Sende oferece, entre outras funcionalidades:</p>
        <ul className="mt-3 list-inside space-y-2">
          {[
            'Central de atendimento via WhatsApp com múltiplos atendentes',
            'Envio de mensagens em massa (broadcasts) usando templates aprovados pela Meta',
            'Respostas automáticas por inteligência artificial (bot)',
            'Agendamento de follow-ons e lembretes',
            'Gestão de contatos, tags e funil de vendas',
            'Relatórios de uso e faturamento das mensagens enviadas',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3">
          O serviço depende da disponibilidade e das políticas da API do WhatsApp Business, operada
          pela Meta Platforms, Inc., terceira alheia a este contrato.
        </p>
      </Section>

      <Section title="4. Cadastro e conta">
        <div className="mt-1 space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <Item title="Informações verdadeiras">
            Você se compromete a fornecer dados de cadastro completos, atuais e verdadeiros, e a
            mantê-los atualizados.
          </Item>
          <Item title="Segurança da conta">
            Você é responsável por manter a confidencialidade da sua senha e por todas as atividades
            realizadas na sua conta. Notifique-nos imediatamente em caso de uso não autorizado.
          </Item>
          <Item title="Um responsável por empresa">
            Cada conta de empresa deve ter ao menos um usuário com papel de <em>owner</em>,
            responsável pelas configurações e permissões dos demais usuários vinculados.
          </Item>
        </div>
      </Section>

      <Section title="5. Uso da API do WhatsApp e conformidade com a Meta">
        <p>
          Ao conectar um número de WhatsApp à plataforma, você concorda em cumprir os{' '}
          <span className="italic">WhatsApp Business Messaging Policy</span> e os demais termos e
          políticas comerciais publicados pela Meta para o WhatsApp Business Platform. O Sende atua
          como uma ferramenta de gestão sobre essa API — não somos parte, garantidores ou
          responsáveis pelas decisões da Meta sobre aprovação de templates, categorização, tarifação,
          suspensão ou banimento de números, que seguem critérios exclusivos da Meta.
        </p>
      </Section>

      <Section title="6. Uso aceitável">
        <p>É proibido utilizar a plataforma para:</p>
        <ul className="mt-3 list-inside space-y-2">
          {[
            'Enviar mensagens a contatos sem consentimento prévio (spam)',
            'Distribuir conteúdo ilegal, discriminatório, difamatório ou que viole direitos de terceiros',
            'Praticar golpes, phishing ou qualquer forma de fraude',
            'Tentar acessar, sem autorização, dados de outras empresas cadastradas na plataforma',
            'Realizar engenharia reversa, copiar ou revender o software sem autorização por escrito',
            'Sobrecarregar deliberadamente a infraestrutura do serviço',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3">
          O descumprimento pode resultar em suspensão ou encerramento da conta, sem prejuízo de
          outras medidas cabíveis.
        </p>
      </Section>

      <Section title="7. Responsabilidade sobre contatos e consentimento">
        <p>
          Você é o único responsável por garantir que possui base legal e consentimento adequados
          (conforme a LGPD e as políticas da Meta) para enviar mensagens aos contatos importados ou
          cadastrados na plataforma. O Sende não verifica a origem ou a licitude das listas de
          contato enviadas por você, e não se responsabiliza por reclamações, bloqueios ou sanções
          decorrentes de mensagens enviadas sem o devido consentimento do destinatário.
        </p>
      </Section>

      <Section title="8. Planos, cobrança e saldo">
        <div className="mt-1 space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <Item title="Modelo de saldo pré-pago">
            O uso de mensagens (envio de templates, respostas automáticas do bot) é debitado de um
            saldo pré-pago vinculado à sua empresa, de acordo com a tabela de custos vigente
            informada na plataforma.
          </Item>
          <Item title="Limites de gasto">
            Podem ser configurados limites diários e mensais por número conectado, como proteção
            contra uso indevido ou inesperado.
          </Item>
          <Item title="Reajuste de valores">
            Os valores cobrados por mensagem podem ser revisados periodicamente, refletindo mudanças
            nas tarifas praticadas pela Meta. Alterações não têm efeito retroativo sobre mensagens já
            enviadas.
          </Item>
          <Item title="Bloqueio por saldo insuficiente">
            Caso o saldo disponível não seja suficiente para cobrir uma mensagem, um broadcast ou o
            limite configurado, o envio correspondente será automaticamente bloqueado até a
            realização de novo crédito.
          </Item>
        </div>
      </Section>

      <Section title="9. Propriedade intelectual">
        <p>
          O software, marca, layout, código-fonte e demais elementos da plataforma Sende são de
          propriedade da GlobalSix Technology LTDA e protegidos por lei. Estes Termos não concedem
          qualquer licença de uso da marca ou do software além do estritamente necessário para
          utilização do serviço contratado. Os dados inseridos por você (contatos, mensagens,
          configurações) permanecem de sua titularidade.
        </p>
      </Section>

      <Section title="10. Disponibilidade do serviço">
        <p>
          Envidamos esforços razoáveis para manter a plataforma disponível de forma contínua, mas não
          garantimos operação ininterrupta ou livre de erros. Manutenções programadas, falhas de
          infraestrutura de terceiros (incluindo a API da Meta) ou eventos de força maior podem
          causar indisponibilidade temporária, sem gerar direito a indenização, salvo disposição
          contratual específica em contrário.
        </p>
      </Section>

      <Section title="11. Limitação de responsabilidade">
        <p>
          Na máxima extensão permitida pela lei, a GlobalSix Technology LTDA não se responsabiliza
          por danos indiretos, lucros cessantes, perda de dados ou de oportunidades de negócio
          decorrentes do uso ou da impossibilidade de uso da plataforma, incluindo aqueles causados
          por instabilidade, suspensão ou alteração de políticas da API do WhatsApp por parte da
          Meta. Nossa responsabilidade total, quando aplicável, está limitada ao valor pago pelo
          serviço nos últimos 3 (três) meses anteriores ao evento.
        </p>
      </Section>

      <Section title="12. Suspensão e encerramento">
        <p>
          Podemos suspender ou encerrar o acesso à plataforma, a nosso critério, em caso de violação
          destes Termos, inadimplência ou uso que coloque em risco a segurança do serviço ou de
          outros usuários. Você pode encerrar sua conta a qualquer momento; a exclusão de dados
          segue o disposto na nossa{' '}
          <a href="/politica-privacidade" className="text-teal-600 underline">Política de Privacidade</a>.
        </p>
      </Section>

      <Section title="13. Alterações nestes Termos">
        <p>
          Podemos atualizar estes Termos periodicamente para refletir mudanças no serviço, na
          legislação ou nas políticas de parceiros como a Meta. Alterações relevantes serão
          comunicadas por e-mail ou aviso na plataforma com antecedência mínima de 7 dias. O uso
          continuado após a vigência das alterações implica aceitação dos novos Termos.
        </p>
      </Section>

      <Section title="14. Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
          da comarca de Brasília/DF para dirimir quaisquer controvérsias, com renúncia a qualquer
          outro, por mais privilegiado que seja.
        </p>
      </Section>

      <Section title="15. Contato">
        <div className="mt-1 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm space-y-1">
          <p><span className="font-medium text-ink">Empresa:</span> GlobalSix Technology LTDA</p>
          <p><span className="font-medium text-ink">CNPJ:</span> 53.843.384/0001-70</p>
          <p>
            <span className="font-medium text-ink">E-mail:</span>{' '}
            <a href="mailto:contato@sende.app.br" className="text-teal-600 underline">
              contato@sende.app.br
            </a>
          </p>
        </div>
      </Section>

      {/* Rodapé do documento */}
      <div className="mt-12 border-t border-gray-100 pt-8 text-center text-xs text-ink-soft/60">
        Sende · GlobalSix Technology LTDA · CNPJ 53.843.384/0001-70
        <br />
        Este documento está disponível permanentemente em{' '}
        <span className="text-teal-600">sende.app.br/termos-de-servico</span>
      </div>
    </div>
  )
}
