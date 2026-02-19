import { useState, useEffect } from 'react';
import { personneAPI, contratAPI } from '../services/api';

export interface DashboardStats {
  totalPersonnes: number;
  activeContracts: number;
  expiredContracts: number;
  locations: number;
}

export interface ContractDistribution {
  label: string;
  value: number;
  percentage: number;
}

export interface GenderDistribution {
  label: string;
  value: number;
  percentage: number;
}

export const useDashboardData = (acteurId?: string, projetId?: string) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contractData, setContractData] = useState<ContractDistribution[]>([]);
  const [genderData, setGenderData] = useState<GenderDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const personnes = await personneAPI.getPersonnes(acteurId, projetId);
        const contrats = await contratAPI.getContrats();

        const now = new Date();
        const activeContrats = contrats.filter((c: any) => {
          const dateDebut = new Date(c.date_debut);
          const dateFin = c.date_fin ? new Date(c.date_fin) : null;
          return dateDebut <= now && (!dateFin || dateFin >= now);
        });

        const expiredContrats = contrats.filter((c: any) => {
          const dateFin = c.date_fin ? new Date(c.date_fin) : null;
          return dateFin && dateFin < now;
        });

        const contractTypes = contrats.reduce((acc: any, c: any) => {
          const type = c.categorie_poste || 'Autre';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const totalContracts = Object.values(contractTypes).reduce((a: number, b: any) => a + b, 0);
        const contractDistribution = Object.entries(contractTypes).map(([type, count]: [string, any]) => ({
          label: type,
          value: count,
          percentage: Math.round((count / totalContracts) * 100),
        }));

        const genders = personnes.reduce((acc: any, p: any) => {
          const gender = p.genre || 'Non spécifié';
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {});

        const totalPersonnes = personnes.length;
        const genderDistribution = Object.entries(genders).map(([gender, count]: [string, any]) => ({
          label: gender,
          value: count,
          percentage: Math.round((count / totalPersonnes) * 100),
        }));

        setStats({
          totalPersonnes,
          activeContracts: activeContrats.length,
          expiredContracts: expiredContrats.length,
          locations: new Set(personnes.map((p: any) => p.contact)).size,
        });

        setContractData(contractDistribution);
        setGenderData(genderDistribution);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
        setError(message);
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [acteurId, projetId]);

  return { stats, contractData, genderData, loading, error };
};
