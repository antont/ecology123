import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PopulationChart } from './PopulationChart'

// Mock Recharts components to avoid complex rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, name }: any) => (
    <div data-testid={`line-${name}`} data-stroke={stroke} data-key={dataKey} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('PopulationChart', () => {
  const mockData = [
    { step: 0, grass: 100, sheep: 20, wolves: 5 },
    { step: 1, grass: 105, sheep: 18, wolves: 5 },
    { step: 2, grass: 110, sheep: 15, wolves: 4 },
    { step: 3, grass: 115, sheep: 12, wolves: 4 },
    { step: 4, grass: 120, sheep: 10, wolves: 3 },
  ]

  it('should render chart with provided data', () => {
    render(<PopulationChart data={mockData} />)
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByText('Population Trends')).toBeInTheDocument()
    expect(screen.getByText('Real-time ecosystem dynamics')).toBeInTheDocument()
  })

  it('should display correct data points count', () => {
    render(<PopulationChart data={mockData} />)
    
    expect(screen.getByText('Showing last 5 steps')).toBeInTheDocument()
    expect(screen.getByText('Total: 5 steps')).toBeInTheDocument()
  })

  it('should limit data points when maxDataPoints is specified', () => {
    const largeData = Array.from({ length: 150 }, (_, i) => ({
      step: i,
      grass: 100 + i,
      sheep: 20 - Math.floor(i / 10),
      wolves: 5 - Math.floor(i / 20)
    }))

    render(<PopulationChart data={largeData} maxDataPoints={50} />)
    
    expect(screen.getByText('Showing last 50 steps')).toBeInTheDocument()
    expect(screen.getByText('Total: 150 steps')).toBeInTheDocument()
  })

  it('should render all three species lines', () => {
    render(<PopulationChart data={mockData} />)
    
    expect(screen.getByTestId('line-grass')).toBeInTheDocument()
    expect(screen.getByTestId('line-sheep')).toBeInTheDocument()
    expect(screen.getByTestId('line-wolves')).toBeInTheDocument()
  })

  it('should have correct line colors', () => {
    render(<PopulationChart data={mockData} />)
    
    const grassLine = screen.getByTestId('line-grass')
    const sheepLine = screen.getByTestId('line-sheep')
    const wolvesLine = screen.getByTestId('line-wolves')
    
    expect(grassLine).toHaveAttribute('data-stroke', '#22c55e')
    expect(sheepLine).toHaveAttribute('data-stroke', '#6b7280')
    expect(wolvesLine).toHaveAttribute('data-stroke', '#ef4444')
  })

  it('should handle empty data gracefully', () => {
    render(<PopulationChart data={[]} />)
    
    expect(screen.getByText('Showing last 0 steps')).toBeInTheDocument()
    expect(screen.getByText('Total: 0 steps')).toBeInTheDocument()
  })

  it('should pass correct data to chart component', () => {
    render(<PopulationChart data={mockData} />)
    
    const chartElement = screen.getByTestId('line-chart')
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '[]')
    
    expect(chartData).toHaveLength(5)
    expect(chartData[0]).toEqual({ step: 0, grass: 100, sheep: 20, wolves: 5 })
    expect(chartData[4]).toEqual({ step: 4, grass: 120, sheep: 10, wolves: 3 })
  })

  it('should render chart controls', () => {
    render(<PopulationChart data={mockData} />)
    
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('legend')).toBeInTheDocument()
  })
})
