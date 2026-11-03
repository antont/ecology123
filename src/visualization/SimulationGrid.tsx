'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createSimulation, defaultConfig, type Simulation, type StepStats } from '../sim'
import { appendCapped, parseSeed, randomSeed, stepsDue } from './loop'
import { uiConfig } from './uiConfig'
import styles from './SpeedControl.module.css'
import { PopulationDashboard } from './PopulationDashboard'

interface SimulationGridProps {
  cellSize?: number
}

interface PopulationPoint {
  step: number
  grass: number
  sheep: number
  wolves: number
}

const toPoint = (s: StepStats): PopulationPoint => ({
  step: s.step, grass: Math.round(s.grass), sheep: s.sheep, wolves: s.wolves,
})

function draw(canvas: HTMLCanvasElement | null, sim: Simulation, cellSize: number) {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  for (let y = 0; y < sim.height; y++) {
    for (let x = 0; x < sim.width; x++) {
      const g = sim.grass[y * sim.width + x]
      ctx.fillStyle = `rgb(20, ${Math.round(40 + 180 * g)}, 20)`
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    }
  }
  const inset = cellSize >= 4 ? 1 : 0
  ctx.fillStyle = '#ffffff'
  for (const s of sim.sheep) ctx.fillRect(s.x * cellSize + inset, s.y * cellSize + inset, cellSize - 2 * inset, cellSize - 2 * inset)
  ctx.fillStyle = '#8b0000'
  for (const w of sim.wolves) ctx.fillRect(w.x * cellSize + inset, w.y * cellSize + inset, cellSize - 2 * inset, cellSize - 2 * inset)
  if (cellSize >= 6) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= sim.width; x++) {
      ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, sim.height * cellSize); ctx.stroke()
    }
    for (let y = 0; y <= sim.height; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(sim.width * cellSize, y * cellSize); ctx.stroke()
    }
  }
}

export const SimulationGrid: React.FC<SimulationGridProps> = ({ cellSize = 7 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Simulation | null>(null)

  const [seed, setSeed] = useState<number | null>(null)
  const [seedInput, setSeedInput] = useState('')
  const [stats, setStats] = useState<StepStats | null>(null)
  const [history, setHistory] = useState<PopulationPoint[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(uiConfig.speed.default)

  const start = useCallback((nextSeed: number) => {
    const sim = createSimulation(defaultConfig, nextSeed)
    simRef.current = sim
    setSeed(nextSeed)
    setSeedInput(String(nextSeed))
    setStats(sim.stats)
    setHistory([toPoint(sim.stats)])
  }, [])

  const advance = useCallback((steps: number) => {
    const sim = simRef.current
    if (!sim || steps <= 0) return
    const points: PopulationPoint[] = []
    for (let i = 0; i < steps; i++) {
      sim.step()
      points.push(toPoint(sim.stats))
    }
    setStats(sim.stats)
    setHistory(prev => points.reduce((acc, p) => appendCapped(acc, p, uiConfig.historyCap), prev))
  }, [])

  // Seed on the client only, so server and client renders agree
  useEffect(() => { start(randomSeed()) }, [start])

  useEffect(() => {
    if (simRef.current) draw(canvasRef.current, simRef.current, cellSize)
  }, [stats, cellSize])

  useEffect(() => {
    if (!running) return
    const interval = 1000 / speed
    let frame = 0
    let last = performance.now()
    let owed = 0
    const tick = (now: number) => {
      owed += now - last
      last = now
      const steps = stepsDue(owed, speed, uiConfig.maxStepsPerFrame)
      // Drop any backlog beyond one step, e.g. after the tab was hidden
      owed = Math.min(owed - steps * interval, interval)
      advance(steps)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, speed, advance])

  const parsedSeed = parseSeed(seedInput)
  const reset = () => {
    const next = parsedSeed ?? seed
    if (next !== null) start(next)
  }

  const width = defaultConfig.width
  const height = defaultConfig.height
  const current = stats ?? { step: 0, grass: 0, sheep: 0, wolves: 0 }
  const point = { step: current.step, grass: Math.round(current.grass), sheep: current.sheep, wolves: current.wolves }
  const speedPercent = ((speed - uiConfig.speed.min) / (uiConfig.speed.max - uiConfig.speed.min)) * 100

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="bg-gray-100 p-1.5 rounded shadow-sm">
            <div className="text-xs text-gray-600">Step</div>
            <div className="text-sm font-bold" data-testid="stat-step">{point.step}</div>
          </div>
          <div className="bg-green-100 p-1.5 rounded shadow-sm">
            <div className="text-xs text-gray-600">Grass</div>
            <div className="text-sm font-bold text-green-600" data-testid="stat-grass">{point.grass}</div>
          </div>
          <div className="bg-white p-1.5 rounded shadow-sm border">
            <div className="text-xs text-gray-600">Sheep</div>
            <div className="text-sm font-bold text-gray-700" data-testid="stat-sheep">{point.sheep}</div>
          </div>
          <div className="bg-red-100 p-1.5 rounded shadow-sm">
            <div className="text-xs text-gray-600">Wolves</div>
            <div className="text-sm font-bold text-red-600" data-testid="stat-wolves">{point.wolves}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 mb-2 min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="flex-1 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={width * cellSize}
            height={height * cellSize}
            className="border border-gray-300 rounded shadow-lg"
            style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
          />
        </div>
        <div className="w-[500px] flex-shrink-0">
          <PopulationDashboard data={history} currentStats={point} chartWindow={uiConfig.chartWindow} />
        </div>
      </div>

      <div className="flex-shrink-0 mb-2 text-xs text-gray-600 text-center">
        <span className="font-semibold">Legend:</span>
        <span className="ml-2">🟢 Grass (brighter = more) • ⚪ Sheep • 🔴 Wolves</span>
      </div>

      <div className="flex-shrink-0 bg-white rounded shadow border border-gray-200 p-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              aria-label={running ? 'Pause' : 'Play'}
              onClick={() => setRunning(r => !r)}
              className={`px-2 py-1 rounded font-semibold text-white text-xs transition-colors ${
                running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {running ? '⏸️' : '▶️'}
            </button>
            <button
              aria-label="Step"
              onClick={() => advance(1)}
              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded text-xs transition-colors"
            >
              ⏭️
            </button>
            <button
              aria-label="Reset"
              onClick={reset}
              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded text-xs transition-colors"
            >
              🔄
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <label htmlFor="seed" className="font-medium text-gray-700">Seed</label>
            <input
              id="seed"
              value={seedInput}
              onChange={e => setSeedInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') reset() }}
              aria-invalid={parsedSeed === null}
              inputMode="numeric"
              className={`w-28 px-1 py-0.5 border rounded font-mono ${parsedSeed === null ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              aria-label="New random seed"
              onClick={() => start(randomSeed())}
              className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded"
            >
              🎲
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <label htmlFor="speed" className="text-xs font-medium text-gray-700 whitespace-nowrap">Speed</label>
            <input
              id="speed"
              type="range"
              min={uiConfig.speed.min}
              max={uiConfig.speed.max}
              step="0.5"
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className={`flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer ${styles.slider}`}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${speedPercent}%, #e5e7eb ${speedPercent}%, #e5e7eb 100%)`,
              }}
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{speed} steps/s</span>
          </div>

          <div className="flex gap-0.5">
            {Object.entries(uiConfig.speed.presets).map(([name, value]) => (
              <button
                key={name}
                onClick={() => setSpeed(value)}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  speed === value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
