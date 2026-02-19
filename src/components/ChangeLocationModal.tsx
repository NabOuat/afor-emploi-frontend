import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../styles/ChangeLocationModal.css';
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

interface ChangeLocationModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function ChangeLocationModal({ employee, isOpen, onClose, darkMode }: ChangeLocationModalProps) {
  const [formData, setFormData] = useState({
    dateDebut: new Date().toLocaleDateString('fr-FR'),
    region: '',
    departement: '',
    sousPrefecture: '',
  });

  const [projectZones, setProjectZones] = useState<{
    regions: Array<{ id: string; nom: string }>;
    departements: Array<{ id: string; nom: string; region_id: string }>;
    sous_prefectures: Array<{ id: string; nom: string; departement_id: string }>;
  }>({
    regions: [],
    departements: [],
    sous_prefectures: [],
  });

  const [employeeProjets, setEmployeeProjets] = useState<string[]>([]);
  const [selectedProjet, setSelectedProjet] = useState<string>('');
  const [selectedEngagement, setSelectedEngagement] = useState<string>('');
  const [engagements, setEngagements] = useState<Array<{id: string, nom: string, description: string}>>([]);
  const [showEngagements, setShowEngagements] = useState(true);
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

  // Charger les projets de l'employé au montage du modal
  useEffect(() => {
    if (isOpen && employee && acteurId) {
      const fetchEmployeeData = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          console.log('🔍 ChangeLocationModal - Chargement des projets pour employé:', employee.id);
          const response = await fetch(`${apiUrl}/employees/list/${acteurId}`);
          
          if (response.ok) {
            const employees = await response.json();
            const currentEmployee = employees.find((emp: any) => emp.id === employee.id);
            
            if (currentEmployee && currentEmployee.projets) {
              const projetIds = currentEmployee.projets.map((p: any) => p.id);
              console.log('✅ Projets trouvés:', projetIds);
              setEmployeeProjets(projetIds);
              // Sélectionner le premier projet par défaut
              if (projetIds.length > 0) {
                setSelectedProjet(projetIds[0]);
              }
            } else {
              console.warn('⚠️ Aucun projet trouvé pour cet employé');
            }
          } else {
            console.error('❌ Erreur API:', response.status);
          }
        } catch (err) {
          console.error('❌ Erreur lors du chargement des projets de l\'employé:', err);
        }
      };
      
      fetchEmployeeData();
    }
  }, [isOpen, employee, acteurId]);

  // Charger les zones d'intervention basées sur les projets de l'employé
  useEffect(() => {
    if (employeeProjets.length > 0 && acteurId) {
      const fetchZones = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const projetIds = employeeProjets.join(',');
          console.log('🔍 ChangeLocationModal - Chargement des zones pour projets:', projetIds, 'acteur:', acteurId);
          const response = await fetch(`${apiUrl}/zones/intervention/projects?projet_ids=${projetIds}&acteur_id=${acteurId}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Zones chargées:', data);
            setProjectZones(data);
          } else {
            console.error('❌ Erreur lors du chargement des zones - Status:', response.status);
            setProjectZones({ regions: [], departements: [], sous_prefectures: [] });
          }
        } catch (err) {
          console.error('❌ Erreur lors du chargement des zones:', err);
          setProjectZones({ regions: [], departements: [], sous_prefectures: [] });
        }
      };
      
      fetchZones();
    } else {
      console.log('⚠️ Pas de projets ou acteur_id manquant - zones vides');
      setProjectZones({ regions: [], departements: [], sous_prefectures: [] });
    }
  }, [employeeProjets, acteurId]);

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

  const handleCloseWithReset = () => {
    setFormData({
      dateDebut: new Date().toLocaleDateString('fr-FR'),
      region: '',
      departement: '',
      sousPrefecture: '',
    });
    setProjectZones({
      regions: [],
      departements: [],
      sous_prefectures: [],
    });
    setEmployeeProjets([]);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'region') {
      setFormData(prev => ({
        ...prev,
        region: value,
        departement: '',
        sousPrefecture: '',
      }));
    } else if (name === 'departement') {
      setFormData(prev => ({
        ...prev,
        departement: value,
        sousPrefecture: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Filtrer les départements selon la région sélectionnée
  const filteredDepartements = formData.region
    ? projectZones.departements.filter(d => d.region_id === formData.region)
    : projectZones.departements;

  // Filtrer les sous-préfectures selon le département sélectionné
  const filteredSousPrefectures = formData.departement
    ? projectZones.sous_prefectures.filter(sp => sp.departement_id === formData.departement)
    : projectZones.sous_prefectures;

  const handleSave = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      // Validation des champs
      if (!formData.region && !formData.departement && !formData.sousPrefecture) {
        showNotification('⚠️ Veuillez sélectionner au moins une localisation (région, département ou sous-préfecture)', 'warning');
        return;
      }
      
      // Récupérer le contrat_id de l'employé
      const employeeResponse = await fetch(`${apiUrl}/employees/list/${localStorage.getItem('acteur_id')}`);
      if (!employeeResponse.ok) {
        const errorText = await employeeResponse.text();
        console.error('Erreur API:', errorText);
        showNotification('✗ Impossible de récupérer les informations de l\'employé. Veuillez réessayer.', 'error');
        return;
      }
      
      const employees = await employeeResponse.json();
      const currentEmployee = employees.find((emp: any) => emp.id === employee.id);
      
      if (!currentEmployee) {
        showNotification('✗ Employé non trouvé dans la liste. Veuillez rafraîchir la page.', 'error');
        return;
      }
      
      if (!currentEmployee.contrat_id) {
        showNotification('✗ Aucun contrat trouvé pour cet employé. Impossible de changer la localisation.', 'error');
        return;
      }
      
      // Préparer les données de localisation
      const locationData = {
        contrat_id: currentEmployee.contrat_id,
        region_id: formData.region || null,
        departement_id: formData.departement || null,
        sous_prefecture_id: formData.sousPrefecture || null,
        date_debut: new Date().toISOString().split('T')[0]
      };
      
      console.log('Données de localisation envoyées:', locationData);
      
      const params = new URLSearchParams();
      if (selectedProjet) params.append('projet_id', selectedProjet);
      if (selectedEngagement) params.append('engagement_id', selectedEngagement);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`${apiUrl}/localisations/change/${employee.id}${queryString}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });
      
      if (response.ok) {
        console.log('Localisation modifiée avec succès');
        
        // Fermer le modal d'abord
        handleCloseWithReset();
        
        // Afficher la notification après un court délai
        setTimeout(() => {
          showNotification('✓ Localisation modifiée avec succès!', 'success');
        }, 100);
        
        // Recharger la page après un délai
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors du changement de localisation:', errorData);
        showNotification(`✗ Erreur: ${errorData.detail || 'Impossible de modifier la localisation'}`, 'error');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      showNotification(`✗ Erreur: ${error.message || 'Une erreur est survenue'}`, 'error');
    }
  };


  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`} onClick={handleCloseWithReset}>
      <div className="modal-content location-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Changer la localisation</h2>
          <button className="modal-close" onClick={handleCloseWithReset} title="Fermer">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body location-body">
          <div className="employee-info">
            <p><strong>{employee.prenom} {employee.nom}</strong></p>
            <p className="position">{employee.poste}</p>
          </div>

          {employeeProjets.length > 0 && (
            <div className="form-group">
              <label>Projet</label>
              <input
                type="text"
                value={selectedProjet}
                disabled
                className="disabled-input"
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
          )}

          {showEngagements && selectedProjet && engagements.length > 0 && (
            <div className="form-group">
              <label>Engagement (optionnel)</label>
              <input
                type="text"
                value={selectedEngagement ? engagements.find(e => e.id === selectedEngagement)?.nom || '' : 'Aucun engagement'}
                disabled
                className="disabled-input"
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
          )}

          <div className="form-group">
            <label>Date de début</label>
            <input
              type="text"
              value={formData.dateDebut}
              disabled
              className="date-input"
            />
          </div>

          <div className="form-group">
            <label>Région</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleInputChange}
            >
              <option value="">Sélectionnez une région</option>
              {projectZones.regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Département</label>
            <select
              name="departement"
              value={formData.departement}
              onChange={handleInputChange}
            >
              <option value="">Sélectionnez un département</option>
              {filteredDepartements.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Sous-préfecture</label>
            <select
              name="sousPrefecture"
              value={formData.sousPrefecture}
              onChange={handleInputChange}
            >
              <option value="">Sélectionnez une sous-préfecture</option>
              {filteredSousPrefectures.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer location-footer">
          <button className="btn-cancel" onClick={handleCloseWithReset}>
            Annuler
          </button>
          <button className="btn-save" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}