'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PopulationData {
  step: number
  grass: number
  sheep: number
  wolves: number
}

interface PopulationChartProps {
  data: PopulationData[]
  maxDataPoints?: number
}

export const PopulationChart: React.FC<PopulationChartProps> = ({ 
  data, 
  maxDataPoints = 100 
}) => {
  // Keep only the most recent data points for performance
  const displayData = data.slice(-maxDataPoints)

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 h-full">
      <div className="mb-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-0">Population Trends</h3>
        <p className="text-sm text-gray-600">Real-time ecosystem dynamics</p>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 5, right: 20, left: 20, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="step" 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => `Step ${value}`}
            />
            {/* Left Y-axis for Grass (high values) */}
            <YAxis 
              yAxisId="grass"
              stroke="#22c55e"
              fontSize={12}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            {/* Right Y-axis for Animals (low values) */}
            <YAxis 
              yAxisId="animals"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.toString()}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => [
                name === 'grass' ? `${Math.round(value / 1000)}k` : value, 
                name === 'grass' ? 'Grass' : 
                name === 'sheep' ? 'Sheep' : 
                name === 'wolves' ? 'Wolves' : name
              ]}
              labelFormatter={(label) => `Step ${label}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => 
                value === 'grass' ? 'Grass (left axis)' : 
                value === 'sheep' ? 'Sheep (right axis)' : 
                value === 'wolves' ? 'Wolves (right axis)' : value
              }
            />
            <Line 
              type="monotone" 
              dataKey="grass" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={false}
              name="grass"
              yAxisId="grass"
            />
            <Line 
              type="monotone" 
              dataKey="sheep" 
              stroke="#6b7280" 
              strokeWidth={2}
              dot={false}
              name="sheep"
              yAxisId="animals"
            />
            <Line 
              type="monotone" 
              dataKey="wolves" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="wolves"
              yAxisId="animals"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Showing last {displayData.length} steps</span>
          <span>Total: {data.length} steps</span>
        </div>
      </div>
    </div>
  )
}
