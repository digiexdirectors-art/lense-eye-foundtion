import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Settings, Save, Globe, Phone, Mail, MapPin, Hash, Image as ImageIcon, Send, MessageSquare, Lock, Server } from 'lucide-react';

const SettingsPage = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    const success = await updateSettings(formData);
    if (success) {
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Failed to update settings. Please try again.');
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-container">Loading Settings...</div>;

  return (
    <div className="settings-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={32} color="var(--primary-color)" />
          Main Settings Management
        </h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}> Manage clinic branding, contact details, and tax information displayed across the platform and PDFs.</p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form glass-card" style={{ padding: '2.5rem', maxWidth: '900px' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div className="form-group">
            <label className="form-label"><Globe size={18} /> Clinic Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              placeholder="e.g. Eye Nova Clinic"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label"><ImageIcon size={18} /> Upload Logo</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="form-input"
              style={{ padding: '0.4rem' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Ensure correct format check just in case
                  if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    alert("Please upload only JPG or PNG images. (PDFs cannot process SVG/WEBP formats)");
                    e.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData({ ...formData, logoUrl: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {formData.logoUrl && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, logoUrl: '' })}
                style={{ marginTop: '0.5rem', background: '#fee2e2', color: '#991b1b', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Clear Logo
              </button>
            )}
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Slogan / Tagline</label>
            <input
              type="text"
              className="form-input"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. Premium Eye Care & Opticals"
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Phone size={18} /> Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Mail size={18} /> Business Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@eyenova.com"
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label"><MapPin size={18} /> Clinic Address</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full clinical address..."
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Hash size={18} /> GSTIN Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="07AAAAA0000A1Z5"
            />
          </div>

        </div>

        {/* Email & SMS Integration Section */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#1e293b' }}>
            <Send size={24} color="var(--primary-color)" />
            Email & SMS Integration
          </h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Configure SMTP credentials for sending login credentials to new staff/doctors and Fast2SMS API key for patient appointment SMS notifications.
          </p>

          {/* SMTP Section */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0c4a6e' }}>
              <Mail size={20} />
              SMTP Email Configuration
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Used to send login credentials when new doctors/staff are registered. Supports Gmail (App Password), Outlook, or any SMTP server.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label"><Server size={16} /> SMTP Host</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label"><Mail size={16} /> SMTP Username / Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  placeholder="clinic@gmail.com"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label"><Lock size={16} /> SMTP Password / App Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.smtpPass}
                  onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                  placeholder="••••••••••••"
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem', background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '0.6rem 1rem', borderRadius: '4px' }}>
              <p style={{ color: '#92400e', fontSize: '0.8rem', margin: 0 }}>
                <strong>Gmail Users:</strong> Use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af' }}>App Password</a> (not your regular password). Enable 2FA first, then generate an App Password.
              </p>
            </div>
          </div>

          {/* SMS Section */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#14532d' }}>
              <MessageSquare size={20} />
              SMS Configuration (Fast2SMS)
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Used to send appointment confirmation SMS to patients. Get your API key from <a href="https://www.fast2sms.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af' }}>fast2sms.com</a>.
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label"><Lock size={16} /> Fast2SMS API Key</label>
              <input
                type="password"
                className="form-input"
                value={formData.smsApiKey}
                onChange={(e) => setFormData({ ...formData, smsApiKey: e.target.value })}
                placeholder="Enter your Fast2SMS authorization key..."
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`message-banner ${message.includes('success') ? 'success' : 'error'}`} style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', background: message.includes('success') ? '#dcfce7' : '#fee2e2', color: message.includes('success') ? '#166534' : '#991b1b' }}>
            {message}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={20} />
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      <div className="settings-preview glass-card" style={{ marginTop: '3rem', padding: '2rem', maxWidth: '900px', borderLeft: '4px solid var(--primary-color)' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Live Preview (Branding)</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" style={{ maxWidth: '300px', maxHeight: '150px', objectFit: 'contain' }} /> : <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={32} color="#94a3b8" /></div>}
          <div>
            <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.5rem' }}>{formData.clinicName || 'CLINIC NAME'}</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{formData.tagline || 'Clinic Tagline'}</p>
          </div>
        </div>
      </div>

      {/* Integration Status Preview */}
      <div className="glass-card" style={{ marginTop: '1.5rem', padding: '2rem', maxWidth: '900px', borderLeft: '4px solid #16a34a' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={20} color="#16a34a" />
          Integration Status
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: formData.smtpHost && formData.smtpUser && formData.smtpPass ? '#dcfce7' : '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: formData.smtpHost && formData.smtpUser && formData.smtpPass ? '#16a34a' : '#94a3b8' }}></div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Email (SMTP)</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {formData.smtpHost && formData.smtpUser && formData.smtpPass ? `Configured — ${formData.smtpHost}` : 'Not configured — emails will be logged to console'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: formData.smsApiKey ? '#dcfce7' : '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: formData.smsApiKey ? '#16a34a' : '#94a3b8' }}></div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>SMS (Fast2SMS)</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {formData.smsApiKey ? 'Configured — SMS will be dispatched' : 'Not configured — SMS will be logged to console'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
