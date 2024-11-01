import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import "./RoomPage.css";

const RoomPage = () => {
  const socket = useSocket();
  const [mystream, setMyStream] = useState();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [remoteStream, setRemoteStream] = useState();
  const [isCaller, setIsCaller] = useState(false);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined the room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
    setIsCaller(true);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of mystream.getTracks()) {
      peer.peer.addTrack(track, mystream);
    }
  }, [mystream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call accepted");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();

    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");

      setRemoteStream(remoteStream[0]);
    });
  }, []);

  const handleNegoIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  const handleCallEnd = useCallback(()=>{
    setRemoteStream(null);
    setRemoteSocketId(null);
  },[])

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoIncoming);
    socket.on("peer:nego:final", handleNegoFinal);
    socket.on("call:end",handleCallEnd)

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoIncoming);
      socket.off("peer:nego:final", handleNegoFinal);
      socket.off("call:end",handleCallEnd)

    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoIncoming,
    handleNegoFinal,
    handleCallEnd
  ]);

  const handleEndCall = useCallback(() => {
    setMyStream(null);
    setRemoteStream(null);
    setRemoteSocketId(null);
    setIsCaller(false);

    socket.emit("call:end",{to:remoteSocketId})

  }, [remoteSocketId,socket]);

  return (
    <div className="room-container">
      <h1>Room Page</h1>
      <h4 className="status-message">
        {remoteSocketId ? "Connected" : "No one in room"}
      </h4>

      {!isCaller && remoteSocketId && mystream && (
        <button
          className="action-button"
          onClick={() => {
            setIsCaller(true);
            sendStreams();
          }}
        >
          Accept Call
        </button>
      )}
      {remoteSocketId && !mystream && (
        <button className="action-button" onClick={handleCallUser}>
          Call
        </button>
      )}

      {remoteStream && (
        <div className="video-container">
          <ReactPlayer
            width="1500px"
            height="600px"
            playing
            muted
            url={remoteStream}
          />
          <p>remote</p>
        </div>
      )}

      {mystream && (
        <div className="my-video-container">
          <ReactPlayer
            width="500px"
            height="200px"
            className="my-video-player"
            playing
            muted
            url={mystream}
          />
        </div>
      )}
      {
        mystream &&
        <button className="action-button" onClick={handleEndCall}>End</button>

      }
    </div>
  );
};

export default RoomPage;
