import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../styles/RenewContractModal.css';
import qualificationsData from '../assets/data/qualifications.json';
import diplomesData from '../assets/data/diplomes.json';
import ecolesData from '../assets/data/ecoles.json';
import categoriesData from '../assets/data/categories.json';
import { shouldShowEngagements } from '../utils/engagementHelper';
import { normalizeText } from '../utils/textNormalizer';

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  qualification: string;
  poste: string;
  statut: 'Contractuel' | 'Fonctionnaire';
  genre: 'M' | 'F';
  age: number;
  validiteContrat: string;
  qualiteContrat: string;
  region: string;
  departement: string;
  sousPrefecture: string;
}

interface RenewContractModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onSuccess?: () => void;
}

interface Projet {
  id: string;
  nom: string;
}

interface Engagement {
  id: string;
  nom: string;
  description: string;
}

export default function RenewContractModal({ employee, isOpen, onClose, darkMode, onSuccess }: RenewContractModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    dateDebut: new Date().toISOString().split('T')[0],
    dureeMois: '',
    natureContrat: '',
    modifyTerms: false,
    statut: employee?.statut || '',
    qualification: employee?.qualification || '',
    poste: employee?.poste || '',
    categorie: '',
    diplome: '',
    ecole: '',
    projetId: '',
    engagementId: '',
  });

  const [projets, setProjets] = useState<Projet[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showEngagements, setShowEngagements] = useState(true);
  const qualifications = (qualificationsData as unknown as string[]) || [];
  const diplomes = (diplomesData as unknown as string[]) || [];
  const ecoles = (ecolesData as unknown as string[]) || [];
  const categories = (categoriesData as unknown as string[]) || ['Cadre', 'Agent', 'Technicien', 'Ouvrier'];
  const acteurId = localStorage.getItem('acteur_id');

  // Ajouter les styles d'animation une seule fois au chargement du composant
  useEffect(() => {
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Déterminer si les engagements doivent être affichés selon le type d'acteur
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const actorType = user.actor_type;
        setShowEngagements(shouldShowEngagements(actorType));
      }
    } catch (err) {
      console.error('Erreur lors de la lecture du type d\'acteur:', err);
      setShowEngagements(true);
    }
  }, []);

  // Charger tous les projets de l'utilisateur
  useEffect(() => {
    if (isOpen && acteurId) {
      const fetchProjets = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/employees/projects?acteur_id=${acteurId}`);

          if (response.ok) {
            const data = await response.json();
            setProjets(Array.isArray(data) ? data : []);
            // Sélectionner le premier projet par défaut
            if (Array.isArray(data) && data.length > 0) {
              setFormData(prev => ({
                ...prev,
                projetId: data[0].id
              }));
            }
          } else {
            console.error('Erreur lors du chargement des projets');
            setProjets([]);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des projets:', err);
          setProjets([]);
        }
      };

      fetchProjets();
    }
  }, [isOpen, acteurId]);

  // Charger les engagements du projet sélectionné
  useEffect(() => {
    if (formData.projetId) {
      const fetchEngagements = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/engagements/project/${formData.projetId}`);

          if (response.ok) {
            const data = await response.json();
            setEngagements(data.engagements || []);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des engagements:', err);
        }
      };

      fetchEngagements();
    }
  }, [formData.projetId]);

  if (!isOpen || !employee) return null;

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    // Retirer la notification après 3 secondes
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(notif)) {
          document.body.removeChild(notif);
        }
      }, 300);
    }, 3000);
  };

  // Déterminer les types de contrat en fonction du statut
  const getContractTypes = () => {
    if (formData.statut === 'Fonctionnaire') {
      return ['CDI', 'CDI à terme imprécis'];
    } else if (formData.statut === 'Contractuel') {
      return ['CDD', 'CDD à terme imprécis', 'CDI', 'Stage', 'Prestation'];
    }
    return [];
  };

  const calculateDateFin = (dureeMois: string): string => {
    if (!dureeMois) return '';

    const date = new Date();
    const months = parseInt(dureeMois);
    date.setMonth(date.getMonth() + months);

    return date.toLocaleDateString('fr-FR');
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === 'statut') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        natureContrat: '',
        dureeMois: '',
      }));
    } else if (name === 'dureeMois') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCloseWithReset = () => {
    setCurrentStep(1);
    setFormData({
      dateDebut: new Date().toISOString().split('T')[0],
      dureeMois: '',
      natureContrat: '',
      modifyTerms: false,
      statut: employee?.statut || '',
      qualification: employee?.qualification || '',
      poste: employee?.poste || '',
      categorie: '',
      diplome: '',
      ecole: '',
      projetId: '',
      engagementId: '',
    });
    onClose();
  };

  const handleRenew = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

      // Validation
      if (!formData.poste) {
        showNotification('⚠️ Veuillez sélectionner un poste', 'error');
        return;
      }

      if (formData.modifyTerms && formData.natureContrat !== 'CDI' && formData.natureContrat !== 'CDI à terme imprécis' && !formData.dureeMois) {
        showNotification('⚠️ Veuillez spécifier la durée du contrat en mois', 'error');
        return;
      }

      const params = new URLSearchParams();
      if (formData.projetId) params.append('projet_id', formData.projetId);
      if (formData.engagementId) params.append('engagement_id', formData.engagementId);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      // Calculer la date de fin si durée spécifiée
      let dateFin = null;
      if (formData.modifyTerms && formData.dureeMois) {
        const date = new Date(formData.dateDebut);
        date.setMonth(date.getMonth() + parseInt(formData.dureeMois));
        dateFin = date.toISOString().split('T')[0];
      }

      const response = await fetch(`${apiUrl}/contrats/renew/${employee.id}${queryString}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fic_personne_id: employee.id,
          poste_nom: normalizeText(formData.poste) || '',
          categorie_poste: formData.categorie ? normalizeText(formData.categorie) : null,
          type_contrat: formData.modifyTerms ? formData.natureContrat : null,
          type_personne: formData.statut || null,
          poste: normalizeText(formData.poste) || '',
          date_debut: formData.dateDebut,
          date_fin: dateFin || null,
          diplome: formData.diplome ? normalizeText(formData.diplome) : null,
          ecole: formData.ecole ? normalizeText(formData.ecole) : null,
        })
      });

      if (response.ok) {
        // Fermer le modal d'abord
        handleCloseWithReset();
        
        // Afficher la notification après un court délai pour s'assurer que le modal est fermé
        setTimeout(() => {
          showNotification('✓ Contrat reconduit avec succès', 'success');
        }, 100);
        
        // Appeler le callback de succès pour recharger la liste
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        console.error('Erreur détaillée:', error);
        showNotification(`✗ Erreur: ${error.detail || 'Une erreur est survenue lors de la reconduction'}`, 'error');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      showNotification(`✗ Erreur: ${error.message || 'Une erreur est survenue lors de la reconduction'}`, 'error');
    }
  };

  const getProjectName = (projetId: string) => {
    const projet = projets.find(p => p.id === projetId);
    return projet ? projet.nom : projetId;
  };

  const getEngagementName = (engagementId: string) => {
    const engagement = engagements.find(e => e.id === engagementId);
    return engagement ? engagement.nom : engagementId;
  };

  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`} onClick={handleCloseWithReset}>
      <div className="modal-content renew-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reconduire le contrat</h2>
          <button className="modal-close" onClick={handleCloseWithReset} title="Fermer">
            <X size={24} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', padding: '0 20px' }}>
          {[1, 2, 3].map((step) => (
            <div key={step} style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: step === currentStep ? '#FF8C00' : step < currentStep ? '#4CAF50' : '#ddd',
              color: step === currentStep || step < currentStep ? 'white' : '#999',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              {step < currentStep ? '✓' : step}
            </div>
          ))}
        </div>

        <div className="modal-body renew-body">
          <div className="employee-info">
            <p><strong>{employee.prenom} {employee.nom}</strong></p>
            <p className="position">{employee.poste}</p>
          </div>

          {/* Étape 1: Informations personnelles */}
          {currentStep === 1 && (
            <>
              <div className="section-title">Étape 1: Informations personnelles</div>

              <div className="form-group">
                <label>Statut</label>
                <select name="statut" value={formData.statut} onChange={handleInputChange}>
                  <option value="">Sélectionnez un statut</option>
                  <option value="Contractuel">Contractuel</option>
                  <option value="Fonctionnaire">Fonctionnaire</option>
                </select>
              </div>

              <div className="form-group">
                <label>Qualification</label>
                <select name="qualification" value={formData.qualification} onChange={handleInputChange}>
                  <option value="">Sélectionnez une qualification</option>
                  {qualifications.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
                {formData.qualification === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez la qualification"
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, qualification: e.target.value }));
                      }
                    }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Poste</label>
                <select name="poste" value={formData.poste} onChange={handleInputChange}>
                  <option value="">Sélectionnez un poste</option>
                  <option value="Chauffeur">Chauffeur</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Responsable">Responsable</option>
                  <option value="Coordinateur">Coordinateur</option>
                  <option value="autre">Autre</option>
                </select>
                {formData.poste === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez le poste"
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, poste: e.target.value }));
                      }
                    }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <select name="categorie" value={formData.categorie} onChange={handleInputChange}>
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
                {formData.categorie === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez la catégorie"
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, categorie: e.target.value }));
                      }
                    }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Diplôme</label>
                <select name="diplome" value={formData.diplome} onChange={handleInputChange}>
                  <option value="">Sélectionnez un diplôme</option>
                  {diplomes.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
                {formData.diplome === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez le diplôme"
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, diplome: e.target.value }));
                      }
                    }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>École</label>
                <select name="ecole" value={formData.ecole} onChange={handleInputChange}>
                  <option value="">Sélectionnez une école</option>
                  {ecoles.map((ec) => (
                    <option key={ec} value={ec}>{ec}</option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
                {formData.ecole === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez l'école"
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, ecole: e.target.value }));
                      }
                    }}
                  />
                )}
              </div>
            </>
          )}

          {/* Étape 2: Projet et Engagement */}
          {currentStep === 2 && (
            <>
              <div className="section-title">Étape 2: Projet et Engagement</div>

              <div className="form-group">
                <label>Projet</label>
                <select name="projetId" value={formData.projetId} onChange={handleInputChange}>
                  <option value="">Sélectionnez un projet</option>
                  {projets.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>

              {showEngagements && formData.projetId && engagements.length > 0 && (
                <div className="form-group">
                  <label>Engagement (optionnel)</label>
                  <select name="engagementId" value={formData.engagementId} onChange={handleInputChange}>
                    <option value="">Aucun engagement</option>
                    {engagements.map((e) => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleInputChange}
                />
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="modifyTerms"
                  name="modifyTerms"
                  checked={formData.modifyTerms}
                  onChange={handleInputChange}
                />
                <label htmlFor="modifyTerms">Modifier les termes du contrat</label>
              </div>

              {formData.modifyTerms && (
                <>
                  <div className="form-group">
                    <label>Nature du contrat</label>
                    <select
                      name="natureContrat"
                      value={formData.natureContrat}
                      onChange={handleInputChange}
                    >
                      <option value="">Sélectionner une nature</option>
                      {getContractTypes().map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {formData.natureContrat && formData.natureContrat !== 'CDI' && formData.natureContrat !== 'CDI à terme imprécis' && (
                    <div className="form-group">
                      <label>Durée du contrat (en mois)</label>
                      <input
                        type="number"
                        name="dureeMois"
                        value={formData.dureeMois}
                        onChange={handleInputChange}
                        placeholder="Entrez la durée en mois"
                        min="1"
                      />
                    </div>
                  )}

                  {formData.dureeMois && (
                    <div className="form-group">
                      <label>Date de fin estimée</label>
                      <input
                        type="text"
                        value={calculateDateFin(formData.dureeMois)}
                        disabled
                        className="disabled-input"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Étape 3: Récapitulatif */}
          {currentStep === 3 && (
            <>
              <div className="section-title">Étape 3: Récapitulatif</div>

              <div style={{ backgroundColor: darkMode ? '#2d2d44' : '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: darkMode ? '#e0e0e0' : '#2c3e50' }}>Informations personnelles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><strong>Statut:</strong> {formData.statut || '-'}</div>
                  <div><strong>Qualification:</strong> {formData.qualification || '-'}</div>
                  <div><strong>Poste:</strong> {formData.poste || '-'}</div>
                  <div><strong>Catégorie:</strong> {formData.categorie || '-'}</div>
                  <div><strong>Diplôme:</strong> {formData.diplome || '-'}</div>
                  <div><strong>École:</strong> {formData.ecole || '-'}</div>
                </div>
              </div>

              <div style={{ backgroundColor: darkMode ? '#2d2d44' : '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: darkMode ? '#e0e0e0' : '#2c3e50' }}>Projet et Contrat</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><strong>Projet:</strong> {getProjectName(formData.projetId) || '-'}</div>
                  <div><strong>Engagement:</strong> {formData.engagementId ? getEngagementName(formData.engagementId) : 'Aucun'}</div>
                  <div><strong>Date de début:</strong> {new Date(formData.dateDebut).toLocaleDateString('fr-FR')}</div>
                  {formData.modifyTerms && (
                    <>
                      <div><strong>Nature du contrat:</strong> {formData.natureContrat || '-'}</div>
                      {formData.dureeMois && <div><strong>Durée:</strong> {formData.dureeMois} mois</div>}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Boutons de navigation */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              style={{
                padding: '10px 20px',
                backgroundColor: currentStep === 1 ? '#ccc' : '#FF8C00',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ChevronLeft size={18} /> Précédent
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNextStep}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF8C00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Suivant <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleRenew}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Valider la reconduction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}