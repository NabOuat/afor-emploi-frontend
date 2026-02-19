import { useState, useEffect } from 'react';
import type { User } from '../types';
import { userAPI } from '../services/api';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setUser(userData);
      setFormData(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const updated = await userAPI.updateProfile(formData);
      setUser(updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) return <div className="profile-page"><p>Chargement...</p></div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.firstName} />
            ) : (
              <div className="avatar-placeholder">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{user?.firstName} {user?.lastName}</h1>
            <p className="email">{user?.email}</p>
            <button 
              className="edit-btn"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>

        <div className="profile-content">
          {editing ? (
            <form className="edit-form">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Localisation</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <button type="button" className="save-btn" onClick={handleSave}>
                Enregistrer les modifications
              </button>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-section">
                <h3>Informations personnelles</h3>
                <p><strong>Email :</strong> {user?.email}</p>
                <p><strong>Téléphone :</strong> {user?.phone || 'Non renseigné'}</p>
                <p><strong>Localisation :</strong> {user?.location || 'Non renseignée'}</p>
              </div>

              <div className="detail-section">
                <h3>À propos</h3>
                <p>{user?.bio || 'Aucune bio renseignée'}</p>
              </div>

              <div className="detail-section">
                <h3>Expérience</h3>
                <p>{user?.experience || 0} ans d'expérience</p>
              </div>

              {user?.skills && user.skills.length > 0 && (
                <div className="detail-section">
                  <h3>Compétences</h3>
                  <div className="skills-list">
                    {user.skills.map((skill, idx) => (
                      <span key={idx} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
