/**
 * CRE Auto-Trigger Status Display
 * 
 * Displays status of the CRE auto-trigger service
 * that automatically runs: cre workflow simulate --trigger-index 2
 * 
 * Service auto-starts on app launch - no manual control needed
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CREStatus {
  running: boolean
  enabled: boolean
  executing: boolean
  pollInterval: number
  workflowPath: string
  target: string
  triggerIndex: number
  creCommand?: string
}

export function CREAutoTriggerControls() {
  const [status, setStatus] = useState<CREStatus | null>(null)
  const [pollInterval, setPollInterval] = useState(10000) // 10 seconds default

  // Fetch status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/cre-trigger')
      const data = await response.json()
      if (data.success) {
        setStatus(data.status)
        setPollInterval(data.status.pollInterval)
      }
    } catch (error) {
      console.error('Failed to fetch CRE status:', error)
    }
  }

  // Auto-refresh status
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000) // Update every 2 seconds
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CRE Auto-Trigger Service</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>CRE Auto-Trigger Service</CardTitle>
            <CardDescription>
              Automatically runs CRE matching workflow when trades are pending
            </CardDescription>
          </div>
          <Badge 
            variant={status.running ? "default" : "secondary"}
            className={status.running ? "bg-green-500" : "bg-gray-500"}
          >
            {status.executing ? '⚙️ EXECUTING' : status.running ? '🟢 ACTIVE' : '🔴 STOPPED'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Info */}
        <Alert>
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <div><strong>CRE Command:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{status.creCommand || 'cre'}</code></div>
              <div><strong>CRE Path:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{status.workflowPath}</code></div>
              <div><strong>Target:</strong> {status.target}</div>
              <div><strong>Trigger Index:</strong> {status.triggerIndex} (Matching Engine)</div>
              <div><strong>Poll Interval:</strong> {status.pollInterval / 1000}s</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Command Preview */}
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm">
          <div className="mb-1 text-gray-500">$ cd {status.workflowPath}\\my-workflow</div>
          <div>$ {status.creCommand || 'cre'} workflow simulate my-workflow \</div>
          <div>    --target {status.target} \</div>
          <div>    --trigger-index {status.triggerIndex} \</div>
          <div>    --non-interactive</div>
        </div>

        {/* Auto-Running Status */}
        <Alert className={status.running ? "border-green-500 bg-green-50" : "border-gray-300"}>
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <div>
                <div className="font-semibold text-gray-900">
                  {status.executing ? '⚙️ Executing CRE Workflow...' : status.running ? '✅ Service Running Automatically' : '⚠️ Service Stopped'}
                </div>
                <div className="text-sm text-gray-600">
                  {status.running 
                    ? `Checking for trades every ${pollInterval / 1000} seconds • No manual intervention needed`
                    : 'Service should auto-start on app launch'}
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* How It Works */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">🔄 How It Works:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
            <li>Service polls every {pollInterval / 1000}s for pending buy/sell orders</li>
            <li>When both exist, automatically runs CRE matching command</li>
            <li>CRE executes confidential matching in TEE environment</li>
            <li>Matches are posted to <code>/api/matches</code></li>
            <li>Users can proceed with escrow deposits & settlement</li>
          </ol>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h4 className="font-semibold text-blue-900 mb-1">✨ Benefits:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>🚫 No manual terminal commands needed</li>
            <li>⚡ Automatic matching within {pollInterval / 1000} seconds</li>
            <li>🔒 CRE TEE ensures confidential compute</li>
            <li>🎯 Production-ready workflow automation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
