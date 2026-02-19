import React from 'react';
import { X, Printer } from 'lucide-react';
import '../styles/EmployeeModal.css';

interface Projet {
  id: string;
  nom: string;
}

interface Engagement {
  id: string;
  nom: string;
  description?: string;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
  qualification: string;
  poste: string;
  statut: 'Contractuel' | 'Fonctionnaire';
  genre: 'M' | 'F';
  age: number;
  date_naissance?: string;
  contact?: string;
  diplome?: string;
  ecole?: string;
  type_contrat?: string;
  date_debut?: string;
  date_fin?: string;
  validiteContrat: string;
  qualiteContrat: string;
  categorie_poste?: string;
  region: string;
  departement: string;
  sousPrefecture: string;
  projets?: Projet[];
  engagements?: Engagement[];
}

interface EmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function EmployeeModal({ employee, isOpen, onClose, darkMode }: EmployeeModalProps) {
  const [contratHistory, setContratHistory] = React.useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // Charger l'historique des contrats
  React.useEffect(() => {
    if (isOpen && employee) {
      const fetchContratHistory = async () => {
        try {
          setLoadingHistory(true);
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/contrats?fic_personne_id=${employee.id}`);
          
          if (response.ok) {
            const data = await response.json();
            setContratHistory(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error('Erreur lors du chargement de l\'historique des contrats:', err);
          setContratHistory([]);
        } finally {
          setLoadingHistory(false);
        }
      };
      
      fetchContratHistory();
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const dateNaissance = new Date();
  dateNaissance.setFullYear(dateNaissance.getFullYear() - employee.age);
  const formattedDateNaissance = dateNaissance.toLocaleDateString('fr-FR');

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=1200');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fiche Employé - ${employee.nom} ${employee.prenom}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: white;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #FF8C00;
            padding-bottom: 20px;
          }
          .logo {
            width: 100px;
            height: 100px;
            background: #f0f0f0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #FF8C00;
            font-size: 24px;
          }
          .header-info {
            text-align: right;
          }
          .header-info h1 {
            color: #FF8C00;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .header-info p {
            color: #7f8c8d;
            font-size: 12px;
          }
          .print-date {
            text-align: right;
            color: #7f8c8d;
            font-size: 11px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            background: #FF8C00;
            color: white;
            padding: 12px 15px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            color: #7f8c8d;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 5px;
          }
          .info-value {
            color: #2c3e50;
            font-size: 13px;
            font-weight: 500;
            word-break: break-word;
          }
          .info-item.full-width {
            grid-column: 1 / -1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          thead {
            background: #FF8C00;
            color: white;
          }
          th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            border-bottom: 2px solid #FF8C00;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 12px;
            color: #2c3e50;
          }
          tbody tr:nth-child(even) {
            background: #f9f9f9;
          }
          .no-data {
            text-align: center;
            color: #95a5a6;
            font-style: italic;
            padding: 20px 10px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #7f8c8d;
            font-size: 11px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .container {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AFOR</div>
            <div class="header-info">
              <h1>FICHE EMPLOYÉ</h1>
              <p>Système de Gestion des Ressources Humaines</p>
            </div>
          </div>
          
          <div class="print-date">
            Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>

          <div class="section">
            <div class="section-title">Informations personnelles</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Matricule</span>
                <span class="info-value">${employee.matricule || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Nom</span>
                <span class="info-value">${employee.nom}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Prénom</span>
                <span class="info-value">${employee.prenom}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Genre</span>
                <span class="info-value">${employee.genre === 'M' ? 'Masculin' : 'Féminin'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date de naissance</span>
                <span class="info-value">${formattedDateNaissance}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Âge</span>
                <span class="info-value">${employee.age} ans</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Contact & Formation</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Type</span>
                <span class="info-value">${employee.statut}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Diplôme</span>
                <span class="info-value">${employee.diplome || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">École</span>
                <span class="info-value">${employee.ecole || '-'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Contrat actuel</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Date de début</span>
                <span class="info-value">${employee.date_debut ? new Date(employee.date_debut).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date de fin</span>
                <span class="info-value">${employee.date_fin ? new Date(employee.date_fin).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">Poste</span>
                <span class="info-value">${employee.poste}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Catégorie</span>
                <span class="info-value">${employee.categorie_poste || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Qualification</span>
                <span class="info-value">${employee.qualification}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Nature du contrat</span>
                <span class="info-value">${employee.type_contrat || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Région</span>
                <span class="info-value">${employee.region}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Département</span>
                <span class="info-value">${employee.departement}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Sous-préfecture</span>
                <span class="info-value">${employee.sousPrefecture}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Projet & Engagement</div>
            <div class="info-grid">
              ${employee.projets && employee.projets.length > 0 ? `
                <div class="info-item full-width">
                  <span class="info-label">Projets</span>
                  <div style="margin-top: 8px;">
                    ${employee.projets.map((projet: any) => `
                      <div style="padding: 8px 12px; background: #f0f0f0; border-radius: 4px; margin-bottom: 6px; font-size: 0.95rem;">
                        ${projet.nom}
                      </div>
                    `).join('')}
                  </div>
                </div>
                ${employee.engagements && employee.engagements.length > 0 ? `
                  <div class="info-item full-width">
                    <span class="info-label">Engagements</span>
                    <div style="margin-top: 8px;">
                      ${employee.engagements.map((engagement: any) => `
                        <div style="padding: 8px 12px; background: #fff3e0; border-radius: 4px; margin-bottom: 6px; font-size: 0.95rem; border-left: 3px solid #FF8C00;">
                          <strong>${engagement.nom}</strong>
                          ${engagement.description ? `<p style="font-size: 0.85rem; color: #666; margin-top: 4px;">${engagement.description}</p>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              ` : `
                <div class="info-item full-width">
                  <span style="color: #999; font-style: italic;">Aucun projet assigné</span>
                </div>
              `}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Historique des contrats</div>
            <table>
              <thead>
                <tr>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Poste</th>
                  <th>Qualification</th>
                  <th>Nature du Contrat</th>
                  <th>École</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="6" class="no-data">Aucun historique disponible</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Historique des localisations</div>
            <table>
              <thead>
                <tr>
                  <th>Date de début</th>
                  <th>Contrat</th>
                  <th>Région</th>
                  <th>Département</th>
                  <th>Sous-préfecture</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="5" class="no-data">Aucun historique disponible</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Ce document a été généré automatiquement par le système de gestion des ressources humaines AFOR.</p>
            <p>© 2026 AFOR - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Détails de l'employé</h2>
          <button className="modal-close" onClick={onClose} title="Fermer">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Informations personnelles */}
          <section className="modal-section">
            <h3 className="section-title">Informations personnelles</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Matricule:</label>
                <span>{employee.matricule || '-'}</span>
              </div>
              <div className="info-item">
                <label>Nom:</label>
                <span>{employee.nom}</span>
              </div>
              <div className="info-item">
                <label>Prénom:</label>
                <span>{employee.prenom}</span>
              </div>
              <div className="info-item">
                <label>Genre:</label>
                <span>{employee.genre === 'M' ? 'Masculin' : 'Féminin'}</span>
              </div>
              <div className="info-item">
                <label>Date de naissance:</label>
                <span>{formattedDateNaissance}</span>
              </div>
              <div className="info-item">
                <label>Âge:</label>
                <span>{employee.age} ans</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="modal-section">
            <h3 className="section-title">Contact</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Type:</label>
                <span>{employee.statut}</span>
              </div>
              <div className="info-item">
                <label>Diplôme:</label>
                <span>{employee.diplome || '-'}</span>
              </div>
              <div className="info-item">
                <label>École:</label>
                <span>{employee.ecole || '-'}</span>
              </div>
            </div>
          </section>

          {/* Contrat actuel */}
          <section className="modal-section">
            <h3 className="section-title">Contrat actuel</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Date de début:</label>
                <span>{employee.date_debut ? new Date(employee.date_debut).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div className="info-item">
                <label>Date de fin:</label>
                <span>{employee.date_fin ? new Date(employee.date_fin).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div className="info-item full-width">
                <label>Poste:</label>
                <span>{employee.poste}</span>
              </div>
              <div className="info-item">
                <label>Catégorie:</label>
                <span>{employee.categorie_poste || '-'}</span>
              </div>
              <div className="info-item">
                <label>Qualification:</label>
                <span>{employee.qualification}</span>
              </div>
              <div className="info-item">
                <label>Nature du contrat:</label>
                <span>{employee.type_contrat || '-'}</span>
              </div>
              <div className="info-item">
                <label>Région:</label>
                <span>{employee.region}</span>
              </div>
              <div className="info-item">
                <label>Département:</label>
                <span>{employee.departement}</span>
              </div>
              <div className="info-item">
                <label>Sous-préfecture:</label>
                <span>{employee.sousPrefecture}</span>
              </div>
            </div>
          </section>

          {/* Projet & Engagement */}
          <section className="modal-section">
            <h3 className="section-title">Projet & Engagement</h3>
            <div className="info-grid">
              {employee.projets && employee.projets.length > 0 ? (
                <>
                  <div className="info-item full-width">
                    <label>Projets:</label>
                    <div style={{ marginTop: '8px' }}>
                      {employee.projets.map((projet) => (
                        <div key={projet.id} style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '4px', 
                          marginBottom: '6px',
                          fontSize: '0.95rem'
                        }}>
                          {projet.nom}
                        </div>
                      ))}
                    </div>
                  </div>
                  {employee.engagements && employee.engagements.length > 0 && (
                    <div className="info-item full-width">
                      <label>Engagements:</label>
                      <div style={{ marginTop: '8px' }}>
                        {employee.engagements.map((engagement) => (
                          <div key={engagement.id} style={{ 
                            padding: '8px 12px', 
                            backgroundColor: '#fff3e0', 
                            borderRadius: '4px', 
                            marginBottom: '6px',
                            fontSize: '0.95rem',
                            borderLeft: '3px solid #FF8C00'
                          }}>
                            <strong>{engagement.nom}</strong>
                            {engagement.description && (
                              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                {engagement.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="info-item full-width">
                  <span style={{ color: '#999', fontStyle: 'italic' }}>Aucun projet assigné</span>
                </div>
              )}
            </div>
          </section>

          {/* Historique des contrats */}
          <section className="modal-section">
            <h3 className="section-title">Historique des contrats (Expirés et En cours)</h3>
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date de début</th>
                    <th>Date de fin</th>
                    <th>Poste</th>
                    <th>Statut</th>
                    <th>Nature du Contrat</th>
                    <th>École</th>
                    <th>Statut Contrat</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={7} className="no-data">Chargement...</td>
                    </tr>
                  ) : contratHistory.length > 0 ? (
                    contratHistory.map((contrat, index) => {
                      const dateDebut = contrat.date_debut ? new Date(contrat.date_debut) : null;
                      const dateFin = contrat.date_fin ? new Date(contrat.date_fin) : null;
                      const isExpired = dateFin && dateFin < new Date();
                      const statusText = isExpired ? 'Expiré' : 'En cours';
                      
                      return (
                        <tr key={index} style={{ backgroundColor: isExpired ? '#fff3cd' : '#e8f5e9' }}>
                          <td>{dateDebut ? dateDebut.toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{dateFin ? dateFin.toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{contrat.poste_nom || contrat.poste || '-'}</td>
                          <td>{contrat.type_personne || '-'}</td>
                          <td>{contrat.type_contrat || '-'}</td>
                          <td>{contrat.ecole || '-'}</td>
                          <td style={{ fontWeight: 'bold', color: isExpired ? '#ff9800' : '#4caf50' }}>{statusText}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="no-data">Aucun historique disponible</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Historique des localisations */}
          <section className="modal-section">
            <h3 className="section-title">Historique des localisations</h3>
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date de début</th>
                    <th>Contrat</th>
                    <th>Région</th>
                    <th>Département</th>
                    <th>Sous-préfecture</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="no-data">
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#7f8c8d' }}>
                        <p style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Aucun historique disponible</p>
                        <p style={{ fontSize: '0.85rem', color: '#999' }}>L'historique des localisations sera affiché ici</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={18} />
            <span>Imprimer</span>
          </button>
          <button className="btn-close" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
