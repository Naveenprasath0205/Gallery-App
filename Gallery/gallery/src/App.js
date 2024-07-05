import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import ImageUploader from './ImageUploader';
import LoginRegister from './LoginRegister';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';

function App() {
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  const setAuthToken = (token) => {
    setToken(token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = token;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login'); // Redirect to login page
  };

  return (
      <div className="App">
        <header className="App-header">
          <h1>GALLERY</h1>
          <Routes>
            {!token ? (
              <Route path="*" element={<LoginRegister setToken={setAuthToken} />} />
            ) : (
              <>
                <Route path="/upload" element={<ImageUploader handleLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/upload" />} />
              </>
            )}
          </Routes>
        </header>
      </div>
  );
}

export default App;