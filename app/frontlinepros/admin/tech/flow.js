'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── node chrome ─────────────────────────────────────────────
function Box({ data }) {
  return (
    <div className={`fnode ${data.kind || ''}`}>
      <Handle type="target" position={Position.Top} />
      <b>{data.label}</b>
      {data.sub && <span>{data.sub}</span>}
      {data.tag && <em className={`ftag ${data.tagKind || ''}`}>{data.tag}</em>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { box: Box };

const edge = (id, source, target, label, dashed) => ({
  id, source, target, label,
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  style: dashed ? { strokeDasharray: '5 4' } : undefined,
  labelStyle: { fontSize: 11 },
});

// ── the architecture, as it actually is ─────────────────────
const ARCH_NODES = [
  { id: 'caller', position: { x: 40, y: 0 },   data: { label: 'Customer', sub: 'rings the shop', kind: 'ext' } },
  { id: 'carrier',position: { x: 40, y: 100 }, data: { label: "Shop's carrier", sub: 'conditional forward, no answer', kind: 'ext' } },
  { id: 'line',   position: { x: 40, y: 200 }, data: { label: 'Assigned number', sub: 'one per shop — the routing key', kind: 'ext' } },
  { id: 'voice',  position: { x: 40, y: 310 }, data: { label: '/api/voice', sub: 'identify shop from To, TwiML', tag: 'signature verified', tagKind: 'ok' } },
  { id: 'open',   position: { x: 40, y: 420 }, data: { label: 'Opening SMS', sub: 'fixed template — no model', tag: 'awaited, not fire-and-forget', tagKind: 'ok' } },
  { id: 'sms',    position: { x: 360, y: 310 },data: { label: '/api/sms', sub: 'every inbound reply', tag: 'signature verified', tagKind: 'ok' } },
  { id: 'kw',     position: { x: 360, y: 420 },data: { label: 'STOP / HELP / START', sub: 'matched before any model', tag: 'code only', tagKind: 'code' } },
  { id: 'l0',     position: { x: 360, y: 530 },data: { label: 'L0 safety', sub: 'literal terms, then haiku', tag: 'fails closed', tagKind: 'ok' } },
  { id: 'l1',     position: { x: 200, y: 640 },data: { label: 'L1 dialogue', sub: 'sonnet-5 · one question a turn' } },
  { id: 'l1b',    position: { x: 200, y: 750 },data: { label: 'L1b extract', sub: 'haiku · records the answers' } },
  { id: 'l2',     position: { x: 520, y: 640 },data: { label: 'L2 vision', sub: 'opus-5 · transcription only' } },
  { id: 'l3',     position: { x: 520, y: 750 },data: { label: 'L3 router', sub: 'threshold, hard overwrite', tag: 'NO MODEL', tagKind: 'code' } },
  { id: 'l4',     position: { x: 360, y: 860 },data: { label: 'L4 triage', sub: 'haiku returns an index only' } },
  { id: 'l5',     position: { x: 360, y: 970 },data: { label: 'L5 job card', sub: 'typed fields + provenance', tag: 'NO MODEL', tagKind: 'code' } },
  { id: 'l6',     position: { x: 40,  y: 860 },data: { label: 'L6 guard', sub: 'every outbound message', tag: 'blocks 8 categories', tagKind: 'ok' } },
  { id: 'out',    position: { x: 40,  y: 970 },data: { label: 'SMS to customer', sub: 'or static fallback if blocked', kind: 'ext' } },
  { id: 'owner',  position: { x: 620, y: 970 },data: { label: 'Owner', sub: 'job card by SMS + dashboard', kind: 'ext' } },
  { id: 'db',     position: { x: 680, y: 530 },data: { label: 'Supabase', sub: 'fp_* tables, service role', kind: 'store' } },
  { id: 'meter',  position: { x: 680, y: 640 },data: { label: 'fp_costs', sub: 'tokens + USD per link', kind: 'store' } },
  { id: 'stripe', position: { x: 680, y: 310 },data: { label: 'Stripe', sub: 'inline price, webhook verified', kind: 'store' } },
];
const ARCH_EDGES = [
  edge('e1','caller','carrier'), edge('e2','carrier','line','unanswered'),
  edge('e3','line','voice'), edge('e4','voice','open'),
  edge('e5','line','sms','replies'), edge('e6','sms','kw'), edge('e7','kw','l0','not a keyword'),
  edge('e8','l0','l1','clear'), edge('e9','l0','l2','photo'),
  edge('e10','l1','l1b'), edge('e11','l2','l3'),
  edge('e12','l3','l4','settled'), edge('e13','l1b','l4','checklist done'),
  edge('e14','l4','l5'), edge('e15','l5','owner'),
  edge('e16','l1','l6'), edge('e17','l6','out'),
  edge('e18','l3','l2','re-shoot ≤2', true),
  edge('e19','sms','db','', true), edge('e20','l0','meter','', true), edge('e21','db','meter','', true),
];

// ── the data model ──────────────────────────────────────────
const DATA_NODES = [
  { id: 'shops', position: { x: 300, y: 0 },   data: { label: 'fp_shops', sub: 'assigned_number is unique — the routing key', kind: 'store' } },
  { id: 'conv',  position: { x: 300, y: 130 }, data: { label: 'fp_conversations', sub: 'one per rescued call · state jsonb', kind: 'store' } },
  { id: 'msg',   position: { x: 60,  y: 270 }, data: { label: 'fp_messages', sub: 'transcript, incl. blocked drafts', kind: 'store' } },
  { id: 'card',  position: { x: 300, y: 270 }, data: { label: 'fp_jobcards', sub: 'fields + provenance · closed_at', kind: 'store' } },
  { id: 'cost',  position: { x: 545, y: 270 }, data: { label: 'fp_costs', sub: 'per link and per message', kind: 'store' } },
  { id: 'opt',   position: { x: 60,  y: 130 }, data: { label: 'fp_optouts', sub: 'shop-scoped or global', kind: 'store' } },
  { id: 'sess',  position: { x: 545, y: 130 }, data: { label: 'fp_sessions', sub: 'owner login, 30 days', kind: 'store' } },
  { id: 'set',   position: { x: 780, y: 0 },   data: { label: 'fp_settings', sub: 'pricing + guard rails', kind: 'store' } },
  { id: 'adm',   position: { x: 780, y: 130 }, data: { label: 'fp_admins', sub: 'allow-list + 8h sessions', kind: 'store' } },
];
const DATA_EDGES = [
  edge('d1','shops','conv','1 : n'), edge('d2','conv','msg','1 : n'),
  edge('d3','conv','card','1 : 1'), edge('d4','conv','cost','1 : n'),
  edge('d5','shops','opt','1 : n'), edge('d6','shops','sess','1 : n'),
];

const VIEWS = {
  architecture: { nodes: ARCH_NODES, edges: ARCH_EDGES,
    note: 'Solid lines are the call path. Dashed lines are writes and retries. The two links marked NO MODEL are deliberate — a threshold in a prompt is a suggestion; in code it is a rule.' },
  data: { nodes: DATA_NODES, edges: DATA_EDGES,
    note: 'Every table is prefixed fp_ and lives in the shared A2Z project with row-level security on. Only the service role reads them.' },
};

export default function ArchFlow({ view = 'architecture' }) {
  const v = VIEWS[view] || VIEWS.architecture;
  const nodes = useMemo(() => v.nodes.map((n) => ({ ...n, type: 'box' })), [v]);
  return (
    <>
      <div className="flowwrap">
        <ReactFlow
          nodes={nodes}
          edges={v.edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: false }}
          nodesDraggable
          minZoom={0.2}
        >
          <Background gap={18} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
      <p className="flownote">{v.note}</p>
    </>
  );
}

// ── one caller's journey, built from real rows ──────────────
export function JourneyFlow({ data }) {
  const { nodes, edges } = useMemo(() => {
    if (!data || data.empty) return { nodes: [], edges: [] };
    const N = [];
    const E = [];
    let y = 0;

    if (data.shop) {
      N.push({ id: 'shop', type: 'box', position: { x: 320, y },
        data: { label: data.shop.business_name, kind: 'store',
                sub: `fp_shops · ${data.shop.trade_id} · ${data.shop.subscription_status || 'no sub'}` } });
      y += 130;
    }

    data.conversations.forEach((c, i) => {
      const cid = `c${i}`;
      const msgs = data.messages.filter((m) => m.conversation_id === c.id);
      const card = data.cards.find((k) => k.conversation_id === c.id);
      const spend = data.costs.filter((k) => k.conversation_id === c.id)
        .reduce((a, r) => a + Number(r.usd || 0), 0);

      N.push({ id: cid, type: 'box', position: { x: 320, y },
        data: { label: new Date(c.started_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                sub: `fp_conversations · ${c.status}${c.hazard ? ' · HAZARD' : ''}`,
                tag: `$${spend.toFixed(4)}`, tagKind: 'code' } });
      if (data.shop) E.push(edge(`es${i}`, 'shop', cid));

      N.push({ id: `${cid}m`, type: 'box', position: { x: 40, y: y + 120 },
        data: { label: `${msgs.length} messages`, kind: 'store',
                sub: msgs.length ? `"${(msgs[0].body || '').slice(0, 46)}…"` : 'none',
                tag: msgs.some((m) => m.blocked) ? 'a draft was blocked' : null, tagKind: 'warn' } });
      E.push(edge(`em${i}`, cid, `${cid}m`));

      if (card) {
        N.push({ id: `${cid}k`, type: 'box', position: { x: 600, y: y + 120 },
          data: { label: card.identified ? 'Job card · model verified' : 'Job card · not identified',
                  kind: 'store',
                  sub: `fp_jobcards${card.closed_at ? ` · closed (${card.outcome || '—'})` : ' · open'}` } });
        E.push(edge(`ek${i}`, cid, `${cid}k`));
      }
      y += 260;
    });
    return { nodes: N, edges: E };
  }, [data]);

  if (!data) return <p className="panel-lead muted">Search a number to see everything we hold on it.</p>;
  if (data.empty) return <p className="panel-lead muted">Nothing on that number.</p>;

  return (
    <div className="flowwrap tall">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.15}>
        <Background gap={18} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
