import { memo, useMemo } from 'react';
import { Clock, User, FileText, Download } from 'lucide-react';
import type { AuditLogEntry } from '../utils/auditLog';
import { auditLogger } from '../utils/auditLog';
import '../styles/AuditLog.css';

interface AuditLogProps {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
}

const AuditLog = memo(({
  entityType,
  entityId,
  userId,
  limit = 50,
}: AuditLogProps) => {
  const logs = useMemo(() => {
    let filtered: AuditLogEntry[] = auditLogger.getLogs();

    if (entityType && entityId) {
      filtered = auditLogger.getEntityLogs(entityType, entityId);
    } else if (userId) {
      filtered = auditLogger.getUserLogs(userId);
    }

    return filtered.slice(-limit).reverse();
  }, [entityType, entityId, userId, limit]);

  const handleExport = () => {
    const csv = auditLogger.exportAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'create';
      case 'UPDATE':
        return 'update';
      case 'DELETE':
        return 'delete';
      case 'VIEW':
        return 'view';
      case 'EXPORT':
        return 'export';
      default:
        return 'default';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: 'Créé',
      UPDATE: 'Modifié',
      DELETE: 'Supprimé',
      VIEW: 'Consulté',
      EXPORT: 'Exporté',
    };
    return labels[action] || action;
  };

  if (logs.length === 0) {
    return (
      <div className="audit-log-empty">
        <FileText size={32} />
        <p>Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <div className="audit-log">
      <div className="audit-log-header">
        <h3>Historique des modifications</h3>
        <button className="audit-export-btn" onClick={handleExport} title="Exporter en CSV">
          <Download size={16} />
          Exporter
        </button>
      </div>

      <div className="audit-log-list">
        {logs.map(log => (
          <div key={log.id} className="audit-log-entry">
            <div className="audit-log-time">
              <Clock size={14} />
              <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
            </div>

            <div className="audit-log-content">
              <div className="audit-log-action">
                <span className={`audit-action-badge ${getActionColor(log.action)}`}>
                  {getActionLabel(log.action)}
                </span>
                <span className="audit-entity-name">{log.entityName}</span>
              </div>

              <div className="audit-log-details">
                <span className="audit-entity-type">{log.entityType}</span>
                {log.userId && (
                  <span className="audit-user">
                    <User size={12} />
                    {log.userId}
                  </span>
                )}
              </div>

              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="audit-changes">
                  {Object.entries(log.changes).map(([field, change]) => (
                    <div key={field} className="audit-change">
                      <span className="change-field">{field}:</span>
                      <span className="change-old">{String(change.old)}</span>
                      <span className="change-arrow">→</span>
                      <span className="change-new">{String(change.new)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

AuditLog.displayName = 'AuditLog';

export default AuditLog;
