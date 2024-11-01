import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import "./LobbyScreen.css"; 

const LobbyScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    socket.emit("room:join", { email, room });
  }, [email, room, socket]);

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
  }, [navigate]);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="lobby-container">
      <h1 className="title">Lobby</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email ID
          </label>
          <input
            type="email"
            value={email}
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="room" className="label">
            Room No
          </label>
          <input
            type="text"
            value={room}
            id="room"
            onChange={(e) => setRoom(e.target.value)}
            className="input"
          />
        </div>
        <button className="button">Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;
