'use client';
import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { Dispatch } from 'react';
import { parts, stageTitles } from './tool-data';
import type { ExplorationState, ExplorationAction } from './exploration.mjs';
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};
export function useWebMCP(
  state: ExplorationState,
  dispatch: Dispatch<ExplorationAction>,
  showGuide: () => void,
) {
  const latest = useRef({ state, dispatch, showGuide });
  latest.current = { state, dispatch, showGuide };
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'get_disassembly_state',
        title: '查看拆解工作台状态',
        description:
          'Read the current structural exploration state and available CAD component identities. Counts are geometric bodies, not all physical internal parts.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => ({
          state: latest.current.state,
          stages: stageTitles,
          parts: parts.map((p) => ({
            id: p.id,
            name: p.label,
            cadName: p.name,
          })),
        }),
      },
      {
        name: 'configure_disassembly_view',
        title: '调整三维拆解视图',
        description:
          'Set a guide stage (0–8), explosion amount (0–1), or select one CAD body. This changes the visible educational view, not a real tool.',
        inputSchema: {
          type: 'object',
          properties: {
            stage: { type: 'integer', minimum: 0, maximum: 8 },
            amount: { type: 'number', minimum: 0, maximum: 1 },
            partId: { type: 'string' },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => {
          if (!input || typeof input !== 'object' || Array.isArray(input))
            throw new Error('Expected an object');
          const x = input as Record<string, unknown>;
          if (
            Object.keys(x).some(
              (k) => !['stage', 'amount', 'partId'].includes(k),
            )
          )
            throw new Error('Unknown field');
          if (
            x.stage !== undefined &&
            (!Number.isInteger(x.stage) ||
              Number(x.stage) < 0 ||
              Number(x.stage) > 8)
          )
            throw new Error('Stage must be 0–8');
          if (
            x.amount !== undefined &&
            (typeof x.amount !== 'number' ||
              !Number.isFinite(x.amount) ||
              x.amount < 0 ||
              x.amount > 1)
          )
            throw new Error('Amount must be 0–1');
          if (x.partId !== undefined && !parts.some((p) => p.id === x.partId))
            throw new Error('Unknown CAD body');
          flushSync(() => {
            latest.current.showGuide();
            if (x.stage !== undefined)
              latest.current.dispatch({
                type: 'stage',
                value: Number(x.stage),
              });
            if (x.amount !== undefined)
              latest.current.dispatch({
                type: 'amount',
                value: Number(x.amount),
              });
            if (x.partId !== undefined)
              latest.current.dispatch({ type: 'select', id: String(x.partId) });
          });
          await new Promise((resolve) => window.setTimeout(resolve, 600));
          return { state: latest.current.state };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
