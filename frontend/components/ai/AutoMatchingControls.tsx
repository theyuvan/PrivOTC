'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap } from 'lucide-react'

interface AutoMatchStatus {
  running: boolean
  enabled: boolean
  pollInterval: number
  orderPoolSize: number
  message?: string
}

export function AutoMatchingControls() {
  const [status, setStatus] = useState<AutoMatchStatus | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auto-match')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${status.running ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <div>
              <CardTitle>Auto-Matching Service</CardTitle>
              <CardDescription>
                Automatic trade matching - No manual CRE command needed!
              </CardDescription>
            </div>
          </div>
          <Badge variant={status.running ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {status.running ? '🟢 ACTIVE' : '🔴 STOPPED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Info */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">{status.running ? '✅ Running' : '⚠️ Stopped'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Poll Interval</div>
            <div className="font-medium">{status.pollInterval}ms</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Orders in Pool</div>
            <div className="font-medium">{status.orderPoolSize}</div>
          </div>
        </div>

        {/* Auto-Running Status Message */}
        <Alert className={status.running ? "border-green-500 bg-green-50" : "border-gray-300"}>
          <AlertDescription className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <div className="font-semibold text-gray-900">
                {status.running ? '✅ Auto-Matching Active' : '⚠️ Service Stopped'}
              </div>
              <div className="text-sm text-gray-600">
                {status.running 
                  ? `Automatically checking for matches every ${status.pollInterval / 1000} seconds`
                  : 'Service should auto-start on app launch'}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* How It Works */}
        <div className="border-t pt-4 space-y-2">
          <div className="font-medium text-sm">🤖 How Auto-Matching Works:</div>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Service polls order pool every {status.pollInterval}ms</li>
            <li>When 2+ orders exist, checks compatibility automatically</li>
            <li>If match found, creates match and posts to /api/matches</li>
            <li>No manual <code className="bg-muted px-1 py-0.5 rounded">cre workflow simulate</code> needed!</li>
          </ol>
        </div>

        {status.message && (
          <div className="text-sm p-3 bg-primary/10 text-primary rounded-lg">
            {status.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
