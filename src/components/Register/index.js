import React, { useState } from 'react'; // Importing React and the useState hook for managing component state
import { useNavigate, Link } from 'react-router-dom'; // Importing navigation hook and Link component from React Router
import styles from './index.module.css'; // Importing CSS module for styling
import { BASE_URL } from '../../constants'; // Importing the base URL for API calls

// Define the Register functional component
const Register = () => {
  // --- State Management ---
  // State to store the value of the email input field
  const [email, setEmail] = useState('');
  // State to store the value of the password input field
  const [password, setPassword] = useState('');
  // State to store the value of the confirm password input field
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- React Router Hook ---
  // Hook to programmatically navigate to different routes
  const navigate = useNavigate();

  // --- Initial Render Log ---
  // This console.log will execute every time the Register component renders.
  // It's useful to see when the component mounts and re-renders.
  console.log("Register component rendered. Current state:", { email, password: password ? '********' : '', confirmPassword: confirmPassword ? '********' : '' });

  // --- Event Handler for Form Submission ---
  // Asynchronous function to handle the registration form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior (page reload)

    // --- Pre-submission Validation Log ---
    console.log("handleSubmit called. Preventing default form action.");
    console.log("Attempting registration with Email:", email, "Password (masked): ********", "Confirm Password (masked): ********");

    // --- Password Match Validation ---
    if (password !== confirmPassword) {
      // Log that passwords do not match
      console.log("Passwords do not match. Showing alert.");
      alert("Passwords don't match"); // Alert the user if passwords don't match
      return; // Stop the function execution
    } else {
      console.log("Passwords match. Proceeding with registration attempt.");
    }

    try {
      // --- API Call ---
      // Log the full API endpoint URL being used for the fetch request
      console.log("Fetching registration API at URL:", BASE_URL + '/api/users/register');
      // Make a POST request to the registration API endpoint
      const response = await fetch(BASE_URL + '/api/users/register', {
        method: 'POST', // HTTP method
        headers: {
          'Content-Type': 'application/json', // Specify content type as JSON
        },
        // Send email and password as a JSON string in the request body
        body: JSON.stringify({ email, password }),
      });

      // --- Post-API Call / Before JSON Parsing Logs ---
      // Log the raw response status from the API call
      console.log("API response received. Status:", response.status, "Status Text:", response.statusText);

      // Parse the JSON response from the server
      const data = await response.json();
      // Log the parsed data from the server, whether it's success or an error message
      console.log("Data returned from API after parsing:", data);

      // --- Conditional Logic Logs ---
      // Check if the HTTP response status is OK (e.g., 200-299)
      if (response.ok) {
        // --- Successful Registration Path ---
        console.log("Registration successful! Showing alert and navigating to login.");
        alert('Registration successful'); // Alert the user of successful registration
        navigate('/login'); // Navigate to the login page
      } else {
        // --- Registration Failed Path (Server Responded with Error) ---
        console.log("Registration failed! Server returned an error.");
        // Log the specific error message from the server if available
        console.log("Error message from server:", data.message);
        // Alert the user with the server's message or a generic failure message
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      // --- Error Handling Path (Network or Other Issue) ---
      // Log any errors that occurred during the fetch operation (e.g., network error, CORS issue)
      console.error('An error occurred during the registration process:', error);
      // Alert the user about an unexpected error
      alert('An error occurred during registration');
    }
  };

  // --- Render Method Logs ---
  // These logs help understand when input changes are being processed.
  console.log("Rendering Register form. Current email:", email, "Current password length:", password.length, "Current confirmPassword length:", confirmPassword.length);

  return (
    <div className={styles.registerContainer}>
      <h2>Register</h2> {/* Title for the registration form */}
      {/* Registration form with onSubmit handler */}
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        {/* Email input field */}
        <input
          type="email"
          placeholder="Email"
          value={email} // Controlled component: value is tied to the 'email' state
          onChange={(e) => {
            setEmail(e.target.value); // Update 'email' state on input change
            console.log("Email input changed to:", e.target.value); // Log email input changes
          }}
          required // HTML5 validation: field is required
        />
        {/* Password input field */}
        <input
          type="password"
          placeholder="Password"
          value={password} // Controlled component: value is tied to the 'password' state
          onChange={(e) => {
            setPassword(e.target.value); // Update 'password' state on input change
            console.log("Password input changed. New password length:", e.target.value.length); // Log password length (don't log actual password)
          }}
          required // HTML5 validation: field is required
        />
        {/* Confirm Password input field */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword} // Controlled component: value is tied to the 'confirmPassword' state
          onChange={(e) => {
            setConfirmPassword(e.target.value); // Update 'confirmPassword' state on input change
            console.log("Confirm Password input changed. New confirm password length:", e.target.value.length); // Log confirm password length
          }}
          required // HTML5 validation: field is required
        />
        {/* Submit button for the form */}
        <button type="submit">Register</button>
      </form>
      {/* Link to the login page for users who already have an account */}
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register; // Export the Register component for use in other parts of the application