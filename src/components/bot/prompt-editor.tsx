'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useEditor, EditorContent, ReactRenderer, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import { Webhook, Workflow } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ExternalAction, Flow } from '@/types'

type MentionItem = { id: string; kind: 'tool' | 'flow' }

const mentionClass: Record<'tool' | 'flow' | 'unknown', string> = {
  tool: 'rounded-full px-1.5 font-semibold text-white bg-teal-600 mx-px',
  flow: 'rounded-full px-1.5 font-semibold text-white bg-violet-600 mx-px',
  unknown: 'rounded-full px-1.5 font-semibold text-white bg-red-600 mx-px',
}

function padMentionSpacing(text: string): string {
  return text
    .replace(/(\S)(\{\{\w+\}\})/g, '$1 $2')
    .replace(/(\{\{\w+\}\})(\S)/g, '$1 $2')
}

function buildContentFromText(text: string, kindOf: (name: string) => 'tool' | 'flow' | null): JSONContent {
  const regex = /\{\{(\w+)\}\}/g
  return {
    type: 'doc',
    content: padMentionSpacing(text).split('\n').map((line) => {
      const content: JSONContent[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null
      regex.lastIndex = 0
      while ((match = regex.exec(line))) {
        if (match.index > lastIndex) content.push({ type: 'text', text: line.slice(lastIndex, match.index) })
        const name = match[1]
        content.push({ type: 'mention', attrs: { id: name, kind: kindOf(name) } })
        lastIndex = regex.lastIndex
      }
      if (lastIndex < line.length) content.push({ type: 'text', text: line.slice(lastIndex) })
      return { type: 'paragraph', content }
    }),
  }
}

// eslint-disable-next-line react/display-name
const MentionList = forwardRef<{ onKeyDown: (props: SuggestionKeyDownProps) => boolean }, SuggestionProps<MentionItem>>(
  (props, ref) => {
    const [selected, setSelected] = useState(0)
    const tools = props.items.filter((i) => i.kind === 'tool')
    const flows = props.items.filter((i) => i.kind === 'flow')
    const flat = [...tools, ...flows]

    useEffect(() => setSelected(0), [props.items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (!flat.length) return false
        if (event.key === 'ArrowDown') { setSelected((i) => (i + 1) % flat.length); return true }
        if (event.key === 'ArrowUp') { setSelected((i) => (i - 1 + flat.length) % flat.length); return true }
        if (event.key === 'Enter') { props.command(flat[selected]); return true }
        return false
      },
    }))

    if (!flat.length) {
      return <div className="w-72 rounded-md border bg-white px-3 py-2 text-xs text-muted-foreground shadow-lg">Nenhum resultado</div>
    }

    return (
      <div className="w-72 max-h-56 overflow-y-auto rounded-md border bg-white shadow-lg">
        {tools.length > 0 && (
          <div>
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Bot Tools</p>
            {tools.map((item) => (
              <button
                key={item.id}
                onClick={() => props.command(item)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-mono hover:bg-gray-50',
                  flat[selected]?.id === item.id && flat[selected]?.kind === item.kind && 'bg-gray-50',
                )}
              >
                <Webhook className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                {item.id}
              </button>
            ))}
          </div>
        )}
        {flows.length > 0 && (
          <div className="border-t">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Fluxos Guiados</p>
            {flows.map((item) => (
              <button
                key={item.id}
                onClick={() => props.command(item)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-mono hover:bg-gray-50',
                  flat[selected]?.id === item.id && flat[selected]?.kind === item.kind && 'bg-gray-50',
                )}
              >
                <Workflow className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                {item.id}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  },
)

export function PromptEditor({
  value,
  onChange,
  placeholder,
  className,
  wrapperClassName,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  wrapperClassName?: string
}) {
  const { data: actions = [] } = useQuery<ExternalAction[]>({
    queryKey: ['external-actions'],
    queryFn: () => api.get('/external-actions').then((r) => r.data),
  })
  const { data: flows = [] } = useQuery<Flow[]>({
    queryKey: ['flows'],
    queryFn: () => api.get('/flows').then((r) => r.data),
  })

  const dataRef = useRef({ actions, flows })
  dataRef.current = { actions, flows }

  function kindOf(name: string): 'tool' | 'flow' | null {
    if (dataRef.current.actions.some((a) => a.name === name)) return 'tool'
    if (dataRef.current.flows.some((f) => f.name === name)) return 'flow'
    return null
  }

  const lastEmittedRef = useRef<string>(value)

  const CustomMention = Mention.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        kind: {
          default: null,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-kind'),
          renderHTML: (attrs: any) => (attrs.kind ? { 'data-kind': attrs.kind } : {}),
        },
      }
    },
  }).configure({
    renderText: ({ node }) => `{{${node.attrs.id}}}`,
    renderHTML: ({ node }) => {
      const kind = (node.attrs.kind as 'tool' | 'flow' | null) ?? 'unknown'
      return [
        'span',
        { class: mentionClass[kind], 'data-type': 'mention', 'data-id': node.attrs.id, 'data-kind': kind },
        `{{${node.attrs.id}}}`,
      ]
    },
    // `as any`: o tipo padrão do Mention amarra o item da suggestion em MentionNodeAttrs,
    // mas nossos itens (MentionItem, com `kind`) têm um formato próprio — sem hook público
    // no Tiptap pra injetar esse generic via .configure().
    suggestion: {
      char: '{{',
      allowSpaces: false,
      items: ({ query }: { query: string }): MentionItem[] => {
        const q = query.toLowerCase()
        const toolItems = dataRef.current.actions
          .filter((a) => a.name.toLowerCase().includes(q))
          .map((a): MentionItem => ({ id: a.name, kind: 'tool' }))
        const flowItems = dataRef.current.flows
          .filter((f) => f.name.toLowerCase().includes(q))
          .map((f): MentionItem => ({ id: f.name, kind: 'flow' }))
        return [...toolItems, ...flowItems]
      },
      command: ({ editor, range, props }: { editor: Editor; range: any; props: MentionItem }) => {
        const charBefore = editor.state.doc.textBetween(Math.max(0, range.from - 1), range.from)
        const needsLeadingSpace = charBefore && !/\s/.test(charBefore)
        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            ...(needsLeadingSpace ? [{ type: 'text', text: ' ' }] : []),
            { type: 'mention', attrs: { id: props.id, kind: props.kind } },
            { type: 'text', text: ' ' },
          ])
          .run()
      },
      render: () => {
        let component: ReactRenderer<any, SuggestionProps<MentionItem>>
        let unmount: (() => void) | undefined
        return {
          onStart: (props: SuggestionProps<MentionItem>) => {
            component = new ReactRenderer(MentionList, { props, editor: props.editor })
            unmount = props.mount(component.element)
          },
          onUpdate: (props: SuggestionProps<MentionItem>) => component.updateProps(props),
          onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === 'Escape') { unmount?.(); return true }
            return component.ref?.onKeyDown(props) ?? false
          },
          onExit: () => { unmount?.(); component.destroy() },
        }
      },
    } as any,
  })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, blockquote: false, codeBlock: false, horizontalRule: false }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      CustomMention,
    ],
    content: buildContentFromText(value, kindOf),
    editorProps: {
      attributes: {
        class: cn(
          'prose-none min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none',
          '[&_p]:m-0 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:text-muted-foreground [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:h-0',
          className,
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText({ blockSeparator: '\n' })
      lastEmittedRef.current = text
      onChange(text)
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value === lastEmittedRef.current) return
    if (value === editor.getText({ blockSeparator: '\n' })) return
    editor.commands.setContent(buildContentFromText(value, kindOf))
    lastEmittedRef.current = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ id: string; kind: 'tool' | 'flow' | 'unknown'; rect: DOMRect } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function findMention(target: EventTarget | null): HTMLElement | null {
      if (!(target instanceof HTMLElement)) return null
      return target.closest('[data-type="mention"]')
    }
    function onOver(e: MouseEvent) {
      const el = findMention(e.target)
      if (!el) return
      setHover({
        id: el.getAttribute('data-id') ?? '',
        kind: (el.getAttribute('data-kind') as 'tool' | 'flow' | null) ?? 'unknown',
        rect: el.getBoundingClientRect(),
      })
    }
    function onOut(e: MouseEvent) {
      const el = findMention(e.target)
      if (el) setHover(null)
    }
    container.addEventListener('mouseover', onOver)
    container.addEventListener('mouseout', onOut)
    return () => {
      container.removeEventListener('mouseover', onOver)
      container.removeEventListener('mouseout', onOut)
    }
  }, [])

  const hoveredTool = hover?.kind === 'tool' ? actions.find((a) => a.name === hover.id) : undefined
  const hoveredFlow = hover?.kind === 'flow' ? flows.find((f) => f.name === hover.id) : undefined

  return (
    <div ref={containerRef} className={cn('relative', wrapperClassName)}>
      <EditorContent editor={editor} />
      {hover && (
        <div
          className="fixed z-50 max-h-96 w-80 overflow-y-auto rounded-lg border bg-white p-3 text-xs shadow-lg"
          style={{ top: hover.rect.bottom + 6, left: hover.rect.left }}
        >
          {hoveredTool && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Webhook className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                <span className="font-mono font-semibold text-gray-900">{hoveredTool.name}</span>
              </div>
              <p className="text-gray-600">{hoveredTool.description}</p>
              <p className="font-mono text-[11px] text-gray-400">{hoveredTool.method} {hoveredTool.url}</p>
              {!!hoveredTool.parametersSchema?.properties && Object.keys(hoveredTool.parametersSchema.properties).length > 0 && (
                <div className="border-t pt-1.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Parâmetros que a IA fornece</p>
                  <ul className="space-y-0.5">
                    {Object.entries(hoveredTool.parametersSchema.properties as Record<string, any>).map(([key, def]) => (
                      <li key={key} className="font-mono text-[11px] text-gray-600">
                        <span className="text-teal-700">{key}</span>{def?.type ? ` (${def.type})` : ''}{def?.description ? ` — ${def.description}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!hoveredTool.headersTemplate && Object.keys(hoveredTool.headersTemplate).length > 0 && (
                <div className="border-t pt-1.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Headers</p>
                  <ul className="space-y-0.5">
                    {Object.entries(hoveredTool.headersTemplate).map(([key, val]) => (
                      <li key={key} className="truncate font-mono text-[11px] text-gray-600">
                        <span className="text-teal-700">{key}</span>: {val}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!hoveredTool.bodyTemplate && Object.keys(hoveredTool.bodyTemplate).length > 0 && (
                <div className="border-t pt-1.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Corpo da requisição</p>
                  <ul className="space-y-0.5">
                    {Object.entries(hoveredTool.bodyTemplate).map(([key, val]) => (
                      <li key={key} className="truncate font-mono text-[11px] text-gray-600">
                        <span className="text-teal-700">{key}</span>: {String(val)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hoveredTool.hasAccessToken && (
                <p className="border-t pt-1.5 text-[11px] text-gray-500">🔒 Token de acesso configurado (enviado como Authorization)</p>
              )}
            </div>
          )}
          {hoveredFlow && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                <span className="font-mono font-semibold text-gray-900">{hoveredFlow.name}</span>
              </div>
              <p className="text-gray-600">{hoveredFlow.description}</p>
              {!hoveredFlow.startStepId && (
                <p className="text-[11px] text-amber-600">⚠ esse fluxo ainda não tem passo inicial definido</p>
              )}
            </div>
          )}
          {!hoveredTool && !hoveredFlow && (
            <p className="text-red-600">Não encontrado — pode ter sido renomeado ou excluído.</p>
          )}
        </div>
      )}
    </div>
  )
}
