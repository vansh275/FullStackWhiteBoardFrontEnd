import { io } from "socket.io-client";
import { BASE_URL } from "../constants";

const token = localStorage.getItem("whiteboard_user_token");

const socket = io(BASE_URL, {
  extraHeaders: token ? { Authorization: `Bearer ${token}` } : {}, // Only send if token exists
});

export default socket;
