import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    const cleanToken = newToken.trim().replace(/^"|"$/g, ''); // Clean token
    console.log("Storing Token in localStorage:", cleanToken);
    localStorage.setItem('token', cleanToken);
    setToken(cleanToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  console.log("Current Token in App:", token);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/profile" /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/profile"
            element={token ? <Profile token={token} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to={token ? "/profile" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;