/** Display and playback settings; nothing here affects the model. */
export const uiConfig = {
  speed: {
    min: 0.5,
    max: 60,
    default: 10,
    presets: { '1x': 1, '5x': 5, '10x': 10, '30x': 30, '60x': 60 } as Record<string, number>,
  },
  /** Cap on steps run in one animation frame, so a hidden tab never tries to catch up. */
  maxStepsPerFrame: 10,
  /** Population history kept for the chart. */
  historyCap: 1000,
  /** Steps shown in the chart: several ~135-step cycles. */
  chartWindow: 600,
  /** Target canvas size in pixels. */
  displaySize: 600,
}
