export type ExplorationState = {
  stage: number;
  amount: number;
  playing: boolean;
  direction: number;
  selected: string | null;
  isolated: boolean;
  completed: number[];
  cameraRevision: number;
};
export type ExplorationAction =
  | { type: 'stage' | 'amount'; value: number }
  | { type: 'select'; id: string | null }
  | { type: 'tick'; delta: number }
  | { type: 'isolate' | 'play' | 'reverse' | 'complete' | 'camera' | 'reset' };
export const initialState: ExplorationState;
export function transition(
  state: ExplorationState,
  action: ExplorationAction,
): ExplorationState;
export function offsetForPart(
  part: { index: number },
  amount: number,
): number[];
