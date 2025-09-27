'use client'

import React, { useEffect, useRef, useState } from 'react'
import { SimulationEngine } from '../simulation/engine/SimulationEngine'
import { WORLD_CONFIG } from '../simulation/config/WorldConfig'
import { WorldCell, Grass, Sheep, Wolf } from '../simulation/types/SimulationTypes'
import styles from './SpeedControl.module.css'

interface SimulationGridProps {
  width?: number
  height?: number
  cellSize?: number
}

export const SimulationGrid: React.FC<SimulationGridProps> = ({
  width = 50,
  height = 50,
  cellSize = 12
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastStepTime = useRef<number>(0)
  
  const [simulation, setSimulation] = useState<SimulationEngine | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(WORLD_CONFIG.speed.defaultSpeed)
  const [stats, setStats] = useState({
    step: 0,
    grass: 0,
    sheep: 0,
    wolves: 0
  })

  useEffect(() => {
    // Initialize simulation
    const sim = new SimulationEngine(WORLD_CONFIG)
    setSimulation(sim)
    
    // Initialize world with some organisms
    initializeWorld(sim)
    
    return () => {
      sim.destroy()
    }
  }, [])

  const initializeWorld = (sim: SimulationEngine) => {
    const world = sim.getWorld()
    
    // Add some grass
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      
      const grass: Grass = {
        id: `grass-${i}`,
        x,
        y,
        energy: 0.8,
        age: 0,
        isAlive: true,
        density: Math.random() * 0.8 + 0.2,
        growthStage: 'mature',
        lastGrazed: 0,
        seasonalGrowth: 1.0
      }
      
      world.setCellContent(x, y, { grass })
    }
    
    // Add some sheep
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      
      const sheep: Sheep = {
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.8, // Higher energy to prevent immediate death
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: 'north' as any,
        grazingEfficiency: 0.8
      }
      
      world.setCellContent(x, y, { sheep })
    }
    
    // Add some wolves
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      
      const wolf: Wolf = {
        id: `wolf-${i}`,
        x,
        y,
        energy: 0.9,
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: 'north' as any,
        huntingTarget: undefined
      }
      
      world.setCellContent(x, y, { wolf })
    }
    
    // Update statistics after initialization
    world.updateStatistics()
    updateStats(sim)
  }

  const drawGrid = () => {
    if (!simulation || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const world = simulation.getWorld()
    const cells = world.getCells()
    
    // Clear canvas
    ctx.fillStyle = '#2d3748' // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 0.5
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const cell = cells[x][y]
        const pixelX = x * cellSize
        const pixelY = y * cellSize
        
        // Draw cell background
        if (cell.grass) {
          const intensity = Math.floor(cell.grass.density * 255)
          ctx.fillStyle = `rgb(0, ${intensity}, 0)` // Green for grass
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize)
        }
        
        // Draw organisms
        if (cell.sheep) {
          ctx.fillStyle = '#ffffff' // White for sheep
          ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2)
        }
        
        if (cell.wolf) {
          ctx.fillStyle = '#8b0000' // Dark red for wolves
          ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2)
        }
        
        // Draw grid lines
        ctx.strokeRect(pixelX, pixelY, cellSize, cellSize)
      }
    }
  }

  const updateStats = (sim: SimulationEngine) => {
    const worldStats = sim.getStatistics()
    setStats({
      step: sim.getCurrentStep(),
      grass: worldStats.grassCount,
      sheep: worldStats.sheepCount,
      wolves: worldStats.wolfCount
    })
  }

  const stepSimulation = () => {
    if (!simulation) return
    
    simulation.step()
    drawGrid()
    updateStats(simulation)
  }

  const toggleSimulation = () => {
    if (!simulation) return
    
    if (isRunning) {
      simulation.pause()
      setIsRunning(false)
    } else {
      simulation.start()
      setIsRunning(true)
    }
  }

  // Animation loop that runs continuously with speed control
  useEffect(() => {
    if (!simulation) return

    const animate = (currentTime: number) => {
      if (simulation.isRunning()) {
        // Calculate time-based stepping based on speed
        const timeSinceLastStep = currentTime - lastStepTime.current
        const stepInterval = 1000 / speed // Convert steps per second to milliseconds
        
        if (timeSinceLastStep >= stepInterval) {
          if (!simulation.isPaused()) {
            simulation.step()
            lastStepTime.current = currentTime
          }
        }
        
        // Always update display (smooth animation)
        drawGrid()
        updateStats(simulation)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate)
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [simulation, speed])

  const resetSimulation = () => {
    if (!simulation) return
    
    simulation.reset()
    initializeWorld(simulation)
    drawGrid()
    updateStats(simulation)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    // Reset timing to avoid immediate step after speed change
    lastStepTime.current = performance.now()
  }

  useEffect(() => {
    drawGrid()
  }, [simulation])

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Compact Statistics at the top */}
      <div className="flex-shrink-0 mb-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-100 p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">Step</div>
            <div className="text-lg font-bold">{stats.step}</div>
          </div>
          <div className="bg-green-100 p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">Grass</div>
            <div className="text-lg font-bold text-green-600">{stats.grass}</div>
          </div>
          <div className="bg-white p-2 rounded shadow-sm border">
            <div className="text-xs text-gray-600">Sheep</div>
            <div className="text-lg font-bold text-gray-700">{stats.sheep}</div>
          </div>
          <div className="bg-red-100 p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">Wolves</div>
            <div className="text-lg font-bold text-red-600">{stats.wolves}</div>
          </div>
        </div>
      </div>

      {/* Scalable Simulation Grid */}
      <div className="flex-1 flex items-center justify-center mb-3 min-h-0">
        <div className="relative max-w-full max-h-full">
          <canvas
            ref={canvasRef}
            width={width * cellSize}
            height={height * cellSize}
            className="border border-gray-300 rounded shadow-lg max-w-full max-h-full object-contain"
            style={{ 
              imageRendering: 'pixelated',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>

      {/* Compact Legend */}
      <div className="flex-shrink-0 mb-3 text-xs text-gray-600 text-center">
        <span className="font-semibold">Legend:</span>
        <span className="ml-2">🟢 Grass (darker = denser) • ⚪ Sheep • 🔴 Wolves</span>
      </div>

      {/* Compact Integrated Control Panel */}
      <div className="flex-shrink-0 bg-white rounded shadow border border-gray-200 p-2">
        <div className="flex items-center justify-between gap-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSimulation}
              className={`px-2 py-1 rounded font-semibold text-white text-xs transition-colors ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRunning ? '⏸️' : '▶️'}
            </button>
            
            <button
              onClick={stepSimulation}
              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded text-xs transition-colors"
            >
              ⏭️
            </button>
            
            <button
              onClick={resetSimulation}
              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded text-xs transition-colors"
            >
              🔄
            </button>
          </div>

          {/* Speed Control - Ultra Compact */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Speed:</span>
            <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
              {speed < 1 ? `${speed.toFixed(1)}x` : speed >= 60 ? '∞' : `${Math.round(speed)}x`}
            </span>
            
            <input
              type="range"
              min={WORLD_CONFIG.speed.minSpeed}
              max={WORLD_CONFIG.speed.maxSpeed}
              step="0.1"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              disabled={!isRunning}
              className={`flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer ${styles.slider}`}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  ((speed - WORLD_CONFIG.speed.minSpeed) / (WORLD_CONFIG.speed.maxSpeed - WORLD_CONFIG.speed.minSpeed)) * 100
                }%, #e5e7eb ${
                  ((speed - WORLD_CONFIG.speed.minSpeed) / (WORLD_CONFIG.speed.maxSpeed - WORLD_CONFIG.speed.minSpeed)) * 100
                }%, #e5e7eb 100%)`
              }}
            />
            
            <div className="text-xs text-gray-500 whitespace-nowrap">
              {speed.toFixed(1)}/s
            </div>
          </div>

          {/* Speed Presets - Ultra Compact */}
          <div className="flex gap-0.5">
            {Object.entries(WORLD_CONFIG.speed.presets).map(([name, value]) => (
              <button
                key={name}
                onClick={() => handleSpeedChange(value)}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  Math.abs(speed - value) < 0.1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!isRunning}
                title={`${name === 'verySlow' ? 'Very Slow' :
                        name === 'veryFast' ? 'Very Fast' :
                        name.charAt(0).toUpperCase() + name.slice(1)} (${value}x)`}
              >
                {name === 'verySlow' ? '0.5x' :
                 name === 'slow' ? '1x' :
                 name === 'normal' ? '2x' :
                 name === 'fast' ? '5x' :
                 name === 'veryFast' ? '10x' :
                 name === 'unlimited' ? '∞' : value + 'x'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
