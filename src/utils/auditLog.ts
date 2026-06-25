export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000;

  /**
   * Log an action
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.logs.push(auditEntry);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Persist to localStorage
    this.persistToStorage();

    return auditEntry;
  }

  /**
   * Get all logs
   */
  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific entity
   */
  getEntityLogs(entityType: string, entityId: string): AuditLogEntry[] {
    return this.logs.filter(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }

  /**
   * Get logs for a specific user
   */
  getUserLogs(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get logs for a specific action
   */
  getActionLogs(action: AuditLogEntry['action']): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Get logs within a date range
   */
  getLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.logs.filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('audit_logs');
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(): string {
    const headers = ['ID', 'Timestamp', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'Entity Name'];
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.entityType,
      log.entityId,
      log.entityName,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist logs to localStorage
   */
  private persistToStorage(): void {
    try {
      const logsToStore = this.logs.slice(-1000); // Store only recent 1000 logs
      localStorage.setItem('audit_logs', JSON.stringify(logsToStore));
    } catch (error) {
      console.error('Failed to persist audit logs:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Load logs on initialization
auditLogger.loadFromStorage();
