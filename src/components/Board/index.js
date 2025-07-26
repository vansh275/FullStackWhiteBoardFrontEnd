import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs"; // Library for drawing sketchy-style graphics
import boardContext from "../../store/board-context"; // Context for managing board elements and actions
import { TOOL_ACTION_TYPES, TOOL_ITEMS, BASE_URL } from "../../constants"; // Constants for tool types and API base URL
import toolboxContext from "../../store/toolbox-context"; // Context for managing toolbox state (e.g., current tool, color)
import socket from "../../utils/socket"; // Socket.io client for real-time communication

import classes from "./index.module.css"; // CSS module for styling

import {
  getSvgPathFromStroke, // Helper function to convert stroke points to SVG path
} from "../../utils/element";
import getStroke from "perfect-freehand"; // Library for drawing smooth freehand lines
import axios from "axios"; // HTTP client for making API requests

// Define the Board functional component, which receives 'id' as a prop
function Board({ id }) {
  // --- Refs ---
  const canvasRef = useRef(); // Ref to access the HTML canvas element directly
  const textAreaRef = useRef(); // Ref to access the HTML textarea element directly

  // --- Initial Prop Log ---
  // Log the 'id' prop received by the Board component (useful to see if it's undefined or a specific ID)
  console.log("Board component mounted/re-rendered. Current ID prop:", id);

  // --- Context Consumption ---
  // Destructuring various values and functions from boardContext
  const {
    elements, // Array of all drawing elements on the board
    toolActionType, // Current action being performed (e.g., drawing, writing)
    boardMouseDownHandler, // Handler for mouse down events on the board
    boardMouseMoveHandler, // Handler for mouse move events on the board
    boardMouseUpHandler, // Handler for mouse up events on the board
    textAreaBlurHandler, // Handler for when the textarea loses focus
    undo, // Function to undo the last action
    redo, // Function to redo the last undone action
    setCanvasId, // Function to set the current canvas ID in context
    setElements, // Function to update the elements array in context
    setHistory // Function to update the history stack in context
  } = useContext(boardContext);

  // Destructuring toolboxState from toolboxContext
  const { toolboxState } = useContext(toolboxContext);

  // Retrieve user token from localStorage
  const token = localStorage.getItem("whiteboard_user_token");
  // Log the retrieved token (will be null if not present)
  console.log("Retrieved token from localStorage:", token ? "Token Found" : "No Token Found");


  // --- State for Authorization ---
  const [isAuthorized, setIsAuthorized] = useState(true); // State to manage user authorization for editing

  // --- Effect for Socket.io Communication (Real-time updates) ---
  // This useEffect runs when the 'id' prop changes.
  useEffect(() => {
    // Log when this effect runs and what 'id' it's reacting to
    console.log("Socket.io useEffect running. ID:", id);

    if (id) {
      // --- Socket Emit: Join Canvas ---
      // Emit 'joinCanvas' event to the server to join a specific canvas room
      setCanvasId(id);
      console.log("Emitting 'joinCanvas' with canvasId:", id);
      socket.emit("joinCanvas", { canvasId: id, token });

      // --- Socket Listener: Receive Drawing Update ---
      // Listen for 'receiveDrawingUpdate' events from the server
      socket.on("receiveDrawingUpdate", (updatedElements) => {
        console.log("Received 'receiveDrawingUpdate' from socket. Updating elements.");
        // Update the elements state with the received drawing updates
        setElements(updatedElements);
      });

      // --- Socket Listener: Load Canvas ---
      // Listen for 'loadCanvas' event from the server (for initial load from socket)
      socket.on("loadCanvas", (initialElements) => {
        console.log("Received 'loadCanvas' from socket. Setting initial elements.");
        // Set the elements state with the initial canvas data
        setElements(initialElements);
      });

      // --- Socket Listener: Unauthorized ---
      // Listen for 'unauthorized' event from the server
      socket.on("unauthorized", (data) => {
        console.log("Received 'unauthorized' event from socket:", data.message);
        alert("Access Denied: You cannot edit this canvas.");
        setIsAuthorized(false); // Set authorization status to false
      });

      // --- Cleanup Function for Socket Listeners ---
      // This return function runs when the component unmounts or when 'id' changes before the effect re-runs
      return () => {
        console.log("Cleaning up Socket.io listeners.");
        socket.off("receiveDrawingUpdate");
        socket.off("loadCanvas");
        socket.off("unauthorized");
      };
    }
    // Dependency array: re-run this effect if 'id' changes
  }, [id]);

  // --- Effect for Initial Canvas Data Fetch (HTTP Request) ---
  // This useEffect runs when 'id' or 'token' changes.
  useEffect(() => {
    // Define an async function to fetch canvas data
    const fetchCanvasData = async () => {
      // Log when this fetch function is called
      console.log("fetchCanvasData called.");

      // Only proceed if 'id' and 'token' are available
      if (id && token) {
        // Log the canvas ID and confirm token presence before fetch
        console.log(`Attempting to fetch canvas data for ID: ${id} with token.`);
        try {
          // --- API Call: Load Canvas ---
          const response = await axios.get(`${BASE_URL}/api/canvas/load/${id}`, {
            headers: { Authorization: `Bearer ${token}` }, // Include JWT token in headers
          });

          // Log the successful API response data
          console.log("Canvas data fetched successfully:", response.data);
          setCanvasId(id); // Set the current canvas ID in context
          setElements(response.data.elements); // Set the fetched elements in context
          setHistory(response.data.elements); // Set the fetched elements as initial history
          requestAnimationFrame(() => {
            setElements([...response.data.elements]); // Force new reference
          });
        } catch (error) {
          // Log any errors during the canvas data fetch
          console.error("Error loading canvas:", error);
          // Optional: Display an alert or set an error state here
        } finally {
          // This block runs regardless of success or error
          console.log("Canvas data fetch attempt finished.");
        }
      } else {
        // Log if fetch is skipped due to missing ID or token
        console.log("Skipping canvas data fetch: ID or token is missing.", { id, token: token ? "present" : "missing" });
      }
    };

    fetchCanvasData(); // Call the defined fetch function
    // Dependency array: re-run this effect if 'id' or 'token' changes
  }, [id, token]); // Include setters in dependencies to satisfy ESLint

  // --- Effect for Canvas Resizing ---
  // This useEffect runs once on component mount to set canvas dimensions.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { // Ensure canvasRef.current is not null
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log(`Canvas resized to width: ${canvas.width}, height: ${canvas.height}`);
    } else {
      console.warn("Canvas ref is null when trying to set dimensions.");
    }
  }, []); // Empty dependency array means this runs only once after initial render

  // --- Effect for Keyboard Shortcuts (Undo/Redo) ---
  // This useEffect sets up and cleans up keyboard event listeners.
  useEffect(() => {
    function handleKeyDown(event) {
      // Log the keydown event details
      console.log("Keydown event:", event.key, "Ctrl key pressed:", event.ctrlKey);
      if (event.ctrlKey && event.key === "z") {
        console.log("Ctrl+Z pressed. Calling undo().");
        undo();
      } else if (event.ctrlKey && event.key === "y") {
        console.log("Ctrl+Y pressed. Calling redo().");
        redo();
      }
    }

    // Add event listener for keydown events on the document
    document.addEventListener("keydown", handleKeyDown);
    console.log("Added 'keydown' event listener for undo/redo.");

    // Cleanup function: remove the event listener when component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      console.log("Removed 'keydown' event listener.");
    };
  }, [undo, redo]); // Dependency array: re-run if undo or redo functions change (unlikely unless context changes)

  // --- useLayoutEffect for Drawing Elements ---
  // This useLayoutEffect runs synchronously after DOM mutations but before browser paints.
  // It's ideal for drawing operations to prevent visual flickers.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("Canvas ref is null in useLayoutEffect, cannot draw.");
      return;
    }
    const context = canvas.getContext("2d");
    context.save(); // Save the current drawing state

    const roughCanvas = rough.canvas(canvas); // Initialize roughjs

    // Log the number of elements being drawn
    console.log(`Drawing ${elements.length} elements to canvas.`);

    // Loop through each element and draw it based on its type
    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          // Log drawing rough elements
          console.log(`Drawing rough element: ${element.type}`);
          roughCanvas.draw(element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          // Log drawing brush strokes
          // console.log("Drawing brush element.");
          context.fillStyle = element.stroke;
          // Generate SVG path from freehand points and fill it
          const path = new Path2D(getSvgPathFromStroke(getStroke(element.points)));
          context.fill(path);
          context.restore(); // Restore context to previous state
          break;
        case TOOL_ITEMS.TEXT:
          // Log drawing text
          console.log("Drawing text element:", element.text);
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          context.restore(); // Restore context to previous state
          break;
        default:
          // Log an error if an unrecognized element type is found
          console.error("Type not recognized:", element.type);
          throw new Error("Type not recognized");
      }
    });

    // Cleanup function: clear the canvas before the next render cycle
    return () => {
      // console.log("Clearing canvas for next redraw.");
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]); // Dependency array: re-run this effect whenever 'elements' array changes

  // --- Effect for Textarea Focus ---
  // This useEffect ensures the textarea automatically focuses when in writing mode.
  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING && textarea) {
      // Log when attempting to focus the textarea
      // console.log("toolActionType is WRITING. Attempting to focus textarea.");
      setTimeout(() => {
        textarea.focus(); // Focus the textarea after a slight delay
        // console.log("Textarea focused.");
      }, 0); // Use setTimeout with 0 for immediate execution after browser's event loop
    } else if (toolActionType !== TOOL_ACTION_TYPES.WRITING) {
      // console.log("toolActionType is not WRITING. Textarea will not be focused.");
    }
  }, [toolActionType]); // Dependency array: re-run if 'toolActionType' changes

  // --- Event Handlers for Canvas Interactions ---
  // Logs authorization status before calling boardMouseDownHandler
  const handleMouseDown = (event) => {
    // console.log("handleMouseDown called. Is authorized?", isAuthorized);
    if (!isAuthorized) {
      console.log("Not authorized to draw. Blocking mouse down.");
      return;
    }
    boardMouseDownHandler(event, toolboxState);
  };

  // Logs authorization status and emits drawing updates on mouse move
  const handleMouseMove = (event) => {
    // Log details about the mouse move event and authorization status
    // console.log("handleMouseMove called. Is authorized?", isAuthorized, "Current elements count:", elements.length);
    if (!isAuthorized) {
      console.log("Not authorized to draw. Blocking mouse move.");
      return;
    }
    boardMouseMoveHandler(event);
    // --- Socket Emit: Drawing Update ---
    // Emit 'drawingUpdate' event to the server with current elements
    // console.log("Emitting 'drawingUpdate' from handleMouseMove. Canvas ID:", id);
    socket.emit("drawingUpdate", { canvasId: id, elements });
  };

  // Logs authorization status and emits drawing updates on mouse up
  const handleMouseUp = () => {
    // console.log("handleMouseUp called. Is authorized?", isAuthorized, "Current elements count:", elements.length);
    if (!isAuthorized) {
      console.log("Not authorized to draw. Blocking mouse up.");
      return;
    }
    boardMouseUpHandler();
    // --- Socket Emit: Drawing Update ---
    // Emit 'drawingUpdate' event to the server with current elements
    // console.log("Emitting 'drawingUpdate' from handleMouseUp. Canvas ID:", id);
    socket.emit("drawingUpdate", { canvasId: id, elements });
  };

  // --- Component JSX (Render Output) ---
  return (
    <>
      {/* Conditional rendering for the textarea when in writing mode */}
      {toolActionType === TOOL_ACTION_TYPES.WRITING && elements.length > 0 && ( // Ensure elements exist before accessing last element
        <textarea
          type="text"
          ref={textAreaRef} // Attach ref to textarea
          className={classes.textElementBox} // Apply CSS class
          style={{ // Apply inline styles based on the last element (text element)
            top: elements[elements.length - 1]?.y1, // Use optional chaining for safety
            left: elements[elements.length - 1]?.x1, // Use optional chaining for safety
            fontSize: `${elements[elements.length - 1]?.size}px`, // Use optional chaining for safety
            color: elements[elements.length - 1]?.stroke, // Use optional chaining for safety
          }}
          // Handle blur event: update the text element with the textarea's value
          onBlur={(event) => {
            console.log("Textarea blurred. New text value:", event.target.value);
            textAreaBlurHandler(event.target.value);
          }}
        />
      )}
      {/* The main canvas element */}
      <canvas
        ref={canvasRef} // Attach ref to canvas
        id="canvas" // HTML ID for the canvas
        onMouseDown={handleMouseDown} // Mouse down event handler
        onMouseMove={handleMouseMove} // Mouse move event handler
        onMouseUp={handleMouseUp} // Mouse up event handler
      />
    </>
  );
}

export default Board; // Export the Board component