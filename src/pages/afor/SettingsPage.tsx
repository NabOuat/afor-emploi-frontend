import { useState } from 'react';
import { Save, Lock, Palette, Shield, X } from 'lucide-react';
import '../../styles/SettingsPage.css';
import { useDarkMode } from '../../hooks/useDarkMode';

interface SettingsState {
  notifications: boolean;
  emailNotifications: boolean;
  apiKey: string;
}

interface PasswordChangeForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    emailNotifications: true,
    apiKey: 'sk_live_****',
  });

  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaveMessage('Paramètres sauvegardés avec succès!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const handlePasswordSubmit = () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    console.log('Mot de passe changé');
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setSaveMessage('Mot de passe changé avec succès!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
  };

  return (
    <div className={`settings-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="settings-header">
        <h1>Paramètres</h1>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="tab-list">
            <button
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <Palette size={20} />
              Général
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={20} />
              Sécurité
            </button>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>Paramètres Généraux</h2>
              
              <div className="setting-group">
                <div className="setting-header">
                  <label>Mode Sombre</label>
                  <p className="setting-description">Activer le mode sombre pour l'interface</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <div className="setting-header">
                  <label>Notifications Système</label>
                  <p className="setting-description">Recevoir les notifications système</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <div className="setting-header">
                  <label>Notifications Email</label>
                  <p className="setting-description">Recevoir les alertes par email</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}


          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Sécurité</h2>

              <div className="setting-group">
                <div className="setting-header">
                  <label>Changer le Mot de Passe</label>
                  <p className="setting-description">Mettre à jour votre mot de passe</p>
                </div>
                <button className="btn-secondary" onClick={() => setShowPasswordModal(true)}>
                  <Lock size={18} />
                  Changer le mot de passe
                </button>
              </div>

              <div className="setting-group">
                <div className="setting-header">
                  <label>Clé API</label>
                  <p className="setting-description">Votre clé API pour les intégrations</p>
                </div>
                <div className="api-key-display">
                  <input
                    type="password"
                    value={settings.apiKey}
                    readOnly
                    className="setting-input"
                  />
                  <button className="btn-small">Copier</button>
                </div>
              </div>
            </div>
          )}

          <div className="settings-footer">
            {saveMessage && <p className="save-message">{saveMessage}</p>}
            <button className="btn-primary" onClick={handleSave}>
              <Save size={20} />
              Sauvegarder les modifications
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Changer le Mot de Passe</h2>
              <button className="modal-close" onClick={handleClosePasswordModal} title="Fermer">
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Ancien Mot de Passe</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre ancien mot de passe"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Nouveau Mot de Passe</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre nouveau mot de passe"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Confirmer le Mot de Passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirmez votre nouveau mot de passe"
                  className="form-input"
                />
              </div>

              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleClosePasswordModal}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handlePasswordSubmit}>
                Changer le Mot de Passe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
