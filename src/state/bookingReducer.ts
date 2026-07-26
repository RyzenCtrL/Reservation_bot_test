import { STEP_ORDER, type Step } from '../types';

export interface BookingState {
  step: Step;
  serviceId: string | null;
  masterId: string | null;
  dateISO: string | null;
  time: string | null;
  direction: 1 | -1;
  confirmed: boolean;
}

export const initialBookingState: BookingState = {
  step: 'service',
  serviceId: null,
  masterId: null,
  dateISO: null,
  time: null,
  direction: 1,
  confirmed: false,
};

export type BookingAction =
  | { type: 'SELECT_SERVICE'; serviceId: string }
  | { type: 'SELECT_MASTER'; masterId: string }
  | { type: 'SELECT_DATE'; dateISO: string }
  | { type: 'SELECT_TIME'; time: string }
  | { type: 'GO_TO_STEP'; step: Step }
  | { type: 'GO_BACK' }
  | { type: 'CONFIRM' }
  | { type: 'RESET' };

function goTo(state: BookingState, step: Step): BookingState {
  const currentIdx = STEP_ORDER.indexOf(state.step);
  const targetIdx = STEP_ORDER.indexOf(step);
  return { ...state, step, direction: targetIdx >= currentIdx ? 1 : -1 };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_SERVICE':
      if (state.serviceId === action.serviceId) return goTo(state, 'master');
      return goTo(
        { ...state, serviceId: action.serviceId, masterId: null, dateISO: null, time: null },
        'master',
      );

    case 'SELECT_MASTER':
      if (state.masterId === action.masterId) return goTo(state, 'date');
      return goTo({ ...state, masterId: action.masterId, dateISO: null, time: null }, 'date');

    case 'SELECT_DATE':
      if (state.dateISO === action.dateISO) return goTo(state, 'time');
      return goTo({ ...state, dateISO: action.dateISO, time: null }, 'time');

    case 'SELECT_TIME':
      return goTo({ ...state, time: action.time }, 'confirm');

    case 'GO_TO_STEP':
      return goTo(state, action.step);

    case 'GO_BACK': {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx <= 0) return state;
      return goTo(state, STEP_ORDER[idx - 1]);
    }

    case 'CONFIRM':
      return { ...state, confirmed: true };

    case 'RESET':
      return initialBookingState;

    default:
      return state;
  }
}
