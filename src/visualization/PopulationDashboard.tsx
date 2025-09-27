'use client'

import React from 'react'
import { PopulationChart } from './PopulationChart'

interface PopulationData {
  step: number
  grass: number
  sheep: number
  wolves: number
}

interface PopulationDashboardProps {
  data: PopulationData[]
  currentStats: {
    step: number
    grass: number
    sheep: number
    wolves: number
  }
}

export const PopulationDashboard: React.FC<PopulationDashboardProps> = ({ 
  data, 
  currentStats 
}) => {
  // Calculate some basic metrics
  const totalSteps = data.length
  const maxGrass = Math.max(...data.map(d => d.grass), 0)
  const maxSheep = Math.max(...data.map(d => d.sheep), 0)
  const maxWolves = Math.max(...data.map(d => d.wolves), 0)
  
  const avgGrass = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.grass, 0) / data.length) : 0
  const avgSheep = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.sheep, 0) / data.length) : 0
  const avgWolves = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.wolves, 0) / data.length) : 0

  // Calculate ecosystem health metrics
  const biodiversity = currentStats.sheep > 0 && currentStats.wolves > 0 ? 'High' : 
                      currentStats.sheep > 0 ? 'Medium' : 'Low'
  
  const stability = data.length > 10 ? 
    (() => {
      const recent = data.slice(-10)
      const grassVariance = recent.reduce((sum, d, i) => 
        i > 0 ? sum + Math.abs(d.grass - recent[i-1].grass) : 0, 0) / 9
      return grassVariance < 10 ? 'Stable' : 'Volatile'
    })() : 'Unknown'

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Population Chart */}
      <div className="flex-1">
        <PopulationChart data={data} />
      </div>

      {/* Metrics Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Ecosystem Metrics</h4>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-600">Biodiversity</div>
            <div className={`font-semibold ${
              biodiversity === 'High' ? 'text-green-600' : 
              biodiversity === 'Medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {biodiversity}
            </div>
          </div>
          
          <div>
            <div className="text-gray-600">Stability</div>
            <div className={`font-semibold ${
              stability === 'Stable' ? 'text-green-600' : 
              stability === 'Volatile' ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {stability}
            </div>
          </div>
        </div>
      </div>

      {/* Peak Populations */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Peak Populations</h4>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-green-600">Grass:</span>
            <span className="font-semibold">{maxGrass}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sheep:</span>
            <span className="font-semibold">{maxSheep}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600">Wolves:</span>
            <span className="font-semibold">{maxWolves}</span>
          </div>
        </div>
      </div>

      {/* Average Populations */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Average Populations</h4>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-green-600">Grass:</span>
            <span className="font-semibold">{avgGrass}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sheep:</span>
            <span className="font-semibold">{avgSheep}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600">Wolves:</span>
            <span className="font-semibold">{avgWolves}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
