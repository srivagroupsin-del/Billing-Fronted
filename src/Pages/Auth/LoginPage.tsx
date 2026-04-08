import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginUser } from '../../api/auth';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await loginUser({ email, password });
      console.log("📡 [Login] Response:", response);

      const token = response.token || response.data?.token || response.access_token || response.data?.access_token;
      const userData = response.user || response.data?.user || (response.data && !response.data.token ? response.data : null);

      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.removeItem('token');

        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        onLogin();
        navigate('/business-select');
      } else {
        console.error("❌ [Login] Token missing in response:", response);
        alert('Login failed: Token not received. Please check backend response structure.');
      }
    } catch (error: any) {
      alert('Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="logo-icon-wrapper">
            <Shield className="logo-icon" />
          </div>
          <h1 className="login-title">Billing Manage</h1>
          <p className="login-subtitle">Admin Portal Access</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <div className="input-label-row">
              <label className="input-label">Email Address</label>
            </div>
            <div className="field-wrapper">
              <Mail className="field-icon" />
              <input
                type="email"
                required
                placeholder="admin@billflow.com"
                className="modern-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-container">
            <div className="input-label-row">
              <label className="input-label">Password</label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
            <div className="field-wrapper">
              <Lock className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="modern-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn-modern" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="spinner-min" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <footer className="login-footer">
          <p>
            Don't have an account? 
            <Link to="/register" className="signup-action">Create Account</Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
