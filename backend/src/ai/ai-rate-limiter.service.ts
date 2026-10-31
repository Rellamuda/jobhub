import { Injectable, ForbiddenException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AiCallTelemetry {
  id: string;
  userId: string;
  userEmail?: string;
  tier: 'FREE' | 'SILVER' | 'PREMIUM';
  endpoint: string;
  tokensEstimated: number;
  costEstimatedUsd: number;
  timestamp: Date;
}

@Injectable()
export class AiRateLimiterService {
  private readonly logger = new Logger(AiRateLimiterService.name);

  // Sliding window burst protection: Map<userId_or_ip, timestamp[]>
  private burstWindow = new Map<string, number[]>();
  private readonly MAX_BURST_PER_MINUTE = 10;

  // In-memory rolling telemetry buffer (keeps last 500 calls)
  private telemetryBuffer: AiCallTelemetry[] = [];
  private readonly MAX_BUFFER_SIZE = 500;

  // Aggregated counters
  private totalCalls = 0;
  private totalTokens = 0;
  private totalCost = 0;
  private callsByEndpoint: Record<string, number> = {};
  private callsByTier: Record<string, number> = {
    FREE: 0,
    SILVER: 0,
    PREMIUM: 0,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Anti-Abuse Burst Check (Max 10 requests / minute)
   */
  checkBurstRate(identifier: string) {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    let timestamps = this.burstWindow.get(identifier) || [];
    // Clean old entries
    timestamps = timestamps.filter((t) => t > oneMinuteAgo);

    if (timestamps.length >= this.MAX_BURST_PER_MINUTE) {
      this.logger.warn(`Rate limit burst exceeded for ${identifier} (${timestamps.length} req/min)`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'AI rate limit exceeded. Please wait 60 seconds before making another generation request.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.burstWindow.set(identifier, timestamps);
  }

  // Rolling IP-level free trial limiter: Map<ip, timestamp[]>
  private freeTrialIpWindow = new Map<string, number[]>();
  private readonly MAX_FREE_TIER_PER_IP_DAILY = 10;

  checkFreeTrialIpAbuse(ip?: string) {
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return;
    // Don't rate limit private network or Docker container bridge IPs
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip)) return;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let timestamps = this.freeTrialIpWindow.get(ip) || [];
    timestamps = timestamps.filter((t) => t > oneDayAgo);

    if (timestamps.length >= this.MAX_FREE_TIER_PER_IP_DAILY) {
      throw new ForbiddenException(
        'The free AI trial limit has been reached for this network/device. Please upgrade to Silver or Diamond to continue generating with AI.',
      );
    }
    timestamps.push(now);
    this.freeTrialIpWindow.set(ip, timestamps);
  }

  /**
   * Lightweight endpoint rate check & telemetry (Profile scoring, Career suggestions, Chat)
   * Only enforces burst protection (10 req/min anti-abuse) without consuming lifetime resume/doc quotas.
   */
  async recordLightweightCall(userId: string, endpoint: string, estimatedChars = 400) {
    try {
      this.checkBurstRate(userId);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, subscriptionTier: true },
      });
      if (user) {
        this.recordTelemetry({
          userId: user.id,
          userEmail: user.email,
          tier: user.subscriptionTier,
          endpoint,
          estimatedInputChars: estimatedChars,
        });
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
    }
  }

  /**
   * 2. Quota Check based on Subscription Tier
   * Free Tier: 3 total credits (allows testing Resume Builder, Cover Letter, and a Job application)
   * Silver Tier: 15 credits / month
   * Diamond/Premium: Unlimited
   */
  async checkQuotaAndIncrement(userId: string, endpoint: string, estimatedInputChars = 500, clientIp?: string) {
    // Check burst rate
    this.checkBurstRate(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, subscriptionTier: true, freeGenerationsUsed: true },
    });

    if (!user) throw new ForbiddenException('User not found');

    // Administrators always have unrestricted AI access
    if (user.role === 'ADMIN') {
      this.recordTelemetry({
        userId,
        userEmail: user.email,
        tier: 'PREMIUM',
        endpoint,
        estimatedInputChars,
      });
      return;
    }

    const tier = user.subscriptionTier;
    const currentUsed = user.freeGenerationsUsed || 0;

    // Check tier limits
    if (tier === 'FREE') {
      const limit = 3;
      if (currentUsed >= limit) {
        throw new ForbiddenException(
          JSON.stringify({
            code: 'TIER_LIMIT_EXHAUSTED',
            message: 'Free AI generation credit reached (3/3). Upgrade to Silver ($13/mo) for 15 generations or Diamond ($20/mo) for unlimited AI access.',
            currentTier: 'FREE',
            nextTier: 'SILVER',
            limit: 3,
            used: currentUsed,
          }),
        );
      }
      // Check multi-account IP farming abuse
      if (clientIp) {
        this.checkFreeTrialIpAbuse(clientIp);
      }
    } else if (tier === 'SILVER') {
      const limit = 15;
      if (currentUsed >= limit) {
        throw new ForbiddenException(
          JSON.stringify({
            code: 'TIER_LIMIT_EXHAUSTED',
            message: 'Silver monthly AI generation quota reached (15/15). Upgrade to Diamond ($20/mo) for unlimited AI tailoring and autonomous applications.',
            currentTier: 'SILVER',
            nextTier: 'PREMIUM',
            limit: 15,
            used: currentUsed,
          }),
        );
      }
    }
    // PREMIUM / DIAMOND has no ceiling (Unlimited)

    // Increment usage counter in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { freeGenerationsUsed: { increment: 1 } },
    });

    // Record Telemetry
    this.recordTelemetry({
      userId,
      userEmail: user.email,
      tier,
      endpoint,
      estimatedInputChars,
    });
  }

  /**
   * 3. Track and Estimate Token Usage
   * Gemini 1.5 Flash Pricing (approx $0.075 / 1M input tokens, $0.30 / 1M output tokens)
   */
  recordTelemetry(params: {
    userId: string;
    userEmail?: string;
    tier: 'FREE' | 'SILVER' | 'PREMIUM';
    endpoint: string;
    estimatedInputChars?: number;
    estimatedOutputChars?: number;
  }) {
    const inputChars = params.estimatedInputChars || 800;
    const outputChars = params.estimatedOutputChars || 1200;

    // Rule of thumb: ~4 characters per token
    const inputTokens = Math.ceil(inputChars / 4);
    const outputTokens = Math.ceil(outputChars / 4);
    const totalTokens = inputTokens + outputTokens;

    // Estimated Gemini cost: ($0.075 * inputTokens + $0.30 * outputTokens) / 1,000,000
    const costUsd = (0.075 * inputTokens + 0.3 * outputTokens) / 1000000;

    const record: AiCallTelemetry = {
      id: `ai_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      userId: params.userId,
      userEmail: params.userEmail,
      tier: params.tier,
      endpoint: params.endpoint,
      tokensEstimated: totalTokens,
      costEstimatedUsd: Number(costUsd.toFixed(6)),
      timestamp: new Date(),
    };

    // Keep sliding buffer
    this.telemetryBuffer.unshift(record);
    if (this.telemetryBuffer.length > this.MAX_BUFFER_SIZE) {
      this.telemetryBuffer.pop();
    }

    // Update aggregates
    this.totalCalls++;
    this.totalTokens += totalTokens;
    this.totalCost += costUsd;
    this.callsByEndpoint[params.endpoint] = (this.callsByEndpoint[params.endpoint] || 0) + 1;
    this.callsByTier[params.tier] = (this.callsByTier[params.tier] || 0) + 1;

    this.logger.debug(
      `AI Call [${params.endpoint}] user=${params.userId} tier=${params.tier} tokens=~${totalTokens} cost=~\$${costUsd.toFixed(5)}`,
    );
  }

  /**
   * 4. User Quota Status for Mobile and Web UI
   */
  async getUserQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, subscriptionTier: true, freeGenerationsUsed: true },
    });

    if (!user) throw new ForbiddenException('User not found');

    const isAdmin = user.role === 'ADMIN';
    const tier = isAdmin ? 'PREMIUM' : user.subscriptionTier;
    const used = user.freeGenerationsUsed || 0;
    const limit = isAdmin ? null : tier === 'FREE' ? 3 : tier === 'SILVER' ? 15 : null;
    const isUnlimited = isAdmin || tier === 'PREMIUM';
    const remaining = isUnlimited ? null : Math.max(0, (limit || 0) - used);
    const canGenerate = isUnlimited || (remaining !== null && remaining > 0);

    return {
      tier: tier === 'PREMIUM' ? 'DIAMOND' : tier,
      used,
      limit,
      remaining,
      isUnlimited,
      canGenerate,
      upgradeRecommendation: tier === 'FREE' ? 'Upgrade to Silver ($13) or Diamond ($20)' : tier === 'SILVER' ? 'Upgrade to Diamond ($20) for unlimited' : null,
    };
  }

  /**
   * 5. Admin Monitoring Metrics
   */
  getAdminMonitoring() {
    const uniqueUsers = new Set(this.telemetryBuffer.map((t) => t.userId)).size;

    return {
      totalApiCalls: this.totalCalls,
      totalTokensEstimated: this.totalTokens,
      totalEstimatedCostUsd: Number(this.totalCost.toFixed(4)),
      uniqueActiveAiUsers: uniqueUsers,
      callsByTier: this.callsByTier,
      callsByEndpoint: this.callsByEndpoint,
      recentCalls: this.telemetryBuffer.slice(0, 50),
      timestamp: new Date(),
    };
  }
}
