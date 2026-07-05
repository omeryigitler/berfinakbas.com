"use client";

import { useEffect, useState } from "react";
import type { OutboxHealthResponse } from "@/domain/integrations/health";

interface OutboxHealthDashboardProps {
  className?: string;
}

export function OutboxHealthDashboard({ className }: OutboxHealthDashboardProps) {
  const [health, setHealth] = useState<OutboxHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/admin/health/outbox");
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || "Sağlık verisi alınamadı");
        }
        const { data } = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Entegrasyon Sağlığı</h2>
            <p>Gönderim sırası sağlık durumu yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Entegrasyon Sağlığı</h2>
            <p className="admin-error">Hata: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const statusLabels: Record<string, string> = {
    PENDING: "Beklenen",
    PROCESSING: "İşleniyor",
    SENT: "Gönderildi",
    FAILED: "Başarısız",
    DEAD: "Teslim Edilemedi",
  };

  return (
    <div className={className}>
      <div className="admin-panel" aria-labelledby="health-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="health-title">Entegrasyon Sağlığı</h2>
            <p>Gönderim sırası durumu ve operasyon metrikleri</p>
          </div>
          <span className="admin-count">{health.totalEvents} olay</span>
        </div>

        <div className="health-metrics-grid">
          <div className="health-metric-card">
            <div className="metric-label">Başarı Oranı</div>
            <div className="metric-value">{health.successRate.toFixed(1)}%</div>
            <div className="metric-detail">
              {health.statusCounts.SENT} / {health.totalEvents} teslim edildi
            </div>
          </div>

          <div className="health-metric-card">
            <div className="metric-label">Ortalama Deneme</div>
            <div className="metric-value">{health.averageAttempts.toFixed(2)}</div>
            <div className="metric-detail">Tüm olaylar için</div>
          </div>

          <div className="health-metric-card">
            <div className="metric-label">En Eski Bekleme</div>
            <div className="metric-value">
              {health.oldestPendingAt
                ? new Date(health.oldestPendingAt).toLocaleString("tr-TR")
                : "Yok"}
            </div>
            <div className="metric-detail">{health.statusCounts.PENDING} olay bekleniyor</div>
          </div>

          <div className="health-metric-card">
            <div className="metric-label">En Eski Başarısız</div>
            <div className="metric-value">
              {health.oldestFailedAt
                ? new Date(health.oldestFailedAt).toLocaleString("tr-TR")
                : "Yok"}
            </div>
            <div className="metric-detail">
              {health.statusCounts.FAILED + health.statusCounts.DEAD} sorunlu olay
            </div>
          </div>
        </div>

        <div className="health-status-list">
          <div className="status-header">Olay Durumu Dağılımı</div>
          <ul>
            {Object.entries(health.statusCounts).map(([status, count]) => (
              <li key={status}>
                <span>{statusLabels[status]}</span>
                <span className="status-badge">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .health-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .health-metric-card {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .metric-value {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .metric-detail {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .health-status-list {
          margin-top: 1.5rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .status-header {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .health-status-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .health-status-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .status-badge {
          font-weight: 600;
          color: #0066cc;
          min-width: 30px;
          text-align: right;
        }

        .admin-error {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
