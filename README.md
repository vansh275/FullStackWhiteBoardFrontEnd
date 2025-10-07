# Real-Time Collaborative Whiteboard - Frontend

This is the frontend for a full-stack, real-time collaborative whiteboard application built with React. It provides a dynamic and interactive user interface where multiple users can draw, write, and collaborate on a shared digital canvas.

**[Backend Repository](https://github.com/vansh275/FullStackWhiteBoardBackEnd)** | **[Live Demo](https://full-stack-white-board-front-end.vercel.app/)**

![Demo GIF placeholder](https://placehold.co/600x400/F4F4F9/333333?text=Project+Demo+GIF)

---

## ✨ Features

-   **Real-Time Drawing**: Experience seamless, low-latency drawing with other users on a shared canvas, powered by **Socket.io**.
-   **Complete Drawing Toolkit**:
    -   **Tools**: Freehand Brush, Line, Rectangle, Circle, Arrow, and Text tools.
    -   **Customization**: A dynamic toolbox to change stroke color, fill color, and brush/font size.
    -   **Actions**: Eraser, Undo/Redo, and a feature to download the canvas as a PNG image.
-   **User & Canvas Management**:
    -   **Authentication**: Secure user registration and login pages that use JWT for session management.
    -   **Sidebar**: A dedicated sidebar to create new canvases, switch between different boards, and delete them.
-   **Collaboration**: Easily share any canvas with other registered users by entering their email address.
-   **Efficient State Management**: Built with React's **Context API** to manage the state of the board, tools, and user session in a clean and scalable way.
-   **Responsive & Modern UI**: Styled with **Tailwind CSS** for a clean, modern, and responsive user experience.

---

## 🛠️ How It Works (Technical Breakdown)

-   **Canvas Rendering**: The main drawing board is a React component that uses an HTML `<canvas>` element. All shapes and lines are rendered on this canvas.
-   **Drawing Libraries**:
    -   **Rough.js** is used to give basic shapes (lines, rectangles, circles) a hand-drawn, sketchy appearance.
    -   **Perfect-freehand** is used to render smooth, pressure-sensitive-like brush strokes.
-   **Real-Time Sync**:
    -   The client establishes a WebSocket connection using **Socket.io-client** and sends its authentication token.
    -   When a user joins a canvas, they emit a `joinCanvas` event. The server adds them to a room and sends back the latest canvas data.
    -   During drawing, `drawingUpdate` events are continuously emitted to the server, which then broadcasts the new canvas state to all other clients in the same room.
-   **State Management**: The application's state is managed via two main React Contexts:
    -   `BoardProvider`: Manages the array of drawing `elements`, the `history` stack for undo/redo, the active tool, and user authentication status.
    -   `ToolboxProvider`: Manages the configuration for each tool, such as color and size.
-   **Routing**: **React Router** is used to handle client-side routing for different pages like login, register, and dynamic routes for specific canvases (`/:id`).

---

## 🚀 Getting Started

### Prerequisites

-   Node.js (v14 or higher)
-   npm
-   A running instance of the [backend server](https://github.com/vansh275/FullStackWhiteBoardBackEnd).

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/vansh275/FullStackWhiteBoardFrontEnd.git](https://github.com/vansh275/FullStackWhiteBoardFrontEnd.git)
    cd FullStackWhiteBoardFrontEnd
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. You must specify the URL where your backend server is running.
    ```env
    # URL of the backend server
    REACT_APP_BACKEND_URL=http://localhost:5000
    ```
    *Note: The `BASE_URL` is configured in `src/constants.js` and will use this environment variable.*

4.  **Start the development server:**
    ```bash
    npm start
    ```
    The application will open automatically at `http://localhost:3000`.

---

## 📜 Available Scripts

-   `npm start`: Runs the app in development mode.
-   `npm test`: Launches the test runner.
-   `npm run build`: Builds the app for production.
