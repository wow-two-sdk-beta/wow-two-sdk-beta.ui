import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NodeEditor, type NodeEditorEdge, type NodeEditorNode } from './NodeEditor';

const meta: Meta = {
  title: 'Display/NodeEditor',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const INITIAL_NODES: NodeEditorNode[] = [
  { id: 'input', x: 40, y: 40, label: 'Input' },
  { id: 'transform', x: 280, y: 100, label: 'Transform' },
  { id: 'filter', x: 280, y: 220, label: 'Filter' },
  { id: 'output', x: 540, y: 160, label: 'Output' },
];

const INITIAL_EDGES: NodeEditorEdge[] = [
  { id: 'e1', source: 'input', target: 'transform', label: 'rows' },
  { id: 'e2', source: 'input', target: 'filter' },
  { id: 'e3', source: 'transform', target: 'output' },
  { id: 'e4', source: 'filter', target: 'output', label: 'matched' },
];

export const Default: Story = {
  render: () => {
    function Demo() {
      const [nodes, setNodes] = useState<NodeEditorNode[]>(INITIAL_NODES);
      return (
        <div className="p-4">
          <NodeEditor
            nodes={nodes}
            edges={INITIAL_EDGES}
            onNodesChange={setNodes}
            onEdgeClick={(e) => alert(`Clicked edge ${e.id}`)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Drag nodes · drag empty area to pan · wheel to zoom · click edge to inspect.
          </p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const CustomRender: Story = {
  render: () => {
    function Demo() {
      const [nodes, setNodes] = useState<NodeEditorNode[]>(
        INITIAL_NODES.map((n, i) => ({ ...n, data: { kind: ['source', 'op', 'op', 'sink'][i] } })),
      );
      return (
        <div className="p-4">
          <NodeEditor
            nodes={nodes}
            edges={INITIAL_EDGES}
            onNodesChange={setNodes}
            renderNode={(n) => (
              <div className="flex h-full w-full flex-col rounded-md border border-border bg-card text-xs shadow-sm">
                <div className="border-b border-border bg-muted px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                  {String(n.data?.kind ?? 'node')}
                </div>
                <div className="flex flex-1 items-center px-2 font-medium">{n.label}</div>
              </div>
            )}
          />
        </div>
      );
    }
    return <Demo />;
  },
};
