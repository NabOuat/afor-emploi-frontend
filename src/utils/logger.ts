/**
 * Système de logging centralisé pour le frontend AFOR Emploi
 * Enregistre toutes les activités frontend dans la console et localStorage
 */

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
  data?: any;
}

class FrontendLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite pour éviter de saturer localStorage

  constructor() {
    // Charger les logs existants depuis localStorage
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('frontend_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    }
  }

  private saveLogs() {
    try {
      // Garder seulement les N derniers logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      localStorage.setItem('frontend_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des logs:', error);
    }
  }

  private log(level: LogEntry['level'], category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);
    this.saveLogs();

    // Afficher dans la console avec formatage
    const emoji = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      DEBUG: '🔍'
    }[level];

    const style = {
      INFO: 'color: #3498db',
      WARN: 'color: #f39c12',
      ERROR: 'color: #e74c3c',
      DEBUG: 'color: #95a5a6'
    }[level];

    console.log(
      `%c${emoji} [${level}] ${category} | ${message}`,
      style,
      data || ''
    );
  }

  info(category: string, message: string, data?: any) {
    this.log('INFO', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('WARN', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('ERROR', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.log('DEBUG', category, message, data);
  }

  // Méthodes spécifiques pour tracer les opérations importantes
  logEmployeeCreation(employeeData: any) {
    this.info('EMPLOYEE_CREATE', 'Création d\'employé', {
      nom: employeeData.nom,
      prenom: employeeData.prenom,
      matricule: employeeData.matricule,
      poste: employeeData.poste_nom,
      type_contrat: employeeData.type_contrat,
      projets: employeeData.projets?.length || 0
    });
  }

  logApiRequest(method: string, endpoint: string, payload?: any) {
    this.debug('API_REQUEST', `${method} ${endpoint}`, payload);
  }

  logApiResponse(endpoint: string, status: number, data?: any) {
    if (status >= 200 && status < 300) {
      this.info('API_RESPONSE', `${endpoint} - ${status}`, data);
    } else if (status >= 400) {
      this.error('API_RESPONSE', `${endpoint} - ${status}`, data);
    }
  }

  // Exporter les logs en fichier texte
  exportLogs(): string {
    let output = '='.repeat(80) + '\n';
    output += 'FRONTEND LOGS - AFOR EMPLOI\n';
    output += '='.repeat(80) + '\n\n';

    this.logs.forEach(log => {
      output += `[${log.timestamp}] [${log.level}] ${log.category}\n`;
      output += `  ${log.message}\n`;
      if (log.data) {
        output += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }
      output += '\n';
    });

    return output;
  }

  // Télécharger les logs
  downloadLogs() {
    const content = this.exportLogs();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `frontend_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Vider les logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('frontend_logs');
    console.log('✅ Logs frontend effacés');
  }

  // Obtenir tous les logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

// Instance singleton
export const frontendLogger = new FrontendLogger();

// Exposer dans window pour accès depuis la console
if (typeof window !== 'undefined') {
  (window as any).frontendLogger = frontendLogger;
}
