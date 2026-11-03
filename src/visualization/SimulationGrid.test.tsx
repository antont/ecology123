import { describe, it, expect, beforeAll } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SimulationGrid } from './SimulationGrid'
import { runHeadless } from '../sim/analysis'
import { defaultConfig } from '../sim'

beforeAll(() => {
  // jsdom has no canvas; the component must cope with a missing 2D context
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
})

const stat = (name: string) => screen.getByTestId(`stat-${name}`).textContent
const click = (label: string, times = 1) => {
  for (let i = 0; i < times; i++) fireEvent.click(screen.getByRole('button', { name: label }))
}
const typeSeed = (value: string) => fireEvent.change(screen.getByLabelText('Seed'), { target: { value } })

describe('SimulationGrid', () => {
  it('Step advances the step counter', () => {
    render(<SimulationGrid cellSize={2} />)
    expect(stat('step')).toBe('0')
    click('Step')
    expect(stat('step')).toBe('1')
  })

  it('Reset with a seed replays that run exactly', () => {
    render(<SimulationGrid cellSize={2} />)
    typeSeed('42')
    click('Reset')
    click('Step', 5)
    const expected = runHeadless(defaultConfig, 42, 5)[4]
    expect(stat('step')).toBe('5')
    expect(stat('sheep')).toBe(String(expected.sheep))
    expect(stat('wolves')).toBe(String(expected.wolves))
    expect(stat('grass')).toBe(String(Math.round(expected.grass)))
  })

  it('flags an invalid seed and keeps the previous one on Reset', () => {
    render(<SimulationGrid cellSize={2} />)
    typeSeed('42')
    click('Reset')
    typeSeed('abc')
    expect(screen.getByLabelText('Seed')).toHaveAttribute('aria-invalid', 'true')
    click('Reset')
    click('Step', 5)
    expect(stat('sheep')).toBe(String(runHeadless(defaultConfig, 42, 5)[4].sheep))
    expect(screen.getByLabelText('Seed')).toHaveValue('42')
  })

  it('New random seed starts a different run', () => {
    render(<SimulationGrid cellSize={2} />)
    typeSeed('42')
    click('Reset')
    click('Step')
    click('New random seed')
    expect(screen.getByLabelText('Seed')).not.toHaveValue('42')
    expect(stat('step')).toBe('0')
  })

  it('Play toggles to Pause and back', () => {
    render(<SimulationGrid cellSize={2} />)
    click('Play')
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    click('Pause')
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })
})
