export const DEFAULT_STROKE_OPTIONS = {
  size: 16,
  smoothing: 0.5,
  thinning: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: {
    taper: 0,
    cap: true,
  },
  end: {
    taper: 0,
    cap: true,
  },
};
