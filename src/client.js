window.__ModuleLoader__.load({
  id: 'dsh-student-memory',
  factory(require) {
    const React = require('react')
    const { createElement: h, useEffect, useState } = React
    const exports = {}

    let layout = null
    let openSession = null
    let openChild = null
    let refreshSubagents = null
    let setCatalogOpen = null

    const CSS = `
.sm-col{height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:12px;
  color:#e8f4fb;font:12px/1.45 ui-sans-serif,system-ui;background:#0b2436;box-sizing:border-box}
.sm-col .head{display:flex;align-items:center;justify-content:space-between;flex:none}
.sm-col .head b{font-size:13px}
.sm-col .head button{background:none;border:0;color:#9ec4d8;cursor:pointer;font-size:14px;padding:2px 6px}
.sm-col .scene{position:relative;overflow:hidden;border-radius:12px;height:240px;flex:none;background:#0b2436}
.sm-col .band{position:absolute;left:0;right:0}
.sm-col .sky{top:0;height:34%;background:linear-gradient(#d8eef8,#8ec8e6)}
.sm-col .mid{top:34%;height:28%;background:linear-gradient(#3a8bb8,#1d5f86)}
.sm-col .deep{top:62%;height:38%;background:linear-gradient(#164864,#071821)}
.sm-col .tag{position:absolute;left:10px;display:flex;align-items:center;gap:5px;
  font-size:10px;font-weight:650}
.sm-col .tag.helm{top:8px;color:#0b2436}
.sm-col .tag.dive{top:36%;color:#d6eaf6}
.sm-col .tag.abyss{top:64%;color:#d6eaf6}
.sm-col .tag svg{width:14px;height:14px}
.sm-col .waves{position:absolute;left:-60%;width:220%;height:18px;pointer-events:none}
.sm-col .waves path{fill:currentColor}
.sm-col .surface-waves{top:31.2%;color:#3a8bb8;animation:sm-drift 10s linear infinite}
.sm-col .surface-waves.back{top:30.2%;color:#8ec8e6;opacity:.55;animation:sm-drift 16s linear infinite reverse}
.sm-col .deep-waves{top:60.4%;color:#123d56;opacity:.7;animation:sm-drift 18s linear infinite}
.sm-col .ship{position:absolute;left:50%;top:22%;width:56px;height:56px;color:#0b2436;
  filter:drop-shadow(0 6px 10px rgba(11,36,54,.2));animation:sm-bob 4.8s ease-in-out infinite}
.sm-col .line{position:absolute;left:50%;top:30%;width:2px;background:#e8f4fb;
  transform:translateX(-50%);height:0;opacity:0;border-radius:2px}
.sm-col .loot{position:absolute;left:50%;width:28px;height:28px;transform:translate(-50%,0);
  opacity:0;color:#e8f4fb;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
.sm-col .loot svg{width:28px;height:28px}
.sm-col .scene[data-haul="l2"] .line{height:22%;opacity:1;transition:height .45s ease}
.sm-col .scene[data-haul="l3"] .line{height:42%;opacity:1;transition:height .6s ease}
.sm-col .scene[data-haul="l2"] .loot-l2{top:42%;opacity:1;animation:sm-rise .65s ease-out}
.sm-col .scene[data-haul="l3"] .loot-l3{top:72%;opacity:1;animation:sm-rise .8s ease-out}
.sm-col .scene[data-haul="write"] .loot-write{top:76%;opacity:1;animation:sm-sink 1.15s ease-in both}
.sm-col .bubble{position:absolute;left:50%;border-radius:50%;
  border:1.5px solid rgba(232,244,251,.45);opacity:0;pointer-events:none}
.sm-col .scene[data-haul="write"] .bubble-a{width:8px;height:8px;margin-left:14px;animation:sm-bubble 1.1s ease-out .15s both}
.sm-col .scene[data-haul="write"] .bubble-b{width:5px;height:5px;margin-left:-18px;animation:sm-bubble 1s ease-out .35s both}
.sm-col .scene[data-haul="write"] .bubble-c{width:6px;height:6px;margin-left:4px;animation:sm-bubble .9s ease-out .55s both}
@keyframes sm-drift{from{transform:translateX(0)}to{transform:translateX(-18%)}}
@keyframes sm-bob{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 4px))}}
@keyframes sm-rise{from{transform:translate(-50%,36px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
@keyframes sm-sink{from{transform:translate(-50%,-160px);opacity:.95}to{transform:translate(-50%,0);opacity:1}}
@keyframes sm-bubble{from{top:72%;opacity:.7}to{top:34%;opacity:0}}
@media (prefers-reduced-motion:reduce){
  .sm-col .waves,.sm-col .ship{animation:none}
  .sm-col .ship{transform:translate(-50%,-50%)}
}
.sm-col .agent{display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;
  color:#e8f4fb;padding:4px 0;font:12px/1.4 ui-sans-serif,system-ui}
.sm-col .agent:hover{color:#bfe3f5}
.sm-col .agent .st{color:#9ec4d8;font-size:10px}
.sm-col .tok{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;font-size:12px}
.sm-col .tok span{color:#9ec4d8}
.sm-col .pane{background:#123d56;border:1px solid #1d5f86;border-radius:10px;padding:10px;flex:none}
.sm-col h2{margin:0 0 6px;font-size:10px;letter-spacing:.04em;color:#9ec4d8;text-transform:none}
.sm-col h3{margin:6px 0 3px;font-size:10px;color:#9ec4d8}
.sm-col pre,.sm-col p{margin:0;white-space:pre-wrap;word-break:break-word}
.sm-col ul{margin:0;padding-left:1em}
.sm-col li{margin:2px 0}
.sm-col .muted{color:#7ea3b8}
.sm-col code{font:11px/1.4 ui-monospace,monospace;color:#bfe3f5}
.sm-col .badge{display:inline-block;margin-left:5px;padding:0 6px;border-radius:999px;
  font-size:9px;background:#1d5f86;color:#d6eaf6}
.sm-col .badge.used{background:#1f7a4f}
.sm-col .calls button{display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;
  color:#bfe3f5;font:11px/1.6 ui-monospace,monospace;padding:1px 4px;border-radius:4px}
.sm-col .calls button:hover{background:#1d5f86}
.sm-col .calls button.on{background:#1d5f86}
.sm-col .calls .err{color:#f0a2a2}
.sm-col .toolbody{max-height:280px;overflow:auto;margin-top:6px;border-top:1px solid #1d5f86;padding-top:6px}
.sm-helm-btn{background:none;border:1px solid #1d5f86;border-radius:6px;color:inherit;
  cursor:pointer;font-size:12px;padding:2px 8px}
.sm-rail{height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:8px 10px 16px;
  color:#1a2a36;font:12px/1.45 ui-sans-serif,system-ui;box-sizing:border-box}
.sm-rail .fold{border:1px solid #d7e0e6;border-radius:8px;padding:6px 8px;background:#f7fafc}
.sm-rail .fold summary{cursor:pointer;color:#5b6b75;font-size:11px;list-style:none}
.sm-rail .sess{display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;
  padding:3px 4px;border-radius:4px;color:#1a2a36;font:12px/1.4 ui-sans-serif,system-ui}
.sm-rail .sess:hover{background:#e8eef2}
.sm-rail .sess.on{background:#d8e8f2;font-weight:650}
.sm-rail .ws{margin:4px 0 2px;color:#7a8a94;font-size:10px}
.sm-rail .card{border:1px solid #d7e0e6;border-radius:10px;padding:10px;background:#fff}
.sm-rail .card.now{border-color:#3a8bb8;box-shadow:0 0 0 1px #3a8bb8 inset}
.sm-rail .role{font-size:10px;color:#7a8a94;margin:0 0 4px}
.sm-rail .title{margin:0;font-weight:650}
.sm-rail .title button{background:none;border:0;padding:0;cursor:pointer;font:inherit;color:inherit;text-align:left}
.sm-rail .chk{display:flex;align-items:flex-start;gap:6px;margin:4px 0}
.sm-rail .box{width:13px;height:13px;border:1.5px solid #3a8bb8;border-radius:3px;flex:none;margin-top:2px}
.sm-rail .box.on{background:#3a8bb8}
.sm-rail .todos{margin:2px 0 0 19px;padding:0;list-style:none;color:#5b6b75}
.sm-rail .empty{color:#9aa8b0;margin:0}
.sm-rail-icon{display:flex;justify-content:center;padding-top:8px}
.sm-rail-icon button{background:none;border:0;cursor:pointer;font-size:16px}
`

    function injectCss() {
      if (document.getElementById('sm-col-css')) return
      const tag = document.createElement('style')
      tag.id = 'sm-col-css'
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function listOrDash(items, renderItem) {
      return items && items.length
        ? h('ul', null, items.map(renderItem))
        : h('p', { className: 'muted' }, '—')
    }

    function useMemoryState() {
      const [snap, setSnap] = useState(null)
      useEffect(() => {
        injectCss()
        let stop = false
        const tick = async () => {
          try {
            const res = await fetch('/student-memory/state', { cache: 'no-store' })
            if (res.ok && !stop) setSnap(await res.json())
          } catch {
            if (!stop) setSnap(null)
          }
        }
        tick()
        const id = setInterval(tick, 2000)
        return () => { stop = true; clearInterval(id) }
      }, [])
      return snap
    }

    function groupAdrs(adrs, stages) {
      const done = []
      const current = []
      const next = []
      for (const adr of adrs) {
        const mine = stages.filter((stage) => stage.adrId === adr.id)
        const allDone = mine.length > 0 && mine.every((stage) => stage.status === 'done')
        if (adr.status === 'superseded' || allDone) done.push(adr)
        else if (adr.status === 'proposed') next.push(adr)
        else current.push(adr)
      }
      if (current.length > 1) {
        const doing = current.filter((adr) =>
          stages.some((stage) => stage.adrId === adr.id && stage.status === 'doing'))
        const keep = doing.length > 0 ? doing : [current[0]]
        const keepIds = new Set(keep.map((adr) => adr.id))
        return { done, current: keep, next: [...current.filter((adr) => !keepIds.has(adr.id)), ...next] }
      }
      return { done, current, next }
    }

    function Check({ on, label, children }) {
      return h('div', { className: 'chk' },
        h('span', { className: on ? 'box on' : 'box' }),
        h('div', null,
          h('div', null, label),
          children,
        ),
      )
    }

    function AdrCard({ adr, role, stages, todos, expanded, onToggle }) {
      const mine = stages.filter((stage) => stage.adrId === adr.id)
      const items = todos.filter((todo) => todo.adrId === adr.id)
      const open = role === 'current' || expanded
      return h('article', { className: role === 'current' ? 'card now' : 'card' },
        h('p', { className: 'role' }, role === 'done' ? '已完成' : role === 'current' ? '当前工作' : '下一步'),
        h('p', { className: 'title' },
          h('button', { type: 'button', onClick: onToggle }, `${adr.id}  ${adr.title}`)),
        open
          ? (mine.length === 0 && items.length === 0
            ? h('p', { className: 'empty' }, role === 'done' ? '点开可看摘要' : '—')
            : mine.map((stage) => h(Check, {
              key: stage.id,
              on: stage.status === 'done',
              label: role === 'next' ? `前置条件 · ${stage.title}` : stage.title,
            },
            h('ul', { className: 'todos' },
              items.filter((todo) => todo.stageId === stage.id).map((todo) =>
                h('li', { key: todo.id }, `${todo.status === 'done' ? '✓' : todo.status === 'doing' ? '→' : '·'} ${todo.content}`))))))
          : null,
      )
    }

    function SessionSwitch(props) {
      const list = props.useSessions((s) => s)
      const workspaces = props.useWorkspaces((s) => s.items || [])
      const archived = new Set((props.useWorkspaces((s) => s.archivedSessionIds) || []))
      const current = list.current
      const byId = list.byId || {}
      const groups = workspaces.map((ws) => ({
        id: ws.workspaceId,
        title: ws.title,
        sessions: (ws.sessionIds || []).filter((id) => byId[id] && !archived.has(id)),
      })).filter((group) => group.sessions.length > 0)
      const grouped = new Set(groups.flatMap((group) => group.sessions))
      const loose = (list.ids || []).filter((id) => byId[id] && !archived.has(id) && !grouped.has(id))
      if (groups.length === 0 && loose.length === 0) return h('p', { className: 'empty' }, '还没有会话')
      const row = (id) => {
        const item = byId[id]
        return h('button', {
          key: id,
          type: 'button',
          className: id === current ? 'sess on' : 'sess',
          onClick: () => { if (openSession) openSession(id) },
        }, item.displayTitle || id)
      }
      return h('div', null,
        groups.map((group) => h('div', { key: group.id },
          h('div', { className: 'ws' }, group.title),
          group.sessions.map(row))),
        loose.length ? h('div', { className: 'ws' }, '其他') : null,
        loose.map(row),
      )
    }

    // Left browsing region: ADR rail as in the prototype (done / current / next).
    // Shadows sidebar.workspaces. Session switching stays as a compact fold
    // so the official workspace browser is not required.
    function AdrRail(props) {
      const snap = useMemoryState()
      const [openDone, setOpenDone] = useState({})
      if (!props.wide) {
        return h('div', { className: 'sm-rail-icon' },
          h('button', {
            type: 'button',
            title: '打开航线',
            onClick: () => { if (props.expandSidebar) props.expandSidebar() },
          }, '☰'))
      }
      const adrs = (snap && snap.adrs) || []
      const stages = (snap && snap.stages) || []
      const todos = (snap && snap.todos) || []
      const grouped = groupAdrs(adrs, stages)
      const cards = (role, list) => list.map((adr) => h(AdrCard, {
        key: adr.id,
        adr,
        role,
        stages,
        todos,
        expanded: !!openDone[adr.id],
        onToggle: () => setOpenDone((prev) => ({ ...prev, [adr.id]: !prev[adr.id] })),
      }))
      return h('div', { className: 'sm-rail' },
        h('details', { className: 'fold' },
          h('summary', null, '会话'),
          h(SessionSwitch, props)),
        grouped.done.length || grouped.current.length || grouped.next.length
          ? null
          : h('p', { className: 'empty' }, '还没有任务图。模型用 plan_step 写下阶段待办后会出现。'),
        cards('done', grouped.done),
        cards('current', grouped.current),
        cards('next', grouped.next),
      )
    }

    const ICON = {
      helm: 'M12 10.189V14 M12 2v3 M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6 M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76 M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
      dive: 'M12 6v16 m19 13 2-1a9 9 0 0 1-18 0l2 1 M9 11h6',
      book: 'M12 5v16 M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z',
      crate: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z M12 22V12',
    }

    function svgIcon(d, extra) {
      return h('svg', {
        viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        strokeWidth: '1.75', strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true',
      },
      h('path', { d }),
      extra || null)
    }

    function SeaScene({ haul }) {
      return h('div', { className: 'scene', 'data-haul': haul },
        h('div', { className: 'band sky' }),
        h('div', { className: 'band mid' }),
        h('div', { className: 'band deep' }),
        h('svg', { className: 'waves surface-waves back', viewBox: '0 0 240 20', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'M0 11 Q 15 6 30 11 T 60 11 T 90 11 T 120 11 T 150 11 T 180 11 T 210 11 T 240 11 V20 H0Z' })),
        h('svg', { className: 'waves surface-waves', viewBox: '0 0 240 20', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'M0 10 Q 20 4 40 10 T 80 10 T 120 10 T 160 10 T 200 10 T 240 10 V20 H0Z' })),
        h('svg', { className: 'waves deep-waves', viewBox: '0 0 240 20', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
          h('path', { d: 'M0 11 Q 18 8 36 11 T 72 11 T 108 11 T 144 11 T 180 11 T 216 11 T 240 11 V20 H0Z' })),
        h('div', { className: 'tag helm' }, svgIcon(ICON.helm), '舵手 · 本拍工作集'),
        h('div', { className: 'tag dive' },
          svgIcon(ICON.dive, h('circle', { cx: '12', cy: '4', r: '2' })),
          '潜水 · 任务状态'),
        h('div', { className: 'tag abyss' }, svgIcon(ICON.book), '深水 · 过往经验'),
        h('svg', {
          className: 'ship', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
          strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round',
        }, h('path', { d: ICON.helm })),
        h('div', { className: 'line' }),
        h('div', { className: 'loot loot-l2' }, svgIcon(ICON.crate)),
        h('div', { className: 'loot loot-l3' }, svgIcon(ICON.book)),
        h('div', { className: 'loot loot-write' }, svgIcon(ICON.book)),
        h('span', { className: 'bubble bubble-a' }),
        h('span', { className: 'bubble bubble-b' }),
        h('span', { className: 'bubble bubble-c' }),
      )
    }

    function formatTokens(n) {
      if (n < 1000) return String(n)
      if (n < 1_000_000) {
        const v = n / 1000
        return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}K`
      }
      const v = n / 1_000_000
      return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}M`
    }

    function rootToolBlocks(conversation) {
      const out = []
      if (!conversation || !conversation.chat || !conversation.chat.nodes) return out
      for (const node of conversation.chat.nodes.values()) {
        if (node && node.kind === 'tool-call' && node.data && node.data.root) out.push(node.data.root)
      }
      return out
    }

    function blockName(block) {
      if ('kind' in block) return (block.call && block.call.name) || block.callId
      return block.name || block.callId
    }

    function prettyArgs(raw) {
      if (!raw) return ''
      try {
        return JSON.stringify(JSON.parse(raw), null, 2)
      } catch {
        return raw
      }
    }

    function blockBody(block) {
      const argsRaw = 'kind' in block
        ? (block.call && block.call.argsRaw) || ''
        : block.argsRaw || ''
      const result = !('kind' in block)
        ? '还在跑…'
        : (block.content || [])
            .map((item) => item.type === 'text' ? item.text : JSON.stringify(item))
            .join('\n') || '—'
      return h('div', null,
        argsRaw ? h('div', null, h('h3', null, '输入'), h('pre', null, prettyArgs(argsRaw))) : null,
        h('h3', null, '输出'),
        h('pre', null, result),
      )
    }

    function HelmColumn(props) {
      const snap = useMemoryState()
      const [selected, setSelected] = useState(null)
      const conversation = props.useSession((s) => s)
      const sessionId = props.sessionId
      const usage = props.useProjection ? props.useProjection('tokenUsage') : undefined
      const catalog = props.useSessions((list) => {
        const rows = list.subagentsByParent || {}
        return rows[sessionId] || { entries: [] }
      })
      const summaries = props.useSessions((list) => list.byId || {})

      useEffect(() => {
        if (!sessionId || !refreshSubagents) return
        if (setCatalogOpen) setCatalogOpen(sessionId, true)
        refreshSubagents(sessionId).catch(() => {})
        return () => { if (setCatalogOpen) setCatalogOpen(sessionId, false) }
      }, [sessionId])

      const openArcs = (snap && snap.openArcs) || []
      const recalled = (snap && snap.recalled) || []
      const usedIds = (snap && snap.usedIds) || []
      const learned = (snap && snap.sessionLearned) || []
      const pending = openArcs.length > 0
      const used = new Set(usedIds)
      const haul = learned.length ? 'write' : recalled.length ? 'l3' : (snap && snap.now) ? 'l2' : ''
      const blocks = rootToolBlocks(conversation)
      const recent = blocks.slice(-8).reverse()
      const selectedBlock = selected
        ? blocks.find((block) => block.callId === selected)
        : undefined
      const children = (catalog.entries || []).filter((entry) => entry.kind === 'child')
      const input = usage
        ? usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
        : 0
      const cacheHit = usage && input > 0
        ? Math.round(usage.cacheReadTokens / input * 100)
        : null

      return h('div', { className: 'sm-col' },
        h('div', { className: 'head' },
          h('b', null, '舵手'),
          h('button', {
            title: '收起',
            onClick: () => { if (layout) layout.closeDetails() },
          }, '✕'),
        ),
        h('section', { className: 'pane' },
          h('h2', null, 'agent'),
          children.length === 0
            ? h('p', { className: 'muted' }, '还没有子 agent')
            : children.map((entry) => h('button', {
              key: entry.id,
              type: 'button',
              className: 'agent',
              onClick: () => {
                if (openChild) openChild({
                  parentSessionId: sessionId,
                  childSessionId: entry.id,
                  mode: entry.mode,
                })
              },
            },
            entry.label || (summaries[entry.id] && summaries[entry.id].displayTitle) || entry.id,
            h('div', { className: 'st' },
              entry.activity === 'running' ? '工作中，点击可查看详情' : '完成，点击可查看详情'))),
        ),
        h(SeaScene, { haul }),
        h('section', { className: 'pane' },
          h('h2', null, 'token · 消耗情况'),
          usage
            ? h('div', { className: 'tok' },
              h('div', null, h('span', null, '输入 '), formatTokens(input)),
              h('div', null, h('span', null, '输出 '), formatTokens(usage.outputTokens || 0)),
              h('div', null, h('span', null, '缓存命中 '), cacheHit === null ? '—' : `${cacheHit}%`))
            : h('p', { className: 'muted' }, '还没有用量'),
        ),
        h('section', { className: 'pane' },
          h('h2', null, '现在在干什么'),
          h('pre', null, (snap && snap.now) || '—'),
          pending ? h('p', null, '有一次先错后改，还没记下来。') : null,
        ),
        h('section', { className: 'pane' },
          h('h2', null, '这轮摊开的旧经验'),
          listOrDash(recalled, (item) => h('li', { key: item.id },
            h('code', null, item.id), ` ${item.summary}`,
            used.has(item.id) ? h('span', { className: 'badge used' }, '用上了') : null)),
          h('h2', { style: { marginTop: '8px' } }, '学到了什么（本次）'),
          listOrDash(learned, (item) => h('li', { key: item.id },
            item.cause,
            h('span', { className: 'badge' }, item.trust))),
        ),
        h('section', { className: 'pane calls' },
          h('h2', null, '工具调用'),
          recent.length === 0
            ? h('p', { className: 'muted' }, '—')
            : recent.map((block) => h('button', {
              key: block.callId,
              className: selected === block.callId ? 'on' : '',
              onClick: () => setSelected(selected === block.callId ? null : block.callId),
            },
            'kind' in block && block.isError ? h('span', { className: 'err' }, '✗ ') : null,
            blockName(block))),
          selectedBlock
            ? h('div', { className: 'toolbody', key: selectedBlock.callId }, blockBody(selectedBlock))
            : null,
        ),
      )
    }

    function AutoOpen(props) {
      const current = props.useSessions((s) => s.current)
      useEffect(() => {
        if (!current || !layout) return
        try {
          layout.openDetails()
        } catch {
          // Root frame not mounted yet.
        }
      }, [current])
      return null
    }

    function HelmButton() {
      return h('button', {
        className: 'sm-helm-btn',
        title: '打开舵手栏',
        onClick: () => { if (layout) layout.openDetails() },
      }, '舵手')
    }

    exports.inject = ['slots', 'layout', 'sessions']
    exports.apply = function apply(ctx) {
      layout = ctx.layout
      openSession = (id) => { ctx.sessions.open(id) }
      openChild = (address) => { ctx.sessions.openSubagent(address) }
      refreshSubagents = (id) => ctx.sessions.refreshSubagents(id)
      setCatalogOpen = (id, open) => { ctx.sessions.setSubagentCatalogOpen(id, open) }

      ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register({
        name: 'sidebar.workspaces',
        priority: -1,
        inject: () => ({}),
      }, AdrRail))

      ctx.slots.inject('details', () => ctx.slots.register({
        name: 'details',
        priority: -1,
        inject: () => ({}),
      }, HelmColumn))

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'student-memory-auto-open',
        order: 900,
      }, AutoOpen))

      ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'student-memory-helm-open',
        order: 50,
      }, HelmButton))
    }
    return exports
  },
})
