import React, { useState, useEffect, useContext } from 'react'; // Importing React, state/effect hooks, and context hook
import axios from 'axios'; // Importing Axios for HTTP requests
import './index.min.css'; // Importing CSS for styling
import { useNavigate } from 'react-router-dom'; // Importing navigation hook from React Router
import boardContext from '../../store/board-context'; // Importing board context
import { useParams } from 'react-router-dom'; // Importing useParams hook to get URL parameters
import { BASE_URL } from '../../constants'; // Importing API base URL constant


const Sidebar = () => {
  // --- State Variables ---
  // State to hold the list of canvases fetched from the API
  const [canvases, setCanvases] = useState([]);
  // State for the email input field in the share section
  const [email, setEmail] = useState("");
  // State for displaying error messages to the user
  const [error, setError] = useState("");
  // State for displaying success messages to the user
  const [success, setSuccess] = useState("");

  // --- Context Consumption ---
  // Retrieving token from localStorage
  const token = localStorage.getItem('whiteboard_user_token');
  // Destructuring various values and setters from boardContext
  const {
    canvasId, // Currently selected canvas ID from context
    setCanvasId, // Function to set canvas ID in context
    setElements, // Function to clear/set elements on the board
    setHistory, // Function to clear/set history on the board
    isUserLoggedIn, // User login status from context
    setUserLoginStatus // Function to update login status in context
  } = useContext(boardContext);

  // --- React Router Hooks ---
  const navigate = useNavigate(); // Hook for programmatic navigation
  const { id } = useParams(); // Hook to get URL parameters (specifically for dynamic canvas ID in URL)

  // --- Initial Render / Debugging Logs ---
  // Log all initial state and context values on component render
  console.log("Sidebar component rendered.");
  console.log("Current isUserLoggedIn:", isUserLoggedIn);
  console.log("Current canvasId from context:", canvasId);
  console.log("Current ID from URL params (useParams):", id);
  console.log("Token from localStorage:", token ? "present" : "missing");


  // --- useEffect: Fetch Canvases on Login Status Change ---
  // This effect runs whenever 'isUserLoggedIn' changes.
  useEffect(() => {
    console.log("useEffect [isUserLoggedIn] triggered. isUserLoggedIn:", isUserLoggedIn);
    if (isUserLoggedIn) {
      console.log("User is logged in. Initiating fetchCanvases().");
      fetchCanvases(); // Call fetchCanvases if user is logged in
    } else {
      console.log("User is NOT logged in. Skipping fetchCanvases.");
      setCanvases([]); // Clear canvases if user logs out
    }
  }, [isUserLoggedIn]); // Dependency array: runs when isUserLoggedIn changes

  // --- useEffect: (Empty) - Placeholder or potentially for future use ---
  // This useEffect with an empty dependency array runs only once after the initial render.
  // Currently, it does nothing.
  useEffect(() => {
    console.log("Empty useEffect triggered. (Runs once on mount)");
  }, []);

  // --- Asynchronous Function: Fetch Canvases List ---
  const fetchCanvases = async () => {
    console.log("fetchCanvases() called.");
    if (!token) {
      console.log("No token found for fetching canvases. Skipping API call.");
      return; // Exit if no token
    }
    try {
      console.log("Attempting to fetch canvas list from:", BASE_URL + '/api/canvas/list');
      const response = await axios.get(BASE_URL + '/api/canvas/list', {
        headers: { Authorization: `Bearer ${token}` } // Include authorization token
      });
      // Log the successful response data
      console.log("Successfully fetched canvases. Response data:", response.data);
      setCanvases(response.data); // Update canvases state with fetched data

      // --- Logic for Initial Canvas Selection ---
      if (response.data.length === 0) {
        console.log("No existing canvases found. Attempting to create a new canvas.");
        //If no canvases exist, create a new one
        const newCanvas = await handleCreateCanvas(); // Await creation of new canvas
        if (newCanvas) {
          console.log("New canvas created during initial fetch:", newCanvas._id);
          setCanvasId(newCanvas._id); // Set the new canvas as current
          handleCanvasClick(newCanvas._id); // Navigate to the new canvas
        } else {
          console.error("Failed to create a new canvas when none existed.");
        }
      } else if (!canvasId && response.data.length > 0) {
        // If there are canvases but no canvasId is currently selected in context
        console.log("Canvases exist but no canvasId selected in context.");
        if (!id) { // If there's no dynamic ID in the URL
          console.log("No ID in URL. Setting first fetched canvas as default:", response.data[0]._id);
          setCanvasId(response.data[0]._id); // Set the first canvas as current
          handleCanvasClick(response.data[0]._id); // Navigate to the first canvas
        } else {
          console.log("ID already present in URL:", id, ". Not defaulting to first canvas.");
        }
      } else {
        console.log("CanvasId already set or no special handling needed.");
      }
    } catch (error) {
      // Log errors during canvas fetching
      console.error('Error fetching canvases:', error.response?.data || error.message);
    }
  };

  // --- Asynchronous Function: Create New Canvas ---
  const handleCreateCanvas = async () => {
    console.log("handleCreateCanvas() called.");
    if (!token) {
      console.log("No token found for creating canvas. Skipping API call.");
      return null;
    }
    try {
      console.log("Attempting to create new canvas at:", BASE_URL + '/api/canvas/create');
      const response = await axios.post(BASE_URL + '/api/canvas/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Log the successful response from canvas creation
      console.log("New canvas created successfully. Response data:", response.data);
      fetchCanvases(); // Re-fetch all canvases to update the list
      setCanvasId(response.data.canvasId); // Set the new canvas ID in context
      handleCanvasClick(response.data.canvasId); // Navigate to the newly created canvas
      return response.data; // Return the new canvas data
    } catch (error) {
      // Log errors during canvas creation
      console.error('Error creating canvas:', error.response?.data || error.message);
      return null; // Return null on error
    }
  };

  // --- Asynchronous Function: Delete Canvas ---
  const handleDeleteCanvas = async (canvasToDeleteId) => {
    console.log("handleDeleteCanvas() called for ID:", canvasToDeleteId);
    if (!token) {
      console.log("No token found for deleting canvas. Skipping API call.");
      return;
    }
    // Safety check: Don't delete if no canvases exist or if trying to delete a non-existent one
    if (canvases.length === 0) {
      console.warn("Attempted to delete canvas but no canvases exist.");
      return;
    }
    try {
      console.log("Attempting to delete canvas at:", `${BASE_URL}/api/canvas/delete/${canvasToDeleteId}`);
      await axios.delete(`${BASE_URL}/api/canvas/delete/${canvasToDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Canvas ${canvasToDeleteId} deleted successfully.`);
      fetchCanvases(); // Re-fetch canvases to update the list
      // After deletion, select a new default canvas if there are any left
      if (canvases.length > 1) { // If there's more than just the one we just deleted
        const newSelectedCanvasId = canvases.find(c => c._id !== canvasToDeleteId)?._id || canvases[0]?._id;
        console.log(`Setting new default canvas to ${newSelectedCanvasId}`);
        setCanvasId(newSelectedCanvasId);
        handleCanvasClick(newSelectedCanvasId);
      } else { // If no canvases left after deletion
        console.log("No canvases left after deletion. Creating a new one.");
        await handleCreateCanvas(); // Create a new canvas if none remain
      }
    } catch (error) {
      // Log errors during canvas deletion
      console.error('Error deleting canvas:', error.response?.data || error.message);
    }
  };

  // --- Function: Handle Canvas Click (Navigation) ---
  const handleCanvasClick = async (canvasToNavigateId) => {
    console.log("handleCanvasClick() called for ID:", canvasToNavigateId);
    // Clear elements and history when switching canvases
    // setElements([]);
    setHistory([]);
    // Update the canvas ID in context
    setCanvasId(canvasToNavigateId);
    // Navigate to the new canvas URL
    navigate(`/${canvasToNavigateId}`);
    console.log("Navigated to:", `/${canvasToNavigateId}`);
  };

  // --- Function: Handle User Logout ---
  const handleLogout = () => {
    console.log("handleLogout() called.");
    localStorage.removeItem('whiteboard_user_token'); // Remove token from localStorage
    setCanvases([]); // Clear local canvases state
    setUserLoginStatus(false); // Update login status in context to false
    navigate('/login'); // Navigate to the login page (or homepage)
    console.log("User logged out. Navigating to /login.");
  };

  // --- Function: Handle User Login Redirect ---
  const handleLogin = () => {
    console.log("handleLogin() called. Navigating to /login.");
    navigate('/login'); // Navigate to the login page
  };

  // --- Asynchronous Function: Share Canvas ---
  const handleShare = async () => {
    console.log("handleShare() called for canvasId:", canvasId, "with email:", email);
    if (!email.trim()) {
      setError("Please enter an email."); // Set error if email is empty
      console.warn("Share attempt failed: Email is empty.");
      return;
    }
    if (!token) {
      setError("You must be logged in to share.");
      console.warn("Share attempt failed: No token found.");
      return;
    }
    if (!canvasId) {
      setError("No canvas selected to share.");
      console.warn("Share attempt failed: No canvas selected.");
      return;
    }

    try {
      setError(""); // Clear previous errors
      setSuccess(""); // Clear previous success message
      console.log("Attempting to share canvas at:", `${BASE_URL}/api/canvas/share/${canvasId}`, "with email:", email);

      const response = await axios.put(
        `${BASE_URL}/api/canvas/share/${canvasId}`,
        { email }, // Request body with email
        {
          headers: { Authorization: `Bearer ${token}` }, // Include authorization token
        }
      );

      // Log successful share response
      console.log("Canvas shared successfully. Response:", response.data);
      setSuccess(response.data.message); // Set success message
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess("");
        console.log("Success message cleared.");
      }, 5000);
    } catch (err) {
      // Log errors during share operation
      console.error('Error sharing canvas:', err.response?.data || err.message, err);
      // Set error message from response or a generic one
      setError(err.response?.data?.error || "Failed to share canvas.");
      // Clear error message after a delay
      setTimeout(() => {
        setError("");
        console.log("Error message cleared.");
      }, 5000);
    }
  };

  // --- Component Rendering ---
  return (
    <div className="sidebar">
      {/* Create New Canvas Button */}
      <button
        className="create-button"
        onClick={handleCreateCanvas}
        disabled={!isUserLoggedIn} // Disable if user is not logged in
      >
        + Create New Canvas
      </button>

      {/* List of Canvases */}
      <ul className="canvas-list">
        {canvases.length === 0 && isUserLoggedIn && <p>No canvases found. Create one!</p>}
        {canvases.length === 0 && !isUserLoggedIn && <p>Please log in to manage canvases.</p>}
        {canvases.map(canvas => (
          <li
            key={canvas._id} // Unique key for list items
            // Add 'selected' class if this canvas is the currently active one
            className={`canvas-item ${canvas._id === canvasId ? 'selected' : ''}`}
          >
            {console.log("canvas._id ", canvas._id, " canvasId ", canvasId)}
            <span
              className="canvas-name"
              onClick={() => handleCanvasClick(canvas._id)} // Click to switch to this canvas
            >
              {canvas._id} {/* Display canvas ID as its name */}
            </span>
            <button
              className="delete-button"
              onClick={() => handleDeleteCanvas(canvas._id)} // Click to delete this canvas
            >
              del
            </button>
          </li>
        ))}
      </ul>

      {/* Share Canvas Section */}
      <div className="share-container">
        <input
          type="email"
          placeholder="Enter the email"
          value={email} // Controlled component: value tied to 'email' state
          onChange={(e) => {
            setEmail(e.target.value);
            console.log("Share email input changed to:", e.target.value); // Log email input changes
          }}
          disabled={!isUserLoggedIn || !canvasId} // Disable if not logged in or no canvas selected
        />
        <button
          className="share-button"
          onClick={handleShare}
          disabled={!isUserLoggedIn || !canvasId} // Disable if not logged in or no canvas selected
        >
          Share
        </button>
        {/* Display error and success messages */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

      {/* Login/Logout Button */}
      {isUserLoggedIn ? (
        <button className="auth-button logout-button" onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <button className="auth-button login-button" onClick={handleLogin}>
          Login
        </button>
      )}
    </div>
  );
};

export default Sidebar; // Export the Sidebar component