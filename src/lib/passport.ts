import { getDb } from './db';

export function recalculatePassport(merchantId: string, businessId: string) {
  const db = getDb();

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const d365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const rev30 = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND transaction_date >= ?
  `).get(merchantId, d30) as { total: number };

  const rev90 = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND transaction_date >= ?
  `).get(merchantId, d90) as { total: number };

  const rev365 = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND transaction_date >= ?
  `).get(merchantId, d365) as { total: number };

  const count30 = db.prepare(`
    SELECT COUNT(*) as cnt FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND transaction_date >= ?
  `).get(merchantId, d30) as { cnt: number };

  const cashCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0 AND payment_method = 'cash' AND transaction_date >= ?
  `).get(merchantId, d30) as { cnt: number };

  const operatingDays = db.prepare(`
    SELECT COUNT(DISTINCT date(transaction_date)) as days FROM transactions
    WHERE merchant_id = ? AND type = 'sale' AND is_deleted = 0
  `).get(merchantId) as { days: number };

  const firstTxn = db.prepare(`
    SELECT MIN(transaction_date) as first FROM transactions WHERE merchant_id = ? AND is_deleted = 0
  `).get(merchantId) as { first: string | null };

  const totalSales = count30.cnt;
  const pctCash = totalSales > 0 ? Math.round((cashCount.cnt / totalSales) * 100) : 100;
  const pctDigital = 100 - pctCash;

  const daysActive = operatingDays.days || 0;
  const avgDailyRevenue = daysActive > 0 ? rev30.total / Math.min(daysActive, 30) : 0;

  let monthsSince = 0;
  if (firstTxn.first) {
    monthsSince = Math.floor((now.getTime() - new Date(firstTxn.first).getTime()) / (30 * 24 * 60 * 60 * 1000));
  }

  // Score components (0-100 each)
  const consistencyScore = Math.min(100, Math.round((daysActive / 30) * 100));
  const volumeScore = Math.min(100, Math.round((rev30.total / 10000) * 100));
  const longevityScore = Math.min(100, monthsSince * 8);
  const diversityScore = pctDigital > 0 ? 80 : 40;
  const dataScore = totalSales > 10 ? 80 : Math.round(totalSales * 8);

  const composite = Math.round(
    consistencyScore * 0.35 +
    volumeScore * 0.25 +
    diversityScore * 0.20 +
    longevityScore * 0.20
  );

  let verificationLevel = 'self_recorded';
  if (daysActive >= 90) verificationLevel = 'partially_verified';
  if (daysActive >= 180 && pctDigital > 10) verificationLevel = 'financially_verified';

  const existing = db.prepare('SELECT id FROM passports WHERE merchant_id = ?').get(merchantId) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE passports SET
        health_score = ?, total_revenue_30d = ?, total_revenue_90d = ?, total_revenue_365d = ?,
        transaction_count_30d = ?, avg_daily_revenue = ?, pct_cash = ?, pct_digital = ?,
        consistency_score = ?, volume_score = ?, longevity_score = ?,
        verification_level = ?, operating_days = ?, generated_at = ?, updated_at = ?
      WHERE merchant_id = ?
    `).run(
      composite, rev30.total, rev90.total, rev365.total,
      totalSales, avgDailyRevenue, pctCash, pctDigital,
      consistencyScore, volumeScore, longevityScore,
      verificationLevel, daysActive,
      new Date().toISOString(), new Date().toISOString(),
      merchantId
    );
  }
}
