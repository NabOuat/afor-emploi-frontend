import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../styles/EditEmployeeModal.css';
import { normalizeText } from '../utils/textNormalizer';
import diplomesData from '../assets/data/diplomes.json';
import ecolesData from '../assets/data/ecoles.json';
import qualificationsData from '../assets/data/qualifications.json';
import categoriesData from '../assets/data/categories.json';
import { shouldShowEngagements } from '../utils/engagementHelper';

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

interface EditEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
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

export default function EditEmployeeModal({ employee, isOpen, onClose, darkMode }: EditEmployeeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showEngagements, setShowEngagements] = useState(true);
  const [selectedProjet, setSelectedProjet] = useState<string>('');
  const [selectedEngagement, setSelectedEngagement] = useState<string>('');
  const acteurId = localStorage.getItem('acteur_id');
  
  const [formData, setFormData] = useState({
    nom: employee?.nom || '',
    prenom: employee?.prenom || '',
    genre: employee?.genre || 'M',
    dateNaissance: '',
    statut: employee?.statut || 'Contractuel',
    matricule: '',
    diplome: '',
    ecole: '',
    localisation: 'Au siège',
    qualification: employee?.qualification || '',
    poste: employee?.poste || '',
    categorie: '',
    natureContrat: '',
    dateDebut: '01-07-2024',
    dateFin: '',
    dureeMois: '',
    region: employee?.region || '',
    departement: employee?.departement || '',
    sousPrefecture: employee?.sousPrefecture || '',
  });

  const [customOptions, setCustomOptions] = useState({
    diplomes: (diplomesData as unknown as string[]) || [],
    ecoles: (ecolesData as unknown as string[]) || [],
    categories: (categoriesData as unknown as string[]) || ['Cadre', 'Agent', 'Technicien', 'Ouvrier'],
    postes: ['Chauffeur', 'Assistant', 'Responsable', 'Coordinateur'],
    qualifications: (qualificationsData as unknown as string[]) || ['Cadre', 'Agent', 'Spécialiste'],
  });

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

  // Charger les projets de l'employé
  useEffect(() => {
    if (isOpen && employee && acteurId) {
      const fetchProjets = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/employees/list/${acteurId}`);
          
          if (response.ok) {
            const employees = await response.json();
            const currentEmployee = employees.find((emp: any) => emp.id === employee.id);
            
            if (currentEmployee && currentEmployee.projets) {
              setProjets(currentEmployee.projets);
              // Sélectionner le premier projet par défaut
              if (currentEmployee.projets.length > 0) {
                setSelectedProjet(currentEmployee.projets[0].id);
              }
            }
          }
        } catch (err) {
          console.error('Erreur lors du chargement des projets:', err);
        }
      };
      
      fetchProjets();
    }
  }, [isOpen, employee, acteurId]);

  // Charger les engagements du projet sélectionné
  useEffect(() => {
    if (selectedProjet) {
      const fetchEngagements = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/engagements/project/${selectedProjet}`);
          
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
  }, [selectedProjet]);
  
  useEffect(() => {
    if (employee) {
      setFormData({
        nom: employee.nom || '',
        prenom: employee.prenom || '',
        genre: employee.genre || 'M',
        dateNaissance: '',
        statut: employee.statut || 'Contractuel',
        matricule: '',
        diplome: '',
        ecole: '',
        localisation: 'Au siège',
        qualification: employee.qualification || '',
        poste: employee.poste || '',
        categorie: employee.qualiteContrat || '',
        natureContrat: '',
        dateDebut: '01-07-2024',
        dateFin: '',
        dureeMois: '',
        region: employee.region || '',
        departement: employee.departement || '',
        sousPrefecture: employee.sousPrefecture || '',
      });
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    const notif = document.createElement('div');
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800'
    };
    
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${colors[type]};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    // Retirer la notification après 4 secondes
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(notif)) {
          document.body.removeChild(notif);
        }
      }, 300);
    }, 4000);
  };

  const calculateDateFin = (dateDebut: string, dureeMois: string): string => {
    if (!dateDebut || !dureeMois) return '';
    
    const [day, month, year] = dateDebut.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const months = parseInt(dureeMois);
    
    date.setMonth(date.getMonth() + months);
    
    const newDay = String(date.getDate()).padStart(2, '0');
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newYear = date.getFullYear();
    
    return `${newDay}-${newMonth}-${newYear}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'natureContrat') {
      if (value === 'CDI') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          dateFin: 'Indéterminée',
          dureeMois: '',
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          dateFin: '',
          dureeMois: '',
        }));
      }
    } else if (name === 'dureeMois') {
      const newDateFin = calculateDateFin(formData.dateDebut, value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        dateFin: newDateFin,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      // Fonction pour convertir les dates du format DD-MM-YYYY au format YYYY-MM-DD
      const convertDateToISO = (dateStr: string): string | null => {
        if (!dateStr || dateStr === 'Indéterminée') return null;
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      };
      
      // Préparer les données selon la structure backend
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.dateNaissance ? convertDateToISO(formData.dateNaissance) : null,
        genre: formData.genre,
        contact: null,
        matricule: formData.matricule || null,
        diplome: formData.diplome ? normalizeText(formData.diplome) : null,
        type_personne: formData.statut || null,
        poste_nom: formData.poste ? normalizeText(formData.poste) : null,
        categorie_poste: formData.categorie ? normalizeText(formData.categorie) : null,
        type_contrat: formData.natureContrat || null,
        poste: formData.qualification ? normalizeText(formData.qualification) : null,
        ecole: formData.ecole ? normalizeText(formData.ecole) : null,
        date_debut: formData.dateDebut ? convertDateToISO(formData.dateDebut) : null,
        date_fin: formData.dateFin && formData.dateFin !== 'Indéterminée' ? convertDateToISO(formData.dateFin) : null,
        region_id: formData.region || null,
        departement_id: formData.departement || null,
        sous_prefecture_id: formData.sousPrefecture || null,
        projets: []
      };
      
      console.log('Données envoyées:', updateData);
      
      const response = await fetch(`${apiUrl}/employees/update/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        console.log('Employé mis à jour avec succès');
        
        // Fermer le modal et réinitialiser
        handleCloseWithReset();
        
        // Afficher la notification après un court délai
        setTimeout(() => {
          showNotification('✓ Employé mis à jour avec succès!', 'success');
        }, 100);
        
        // Recharger la page après un délai
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la mise à jour:', errorData);
        showNotification(`✗ Erreur: ${errorData.detail || 'Impossible de mettre à jour l\'employé'}`, 'error');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      showNotification(`✗ Erreur: ${error.message || 'Une erreur est survenue lors de la mise à jour'}`, 'error');
    }
  };

  const handleCloseWithReset = () => {
    setCurrentStep(1);
    setFormData({
      nom: '',
      prenom: '',
      genre: 'M',
      dateNaissance: '',
      statut: 'Contractuel',
      matricule: '',
      diplome: '',
      ecole: '',
      localisation: 'Au siège',
      qualification: '',
      poste: '',
      categorie: '',
      natureContrat: '',
      dateDebut: '01-07-2024',
      dateFin: '',
      dureeMois: '',
      region: '',
      departement: '',
      sousPrefecture: '',
    });
    onClose();
  };

  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier l'employé</h2>
          <button className="modal-close" onClick={handleCloseWithReset} title="Fermer">
            <X size={24} />
          </button>
        </div>

        <div className="steps-indicator">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className={`step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="modal-body edit-body">
          {/* Step 1: Informations personnelles */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Informations personnelles</h3>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder="ADINGRA"
                />
              </div>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  placeholder="KOFFI GERMAIN"
                />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <select name="genre" value={formData.genre} onChange={handleInputChange}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleInputChange}
                  placeholder="jj/mm/aaaa"
                />
              </div>
            </div>
          )}

          {/* Step 2: Projet & Engagement */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Projet & Engagement</h3>
              
              {projets.length > 0 && (
                <div className="form-group">
                  <label>Projet</label>
                  <select value={selectedProjet} onChange={(e) => setSelectedProjet(e.target.value)}>
                    <option value="">Sélectionnez un projet</option>
                    {projets.map((p) => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {showEngagements && selectedProjet && engagements.length > 0 && (
                <div className="form-group">
                  <label>Engagement (optionnel)</label>
                  <select value={selectedEngagement} onChange={(e) => setSelectedEngagement(e.target.value)}>
                    <option value="">Aucun engagement</option>
                    {engagements.map((e) => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact & Formation */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Contact & Formation</h3>
              <div className="form-group">
                <label>Statut professionnel</label>
                <select name="statut" value={formData.statut} onChange={handleInputChange}>
                  <option value="Contractuel">Contractuel</option>
                  <option value="Fonctionnaire">Fonctionnaire</option>
                </select>
              </div>
              <div className="form-group">
                <label>Matricule</label>
                <input
                  type="text"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                  placeholder="Matricule"
                />
              </div>
              <div className="form-group">
                <label>Diplôme</label>
                <select name="diplome" value={formData.diplome} onChange={handleInputChange}>
                  <option value="">Sélectionnez un diplôme</option>
                  {customOptions.diplomes.map((d) => (
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
                        const normalizedValue = normalizeText(e.target.value);
                        setFormData(prev => ({ ...prev, diplome: normalizedValue }));
                        setCustomOptions(prev => ({
                          ...prev,
                          diplomes: [...prev.diplomes, normalizedValue],
                        }));
                      }
                    }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>École</label>
                <select name="ecole" value={formData.ecole} onChange={handleInputChange}>
                  <option value="">Sélectionnez une école</option>
                  {customOptions.ecoles.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
                {formData.ecole === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez l'école"
                    onBlur={(e) => {
                      if (e.target.value) {
                        const normalizedValue = normalizeText(e.target.value);
                        setFormData(prev => ({ ...prev, ecole: normalizedValue }));
                        setCustomOptions(prev => ({
                          ...prev,
                          ecoles: [...prev.ecoles, normalizedValue],
                        }));
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Localisation & Contrat */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Localisation & Contrat</h3>
              <div className="form-group">
                <label>Localisation</label>
                <select name="localisation" value={formData.localisation} onChange={handleInputChange}>
                  <option value="Au siège">Au siège</option>
                  <option value="À l'intérieur">À l'intérieur</option>
                </select>
              </div>
              <div className="form-group">
                <label>Qualification</label>
                <select name="qualification" value={formData.qualification} onChange={handleInputChange}>
                  <option value="">Sélectionnez une qualification</option>
                  {customOptions.qualifications.map((q) => (
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
                        const normalizedValue = normalizeText(e.target.value);
                        setFormData(prev => ({ ...prev, qualification: normalizedValue }));
                        setCustomOptions(prev => ({
                          ...prev,
                          qualifications: [...prev.qualifications, normalizedValue],
                        }));
                      }
                    }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Poste</label>
                <select name="poste" value={formData.poste} onChange={handleInputChange}>
                  <option value="">Sélectionnez un poste</option>
                  {customOptions.postes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
                {formData.poste === 'autre' && (
                  <input
                    type="text"
                    placeholder="Entrez le poste"
                    onBlur={(e) => {
                      if (e.target.value) {
                        const normalizedValue = normalizeText(e.target.value);
                        setFormData(prev => ({ ...prev, poste: normalizedValue }));
                        setCustomOptions(prev => ({
                          ...prev,
                          postes: [...prev.postes, normalizedValue],
                        }));
                      }
                    }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select name="categorie" value={formData.categorie} onChange={handleInputChange}>
                  <option value="">Sélectionnez une catégorie</option>
                  {customOptions.categories.map((c) => (
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
                        const normalizedValue = normalizeText(e.target.value);
                        setFormData(prev => ({ ...prev, categorie: normalizedValue }));
                        setCustomOptions(prev => ({
                          ...prev,
                          categories: [...prev.categories, normalizedValue],
                        }));
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 5: Dates & Confirmation */}
          {currentStep === 5 && (
            <div className="form-step">
              <h3>Contrat</h3>
              <div className="form-group">
                <label>Nature du Contrat</label>
                <select name="natureContrat" value={formData.natureContrat} onChange={handleInputChange}>
                  <option value="">Sélectionner une nature</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleInputChange}
                  placeholder="jj/mm/aaaa"
                />
              </div>
              {formData.natureContrat === 'CDI' ? (
                <div className="form-group">
                  <label>Date de fin</label>
                  <input
                    type="text"
                    value="Indéterminée"
                    disabled
                    className="disabled-input"
                  />
                </div>
              ) : formData.natureContrat && formData.natureContrat !== 'CDI' ? (
                <>
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
                  <div className="form-group">
                    <label>Date de fin (calculée automatiquement)</label>
                    <input
                      type="text"
                      value={formData.dateFin}
                      disabled
                      className="disabled-input"
                      placeholder="Sera calculée automatiquement"
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Date de fin</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Sélectionnez d'abord une nature de contrat"
                    className="disabled-input"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Récapitulatif */}
          {currentStep === 5 && (
            <div className="form-step recap-step">
              <h3>Récapitulatif des modifications</h3>
              <div className="recap-sections">
                <div className="recap-section">
                  <h4>Informations personnelles</h4>
                  <div className="recap-item">
                    <span className="recap-label">Nom:</span>
                    <span className="recap-value">{formData.nom}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Prénom:</span>
                    <span className="recap-value">{formData.prenom}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Genre:</span>
                    <span className="recap-value">{formData.genre === 'M' ? 'Masculin' : 'Féminin'}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Date de naissance:</span>
                    <span className="recap-value">{formData.dateNaissance || 'Non spécifiée'}</span>
                  </div>
                </div>

                <div className="recap-section">
                  <h4>Contact & Formation</h4>
                  <div className="recap-item">
                    <span className="recap-label">Statut professionnel:</span>
                    <span className="recap-value">{formData.statut}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Matricule:</span>
                    <span className="recap-value">{formData.matricule || 'Non spécifié'}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Diplôme:</span>
                    <span className="recap-value">{formData.diplome || 'Non spécifié'}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">École:</span>
                    <span className="recap-value">{formData.ecole || 'Non spécifiée'}</span>
                  </div>
                </div>

                <div className="recap-section">
                  <h4>Localisation & Contrat</h4>
                  <div className="recap-item">
                    <span className="recap-label">Localisation:</span>
                    <span className="recap-value">{formData.localisation}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Qualification:</span>
                    <span className="recap-value">{formData.qualification || 'Non spécifiée'}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Poste:</span>
                    <span className="recap-value">{formData.poste || 'Non spécifié'}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Catégorie:</span>
                    <span className="recap-value">{formData.categorie || 'Non spécifiée'}</span>
                  </div>
                </div>

                <div className="recap-section">
                  <h4>Contrat</h4>
                  <div className="recap-item">
                    <span className="recap-label">Nature du Contrat:</span>
                    <span className="recap-value">{formData.natureContrat || 'Non spécifiée'}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Date de début:</span>
                    <span className="recap-value">{formData.dateDebut}</span>
                  </div>
                  {formData.natureContrat !== 'CDI' && formData.dureeMois && (
                    <div className="recap-item">
                      <span className="recap-label">Durée du contrat:</span>
                      <span className="recap-value">{formData.dureeMois} mois</span>
                    </div>
                  )}
                  <div className="recap-item">
                    <span className="recap-label">Date de fin:</span>
                    <span className="recap-value">{formData.dateFin || 'Non spécifiée'}</span>
                  </div>
                </div>
              </div>
              <div className="confirmation-message">
                <p>Vérifiez l'ensemble des informations avant de confirmer les modifications.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer edit-footer">
          <button
            className="btn-prev"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft size={18} />
            Précédent
          </button>
          <div className="step-counter">
            Étape {currentStep} sur 5
          </div>
          {currentStep < 5 ? (
            <button className="btn-next" onClick={handleNextStep}>
              Suivant
              <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn-confirm" onClick={handleConfirm}>
              Confirmer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}