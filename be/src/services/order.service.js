const envConfig = require('../config/env.config');
const logger = require('../utils/logger');

class OrderService {
  async getOrderQueue() {
    try {
      const target = new URL(envConfig.appsScriptUrl);
      target.searchParams.set('action', 'list');
      target.searchParams.set('t', Date.now().toString());

      const upstream = await fetch(target, { cache: 'no-store' });
      if (!upstream.ok) {
        throw new Error(`Upstream returned HTTP ${upstream.status}`);
      }

      const raw = await upstream.text();
      try {
        const parsed = JSON.parse(raw);
        return parsed.orders || [];
      } catch {
        return [];
      }
    } catch (err) {
      logger.warn(`Fallback: Failed to fetch order queue from cloud (${err.message})`);
      return [];
    }
  }

  async submitOrder(orderData) {
    const { videoId, requesterName, songTitle } = orderData;
    return {
      orderId: `ord_${Date.now()}`,
      videoId,
      requesterName: requesterName || 'Anonymous',
      songTitle: songTitle || 'YouTube Requested Track',
      createdAt: new Date().toISOString(),
      queuePosition: 1,
    };
  }
}

module.exports = new OrderService();
