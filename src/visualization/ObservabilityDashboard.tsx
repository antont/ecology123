/**
 * ObservabilityDashboard provides detailed insights into ecosystem health,
 * population trends, alerts, and extinction analysis for debugging and learning.
 */

import React from 'react'
import { PopulationHealth, EcosystemAlert, ExtinctionAnalysis, OscillationAnalysis } from '../simulation/types/SimulationTypes'

interface ObservabilityDashboardProps {
  populationHealth: PopulationHealth[]
  alerts: EcosystemAlert[]
  extinctionAnalysis: ExtinctionAnalysis | null
  oscillationAnalysis: OscillationAnalysis
  isVisible: boolean
  onToggle: () => void
}

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  populationHealth,
  alerts,
  extinctionAnalysis,
  oscillationAnalysis,
  isVisible,
  onToggle
}) => {
  const getSeverityColor = (severity: EcosystemAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: PopulationHealth['trend']) => {
    switch (trend) {
      case 'increasing': return '📈'
      case 'stable': return '➡️'
      case 'declining': return '📉'
      case 'extinct': return '💀'
      default: return '❓'
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-50"
      >
        🔍 Show Analysis
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">🔬 Ecological Analysis Dashboard</h2>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Population Health */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🏥 Population Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {populationHealth.map((health) => (
                <div key={health.species} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium capitalize">{health.species}</h4>
                    <span className="text-lg">{getTrendIcon(health.trend)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Population:</span>
                      <span className="font-medium">{health.currentCount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Health Score:</span>
                      <span className={`font-medium ${getHealthColor(health.healthScore)}`}>
                        {health.healthScore.toFixed(0)}/100
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trend:</span>
                      <span className="text-sm capitalize">{health.trend}</span>
                    </div>
                    
                    {health.timeToExtinction && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Extinction in:</span>
                        <span className="text-sm text-red-600 font-medium">
                          ~{health.timeToExtinction} steps
                        </span>
                      </div>
                    )}
                    
                    {health.riskFactors.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Risk Factors:</span>
                        <ul className="text-xs text-red-600 mt-1">
                          {health.riskFactors.map((factor, i) => (
                            <li key={i}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🚨 Active Alerts</h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{alert.species}</span>
                          <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">Step {alert.step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Extinction Analysis */}
          {extinctionAnalysis && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                💀 Extinction Analysis: {extinctionAnalysis.species}
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Basic Info</h4>
                    <div className="space-y-1 text-sm">
                      <div>Extinction Step: <span className="font-medium">{extinctionAnalysis.step}</span></div>
                      <div>Last Population: <span className="font-medium">{extinctionAnalysis.lastPopulation}</span></div>
                      <div>Confidence: <span className="font-medium">{(extinctionAnalysis.causeAnalysis.confidence * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Environmental Context</h4>
                    <div className="space-y-1 text-sm">
                      <div>Grass Available: <span className="font-medium">{extinctionAnalysis.environmentalContext.grassAvailability.toLocaleString()}</span></div>
                      {extinctionAnalysis.environmentalContext.preyAvailability !== undefined && (
                        <div>Prey Available: <span className="font-medium">{extinctionAnalysis.environmentalContext.preyAvailability}</span></div>
                      )}
                      <div>Competition Level: <span className="font-medium">{(extinctionAnalysis.environmentalContext.competitionLevel * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">🎯 Primary Cause</h4>
                    <p className="text-sm bg-white p-2 rounded border">
                      {extinctionAnalysis.causeAnalysis.primaryCause}
                    </p>
                  </div>

                  {extinctionAnalysis.causeAnalysis.contributingFactors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">🔍 Contributing Factors</h4>
                      <ul className="text-sm space-y-1">
                        {extinctionAnalysis.causeAnalysis.contributingFactors.map((factor, i) => (
                          <li key={i} className="bg-white p-2 rounded border">
                            • {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-red-800 mb-2">💡 Recommendation</h4>
                    <p className="text-sm bg-white p-2 rounded border">
                      {extinctionAnalysis.causeAnalysis.recommendation}
                    </p>
                  </div>

                  {extinctionAnalysis.causeAnalysis.preventionStrategy && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">🛡️ Prevention Strategy</h4>
                      <p className="text-sm bg-white p-2 rounded border">
                        {extinctionAnalysis.causeAnalysis.preventionStrategy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Oscillation Analysis */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🌊 Predator-Prey Oscillations</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Oscillation Metrics</h4>
                  <div className="space-y-1 text-sm">
                    <div>Total Cycles: <span className="font-medium">{oscillationAnalysis.totalCycles}</span></div>
                    <div>Avg Duration: <span className="font-medium">{oscillationAnalysis.averageCycleDuration.toFixed(1)} steps</span></div>
                    <div>Health: <span className={`font-medium ${
                      oscillationAnalysis.oscillationHealth === 'healthy' ? 'text-green-600' :
                      oscillationAnalysis.oscillationHealth === 'damped' ? 'text-yellow-600' :
                      oscillationAnalysis.oscillationHealth === 'chaotic' ? 'text-orange-600' : 'text-red-600'
                    }`}>{oscillationAnalysis.oscillationHealth}</span></div>
                    <div>Stability Score: <span className="font-medium">{oscillationAnalysis.stabilityScore}/100</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Ecological Dynamics</h4>
                  <div className="space-y-1 text-sm">
                    <div>Near-Extinction Recoveries: <span className="font-medium text-green-600">{oscillationAnalysis.nearExtinctionRecoveries}</span></div>
                    <div>Overgrowth Corrections: <span className="font-medium text-orange-600">{oscillationAnalysis.overgrowthCorrections}</span></div>
                    <div>Avg Amplitude: <span className="font-medium">{oscillationAnalysis.averageAmplitude.toFixed(0)}</span></div>
                  </div>
                </div>
              </div>

              {oscillationAnalysis.cyclesBySpecies && Object.keys(oscillationAnalysis.cyclesBySpecies).length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Cycles by Species</h4>
                  <div className="flex gap-4 text-sm">
                    {Object.entries(oscillationAnalysis.cyclesBySpecies).map(([species, count]) => (
                      <div key={species} className="bg-white px-2 py-1 rounded border">
                        <span className="capitalize">{species}: </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {oscillationAnalysis.recentCycles.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Recent Oscillation Cycles</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {oscillationAnalysis.recentCycles.slice(-5).map((cycle, i) => (
                      <div key={i} className="bg-white p-2 rounded border text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium capitalize">{cycle.species}</span>
                            <span className={`ml-2 px-1 rounded text-xs ${
                              cycle.cycleType === 'near_extinction_recovery' ? 'bg-green-100 text-green-700' :
                              cycle.cycleType === 'growth_to_decline' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {cycle.cycleType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-right text-gray-500">
                            <div>{cycle.duration} steps</div>
                            <div>±{cycle.amplitude}</div>
                          </div>
                        </div>
                        {cycle.triggerFactor && (
                          <div className="mt-1 text-gray-600 italic">
                            {cycle.triggerFactor}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Help Section */}
          <section className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Understanding the Analysis</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Health Score:</strong> Combines population stability, sustainability, and trend (0-100)</p>
              <p><strong>Trend:</strong> Recent population direction based on last 10 steps</p>
              <p><strong>Risk Factors:</strong> Current threats to population survival</p>
              <p><strong>Alerts:</strong> Real-time warnings about critical ecosystem events</p>
              <p><strong>Extinction Analysis:</strong> Detailed investigation when a species goes extinct</p>
              <p><strong>Oscillations:</strong> Predator-prey cycles showing ecosystem health and stability</p>
              <p><strong>Near-Extinction Recovery:</strong> Species bouncing back from very low populations (&lt;10)</p>
              <p><strong>Overgrowth Correction:</strong> Natural population control preventing ecosystem collapse</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

