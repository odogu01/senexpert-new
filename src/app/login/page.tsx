'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, getCurrentUser, getProfile, getDashboardRoute } from '@/services/authService';
import { type Profile } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  // Check if user is already logged in
  useEffect(() => {
    async function checkSession() {
      const { user } = await getCurrentUser();
      if (user) {
        // Get profile and redirect to appropriate dashboard
        const profileResponse = await getProfile(user.id);
        if (profileResponse.success && profileResponse.data) {
          const route = getDashboardRoute(profileResponse.data.role);
          router.push(route);
        } else {
          // Default to main dashboard if no profile
          router.push('/dashboard');
        }
      }
    }
    checkSession();
  }, [router]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Attempt login with Supabase
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        // Redirect to main dashboard (role-based UI is handled there)
        router.push('/dashboard');
      } else {
        // Show error message
        setError(response.error?.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #e0e5ec;
          line-height: 1.6;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
        }

        .login-card {
          background: #e0e5ec;
          border-radius: 30px;
          padding: 10px 30px 40px;
          box-shadow: 
            20px 20px 60px #bec3cf,
            -20px -20px 60px #ffffff;
          position: relative;
          transition: all 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-5px);
        }

        .login-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .neu-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 10px;
          background: #e0e5ec;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            8px 8px 20px #bec3cf,
            -8px -8px 20px #ffffff,
            inset 0 0 0 #bec3cf,
            inset 0 0 0 #ffffff;
          transition: all 0.3s ease;
          padding: 18px;
        }

        .neu-icon:hover {
          box-shadow: 
            4px 4px 10px #bec3cf,
            -4px -4px 10px #ffffff,
            inset 4px 4px 10px #bec3cf,
            inset -4px -4px 10px #ffffff;
        }

        .neu-icon img {
          width: 100%;
          height: auto;
        }

        .login-header h2 {
          color: #3d4468;
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .login-header p {
          color: #9499b7;
          font-size: 15px;
          font-weight: 400;
        }

        .form-group {
          margin-bottom: 8px;
          position: relative;
        }

        .neu-input {
          position: relative;
          background: #e0e5ec;
          border-radius: 15px;
          box-shadow: 
            inset 8px 8px 16px #bec3cf,
            inset -8px -8px 16px #ffffff;
          transition: all 0.3s ease;
        }

        .neu-input:focus-within {
          box-shadow: 
            inset 4px 4px 8px #bec3cf,
            inset -4px -4px 8px #ffffff;
        }

        .neu-input input {
          width: 100%;
          background: transparent;
          border: none;
          padding: 20px 24px 10px;
          padding-left: 55px;
          color: #3d4468;
          font-size: 16px;
          font-weight: 500;
          outline: none;
          transition: all 0.3s ease;
        }

        .neu-input input::placeholder {
          color: transparent;
        }

        .neu-input label {
          position: absolute;
          left: 55px;
          top: 50%;
          transform: translateY(-50%);
          color: #9499b7;
          font-size: 16px;
          font-weight: 400;
          pointer-events: none;
          transition: all 0.3s ease;
        }

        .neu-input input:focus ~ label,
        .neu-input input:not(:placeholder-shown) ~ label {
          top: 12px;
          font-size: 12px;
          color: #6c7293;
          transform: translateY(0);
        }

        .input-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #9499b7;
          transition: all 0.3s ease;
        }

        .input-icon svg {
          width: 100%;
          height: 100%;
        }

        .neu-input:focus-within .input-icon {
          color: #6c7293;
        }

        .password-group {
          padding-right: 50px;
        }

        .neu-toggle {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: #e0e5ec;
          border: none;
          width: 35px;
          height: 35px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9499b7;
          box-shadow: 
            4px 4px 10px #bec3cf,
            -4px -4px 10px #ffffff;
          transition: all 0.3s ease;
        }

        .neu-toggle:hover {
          color: #6c7293;
        }

        .neu-toggle:active {
          box-shadow: 
            inset 2px 2px 5px #bec3cf,
            inset -2px -2px 5px #ffffff;
        }

        .neu-toggle svg {
          width: 18px;
          height: 18px;
        }

        .eye-closed {
          display: none;
        }

        .neu-toggle.show-password .eye-open {
          display: none;
        }

        .neu-toggle.show-password .eye-closed {
          display: block;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .remember-wrapper {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .remember-wrapper input[type="checkbox"] {
          display: none;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          color: #6c7293;
          font-size: 14px;
          font-weight: 500;
        }

        .neu-checkbox {
          width: 22px;
          height: 22px;
          background: #e0e5ec;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            3px 3px 8px #bec3cf,
            -3px -3px 8px #ffffff;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .remember-wrapper input[type="checkbox"]:checked + .checkbox-label .neu-checkbox {
          box-shadow: 
            inset 2px 2px 5px #bec3cf,
            inset -2px -2px 5px #ffffff;
        }

        .neu-checkbox svg {
          width: 14px;
          height: 14px;
          color: #00c896;
          opacity: 0;
          transform: scale(0);
          transition: all 0.3s ease;
        }

        .remember-wrapper input[type="checkbox"]:checked + .checkbox-label .neu-checkbox svg {
          opacity: 1;
          transform: scale(1);
        }

        .forgot-link {
          color: #6c7293;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .forgot-link:hover {
          color: #3d4468;
        }

        .neu-button {
          width: 100%;
          background: #e0e5ec;
          border: none;
          border-radius: 15px;
          padding: 18px 32px;
          color: #3d4468;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          margin-bottom: 10px;
          box-shadow: 
            8px 8px 20px #bec3cf,
            -8px -8px 20px #ffffff;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .neu-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .neu-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            12px 12px 30px #bec3cf,
            -12px -12px 30px #ffffff;
        }

        .neu-button:hover::before {
          left: 100%;
        }

        .neu-button:active {
          transform: translateY(0);
          box-shadow: 
            inset 4px 4px 10px #bec3cf,
            inset -4px -4px 10px #ffffff;
        }

        .btn-text {
          position: relative;
          z-index: 1;
          transition: opacity 0.3s ease;
        }

        .btn-loader {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .neu-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #bec3cf;
          border-top: 3px solid #6c7293;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .neu-button.loading .btn-text {
          opacity: 0;
        }

        .neu-button.loading .btn-loader {
          opacity: 1;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          gap: 16px;
        }

        .divider-line {
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, transparent, #bec3cf, transparent);
        }

        .divider span {
          color: #9499b7;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .back-link {
          text-align: center;
        }

        .back-link a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6c7293;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .back-link a:hover {
          color: #3d4468;
        }

        .back-link svg {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 16px;
          }
          
          .login-card {
            padding: 35px 25px;
            border-radius: 20px;
          }
          
          .login-header h2 {
            font-size: 1.75rem;
          }
          
          .neu-input input {
            padding: 18px 20px 10px;
            padding-left: 50px;
          }
          
          .neu-input label,
          .neu-input input:focus ~ label,
          .neu-input input:not(:placeholder-shown) ~ label {
            left: 50px;
          }

          .form-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="neu-icon">
              <Link href="/">
                <img src="/title-logo.png" alt="SenExpert Global" />
              </Link>
            </div>
            <h2>Welcome back</h2>
            <p>Please sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Error Message */}
            {error && (
              <div className="error-message" style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#b91c1c',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <div className="neu-input">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  autoComplete="email"
                />
                <label htmlFor="email">Email address</label>
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="neu-input password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  autoComplete="current-password"
                />
                <label htmlFor="password">Password</label>
                <div className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <button 
                  type="button" 
                  className={`neu-toggle ${showPassword ? 'show-password' : ''}`}
                  onClick={handleTogglePassword}
                  aria-label="Toggle password visibility"
                >
                  <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Options */}
            <div className="form-options">
              <div className="remember-wrapper">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <label htmlFor="remember" className="checkbox-label">
                  <div className="neu-checkbox">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  Remember me
                </label>
              </div>
              <Link href="/password-reset" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className={`neu-button login-btn ${isLoading ? 'loading' : ''}`}>
              <span className="btn-text">Sign In</span>
              <div className="btn-loader">
                <div className="neu-spinner"></div>
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span>Safe and Secure Login</span>
            <div className="divider-line"></div>
          </div>

          {/* Back to Home */}
          <div className="back-link">
            <Link href="/">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
