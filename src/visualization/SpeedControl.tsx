'use client'

import React from 'react'
import { WORLD_CONFIG, SpeedConfig } from '../simulation/config/WorldConfig'
import styles from './SpeedControl.module.css'

interface SpeedControlProps {
  currentSpeed: number
  onSpeedChange: (speed: number) => void
  isRunning: boolean
}

export const SpeedControl: React.FC<SpeedControlProps> = ({
  currentSpeed,
  onSpeedChange,
  isRunning
}) => {
  const speedConfig = WORLD_CONFIG.speed
  const presets = speedConfig.presets

  const handlePresetClick = (speed: number) => {
    onSpeedChange(speed)
  }

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(event.target.value)
    onSpeedChange(speed)
  }

  const getSpeedLabel = (speed: number): string => {
    if (speed < 1) return `${speed.toFixed(1)}x`
    if (speed >= 60) return 'Unlimited'
    return `${Math.round(speed)}x`
  }

  const getSpeedDescription = (speed: number): string => {
    if (speed <= 0.5) return 'Very slow - detailed observation'
    if (speed <= 1) return 'Slow - easy observation'
    if (speed <= 2) return 'Normal - balanced view'
    if (speed <= 5) return 'Fast - quick simulation'
    if (speed <= 10) return 'Very fast - rapid simulation'
    return 'Unlimited - maximum speed'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Speed Control</h3>
        <div className="text-lg font-bold text-blue-600">
          {getSpeedLabel(currentSpeed)}
        </div>
      </div>
      
      {/* Speed Description */}
      <div className="text-xs text-gray-500 mb-4">
        {getSpeedDescription(currentSpeed)}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handlePresetClick(presets.verySlow)}
          className={`px-3 py-2 text-xs rounded transition-colors ${
            Math.abs(currentSpeed - presets.verySlow) < 0.1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={!isRunning}
        >
          Very Slow
        </button>
        <button
          onClick={() => handlePresetClick(presets.slow)}
          className={`px-3 py-2 text-xs rounded transition-colors ${
            Math.abs(currentSpeed - presets.slow) < 0.1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={!isRunning}
        >
          Slow
        </button>
        <button
          onClick={() => handlePresetClick(presets.normal)}
          className={`px-3 py-2 text-xs rounded transition-colors ${
            Math.abs(currentSpeed - presets.normal) < 0.1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={!isRunning}
        >
          Normal
        </button>
        <button
          onClick={() => handlePresetClick(presets.fast)}
          className={`px-3 py-2 text-xs rounded transition-colors ${
            Math.abs(currentSpeed - presets.fast) < 0.1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={!isRunning}
        >
          Fast
        </button>
        <button
          onClick={() => handlePresetClick(presets.veryFast)}
          className={`px-3 py-2 text-xs rounded transition-colors ${
            Math.abs(currentSpeed - presets.veryFast) < 0.1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={!isRunning}
        >
          Very Fast
        </button>
        <button
          onClick={() => handlePresetClick(presets.unlimited)}
          className={`px-3 py-2 text-xs rounded transition-colors ${
            Math.abs(currentSpeed - presets.unlimited) < 0.1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={!isRunning}
        >
          Unlimited
        </button>
      </div>

      {/* Speed Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.1x</span>
          <span>Steps per second</span>
          <span>60x</span>
        </div>
        <input
          type="range"
          min={speedConfig.minSpeed}
          max={speedConfig.maxSpeed}
          step="0.1"
          value={currentSpeed}
          onChange={handleSliderChange}
          disabled={!isRunning}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${styles.slider}`}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              ((currentSpeed - speedConfig.minSpeed) / (speedConfig.maxSpeed - speedConfig.minSpeed)) * 100
            }%, #e5e7eb ${
              ((currentSpeed - speedConfig.minSpeed) / (speedConfig.maxSpeed - speedConfig.minSpeed)) * 100
            }%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Current Speed Details */}
      <div className="mt-3 text-center">
        <div className="text-sm text-gray-500">
          {currentSpeed.toFixed(1)} steps/second
        </div>
      </div>
    </div>
  )
}
