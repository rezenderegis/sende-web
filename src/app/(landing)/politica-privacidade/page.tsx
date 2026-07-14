import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Sende',
  description: 'Saiba como a Sende coleta, usa e protege seus dados pessoais.',
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

export default function PoliticaPrivacidadePage() {
  const updated = '13 de julho de 2025'

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      {/* Cabeçalho */}
      <div className="mb-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-600">
          Documento legal
        </p>
        <h1 className="mb-4 font-display text-4xl font-bold text-teal-900">
          Política de Privacidade
        </h1>
        <p className="text-sm text-ink-soft">
          Última atualização: <span className="font-medium text-ink">{updated}</span>
        </p>
        <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 text-sm text-teal-800">
          Esta Política descreve como a <strong>GlobalSix Technology</strong>, responsável pela
          plataforma <strong>Sende</strong>, coleta, usa, armazena e protege seus dados pessoais,
          em conformidade com a{' '}
          <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
        </div>
      </div>

      <Section title="1. Quem somos">
        <p>
          <strong className="text-ink">GlobalSix Technology LTDA</strong>, inscrita no CNPJ
          53.843.384/0001-70, é a controladora dos dados pessoais tratados por meio da plataforma
          Sende. Para dúvidas ou exercício de direitos, entre em contato pelo e-mail{' '}
          <a href="mailto:privacidade@sende.app.br" className="text-teal-600 underline">
            privacidade@sende.app.br
          </a>
          .
        </p>
      </Section>

      <Section title="2. Dados que coletamos">
        <p>Coletamos apenas os dados necessários para o funcionamento da plataforma:</p>
        <div className="mt-4 space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <Item title="Dados de conta">
            Nome, e-mail e senha (armazenada com hash irreversível) fornecidos no cadastro.
          </Item>
          <Item title="Dados da empresa">
            Nome, CNPJ e informações de configuração inseridas durante a utilização da plataforma.
          </Item>
          <Item title="Dados de uso">
            Logs de acesso, endereço IP, dispositivo e horários de utilização, usados para
            segurança e diagnóstico.
          </Item>
          <Item title="Dados de terceiros (contatos)">
            Números de telefone e nomes de clientes importados ou recebidos via WhatsApp. Você,
            como operador, é responsável pela base legal que autoriza esse uso.
          </Item>
          <Item title="Mensagens e conversas">
            Conteúdo das mensagens trocadas via WhatsApp Business API, armazenado para viabilizar
            o atendimento e histórico.
          </Item>
        </div>
      </Section>

      <Section title="3. Como usamos seus dados">
        <ul className="list-inside space-y-2">
          {[
            'Criar e manter sua conta de acesso à plataforma',
            'Processar e exibir mensagens de WhatsApp em tempo real',
            'Enviar broadcasts e automatizar respostas conforme configurado',
            'Gerar relatórios e analytics de atendimento',
            'Garantir a segurança e prevenir fraudes',
            'Cumprir obrigações legais e regulatórias',
            'Enviar comunicações sobre o serviço (não comerciais, a menos que autorizado)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="4. Base legal para o tratamento">
        <p>Tratamos seus dados com base nas seguintes hipóteses legais da LGPD (art. 7º e 11):</p>
        <div className="mt-4 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <Item title="Execução de contrato">
            Dados necessários para prestar o serviço contratado.
          </Item>
          <Item title="Legítimo interesse">
            Segurança da plataforma, prevenção a fraudes e melhoria do serviço.
          </Item>
          <Item title="Cumprimento de obrigação legal">
            Retenção de logs conforme exigências legais (Marco Civil, art. 15).
          </Item>
          <Item title="Consentimento">
            Comunicações de marketing, quando aplicável — sempre com opção de revogação.
          </Item>
        </div>
      </Section>

      <Section title="5. Compartilhamento de dados">
        <p>
          Não vendemos nem alugamos seus dados. Podemos compartilhá-los apenas com:
        </p>
        <ul className="mt-3 list-inside space-y-2">
          {[
            'Meta Platforms (WhatsApp Business API) — para envio e recebimento de mensagens',
            'Provedores de infraestrutura de nuvem (hospedagem segura e criptografada)',
            'Autoridades competentes, quando exigido por lei ou decisão judicial',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3">
          Todos os fornecedores são contratualmente obrigados a proteger seus dados e utilizá-los
          apenas para as finalidades acordadas.
        </p>
      </Section>

      <Section title="6. Retenção e exclusão">
        <p>
          Mantemos seus dados enquanto a conta estiver ativa. Após o encerramento:
        </p>
        <ul className="mt-3 list-inside space-y-2">
          {[
            'Dados de conta e conversas são excluídos em até 30 dias após a solicitação',
            'Logs de acesso são retidos por até 6 meses (obrigação legal — Marco Civil, art. 15)',
            'Dados necessários para cumprimento de obrigações fiscais ou legais podem ser mantidos pelo prazo exigido por lei',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3">
          Para solicitar a exclusão da sua conta e dados, acesse:{' '}
          <a href="/delete-account" className="text-teal-600 underline">
            sende.app.br/delete-account
          </a>
          .
        </p>
      </Section>

      <Section title="7. Seus direitos (LGPD, art. 18)">
        <p>Você tem direito a:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Acesso', desc: 'Saber quais dados temos sobre você' },
            { title: 'Correção', desc: 'Atualizar dados incompletos ou incorretos' },
            { title: 'Exclusão', desc: 'Solicitar remoção dos seus dados' },
            { title: 'Portabilidade', desc: 'Receber seus dados em formato estruturado' },
            { title: 'Revogação', desc: 'Retirar consentimentos concedidos' },
            { title: 'Oposição', desc: 'Contestar tratamentos com base em legítimo interesse' },
          ].map((r) => (
            <div key={r.title} className="rounded-xl border border-teal-100 bg-teal-50 p-4">
              <p className="text-sm font-semibold text-teal-900">{r.title}</p>
              <p className="mt-0.5 text-xs text-teal-700">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4">
          Para exercer qualquer direito, envie e-mail para{' '}
          <a href="mailto:privacidade@sende.app.br" className="text-teal-600 underline">
            privacidade@sende.app.br
          </a>
          . Responderemos em até 15 dias úteis.
        </p>
      </Section>

      <Section title="8. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
          criptografia em trânsito (TLS/HTTPS), autenticação com tokens JWT de curta duração,
          senhas armazenadas com hash irreversível (bcrypt) e acesso restrito a dados por função de
          usuário. Nenhum sistema é 100% seguro — em caso de incidente, notificaremos os afetados
          conforme a LGPD.
        </p>
      </Section>

      <Section title="9. Cookies e rastreamento">
        <p>
          Utilizamos apenas cookies estritamente necessários para autenticação e funcionamento da
          plataforma. Não utilizamos cookies de rastreamento para fins publicitários.
        </p>
      </Section>

      <Section title="10. Transferência internacional">
        <p>
          Alguns dados podem ser processados fora do Brasil, em servidores de provedores de
          infraestrutura (como AWS ou similar), em países que oferecem grau de proteção adequado ou
          mediante cláusulas contratuais padrão, conforme art. 33 da LGPD.
        </p>
      </Section>

      <Section title="11. Alterações nesta política">
        <p>
          Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas
          por e-mail ou notificação na plataforma com antecedência mínima de 7 dias. O uso
          continuado após a vigência das alterações implica aceitação.
        </p>
      </Section>

      <Section title="12. Contato e DPO">
        <p>
          Para qualquer questão sobre privacidade ou para exercer seus direitos:
        </p>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm space-y-1">
          <p><span className="font-medium text-ink">Empresa:</span> GlobalSix Technology LTDA</p>
          <p><span className="font-medium text-ink">CNPJ:</span> 53.843.384/0001-70</p>
          <p>
            <span className="font-medium text-ink">E-mail:</span>{' '}
            <a href="mailto:privacidade@sende.app.br" className="text-teal-600 underline">
              privacidade@sende.app.br
            </a>
          </p>
        </div>
      </Section>

      {/* Rodapé do documento */}
      <div className="mt-12 border-t border-gray-100 pt-8 text-center text-xs text-ink-soft/60">
        Sende · GlobalSix Technology LTDA · CNPJ 53.843.384/0001-70
        <br />
        Este documento está disponível permanentemente em{' '}
        <span className="text-teal-600">sende.app.br/politica-privacidade</span>
      </div>
    </div>
  )
}
