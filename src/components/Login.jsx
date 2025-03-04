import { useState } from 'react';
import { login } from '../services/api'; // Assuming this is your API service

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both identifier and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await login(identifier, password);
      onLogin(token);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-app-wrapper">
      <div className="login-inner-container">
        <div className="login-board-surface">
          <div className="login-folder-card">
            <h1>Login to Your Profile</h1>

            {error && (
              <div className="login-error-text">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-input-group">
                <label htmlFor="identifier">Username or Email</label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;