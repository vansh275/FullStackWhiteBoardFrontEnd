import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './index.min.css';
import { useNavigate } from 'react-router-dom';
import boardContext from '../../store/board-context';
import { useParams } from 'react-router-dom';
import { BASE_URL } from '../../constants';


const Sidebar = () => {
  // --- State Variables ---
  const [canvases, setCanvases] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Context Consumption ---
  const token = localStorage.getItem('whiteboard_user_token');
  const {
    canvasId,
    setCanvasId,
    setHistory,
    isUserLoggedIn,
    setUserLoginStatus
  } = useContext(boardContext);

  // --- React Router Hooks ---
  const navigate = useNavigate();
  const { id } = useParams();

  // --- useEffect: Fetch Canvases on Login Status Change ---
  useEffect(() => {
    if (isUserLoggedIn) {
      fetchCanvases();
    } else {
      setCanvases([]);
    }
  }, [isUserLoggedIn]);


  // --- Asynchronous Function: Fetch Canvases List ---
  const fetchCanvases = async () => {
    if (!token) {
      return;
    }
    try {
      const response = await axios.get(BASE_URL + '/api/canvas/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCanvases(response.data);

      if (response.data.length === 0) {
        const newCanvas = await handleCreateCanvas();
        if (newCanvas) {
          setCanvasId(newCanvas._id);
          handleCanvasClick(newCanvas._id);
        } else {
          console.error("Failed to create a new canvas when none existed.");
        }
      } else if (!canvasId && response.data.length > 0) {
        if (!id) {
          setCanvasId(response.data[0]._id);
          handleCanvasClick(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching canvases:', error.response?.data || error.message);
    }
  };

  // --- Asynchronous Function: Create New Canvas ---
  const handleCreateCanvas = async () => {
    if (!token) {
      return null;
    }
    try {
      const response = await axios.post(BASE_URL + '/api/canvas/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCanvases();
      setCanvasId(response.data.canvasId);
      handleCanvasClick(response.data.canvasId);
      return response.data;
    } catch (error) {
      console.error('Error creating canvas:', error.response?.data || error.message);
      return null;
    }
  };

  // --- Asynchronous Function: Delete Canvas ---
  const handleDeleteCanvas = async (canvasToDeleteId) => {
    if (!token || canvases.length === 0) {
      return;
    }
    try {
      await axios.delete(`${BASE_URL}/api/canvas/delete/${canvasToDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCanvases();
      if (canvases.length > 1) {
        const newSelectedCanvasId = canvases.find(c => c._id !== canvasToDeleteId)?._id || canvases[0]?._id;
        setCanvasId(newSelectedCanvasId);
        handleCanvasClick(newSelectedCanvasId);
      } else {
        await handleCreateCanvas();
      }
    } catch (error) {
      console.error('Error deleting canvas:', error.response?.data || error.message);
    }
  };

  // --- Function: Handle Canvas Click (Navigation) ---
  const handleCanvasClick = async (canvasToNavigateId) => {
    setHistory([]);
    setCanvasId(canvasToNavigateId);
    navigate(`/${canvasToNavigateId}`);
  };

  // --- Function: Handle User Logout ---
  const handleLogout = () => {
    localStorage.removeItem('whiteboard_user_token');
    setCanvases([]);
    setUserLoginStatus(false);
    navigate('/login');
  };

  // --- Function: Handle User Login Redirect ---
  const handleLogin = () => {
    navigate('/login');
  };

  // --- Asynchronous Function: Share Canvas ---
  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }
    if (!token) {
      setError("You must be logged in to share.");
      return;
    }
    if (!canvasId) {
      setError("No canvas selected to share.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      const response = await axios.put(
        `${BASE_URL}/api/canvas/share/${canvasId}`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error('Error sharing canvas:', err.response?.data || err.message, err);
      setError(err.response?.data?.error || "Failed to share canvas.");
      setTimeout(() => setError(""), 5000);
    }
  };

  // --- Component Rendering ---
  return (
    <div className="sidebar">
      <button
        className="create-button"
        onClick={handleCreateCanvas}
        disabled={!isUserLoggedIn}
      >
        + Create New Canvas
      </button>

      <ul className="canvas-list">
        {canvases.length === 0 && isUserLoggedIn && <p>No canvases found. Create one!</p>}
        {canvases.length === 0 && !isUserLoggedIn && <p>Please log in to manage canvases.</p>}
        {canvases.map(canvas => (
          <li
            key={canvas._id}
            className={`canvas-item ${canvas._id === canvasId ? 'selected' : ''}`}
          >
            <span
              className="canvas-name"
              onClick={() => handleCanvasClick(canvas._id)}
            >
              {canvas._id}
            </span>
            <button
              className="delete-button"
              onClick={() => handleDeleteCanvas(canvas._id)}
            >
              del
            </button>
          </li>
        ))}
      </ul>

      <div className="share-container">
        <input
          type="email"
          placeholder="Enter the email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!isUserLoggedIn || !canvasId}
        />
        <button
          className="share-button"
          onClick={handleShare}
          disabled={!isUserLoggedIn || !canvasId}
        >
          Share
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

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

export default Sidebar;