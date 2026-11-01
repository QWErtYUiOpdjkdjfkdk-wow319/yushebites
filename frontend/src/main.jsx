import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import { AuthProvider } from './context/authContext.jsx'

// If the server says our login token is missing/expired/invalid (401),
// clear the saved login and send the user back to the login page.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const onLoginPage = window.location.pathname === '/login';
    if (error.response?.status === 401 && !onLoginPage) {
      localStorage.removeItem('pos-user');
      localStorage.removeItem('pos-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
