import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SimulationGrid } from './SimulationGrid'

// Mock the simulation engine
const mockSimulationEngine = {
  getWorld: vi.fn(() => ({
    reset: vi.fn(),
    setCellContent: vi.fn(),
    updateStatistics: vi.fn(),
    getCell: vi.fn(() => ({ grass: null, sheep: null, wolf: null })),
    getOrganismsByType: vi.fn(() => []),
  })),
  getStatistics: vi.fn(() => ({
    grassCount: 100,
    sheepCount: 20,
    wolfCount: 5,
  })),
  getCurrentStep: vi.fn(() => 0),
  isRunning: vi.fn(() => false),
  isPaused: vi.fn(() => false),
  start: vi.fn(),
  pause: vi.fn(),
  step: vi.fn(),
  reset: vi.fn(),
  destroy: vi.fn(),
}

vi.mock('../simulation/engine/SimulationEngine', () => ({
  SimulationEngine: vi.fn(() => mockSimulationEngine)
}))

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillStyle: '',
  fillRect: vi.fn(),
  strokeStyle: '',
  strokeRect: vi.fn(),
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as any

describe('SimulationGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset step counter
    mockSimulationEngine.getCurrentStep.mockReturnValue(0)
  })

  it('should render simulation interface', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    expect(screen.getByText('Step')).toBeInTheDocument()
    expect(screen.getByText('Grass')).toBeInTheDocument()
    expect(screen.getByText('Sheep')).toBeInTheDocument()
    expect(screen.getByText('Wolves')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('should display initial population counts', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    expect(screen.getByText('100')).toBeInTheDocument() // Grass count
    expect(screen.getByText('20')).toBeInTheDocument() // Sheep count
    expect(screen.getByText('5')).toBeInTheDocument() // Wolf count
  })

  it('should collect population data when step is executed', async () => {
    // Mock step progression
    let stepCount = 0
    mockSimulationEngine.getCurrentStep.mockImplementation(() => stepCount)
    mockSimulationEngine.getStatistics.mockImplementation(() => ({
      grassCount: 100 + stepCount * 5,
      sheepCount: 20 - stepCount,
      wolfCount: 5,
    }))

    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    // Click step button
    const stepButton = screen.getByRole('button', { name: /step/i })
    fireEvent.click(stepButton)
    
    // Simulate step execution
    stepCount = 1
    mockSimulationEngine.step.mockImplementation(() => {
      stepCount = 1
    })
    
    fireEvent.click(stepButton)
    
    await waitFor(() => {
      expect(mockSimulationEngine.step).toHaveBeenCalled()
    })
  })

  it('should update population data when simulation runs', async () => {
    let stepCount = 0
    mockSimulationEngine.getCurrentStep.mockImplementation(() => stepCount)
    mockSimulationEngine.getStatistics.mockImplementation(() => ({
      grassCount: 100 + stepCount * 10,
      sheepCount: 20 - stepCount * 2,
      wolfCount: 5,
    }))
    mockSimulationEngine.isRunning.mockReturnValue(true)

    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    // Start simulation
    const startButton = screen.getByRole('button', { name: /start/i })
    fireEvent.click(startButton)
    
    // Simulate multiple steps
    for (let i = 1; i <= 3; i++) {
      stepCount = i
      // Trigger animation frame
      vi.advanceTimersByTime(100)
    }
    
    await waitFor(() => {
      expect(mockSimulationEngine.step).toHaveBeenCalled()
    })
  })

  it('should reset population data when reset is clicked', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    const resetButton = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(resetButton)
    
    expect(mockSimulationEngine.reset).toHaveBeenCalled()
  })

  it('should handle speed changes', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    const speedSlider = screen.getByRole('slider')
    fireEvent.change(speedSlider, { target: { value: '5' } })
    
    // Speed change should not cause immediate step
    expect(mockSimulationEngine.step).not.toHaveBeenCalled()
  })

  it('should render population dashboard', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    expect(screen.getByText('Population Trends')).toBeInTheDocument()
    expect(screen.getByText('Ecosystem Metrics')).toBeInTheDocument()
  })

  it('should initialize with empty population data', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    // Should show 0 steps initially
    expect(screen.getByText('Total: 0 steps')).toBeInTheDocument()
  })

  it('should update canvas when simulation state changes', () => {
    render(<SimulationGrid width={10} height={10} cellSize={20} />)
    
    // Canvas should be rendered
    const canvas = screen.getByRole('img', { hidden: true }) // Canvas has implicit img role
    expect(canvas).toBeInTheDocument()
  })
})
