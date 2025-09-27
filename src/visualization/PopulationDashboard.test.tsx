import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PopulationDashboard } from './PopulationDashboard'

// Mock PopulationChart component
vi.mock('./PopulationChart', () => ({
  PopulationChart: ({ data, currentStats }: any) => (
    <div data-testid="population-chart" data-points={data.length}>
      Chart with {data.length} data points
    </div>
  ),
}))

describe('PopulationDashboard', () => {
  const mockData = [
    { step: 0, grass: 100, sheep: 20, wolves: 5 },
    { step: 1, grass: 105, sheep: 18, wolves: 5 },
    { step: 2, grass: 110, sheep: 15, wolves: 4 },
    { step: 3, grass: 115, sheep: 12, wolves: 4 },
    { step: 4, grass: 120, sheep: 10, wolves: 3 },
  ]

  const mockCurrentStats = {
    step: 4,
    grass: 120,
    sheep: 10,
    wolves: 3
  }

  it('should render population chart with correct data', () => {
    render(<PopulationDashboard data={mockData} currentStats={mockCurrentStats} />)
    
    expect(screen.getByTestId('population-chart')).toBeInTheDocument()
    expect(screen.getByTestId('population-chart')).toHaveAttribute('data-points', '5')
  })

  it('should calculate and display ecosystem metrics correctly', () => {
    render(<PopulationDashboard data={mockData} currentStats={mockCurrentStats} />)
    
    // Should show "High" biodiversity since all species are present
    expect(screen.getByText('Biodiversity')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    
    // Should show "Unknown" stability (requires >10 data points)
    expect(screen.getByText('Stability')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('should display low biodiversity when species are missing', () => {
    const statsWithMissingSpecies = {
      step: 4,
      grass: 120,
      sheep: 0, // No sheep
      wolves: 3
    }

    render(<PopulationDashboard data={mockData} currentStats={statsWithMissingSpecies} />)
    
    expect(screen.getByText('Biodiversity')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('should calculate peak populations correctly', () => {
    render(<PopulationDashboard data={mockData} currentStats={mockCurrentStats} />)
    
    expect(screen.getByText('Peak Populations')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument() // Max grass
    expect(screen.getByText('20')).toBeInTheDocument() // Max sheep
    expect(screen.getByText('5')).toBeInTheDocument() // Max wolves
  })

  it('should calculate average populations correctly', () => {
    render(<PopulationDashboard data={mockData} currentStats={mockCurrentStats} />)
    
    expect(screen.getByText('Average Populations')).toBeInTheDocument()
    // Average grass: (100+105+110+115+120)/5 = 110
    expect(screen.getByText('110')).toBeInTheDocument()
    // Average sheep: (20+18+15+12+10)/5 = 15
    expect(screen.getByText('15')).toBeInTheDocument()
    // Average wolves: (5+5+4+4+3)/5 = 4.2 ≈ 4
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should handle empty data gracefully', () => {
    render(<PopulationDashboard data={[]} currentStats={mockCurrentStats} />)
    
    expect(screen.getByTestId('population-chart')).toHaveAttribute('data-points', '0')
    expect(screen.getByText('Peak Populations')).toBeInTheDocument()
    expect(screen.getByText('Average Populations')).toBeInTheDocument()
  })

  it('should display correct color coding for metrics', () => {
    render(<PopulationDashboard data={mockData} currentStats={mockCurrentStats} />)
    
    const biodiversityElement = screen.getByText('High')
    const stabilityElement = screen.getByText('Unknown')
    
    expect(biodiversityElement).toHaveClass('text-green-600')
    expect(stabilityElement).toHaveClass('text-gray-600')
  })

  it('should show stable stability for consistent data', () => {
    const stableData = Array.from({ length: 15 }, (_, i) => ({
      step: i,
      grass: 100 + Math.random() * 5, // Low variance
      sheep: 20,
      wolves: 5
    }))

    render(<PopulationDashboard data={stableData} currentStats={mockCurrentStats} />)
    
    expect(screen.getByText('Stability')).toBeInTheDocument()
    expect(screen.getByText('Stable')).toBeInTheDocument()
  })

  it('should show volatile stability for highly variable data', () => {
    const volatileData = Array.from({ length: 15 }, (_, i) => ({
      step: i,
      grass: 100 + (i % 2 === 0 ? 100 : -80), // Highly variable grass
      sheep: 20,
      wolves: 5
    }))

    render(<PopulationDashboard data={volatileData} currentStats={mockCurrentStats} />)
    
    expect(screen.getByText('Stability')).toBeInTheDocument()
    expect(screen.getByText('Volatile')).toBeInTheDocument()
  })

  it('should render all metric sections', () => {
    render(<PopulationDashboard data={mockData} currentStats={mockCurrentStats} />)
    
    expect(screen.getByText('Ecosystem Metrics')).toBeInTheDocument()
    expect(screen.getByText('Peak Populations')).toBeInTheDocument()
    expect(screen.getByText('Average Populations')).toBeInTheDocument()
  })
})
