import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './index.module.css';
import boardContext from '../../store/board-context';
import { BASE_URL } from '../../constants'; // Assuming BASE_URL is a constant for your API base URL

const Login = () => {
  // --- State Management ---
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input

  // --- React Router Hooks ---
  const navigate = useNavigate(); // Hook to programmatically navigate

  // --- Context Consumption ---
  const { isUserLoggedIn, setUserLoginStatus } = useContext(boardContext); // Accessing user login status and setter from context

  // --- Initial Render / Component Mount Log ---
  // This log will fire every time the Login component renders.
  // It's useful to see initial state and re-renders.
  console.log("Login component rendered. Current login status from context:", isUserLoggedIn);

  // --- Event Handler for Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission to avoid page reload

    // --- Pre-API Call Logs ---
    console.log("handleSubmit called. Preventing default form action.");
    console.log("Attempting login with Email:", email, "and Password:", password ? "********" : "No Password Entered"); // Mask password for security in logs

    try {
      // --- API Call ---
      // Log the full API endpoint URL being used for the fetch request
      console.log("Fetching login API at URL:", BASE_URL + '/api/users/login');
      const response = await fetch(BASE_URL + '/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // --- Post-API Call / Before JSON Parsing Logs ---
      console.log("API response received. Status:", response.status, "Status Text:", response.statusText);

      // Attempt to parse the response as JSON
      const data = await response.json();
      // Log the parsed data from the server, regardless of success or failure
      console.log("Data returned from API after parsing:", data);

      // --- Conditional Logic Logs ---
      if (response.ok) {
        // --- Successful Login Path ---
        console.log("Login successful! Response status is OK.");
        console.log("Storing token in localStorage:", data.token);
        localStorage.setItem('whiteboard_user_token', data.token); // Store token

        console.log("Updating user login status in context to TRUE.");
        setUserLoginStatus(true); // Update context

        console.log("Navigating to homepage ('/').");
        window.location.replace('/'); // Navigate to homepage
      } else {
        // --- Login Failed Path (Server Error) ---
        console.log("Login failed! Server returned an error.");
        console.log("Error message from server:", data.message);
        alert(data.message || 'Login failed'); // Show alert to user
      }
    } catch (error) {
      // --- Error Handling Path (Network/Fetch Error) ---
      console.error('An error occurred during the login process:', error); // Log the full error object
      alert('An error occurred during login'); // Show generic error to user
    }
  };

  // --- Render Method Logs ---
  // These logs help understand when state changes cause re-renders or when input changes.
  // console.log("Rendering Login form. Current email:", email, "Current password length:", password.length);

  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // console.log("Email input changed to:", e.target.value); // Log email input changes
          }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            // console.log("Password input changed. New password length:", e.target.value.length); // Log password length (don't log actual password)
          }}
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