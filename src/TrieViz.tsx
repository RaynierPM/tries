import { TrieNode } from './core'

const H_GAP = 40
const V_GAP = 62
const R = 13
const PAD_X = 24
const PAD_Y = 28

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

export function TrieViz({ root }: { root: TrieNode }) {
  const count = countNodes(root)

  if (count <= 1) return null

  if (count > 450) {
    return (
      <div className="graph-section">
        <div className="graph-header">
          <span className="graph-title">TREE STRUCTURE</span>
          <div className="graph-dots"><span /><span /><span /></div>
        </div>
        <div className="viz-overflow">
          <span className="viz-overflow-icon">◈</span>
          <span>{count.toLocaleString()} nodes — trie too large to render visually</span>
        </div>
      </div>
    )
  }

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
    <div className="graph-section">
      <div className="graph-header">
        <span className="graph-title">TREE STRUCTURE</span>
        <div className="graph-dots"><span /><span /><span /></div>
        <span className="graph-node-count">{count - 1} nodes</span>
      </div>
      <div className="viz-scroll">
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

          {/* Edges */}
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

          {/* Nodes */}
          <g>
            {nodes.map((n, i) => (
              <g key={i} transform={`translate(${cx(n)},${cy(n)})`}>
                {n.isEnd && (
                  <circle
                    r={R + 5}
                    fill="none"
                    stroke="rgba(0,255,65,0.12)"
                    strokeWidth="1"
                  />
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
      </div>
    </div>
  )
}
