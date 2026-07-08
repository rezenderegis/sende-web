# Broadcast com CSV Personalizado

## Objetivo

Permitir envio de mensagens únicas por número dentro do fluxo de broadcast existente,
via upload de CSV com mensagem (texto livre) ou variáveis (template Meta).

## Motivação

A janela de 24h da Meta exige:
- **Dentro de 24h**: pode enviar texto livre
- **Fora de 24h / contato frio**: obrigatório usar template aprovado pela Meta

Logo, os dois modos são necessários.

---

## Fluxo no Wizard

Mesma estrutura do broadcast atual, com CSV substituindo a seleção de contatos/tags no Step 1.

```
Step 0: Nome + número WhatsApp + tipo (Texto / Template)
        Se texto:    campo de mensagem global torna-se opcional (pode vir do CSV)
        Se template: seleciona o template (igual ao broadcast atual)

Step 1: Upload CSV
        Formato varia conforme tipo escolhido (ver abaixo)
        → preview das 5 primeiras linhas
        → contador: X válidos, Y com erro

Step 2: Revisar e enviar
```

---

## Formatos de CSV

### Tipo Texto
```csv
telefone,nome,mensagem
5561999887766,João Silva,Olá João! Temos uma oferta de R$ 150 para você...
5561888776655,,Oi! Confira nossa promoção exclusiva...
5562988776655,Maria Costa,Maria, separamos algo especial pra você...
```

### Tipo Template
Colunas `var1`, `var2`, `var3`... mapeiam para `{{1}}`, `{{2}}`, `{{3}}` do template.
```csv
telefone,nome,var1,var2
5561999887766,João,R$ 150,janeiro
5561888776655,Maria,30%,fevereiro
```

### Regras da coluna `nome`
| Situação | Comportamento |
|---|---|
| Nome no CSV + contato novo | Cadastra com o nome |
| Nome no CSV + contato existe | Atualiza o nome |
| Sem nome + contato existe | Mantém o nome existente |
| Sem nome + contato novo | Usa telefone como nome provisório |

---

## Mudanças no Banco de Dados

### `broadcast_recipients`
```sql
ALTER TABLE broadcast_recipients ADD COLUMN "customMessage" TEXT NULL;
ALTER TABLE broadcast_recipients ADD COLUMN "templateVariables" JSONB NULL;
```

### `broadcasts`
```sql
ALTER TABLE broadcasts ADD COLUMN mode VARCHAR DEFAULT 'standard';
-- 'standard' = fluxo atual (contatos/tags + mensagem global)
-- 'csv'      = CSV personalizado
```

---

## Mudanças no Backend

### 1. Migration
Adiciona as colunas acima.

### 2. `broadcast.processor.ts`
Lógica de mensagem personalizada por recipient:
```typescript
// Tipo texto
const message = recipient.customMessage ?? broadcast.message

// Tipo template com variáveis
const templateVariables = recipient.templateVariables ?? null
```

### 3. Novo endpoint `POST /broadcasts/:id/recipients/csv`
- Recebe multipart/form-data com o arquivo CSV
- Para cada linha:
  - Normaliza telefone
  - `findOrCreateByPhone` (cria contato se não existir, atualiza nome se informado)
  - Cria `broadcast_recipient` com `customMessage` ou `templateVariables`
- Retorna `{ added, skipped, errors: [{ row, phone, reason }] }`

### 4. Validação no `send`
- `mode=standard`: exige `broadcast.message` (texto) ou `broadcast.templateName` (template)
- `mode=csv` + texto: exige que todos recipients tenham `customMessage`
- `mode=csv` + template: exige que todos recipients tenham `templateVariables`

---

## Mudanças no Frontend

### `broadcasts/new/page.tsx`

**Step 0** — igual ao atual, campo mensagem fica opcional quando modo CSV

**Step 1** — toggle entre modos:
```
Adicionar destinatários por:
[ Contatos / Tags ]   [ Importar CSV ]
```

Se CSV selecionado:
- Dropzone para upload do arquivo
- Preview em tabela das 5 primeiras linhas
- Mensagem de validação: "98 válidos · 2 com erro"
- Erros mostrados por linha

**Step 2** — igual ao atual

---

## Limites e Validações

- Máximo de 1.000 linhas por CSV
- Colunas obrigatórias: `telefone`, `mensagem` (texto) ou `telefone` + `var1` (template)
- Coluna `nome` sempre opcional
- Encoding: UTF-8 (com ou sem BOM)
- Telefone: mesma normalização do import de contatos existente
