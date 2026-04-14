import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LogIn, Eye } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings } = useSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Because we set up the Vite Proxy, this matches our backend endpoint correctly!
      const { data } = await axios.post('/api/auth/login', { email, password });
      
      // Save global state
      login(data.user, data.token);
      
      // Send them to their dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card login-form">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" style={{ maxWidth: '280px', maxHeight: '120px', objectFit: 'contain' }} />
          ) : (
            <Eye size={72} color="var(--primary-color)" />
          )}
        </div>
        <h1>{settings.clinicName} Access</h1>
        <p>Login to the Medical Billing System</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="account@eyenova.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={20} />
                Secure Login
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
