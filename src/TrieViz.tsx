import { useEffect, useState } from 'react'
import { TrieNode } from './core'

const H_GAP = 40
const V_GAP = 62
const R = 13
const PAD_X = 24
const PAD_Y = 28
const LARGE_THRESHOLD = 800

interface LayoutNode {
  char: string
  isEnd: boolean
  x: number
  depth: number
  children: LayoutNode[]
}

function countNodes(node: TrieNode): number {
  return 1 + Object.values(node.children).reduce((s, c) => s + countNodes(c), 0)
}

function buildLayout(
  node: TrieNode,
  char: string,
  depth: number,
  offset: number
): { n: LayoutNode; w: number } {
  const entries = Object.entries(node.children)
  if (entries.length === 0) {
    return { n: { char, isEnd: node.isEnd, x: offset + 0.5, depth, children: [] }, w: 1 }
  }
  const children: LayoutNode[] = []
  let cx = offset
  for (const [c, child] of entries) {
    const { n, w } = buildLayout(child, c, depth + 1, cx)
    children.push(n)
    cx += w
  }
  const w = cx - offset
  return { n: { char, isEnd: node.isEnd, x: offset + w / 2, depth, children }, w }
}

function collectEdges(n: LayoutNode, out: [LayoutNode, LayoutNode][]) {
  for (const c of n.children) {
    out.push([n, c])
    collectEdges(c, out)
  }
}

function collectNodes(n: LayoutNode, out: LayoutNode[]) {
  out.push(n)
  n.children.forEach(c => collectNodes(c, out))
}

function getMaxDepth(n: LayoutNode): number {
  if (!n.children.length) return n.depth
  return Math.max(...n.children.map(getMaxDepth))
}

function TrieSVG({ root }: { root: TrieNode }) {
  const { n: layout, w: totalWidth } = buildLayout(root, '·', 0, 0)
  const depth = getMaxDepth(layout)

  const svgW = totalWidth * H_GAP + PAD_X * 2
  const svgH = (depth + 1) * V_GAP + PAD_Y * 2

  const edges: [LayoutNode, LayoutNode][] = []
  collectEdges(layout, edges)

  const nodes: LayoutNode[] = []
  collectNodes(layout, nodes)

  const cx = (n: LayoutNode) => PAD_X + n.x * H_GAP
  const cy = (n: LayoutNode) => PAD_Y + n.depth * V_GAP

  return (
    <svg width={svgW} height={svgH} className="viz-svg">
      <defs>
        <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g>
        {edges.map(([p, c], i) => (
          <line
            key={i}
            x1={cx(p)} y1={cy(p)}
            x2={cx(c)} y2={cy(c)}
            stroke="rgba(0,255,65,0.12)"
            strokeWidth="1"
          />
        ))}
      </g>

      <g>
        {nodes.map((n, i) => (
          <g key={i} transform={`translate(${cx(n)},${cy(n)})`}>
            {n.isEnd && (
              <circle r={R + 5} fill="none" stroke="rgba(0,255,65,0.12)" strokeWidth="1" />
            )}
            <circle
              r={R}
              fill={n.isEnd ? 'rgba(0,255,65,0.1)' : '#080810'}
              stroke={n.isEnd ? '#00ff41' : 'rgba(0,255,65,0.28)'}
              strokeWidth={n.isEnd ? 1.5 : 1}
              filter={n.isEnd ? 'url(#node-glow)' : undefined}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight={n.isEnd ? '700' : '400'}
              fill={n.isEnd ? '#00ff41' : 'rgba(200,255,200,0.6)'}
            >
              {n.char}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export function TrieViz({ root }: { root: TrieNode }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const count = countNodes(root)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setExpanded(false)
        setConfirming(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (count <= 1) return null

  const isLarge = count > LARGE_THRESHOLD

  function handleExpand() {
    if (isLarge) {
      setConfirming(true)
    } else {
      setExpanded(true)
    }
  }

  return (
    <>
      <div className="graph-section">
        <div className="graph-header">
          <span className="graph-title">TREE STRUCTURE</span>
          <div className="graph-dots"><span /><span /><span /></div>
          <span className="graph-node-count">{count - 1} nodes</span>
          <button className="expand-btn" onClick={handleExpand}>
            ⤢ EXPAND
          </button>
        </div>

        {isLarge ? (
          <div className="viz-overflow">
            <span className="viz-overflow-icon">◈</span>
            <span>{count.toLocaleString()} nodes — trie too large to render inline</span>
          </div>
        ) : (
          <div className="viz-scroll">
            <TrieSVG root={root} />
          </div>
        )}
      </div>

      {/* Confirmation popup */}
      {confirming && (
        <div className="dialog-overlay" onClick={() => setConfirming(false)}>
          <div className="dialog-confirm" onClick={e => e.stopPropagation()}>
            <div className="dialog-confirm-icon">⚠</div>
            <p className="dialog-confirm-title">Large graph detected</p>
            <p className="dialog-confirm-body">
              This trie has <strong>{count.toLocaleString()}</strong> nodes.
              Rendering may be slow or cause lag.
            </p>
            <div className="dialog-confirm-actions">
              <button
                className="dialog-btn-primary"
                onClick={() => { setConfirming(false); setExpanded(true) }}
              >
                RENDER ANYWAY
              </button>
              <button
                className="dialog-btn-secondary"
                onClick={() => setConfirming(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded dialog */}
      {expanded && (
        <div className="dialog-overlay" onClick={() => setExpanded(false)}>
          <div className="dialog-expanded" onClick={e => e.stopPropagation()}>
            <div className="dialog-expanded-header">
              <div className="dialog-header-left">
                <span className="graph-title">TREE STRUCTURE</span>
                <span className="graph-node-count">{count - 1} nodes</span>
              </div>
              <button className="dialog-close-btn" onClick={() => setExpanded(false)}>
                ✕ CLOSE
              </button>
            </div>
            <div className="dialog-expanded-scroll">
              <TrieSVG root={root} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
