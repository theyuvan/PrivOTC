/**
 * AI Agent Auto-Matching Service
 * 
 * Automatically monitors trade submissions and triggers matching
 * without requiring manual CRE workflow simulation command.
 * 
 * Features:
 * - Real-time trade monitoring
 * - Automatic match execution
 * - Configurable polling interval
 */

import { aiMatchingAgent } from './ai-matching-agent'

interface AutoMatchConfig {
  pollInterval: number // milliseconds
  enabled: boolean
  apiBaseUrl: string
}

class AutoMatchingService {
  private config: AutoMatchConfig
  private intervalId: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  constructor(config: Partial<AutoMatchConfig> = {}) {
    this.config = {
      pollInterval: 5000, // Check every 5 seconds
      enabled: true,
      apiBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ...config
    }
  }

  /**
   * Start automatic matching service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Auto-matching service already running')
      return
    }

    console.log('🤖 Starting AI Auto-Matching Service...')
    console.log(`   Poll interval: ${this.config.pollInterval}ms`)
    
    this.isRunning = true
    
    // Run immediate check
    this.checkAndMatch()
    
    // Start polling
    this.intervalId = setInterval(() => {
      this.checkAndMatch()
    }, this.config.pollInterval)

    console.log('✅ Auto-matching service started')
  }

  /**
   * Stop automatic matching service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('⏹️  Auto-matching service stopped')
  }

  /**
   * Check for new trades and trigger matching
   */
  private async checkAndMatch() {
    if (!this.config.enabled) return

    try {
      // Get current order pool
      const orderPool = aiMatchingAgent.getOrderPool()
      
      if (orderPool.length < 2) {
        // Need at least 2 orders to match
        return
      }

      // Trigger matching (async when using ChatOpenAI)
      const matches = await aiMatchingAgent.findMatches()

      if (matches.length > 0) {
        console.log(`🎯 Auto-match triggered: Found ${matches.length} match(es)`)
        
        // Post each match to the matches endpoint
        for (const match of matches) {
          await this.postMatch(match)
        }
      }
    } catch (error) {
      console.error('❌ Auto-matching error:', error)
    }
  }

  /**
   * Post match to matches endpoint
   */
  private async postMatch(match: any) {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.matchId,
          tradeId: match.tradeId,
          buyerAddress: match.buyerAddress,
          sellerAddress: match.sellerAddress,
          ethAmount: match.asset === 'ETH' ? match.amount : 0,
          wldAmount: match.asset === 'WLD' ? match.amount : 0,
          matchPrice: match.price,
          confidence: match.confidence,
          deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        })
      })

      if (response.ok) {
        console.log(`✅ Match ${match.matchId} posted successfully`)
      } else {
        console.error(`❌ Failed to post match ${match.matchId}`)
      }
    } catch (error) {
      console.error(`❌ Error posting match:`, error)
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      running: this.isRunning,
      enabled: this.config.enabled,
      pollInterval: this.config.pollInterval,
      orderPoolSize: aiMatchingAgent.getOrderPool().length
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoMatchConfig>) {
    const wasRunning = this.isRunning
    
    if (wasRunning) {
      this.stop()
    }

    this.config = { ...this.config, ...newConfig }

    if (wasRunning) {
      this.start()
    }

    console.log('⚙️  Auto-matching config updated:', this.config)
  }
}

// Global singleton instance
export const autoMatchingService = new AutoMatchingService()

// Auto-start in server environment
if (typeof window === 'undefined') {
  // Only start on server-side
  autoMatchingService.start()
}
