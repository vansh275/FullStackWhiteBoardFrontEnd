import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './index.module.css';
import { BASE_URL } from '../../constants';

const Register = () => {
  // --- State Management ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- React Router Hook ---
  const navigate = useNavigate();

  // --- Event Handler for Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // --- Password Match Validation ---
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return; // Stop the function execution
    }

    try {
      // --- API Call ---
      const response = await fetch(BASE_URL + '/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // --- Conditional Logic ---
      if (response.ok) {
        // --- Successful Registration Path ---
        alert('Registration successful');
        navigate('/login'); // Navigate to the login page
      } else {
        // --- Registration Failed Path ---
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      // --- Error Handling Path (Network or Other Issue) ---
      // This is the only essential log for debugging critical failures.
      console.error('An error occurred during the registration process:', error);
      alert('An error occurred during registration');
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className={styles.registerForm}>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;