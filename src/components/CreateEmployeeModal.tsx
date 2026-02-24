import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { frontendLogger } from '../utils/logger';
import '../styles/CreateEmployeeModal.css';
import diplomesData from '../assets/data/diplomes.json';
import ecolesData from '../assets/data/ecoles.json';
import qualificationsData from '../assets/data/qualifications.json';
import categoriesData from '../assets/data/categories.json';
import { shouldShowEngagements } from '../utils/engagementHelper';
import { normalizeText } from '../utils/textNormalizer';

interface Projet {
  id: string;
  nom: string;
  nom_complet?: string;
}

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  acteurId?: string;
}

export default function CreateEmployeeModal({ isOpen, onClose, darkMode, acteurId }: CreateEmployeeModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [selectedProjets, setSelectedProjets] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // États pour les engagements
  const [engagementsByProjet, setEngagementsByProjet] = useState<Record<string, Array<{id: string, nom: string, description: string}>>>({});
  const [selectedEngagements, setSelectedEngagements] = useState<Record<string, string>>({});
  const [showEngagements, setShowEngagements] = useState(true);
  
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
  
  const [formData, setFormData] = useState({
    statutProfessionnel: '',
    localisation: '',
    lieuTravail: '',
    region: '',
    departement: '',
    sousPrefecture: '',
    nom: '',
    prenom: '',
    genre: 'M',
    dateNaissance: '',
    age: 0,
    matricule: '',
    contact: '',
    diplome: '',
    ecole: '',
    categorie: '',
    poste: '',
    qualification: '',
    natureContrat: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    dureeMois: '',
  });

  const [customOptions, setCustomOptions] = useState({
    diplomes: (diplomesData as unknown as string[]) || [],
    ecoles: (ecolesData as unknown as string[]) || [],
    categories: (categoriesData as unknown as string[]) || ['Cadre', 'Agent', 'Technicien', 'Ouvrier'],
    postes: ['Chauffeur', 'Assistant', 'Responsable', 'Coordinateur'],
    qualifications: (qualificationsData as unknown as string[]) || ['Cadre', 'Agent', 'Spécialiste'],
  });


  const [errors, setErrors] = useState<Record<string, string>>({});

  // État pour stocker les zones d'intervention réelles
  const [projectZones, setProjectZones] = useState<{
    regions: Array<{id: string, nom: string}>,
    departements: Array<{id: string, nom: string, region_id: string}>,
    sous_prefectures: Array<{id: string, nom: string, departement_id: string}>
  }>({
    regions: [],
    departements: [],
    sous_prefectures: []
  });

  // Charger les projets depuis l'API
  useEffect(() => {
    if (isOpen && acteurId) {
      const fetchProjets = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/employees/projects?acteur_id=${acteurId}`);
          
          if (response.ok) {
            const data = await response.json();
            setProjets(Array.isArray(data) ? data : []);
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

  // Charger les engagements quand les projets sélectionnés changent
  useEffect(() => {
    if (selectedProjets.length > 0) {
      const fetchEngagements = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const newEngagements: Record<string, Array<{id: string, nom: string, description: string}>> = {};
          
          for (const projetId of selectedProjets) {
            const response = await fetch(`${apiUrl}/engagements/project/${projetId}`);
            if (response.ok) {
              const data = await response.json();
              newEngagements[projetId] = data.engagements || [];
            }
          }
          
          setEngagementsByProjet(newEngagements);
        } catch (err) {
          console.error('Erreur lors du chargement des engagements:', err);
        }
      };
      
      fetchEngagements();
    }
  }, [selectedProjets]);

  // Charger les zones d'intervention quand les projets sélectionnés changent
  useEffect(() => {
    if (selectedProjets.length > 0 && acteurId) {
      const fetchZones = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const projetIds = selectedProjets.join(',');
          const response = await fetch(`${apiUrl}/zones/intervention/projects?projet_ids=${projetIds}&acteur_id=${acteurId}`);
          
          if (response.ok) {
            const data = await response.json();
            setProjectZones(data);
          } else {
            console.error('Erreur lors du chargement des zones');
            setProjectZones({ regions: [], departements: [], sous_prefectures: [] });
          }
        } catch (err) {
          console.error('Erreur lors du chargement des zones:', err);
          setProjectZones({ regions: [], departements: [], sous_prefectures: [] });
        }
      };
      
      fetchZones();
    } else {
      setProjectZones({ regions: [], departements: [], sous_prefectures: [] });
    }
  }, [selectedProjets, acteurId]);

  if (!isOpen) return null;

  const calculateAge = (dateNaissance: string): number => {
    if (!dateNaissance) return 0;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateDateFin = (dateDebut: string, dureeMois: string): string => {
    if (!dateDebut || !dureeMois) return '';
    const date = new Date(dateDebut);
    const months = parseInt(dureeMois);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'dateNaissance') {
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        age: age,
      }));
    } else if (name === 'localisation' && value !== 'À l\'intérieur du pays') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        region: '',
        departement: '',
        sousPrefecture: '',
      }));
    } else if (name === 'natureContrat') {
      if (value === 'CDI') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          dateFin: '',
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
    } else if (['diplome', 'ecole', 'categorie', 'poste', 'qualification'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
      // Auto-save custom option if it's a new value
      const currentOptions = customOptions[name as keyof typeof customOptions];
      if (value && Array.isArray(currentOptions) && !currentOptions.includes(value)) {
        setCustomOptions(prev => ({
          ...prev,
          [name]: [...prev[name as keyof typeof customOptions], value],
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (selectedProjets.length === 0) newErrors.projets = 'Sélectionnez au moins un projet';
    } else if (currentStep === 2) {
      // Validation de l'étape 2 : Sélection de l'engagement (optionnel)
      // Les engagements sont optionnels - pas de validation requise
      // L'utilisateur peut continuer sans sélectionner d'engagement
    } else if (currentStep === 3) {
      if (!formData.statutProfessionnel) newErrors.statutProfessionnel = 'Sélectionnez un statut';
      if (!formData.localisation) newErrors.localisation = 'Sélectionnez une localisation';
      if (formData.localisation === 'À l\'intérieur du pays') {
        if (!formData.region) newErrors.region = 'Sélectionnez une région';
        if (!formData.departement) newErrors.departement = 'Sélectionnez un département';
        if (!formData.sousPrefecture) newErrors.sousPrefecture = 'Sélectionnez une sous-préfecture';
      }
    } else if (currentStep === 4) {
      if (!formData.nom) newErrors.nom = 'Le nom est requis';
      if (!formData.prenom) newErrors.prenom = 'Le prénom est requis';
      if (!formData.dateNaissance) newErrors.dateNaissance = 'La date de naissance est requise';
      if (formData.age < 18) newErrors.age = 'L\'employé doit avoir au moins 18 ans';
      if (!formData.contact) newErrors.contact = 'Le contact est requis';
      if (!formData.diplome) newErrors.diplome = 'Sélectionnez un diplôme';
      if (!formData.ecole) newErrors.ecole = 'Sélectionnez une école';
    } else if (currentStep === 5) {
      if (!formData.categorie) newErrors.categorie = 'Sélectionnez une catégorie';
      if (!formData.poste) newErrors.poste = 'Sélectionnez un poste';
      if (!formData.qualification) newErrors.qualification = 'Sélectionnez une qualification';
      if (!formData.natureContrat) newErrors.natureContrat = 'Sélectionnez une nature de contrat';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      // Préparer les données de l'employé selon la structure de la BD
      const employeeData = {
        nom: formData.nom.toUpperCase(),
        prenom: formData.prenom,
        genre: formData.genre,
        age: formData.age || 0,
        type_personne: formData.statutProfessionnel || null,
        qualification: formData.qualification ? normalizeText(formData.qualification) : null,
        poste: formData.poste ? normalizeText(formData.poste) : null,
        categorie_poste: formData.categorie ? normalizeText(formData.categorie) : null,
        type_contrat: formData.natureContrat || null,
        diplome: formData.diplome ? normalizeText(formData.diplome) : null,
        ecole: formData.ecole ? normalizeText(formData.ecole) : null,
        date_debut: formData.dateDebut || null,
        date_fin: formData.dateFin && formData.dateFin !== '' ? formData.dateFin : null,
        region_id: formData.region && formData.region !== '' ? formData.region : null,
        departement_id: formData.departement && formData.departement !== '' ? formData.departement : null,
        sous_prefecture_id: formData.sousPrefecture && formData.sousPrefecture !== '' ? formData.sousPrefecture : null,
        projets: selectedProjets.map(projetId => ({
          projet_id: projetId,
          engagement_id: selectedEngagements[projetId] || null
        })),
        projet_id: selectedProjets.length > 0 ? selectedProjets[0] : null,
        engagement_id: selectedProjets.length > 0 ? selectedEngagements[selectedProjets[0]] : null,
      };
      
      // Logger la requête
      console.log('🔍 DONNÉES ENVOYÉES À L\'API:', JSON.stringify(employeeData, null, 2));
      console.log('🔍 formData.poste:', formData.poste);
      console.log('🔍 formData.categorie:', formData.categorie);
      console.log('🔍 formData.ecole:', formData.ecole);
      console.log('🔍 formData.qualification:', formData.qualification);
      frontendLogger.logEmployeeCreation(employeeData);
      frontendLogger.logApiRequest('POST', '/employees/create', employeeData);
      
      const response = await fetch(`${apiUrl}/employees/create?acteur_id=${acteurId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });
      
      if (response.ok) {
        const result = await response.json();
        frontendLogger.logApiResponse('/employees/create', response.status, result);
        frontendLogger.info('EMPLOYEE_CREATE', `Employé ${result.nom} ${result.prenom} créé avec succès`, result);
        setSuccessMessage(`✅ Employé ${result.nom} ${result.prenom} créé avec succès!`);
        
        // Fermer le modal après 2 secondes et rafraîchir la page
        setTimeout(() => {
          resetForm();
          setSuccessMessage(null);
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        frontendLogger.logApiResponse('/employees/create', response.status, errorData);
        frontendLogger.error('EMPLOYEE_CREATE', `Erreur ${response.status}`, errorData);
        
        // Afficher les détails de l'erreur de validation
        let errorMessage = 'Erreur lors de la création de l\'employé';
        if (response.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => 
              `${err.loc?.join('.') || 'Champ'}: ${err.msg}`
            ).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        setError(errorMessage);
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (err: any) {
      frontendLogger.error('EMPLOYEE_CREATE', 'Exception lors de la création', err);
      const errorMsg = err.message || 'Erreur lors de la création de l\'employé';
      setError(errorMsg);
      alert(`Erreur: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProjet = (projetId: string) => {
    setSelectedProjets(prev =>
      prev.includes(projetId)
        ? prev.filter(id => id !== projetId)
        : [...prev, projetId]
    );
  };

  const handleCarouselNext = () => {
    if (carouselIndex < projets.length - 1) {
      setCarouselIndex(carouselIndex + 1);
    }
  };

  const handleCarouselPrev = () => {
    if (carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedProjets([]);
    setSelectedEngagements({});
    setEngagementsByProjet({});
    setCarouselIndex(0);
    setFormData({
      statutProfessionnel: '',
      localisation: '',
      lieuTravail: '',
      region: '',
      departement: '',
      sousPrefecture: '',
      nom: '',
      prenom: '',
      genre: 'M',
      dateNaissance: '',
      age: 0,
      matricule: '',
      contact: '',
      diplome: '',
      ecole: '',
      categorie: '',
      poste: '',
      qualification: '',
      natureContrat: '',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      dureeMois: '',
    });
    setErrors({});
  };

  // Déterminer les types de contrat en fonction du statut
  const getContractTypes = () => {
    if (formData.statutProfessionnel === 'Fonctionnaire') {
      return ['CDI', 'CDI à terme imprécis'];
    } else if (formData.statutProfessionnel === 'Contractuel') {
      return ['CDD', 'CDI', 'Stage', 'Prestation'];
    }
    return [];
  };

  // Filtrer les départements et sous-préfectures en fonction de la sélection
  const filteredDepartements = formData.region 
    ? projectZones.departements.filter(d => d.region_id === formData.region)
    : projectZones.departements;
  
  const filteredSousPrefectures = formData.departement
    ? projectZones.sous_prefectures.filter(sp => sp.departement_id === formData.departement)
    : projectZones.sous_prefectures;

  const diplomes = customOptions.diplomes;
  const ecoles = customOptions.ecoles;

  return (
    <div className={`modal-overlay ${darkMode ? 'dark-mode' : ''}`} onClick={onClose}>
      {/* Notification de succès */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '16px 20px',
          color: '#155724',
          fontSize: '0.95em',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 10000,
          animation: 'slideIn 0.3s ease-out',
          maxWidth: '400px'
        }}>
          {successMessage}
        </div>
      )}
      
      <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer un nouvel employé</h2>
          <button className="modal-close" onClick={() => { resetForm(); onClose(); }} title="Fermer">
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
        
        <div style={{ textAlign: 'center', fontSize: '0.9em', color: '#666', marginBottom: '20px' }}>
          Étape {currentStep} sur 5
        </div>

        <div className="modal-body create-body">
          {/* Step 1: Sélection des projets avec slider horizontal */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Sélectionnez les projets</h3>
              <p style={{ marginBottom: '30px', color: '#666' }}>Vous pouvez sélectionner un ou plusieurs projets</p>
              
              {projets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p>Aucun projet disponible</p>
                </div>
              ) : (
                <div>
                  {/* Slider horizontal */}
                  <div style={{ position: 'relative', marginBottom: '30px' }}>
                    {/* Bouton précédent */}
                    <button 
                      onClick={handleCarouselPrev}
                      disabled={carouselIndex === 0}
                      style={{
                        position: 'absolute',
                        left: '-50px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: carouselIndex === 0 ? 'not-allowed' : 'pointer',
                        padding: '10px',
                        opacity: carouselIndex === 0 ? 0.3 : 1,
                        transition: 'opacity 0.3s ease',
                        zIndex: 10
                      }}
                    >
                      <ChevronLeft size={28} color="#FF8C00" />
                    </button>

                    {/* Container du slider */}
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      padding: '10px 0',
                      scrollBehavior: 'smooth',
                      scrollSnapType: 'x mandatory',
                      WebkitOverflowScrolling: 'touch',
                    }}>
                      {projets.map((projet) => (
                        <div
                          key={projet.id}
                          onClick={() => toggleProjet(projet.id)}
                          style={{
                            minWidth: '280px',
                            padding: '20px',
                            border: selectedProjets.includes(projet.id) ? '3px solid #FF8C00' : '2px solid #ddd',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            backgroundColor: selectedProjets.includes(projet.id) 
                              ? darkMode ? '#3a3a52' : '#fff3e0'
                              : darkMode ? '#1a1a2e' : '#fff',
                            transition: 'all 0.3s ease',
                            boxShadow: selectedProjets.includes(projet.id) 
                              ? '0 4px 12px rgba(255, 140, 0, 0.3)'
                              : '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transform: selectedProjets.includes(projet.id) ? 'translateY(-5px)' : 'translateY(0)',
                            scrollSnapAlign: 'start',
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={selectedProjets.includes(projet.id)}
                              onChange={() => toggleProjet(projet.id)}
                              style={{
                                marginTop: '4px',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#FF8C00'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <strong style={{ 
                                fontSize: '1.1em',
                                color: darkMode ? '#e0e0e0' : '#2c3e50',
                                display: 'block',
                                marginBottom: '8px'
                              }}>
                                {projet.nom}
                              </strong>
                              {projet.nom_complet && (
                                <p style={{
                                  fontSize: '0.9em',
                                  color: darkMode ? '#aaa' : '#666',
                                  margin: '0',
                                  lineHeight: '1.4'
                                }}>
                                  {projet.nom_complet}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedProjets.includes(projet.id) && (
                            <div style={{
                              marginTop: '12px',
                              padding: '8px 12px',
                              backgroundColor: '#FF8C00',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '0.85em',
                              fontWeight: '600',
                              textAlign: 'center'
                            }}>
                              ✓ Sélectionné
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bouton suivant */}
                    <button 
                      onClick={handleCarouselNext}
                      disabled={carouselIndex === projets.length - 1}
                      style={{
                        position: 'absolute',
                        right: '-50px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: carouselIndex === projets.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '10px',
                        opacity: carouselIndex === projets.length - 1 ? 0.3 : 1,
                        transition: 'opacity 0.3s ease',
                        zIndex: 10
                      }}
                    >
                      <ChevronRight size={28} color="#FF8C00" />
                    </button>
                  </div>

                  {/* Résumé des projets sélectionnés */}
                  {selectedProjets.length > 0 && (
                    <div style={{
                      padding: '15px',
                      backgroundColor: darkMode ? '#2d2d44' : '#e7f3ff',
                      border: '2px solid #FF8C00',
                      borderRadius: '8px',
                      marginTop: '20px'
                    }}>
                      <strong style={{ color: darkMode ? '#e0e0e0' : '#2c3e50' }}>
                        Projets sélectionnés ({selectedProjets.length}):
                      </strong>
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedProjets.map(projetId => {
                          const projet = projets.find(p => p.id === projetId);
                          return projet ? (
                            <span key={projetId} style={{
                              backgroundColor: '#FF8C00',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.9em',
                              fontWeight: '600'
                            }}>
                              {projet.nom}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {errors.projets && <span className="error-message">{errors.projets}</span>}
            </div>
          )}

          {/* Step 2: Sélection de l'engagement par projet (optionnel) - Affichage conditionnel selon type d'acteur */}
          {showEngagements && currentStep === 2 && (
            <div className="form-step">
              <h3>Sélectionnez l'engagement par projet (optionnel)</h3>
              
              {selectedProjets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p>⚠️ Veuillez d'abord sélectionner au moins un projet (Étape 1)</p>
                </div>
              ) : (
                <div>
                  {selectedProjets.map((projetId) => {
                    const projet = projets.find(p => p.id === projetId);
                    const engagements = engagementsByProjet[projetId] || [];
                    
                    return (
                      <div key={projetId} style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? '#2d2d44' : '#f5f5f5', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '15px', color: darkMode ? '#e0e0e0' : '#2c3e50' }}>
                          {projet?.nom}
                        </h4>
                        
                        {engagements.length === 0 ? (
                          <p style={{ color: '#999', fontStyle: 'italic' }}>Aucun engagement disponible pour ce projet</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              padding: '12px',
                              backgroundColor: darkMode ? '#1a1a2e' : 'white',
                              border: !selectedEngagements[projetId] ? '2px solid #FF8C00' : '1px solid #ddd',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}>
                              <input
                                type="radio"
                                name={`engagement-${projetId}`}
                                value=""
                                checked={!selectedEngagements[projetId]}
                                onChange={() => {
                                  setSelectedEngagements(prev => ({
                                    ...prev,
                                    [projetId]: ''
                                  }));
                                }}
                                style={{ marginRight: '12px', marginTop: '2px' }}
                              />
                              <span style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Aucun engagement</span>
                            </label>
                            {engagements.map((engagement) => (
                              <label key={engagement.id} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                padding: '12px',
                                backgroundColor: darkMode ? '#1a1a2e' : 'white',
                                border: selectedEngagements[projetId] === engagement.id ? '2px solid #FF8C00' : '1px solid #ddd',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}>
                                <input
                                  type="radio"
                                  name={`engagement-${projetId}`}
                                  value={engagement.id}
                                  checked={selectedEngagements[projetId] === engagement.id}
                                  onChange={(e) => {
                                    setSelectedEngagements(prev => ({
                                      ...prev,
                                      [projetId]: e.target.value
                                    }));
                                  }}
                                  style={{ marginRight: '12px', marginTop: '2px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <strong style={{ color: darkMode ? '#e0e0e0' : '#2c3e50' }}>
                                    {engagement.nom}
                                  </strong>
                                  {engagement.description && (
                                    <p style={{
                                      margin: '6px 0 0 0',
                                      fontSize: '0.9em',
                                      color: darkMode ? '#aaa' : '#666',
                                      lineHeight: '1.4'
                                    }}>
                                      {engagement.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-step">
              <h3>Informations de base</h3>
              
              <div className="form-group">
                <label>Statut professionnel</label>
                <select name="statutProfessionnel" value={formData.statutProfessionnel} onChange={handleInputChange}>
                  <option value="">Sélectionnez un statut</option>
                  <option value="Fonctionnaire">Fonctionnaire</option>
                  <option value="Contractuel">Contractuel</option>
                </select>
                {errors.statutProfessionnel && <span className="error-message">{errors.statutProfessionnel}</span>}
              </div>

              <div className="form-group">
                <label>Localisation</label>
                <select name="localisation" value={formData.localisation} onChange={handleInputChange}>
                  <option value="">Sélectionnez une localisation</option>
                  <option value="Au siège">Au siège</option>
                  <option value="À l'intérieur du pays">À l'intérieur du pays</option>
                </select>
                {errors.localisation && <span className="error-message">{errors.localisation}</span>}
              </div>

              {formData.localisation === 'À l\'intérieur du pays' && (
                <>
                  {selectedProjets.length === 0 ? (
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '6px', 
                      color: '#856404',
                      fontSize: '0.9rem',
                      marginBottom: '1rem'
                    }}>
                      ⚠️ Sélectionnez d'abord un ou plusieurs projets (Étape 1) pour voir les localisations disponibles
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Région</label>
                        <select name="region" value={formData.region} onChange={handleInputChange}>
                          <option value="">Sélectionnez une région</option>
                          {projectZones.regions.map((r) => (
                            <option key={r.id} value={r.id}>{r.nom}</option>
                          ))}
                        </select>
                        {errors.region && <span className="error-message">{errors.region}</span>}
                      </div>

                      <div className="form-group">
                        <label>Département</label>
                        <select name="departement" value={formData.departement} onChange={handleInputChange}>
                          <option value="">Sélectionnez un département</option>
                          {filteredDepartements.map((d) => (
                            <option key={d.id} value={d.id}>{d.nom}</option>
                          ))}
                        </select>
                        {errors.departement && <span className="error-message">{errors.departement}</span>}
                      </div>

                      <div className="form-group">
                        <label>Sous-préfecture</label>
                        <select name="sousPrefecture" value={formData.sousPrefecture} onChange={handleInputChange}>
                          <option value="">Sélectionnez une sous-préfecture</option>
                          {filteredSousPrefectures.map((sp) => (
                            <option key={sp.id} value={sp.id}>{sp.nom}</option>
                          ))}
                        </select>
                        {errors.sousPrefecture && <span className="error-message">{errors.sousPrefecture}</span>}
                      </div>

                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#e8f4f8', 
                        borderRadius: '6px', 
                        color: '#0c5460',
                        fontSize: '0.85rem',
                        marginTop: '1rem'
                      }}>
                        📍 <strong>Projets sélectionnés:</strong> {selectedProjets.map(id => projets.find(p => p.id === id)?.nom).filter(Boolean).join(', ')}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 4: Informations personnelles et contact */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Informations personnelles</h3>
              
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder="Entrez le nom"
                />
                {errors.nom && <span className="error-message">{errors.nom}</span>}
              </div>

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  placeholder="Entrez le prénom"
                />
                {errors.prenom && <span className="error-message">{errors.prenom}</span>}
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
                />
                {errors.dateNaissance && <span className="error-message">{errors.dateNaissance}</span>}
                {formData.dateNaissance && (
                  <div className="age-display">
                    <span className="age-label">Âge:</span>
                    <span className={`age-value ${formData.age < 18 ? 'invalid' : 'valid'}`}>
                      {formData.age} ans
                    </span>
                  </div>
                )}
                {errors.age && <span className="error-message">{errors.age}</span>}
              </div>

              <div className="form-group">
                <label>Matricule</label>
                <input
                  type="text"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                  placeholder="Entrez le matricule"
                />
                {errors.matricule && <span className="error-message">{errors.matricule}</span>}
              </div>

              <div className="form-group">
                <label>Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Entrez le contact"
                />
                {errors.contact && <span className="error-message">{errors.contact}</span>}
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
                {errors.diplome && <span className="error-message">{errors.diplome}</span>}
              </div>

              <div className="form-group">
                <label>École</label>
                <select name="ecole" value={formData.ecole} onChange={handleInputChange}>
                  <option value="">Sélectionnez une école</option>
                  {ecoles.map((e) => (
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
                {errors.ecole && <span className="error-message">{errors.ecole}</span>}
              </div>
            </div>
          )}

          {/* Step 5: Contrat */}
          {currentStep === 5 && (
            <div className="form-step">
              <h3>Informations du contrat</h3>
              
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
                        setFormData(prev => ({ ...prev, categorie: e.target.value }));
                        setCustomOptions(prev => ({
                          ...prev,
                          categories: [...prev.categories, e.target.value],
                        }));
                      }
                    }}
                  />
                )}
                {errors.categorie && <span className="error-message">{errors.categorie}</span>}
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
                        setFormData(prev => ({ ...prev, poste: e.target.value }));
                        setCustomOptions(prev => ({
                          ...prev,
                          postes: [...prev.postes, e.target.value],
                        }));
                      }
                    }}
                  />
                )}
                {errors.poste && <span className="error-message">{errors.poste}</span>}
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
                        setFormData(prev => ({ ...prev, qualification: e.target.value }));
                        setCustomOptions(prev => ({
                          ...prev,
                          qualifications: [...prev.qualifications, e.target.value],
                        }));
                      }
                    }}
                  />
                )}
                {errors.qualification && <span className="error-message">{errors.qualification}</span>}
              </div>

              <div className="form-group">
                <label>Nature du contrat</label>
                {!formData.statutProfessionnel ? (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '6px', 
                    color: '#856404',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ Sélectionnez d'abord un statut professionnel (Étape 2)
                  </div>
                ) : (
                  <select name="natureContrat" value={formData.natureContrat} onChange={handleInputChange}>
                    <option value="">Sélectionnez une nature</option>
                    {getContractTypes().map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
                {errors.natureContrat && <span className="error-message">{errors.natureContrat}</span>}
              </div>

              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleInputChange}
                />
              </div>

              {formData.natureContrat === 'CDI' || formData.natureContrat === 'CDI à terme imprécis' ? (
                <div className="form-group">
                  <label>Date de fin</label>
                  <input
                    type="text"
                    value="Indéterminée"
                    disabled
                    className="disabled-input"
                  />
                </div>
              ) : formData.natureContrat ? (
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
              ) : null}
            </div>
          )}

          {/* Step 5: Récapitulatif */}
          {currentStep === 5 && (
            <div className="form-step recap-step">
              <h3>Récapitulatif</h3>
              <div className="recap-sections">
                <div className="recap-section">
                  <h4>Projets sélectionnés</h4>
                  <div className="recap-item">
                    <span className="recap-label">Projets ({selectedProjets.length}):</span>
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedProjets.map(projetId => {
                        const projet = projets.find(p => p.id === projetId);
                        return projet ? (
                          <span key={projetId} style={{ 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            padding: '5px 10px', 
                            borderRadius: '4px',
                            fontSize: '0.9em'
                          }}>
                            {projet.nom}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="recap-section">
                  <h4>Localisation</h4>
                  <div className="recap-item">
                    <span className="recap-label">Statut professionnel:</span>
                    <span className="recap-value">{formData.statutProfessionnel}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Localisation:</span>
                    <span className="recap-value">{formData.localisation}</span>
                  </div>
                  {formData.localisation === 'À l\'intérieur du pays' && (
                    <>
                      <div className="recap-item">
                        <span className="recap-label">Région:</span>
                        <span className="recap-value">{formData.region}</span>
                      </div>
                      <div className="recap-item">
                        <span className="recap-label">Département:</span>
                        <span className="recap-value">{formData.departement}</span>
                      </div>
                      <div className="recap-item">
                        <span className="recap-label">Sous-préfecture:</span>
                        <span className="recap-value">{formData.sousPrefecture}</span>
                      </div>
                    </>
                  )}
                </div>

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
                    <span className="recap-label">Âge:</span>
                    <span className="recap-value">{formData.age} ans</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Matricule:</span>
                    <span className="recap-value">{formData.matricule}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Contact:</span>
                    <span className="recap-value">{formData.contact}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Diplôme:</span>
                    <span className="recap-value">{formData.diplome}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">École:</span>
                    <span className="recap-value">{formData.ecole}</span>
                  </div>
                </div>

                <div className="recap-section">
                  <h4>Contrat</h4>
                  <div className="recap-item">
                    <span className="recap-label">Catégorie:</span>
                    <span className="recap-value">{formData.categorie}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Poste:</span>
                    <span className="recap-value">{formData.poste}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Qualification:</span>
                    <span className="recap-value">{formData.qualification}</span>
                  </div>
                  <div className="recap-item">
                    <span className="recap-label">Nature du contrat:</span>
                    <span className="recap-value">{formData.natureContrat}</span>
                  </div>
                </div>
              </div>
              <div className="confirmation-message">
                <p>Vérifiez l'ensemble des informations avant de créer l'employé. Si vous souhaitez apporter des modifications, utilisez les boutons de navigation.</p>
              </div>
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  color: '#721c24',
                  marginTop: '15px',
                  fontSize: '0.9em'
                }}>
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer create-footer">
          <button
            className="btn-prev"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft size={18} />
            Précédent
          </button>
          <div className="step-counter">
            Étape {currentStep} sur 5
          </div>
          {currentStep < 5 ? (
            <button className="btn-next" onClick={handleNextStep} disabled={isLoading}>
              Suivant
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              className="btn-confirm" 
              onClick={handleConfirm}
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '⏳ Création en cours...' : 'Créer l\'employé'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
