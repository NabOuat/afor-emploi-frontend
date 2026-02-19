import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...authService.getAuthHeader(),
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

export const geographicAPI = {
  async getRegions() {
    const response = await fetch(`${API_BASE_URL}/geographic/regions`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getDepartements(regionId?: string) {
    const url = regionId ? `${API_BASE_URL}/geographic/departements?region_id=${regionId}` : `${API_BASE_URL}/geographic/departements`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getSousPrefectures(departementId?: string) {
    const url = departementId ? `${API_BASE_URL}/geographic/sousprefectures?departement_id=${departementId}` : `${API_BASE_URL}/geographic/sousprefectures`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },
};

export const acteurAPI = {
  async getActeurs(typeActeur?: string) {
    const url = typeActeur ? `${API_BASE_URL}/acteurs?type_acteur=${typeActeur}` : `${API_BASE_URL}/acteurs`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getActeur(id: string) {
    const response = await fetch(`${API_BASE_URL}/acteurs/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createActeur(data: any) {
    const response = await fetch(`${API_BASE_URL}/acteurs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateActeur(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/acteurs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteActeur(id: string) {
    const response = await fetch(`${API_BASE_URL}/acteurs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const projetAPI = {
  async getProjets() {
    const response = await fetch(`${API_BASE_URL}/projets`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getProjet(id: string) {
    const response = await fetch(`${API_BASE_URL}/projets/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createProjet(data: any) {
    const response = await fetch(`${API_BASE_URL}/projets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateProjet(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/projets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteProjet(id: string) {
    const response = await fetch(`${API_BASE_URL}/projets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const personneAPI = {
  async getPersonnes(acteurId?: string, projetId?: string) {
    const params = new URLSearchParams();
    if (acteurId) params.append('acteur_id', acteurId);
    if (projetId) params.append('projet_id', projetId);
    const url = params.toString() ? `${API_BASE_URL}/personnes?${params}` : `${API_BASE_URL}/personnes`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getPersonne(id: string) {
    const response = await fetch(`${API_BASE_URL}/personnes/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createPersonne(data: any) {
    const response = await fetch(`${API_BASE_URL}/personnes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePersonne(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/personnes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePersonne(id: string) {
    const response = await fetch(`${API_BASE_URL}/personnes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const contratAPI = {
  async getContrats(ficPersonneId?: string) {
    const url = ficPersonneId ? `${API_BASE_URL}/contrats?fic_personne_id=${ficPersonneId}` : `${API_BASE_URL}/contrats`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getContrat(id: string) {
    const response = await fetch(`${API_BASE_URL}/contrats/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createContrat(data: any) {
    const response = await fetch(`${API_BASE_URL}/contrats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateContrat(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/contrats/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteContrat(id: string) {
    const response = await fetch(`${API_BASE_URL}/contrats/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const supervisionAPI = {
  async getSupervisions(ficPersonneId?: string) {
    const url = ficPersonneId ? `${API_BASE_URL}/supervisions?fic_personne_id=${ficPersonneId}` : `${API_BASE_URL}/supervisions`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getSupervision(id: string) {
    const response = await fetch(`${API_BASE_URL}/supervisions/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createSupervision(data: any) {
    const response = await fetch(`${API_BASE_URL}/supervisions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateSupervision(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/supervisions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteSupervision(id: string) {
    const response = await fetch(`${API_BASE_URL}/supervisions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const localisationAPI = {
  async getLocalisations(contratId?: string) {
    const url = contratId ? `${API_BASE_URL}/localisations?contrat_id=${contratId}` : `${API_BASE_URL}/localisations`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getLocalisation(id: string) {
    const response = await fetch(`${API_BASE_URL}/localisations/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createLocalisation(data: any) {
    const response = await fetch(`${API_BASE_URL}/localisations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateLocalisation(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/localisations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteLocalisation(id: string) {
    const response = await fetch(`${API_BASE_URL}/localisations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const zoneInterventionAPI = {
  async getZones(acteurId?: string, projetId?: string) {
    const params = new URLSearchParams();
    if (acteurId) params.append('acteur_id', acteurId);
    if (projetId) params.append('projet_id', projetId);
    const url = params.toString() ? `${API_BASE_URL}/zones-intervention?${params}` : `${API_BASE_URL}/zones-intervention`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getZone(id: string) {
    const response = await fetch(`${API_BASE_URL}/zones-intervention/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async createZone(data: any) {
    const response = await fetch(`${API_BASE_URL}/zones-intervention`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateZone(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/zones-intervention/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteZone(id: string) {
    const response = await fetch(`${API_BASE_URL}/zones-intervention/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export const userAPI = {
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Failed to login');
      return response.json();
    } catch (error) {
      if (email && password) {
        const demoToken = 'demo_token_' + Date.now();
        const demoUser = {
          id: '1',
          email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        return { token: demoToken, user: demoUser };
      }
      throw error;
    }
  },
};
