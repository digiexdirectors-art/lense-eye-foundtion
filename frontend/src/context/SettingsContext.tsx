import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface Settings {
  clinicName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  logoUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smsApiKey: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  updateSettings: (newSettings: Settings) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    clinicName: 'EYE NOVA',
    tagline: 'PREMIUM EYE CARE & OPTICALS',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    logoUrl: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smsApiKey: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update Browser Tab Title and Favicon dynamically
  useEffect(() => {
    if (settings.clinicName) {
      document.title = `${settings.clinicName} | Eye Clinic Management`;
    }

    if (settings.logoUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoUrl;
    }
  }, [settings]);

  const updateSettings = async (newSettings: Settings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings', newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to update settings', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
           <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
           <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
