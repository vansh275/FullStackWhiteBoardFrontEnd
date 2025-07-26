import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './index.module.css';
import boardContext from '../../store/board-context';
import { BASE_URL } from '../../constants';

const Login = () => {
  // --- State Management ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- React Router Hooks ---
  const navigate = useNavigate();

  // --- Context Consumption ---
  const { setUserLoginStatus } = useContext(boardContext);

  // --- Event Handler for Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission to avoid page reload

    try {
      // --- API Call ---
      const response = await fetch(BASE_URL + '/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- Successful Login Path ---
        localStorage.setItem('whiteboard_user_token', data.token);
        setUserLoginStatus(true);
        window.location.replace('/'); // Navigate to homepage
      } else {
        // --- Login Failed Path (Server Error) ---
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      // --- Error Handling Path (Network/Fetch Error) ---
      // This is the only log that is essential for debugging critical failures.
      console.error('An error occurred during the login process:', error);
      alert('An error occurred during login');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;