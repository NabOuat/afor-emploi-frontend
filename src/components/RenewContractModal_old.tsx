import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../styles/RenewContractModal.css';
import qualificationsData from '../assets/data/qualifications.json';
import diplomesData from '../assets/data/diplomes.json';
import ecolesData from '../assets/data/ecoles.json';
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

interface RenewContractModalProps {
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

export default function RenewContractModal({ employee, isOpen, onClose, darkMode }: RenewContractModalProps) {
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
  const acteurId = sessionStorage.getItem('acteur_id');
  
  // Déterminer si les engagements doivent être affichés selon le type d'acteur
  useEffect(() => {
    try {
      const userStr = sessionStorage.getItem('user');
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
      // Réinitialiser natureContrat quand le statut change
      setFormData(prev => ({
        ...prev,
        statut: value,
        natureContrat: '',
      }));
    } else if (name === 'dureeMois') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        dureeMois: numericValue,
      }));
      if (numericValue) {
        const months = parseInt(numericValue);
        const newDate = new Date();
        newDate.setMonth(newDate.getMonth() + months);
        setFormData(prev => ({
          ...prev,
          dateFin: newDate.toISOString().split('T')[0],
        }));
      }
    } else if (name === 'natureContrat') {
      if (value === 'CDI') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          dureeMois: '',
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          dureeMois: '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCloseWithReset = () => {
    setFormData({
      dateDebut: new Date().toISOString().split('T')[0],
      dureeMois: '',
      natureContrat: '',
      modifyTerms: false,
      statut: '',
      qualification: '',
    });
    onClose();
  };

  const handleRenew = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      // Validation
      if (formData.natureContrat !== 'CDI' && formData.natureContrat !== 'CDI à terme imprécis' && !formData.dureeMois) {
        alert('Veuillez spécifier la durée du contrat en mois');
        return;
      }
      
      // Préparer les données du contrat
      const contractData = {
        fic_personne_id: employee.id,
        poste_nom: employee.poste || null,
        categorie_poste: null,
        type_contrat: formData.natureContrat || null,
        type_personne: formData.statut || null,
        poste: formData.qualification || null,
        date_debut: formData.dateDebut || new Date().toISOString().split('T')[0],
        date_fin: formData.dureeMois ? (() => {
          const dateFr = calculateDateFin(formData.dureeMois);
          const [day, month, year] = dateFr.split('/');
          return `${year}-${month}-${day}`;
        })() : null,
        diplome: null,
        ecole: null
      };
      
      console.log('Données de reconduction envoyées:', contractData);
      
      const params = new URLSearchParams();
      if (formData.projetId) params.append('projet_id', formData.projetId);
      if (formData.engagementId) params.append('engagement_id', formData.engagementId);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`${apiUrl}/contrats/renew/${employee.id}${queryString}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });
      
      if (response.ok) {
        console.log('Contrat reconduit avec succès');
        alert('✅ Contrat reconduit avec succès!');
        onClose();
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la reconduction du contrat:', errorData);
        alert(`Erreur: ${errorData.detail || 'Impossible de reconduire le contrat'}`);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la reconduction'}`);
    }
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

        <div className="steps-indicator" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
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

          {/* Étape 1: Informations du contrat */}
          {currentStep === 1 && (
            <>
              <div className="section-title">Étape 1: Informations du contrat</div>
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

          <div className="section-title">Nouvelle reconduction</div>
          
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
                <div className="info-display">
                  <div className="info-row">
                    <span className="info-label">Date de fin estimée:</span>
                    <span className="info-value">{calculateDateFin(formData.dureeMois)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer renew-footer">
          <button className="btn-cancel" onClick={handleCloseWithReset}>
            Annuler
          </button>
          <button 
            className="btn-renew" 
            onClick={handleRenew}
            disabled={!formData.natureContrat}
          >
            Reconduire le contrat
          </button>
        </div>
      </div>
    </div>
  );
}
