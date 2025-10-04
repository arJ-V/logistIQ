"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAiriaAgents } from "@/hooks/use-airia-agents"
import { AIRIA_AGENTS } from "@/lib/airia-client"

export function AiriaTest() {
  const [testInput, setTestInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    processWithAllAgents,
    processSingleAgent,
    results,
    errors,
    resetState
  } = useAiriaAgents()

  const handleTestAllAgents = async () => {
    if (!testInput.trim()) return
    
    setIsLoading(true)
    try {
      await processWithAllAgents(testInput)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestSingleAgent = async (agentGuid: string) => {
    if (!testInput.trim()) return
    
    setIsLoading(true)
    try {
      await processSingleAgent(agentGuid, testInput)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    resetState()
    setTestInput("")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Airia Integration Test</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-input">Test Input (Document Text)</Label>
            <Input
              id="test-input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter document text to test with agents..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTestAllAgents} 
              disabled={!testInput.trim() || isLoading}
              className="bg-primary"
            >
              {isLoading ? "Processing..." : "Test All Agents"}
            </Button>
            
            <Button 
              onClick={handleReset} 
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Individual Agent Tests */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Individual Agent Tests</h3>
        <div className="grid grid-cols-2 gap-4">
          {AIRIA_AGENTS.map((agent) => (
            <Button
              key={agent.guid}
              onClick={() => handleTestSingleAgent(agent.guid)}
              disabled={!testInput.trim() || isLoading}
              variant="outline"
              className="justify-start"
            >
              {agent.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.agent_name}</h4>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.success ? (
                  <div className="text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    Error: {result.error}
                  </div>
                )}
                
                {result.execution_time && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Execution time: {result.execution_time}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="p-6 border-red-200">
          <h3 className="text-xl font-semibold mb-4 text-red-600">Errors</h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-600">
                {error}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Configuration Info */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-xl font-semibold mb-4">Configuration</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Total Agents:</strong> {AIRIA_AGENTS.length}
          </div>
          <div>
            <strong>API Key:</strong> {process.env.NEXT_PUBLIC_AIRIA_API_KEY ? 'Configured' : 'Not configured'}
          </div>
          <div>
            <strong>Base URL:</strong> {process.env.NEXT_PUBLIC_AIRIA_BASE_URL || 'https://api.airia.com'}
          </div>
        </div>
      </Card>
    </div>
  )
}
