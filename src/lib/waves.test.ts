import { describe, expect, it } from 'vitest'
import { sampleGerstnerWaves, waveFromMarine, wavesFromMarine } from './waves'

describe('marine wave translation', () => {
  it('turns a forecast direction-from into a physical travel direction', () => {
    const wave = waveFromMarine('Swell', 2, 90, 8)
    expect(wave.direction).toBe(270)
    expect(wave.wavelength).toBeCloseTo(99.89, 1)
    expect(wave.steepness).toBeGreaterThan(0)
    expect(wave.steepness).toBeLessThanOrEqual(0.78)
  })

  it('creates three stable Gerstner components from one forecast snapshot', () => {
    const waves = wavesFromMarine({ time: '2026-09-03T12:00', waveHeight: 1.8, waveDirection: 320, wavePeriod: 7, swellHeight: 1.2, swellDirection: 310, swellPeriod: 10, windWaveHeight: 0.6, windWaveDirection: 280, windWavePeriod: 4 })
    expect(waves).toHaveLength(3)
    expect(sampleGerstnerWaves(0, 0, 1, waves).y).toBeTypeOf('number')
  })
})
