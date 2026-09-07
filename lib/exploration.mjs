export const initialState = {
  stage: 0,
  amount: 0,
  playing: false,
  direction: 1,
  selected: null,
  isolated: false,
  completed: [],
  cameraRevision: 0,
};
const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const stageAmounts = [0, 0.2, 0.2, 0.24, 0.67, 0.88, 1, 1, 0];
export function transition(state, action) {
  switch (action.type) {
    case 'stage': {
      const stage = Math.round(clamp(action.value, 0, 8));
      return {
        ...state,
        stage,
        amount: stageAmounts[stage],
        playing: false,
        isolated: false,
        selected: null,
        cameraRevision: state.cameraRevision + 1,
      };
    }
    case 'amount':
      return {
        ...state,
        amount: clamp(action.value, 0, 1),
        playing: false,
        isolated: false,
      };
    case 'select':
      return {
        ...state,
        selected: action.id,
        isolated: action.id ? state.isolated : false,
      };
    case 'isolate':
      return {
        ...state,
        isolated: !!state.selected && !state.isolated,
        playing: false,
      };
    case 'play':
      return {
        ...state,
        playing: !state.playing,
        direction:
          state.amount >= 0.999
            ? -1
            : state.amount <= 0.001
              ? 1
              : state.direction,
        isolated: false,
      };
    case 'reverse':
      return { ...state, direction: -1, playing: true, isolated: false };
    case 'tick': {
      if (!state.playing) return state;
      const amount = clamp(
        state.amount + Math.max(0, action.delta) * state.direction,
        0,
        1,
      );
      return { ...state, amount, playing: amount > 0 && amount < 1 };
    }
    case 'complete':
      return {
        ...state,
        completed: [...new Set([...state.completed, state.stage])],
      };
    case 'camera':
      return { ...state, cameraRevision: state.cameraRevision + 1 };
    case 'reset':
      return {
        ...initialState,
        completed: [],
        cameraRevision: state.cameraRevision + 1,
      };
    default:
      return state;
  }
}
const ramp = (amount, start, end) => {
  const t = clamp((amount - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};
export function offsetForPart(part, amount) {
  const i = part.index,
    a = clamp(amount, 0, 1);
  if (a === 0) return [0, 0, 0];
  let v = [0, 0, 0],
    t = 1;
  if (i === 0) {
    v = [70, 8, 92];
    t = ramp(a, 0.32, 0.76);
  } else if (i === 1) {
    v = [55, 14, -84];
    t = ramp(a, 0.32, 0.76);
  } else if (i >= 2 && i <= 7) {
    v = [32, -85, 0];
    t = ramp(a, 0, 0.2);
  } else if (i >= 25) {
    const n = i - 25;
    v = [-12 + n * 2.5, ((n % 3) - 1) * 9, 105 + n * 6];
    t = ramp(a, 0.2, 0.48);
  } else if (i === 8 || i === 9) {
    v = [75, 42, (i === 8 ? -1 : 1) * 28];
    t = ramp(a, 0.5, 1);
  } else if (i >= 10 && i <= 12) {
    v = [-62 - (i - 10) * 31, (i - 11) * 7, 0];
    t = ramp(a, 0.52, 0.93);
  } else if (i >= 13 && i <= 17) {
    v = [-36 + (i - 13) * 14, -24, (i - 15) * 25];
    t = ramp(a, 0.6, 1);
  } else if (i === 18 || i === 19) {
    v = [-64, -24, (i === 18 ? 1 : -1) * 28];
    t = ramp(a, 0.58, 1);
  } else if (i === 20) {
    v = [-40, -10, 44];
    t = ramp(a, 0.55, 1);
  } else if (i === 21) {
    v = [-42, 0, 30];
    t = ramp(a, 0.55, 1);
  } else if (i === 22) {
    v = [5, 22, -57];
    t = ramp(a, 0.52, 1);
  } else if (i === 23) {
    v = [-8, 68, 0];
    t = ramp(a, 0.52, 1);
  } else if (i === 24) {
    v = [-30, 24, 0];
    t = ramp(a, 0.2, 0.38);
  }
  return v.map((n) => n * t);
}
