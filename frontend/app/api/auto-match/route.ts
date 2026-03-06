import { NextRequest, NextResponse } from 'next/server'
import { autoMatchingService } from '@/lib/auto-matching-service'

/**
 * Auto-Matching Service Control API
 * 
 * GET    /api/auto-match - Get service status
 * POST   /api/auto-match - Start/stop/configure service
 */

export async function GET(req: NextRequest) {
  const status = autoMatchingService.getStatus()
  
  return NextResponse.json({
    ...status,
    message: status.running 
      ? 'Auto-matching service is running' 
      : 'Auto-matching service is stopped'
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, config } = body

  switch (action) {
    case 'start':
      autoMatchingService.start()
      return NextResponse.json({
        success: true,
        message: 'Auto-matching service started',
        status: autoMatchingService.getStatus()
      })

    case 'stop':
      autoMatchingService.stop()
      return NextResponse.json({
        success: true,
        message: 'Auto-matching service stopped',
        status: autoMatchingService.getStatus()
      })

    case 'configure':
      if (!config) {
        return NextResponse.json({
          error: 'Missing config parameter'
        }, { status: 400 })
      }
      autoMatchingService.updateConfig(config)
      return NextResponse.json({
        success: true,
        message: 'Configuration updated',
        status: autoMatchingService.getStatus()
      })

    case 'restart':
      autoMatchingService.stop()
      setTimeout(() => autoMatchingService.start(), 1000)
      return NextResponse.json({
        success: true,
        message: 'Auto-matching service restarting',
        status: autoMatchingService.getStatus()
      })

    default:
      return NextResponse.json({
        error: 'Invalid action. Use: start, stop, configure, or restart'
      }, { status: 400 })
  }
}
