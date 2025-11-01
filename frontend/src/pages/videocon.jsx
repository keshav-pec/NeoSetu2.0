import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videocon.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

const backend = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, '') || 'https://neosetu-qcv5.onrender.com';
const server_url = backend;
console.log("🔧 Backend URL:", server_url);

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function Videocon() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();
  let lobbyVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(false);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);
  
  let [isConnecting, setIsConnecting] = useState(false);
  let [isConnected, setIsConnected] = useState(false);
  let [connectionError, setConnectionError] = useState(null);

  // Drag and resize states
  const [localVideoPos, setLocalVideoPos] = useState({ x: 20, y: 100 });
  const [localVideoSize, setLocalVideoSize] = useState({ width: 200, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    getPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log("📊 State Update:", {
      askForUsername,
      isConnecting,
      isConnected,
      socketConnected: socketRef.current?.connected
    });
  }, [askForUsername, isConnecting, isConnected]);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      let hasVideo = false;
      let hasAudio = false;

      // Check video permission
      try {
        const videoPermission = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoPermission) {
          hasVideo = true;
          setVideoAvailable(true);
          console.log("✅ Video permission granted");
          // Stop the test stream
          videoPermission.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.log("❌ Video permission denied:", e);
        setVideoAvailable(false);
      }

      // Check audio permission
      try {
        const audioPermission = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (audioPermission) {
          hasAudio = true;
          setAudioAvailable(true);
          console.log("✅ Audio permission granted");
          // Stop the test stream
          audioPermission.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.log("❌ Audio permission denied:", e);
        setAudioAvailable(false);
      }

      // Check screen share availability
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      // Now get the actual media stream to use
      if (hasVideo || hasAudio) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo,
          audio: hasAudio,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          console.log("✅ Local video stream created and stored in window.localStream");
          
          // Try to attach to whichever video element is currently rendered
          if (lobbyVideoRef.current) {
            lobbyVideoRef.current.srcObject = userMediaStream;
            lobbyVideoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
            console.log("✅ Stream attached to lobby preview");
          }
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
            localVideoref.current.play().catch(e => console.log("Auto-play prevented:", e));
            console.log("✅ Stream attached to meeting self-video");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error getting permissions:", error);
    }
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.log(e);
      }
    }
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      // Track stop failed
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    console.log("🚀 Attempting to connect to:", server_url);
    setIsConnecting(true);
    setConnectionError(null);
    
    // Set a timeout for connection
    const connectionTimeout = setTimeout(() => {
      if (!socketRef.current?.connected) {
        console.error("❌ Connection timeout after 20 seconds");
        setIsConnecting(false);
        setConnectionError("Connection timeout. Please check your internet connection and try again.");
      }
    }, 20000); // 20 second timeout for mobile
    
    try {
      socketRef.current = io.connect(server_url, { 
        secure: true,
        transports: ['polling', 'websocket'], // Try polling first for mobile
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 15000,
        forceNew: true
      });
      
      console.log("📡 Socket.IO client created");
    } catch (error) {
      console.error("❌ Error creating socket:", error);
      clearTimeout(connectionTimeout);
      setIsConnecting(false);
      setConnectionError("Failed to initialize connection. Please refresh and try again.");
      return;
    }

    // Register error handlers FIRST, before connection completes
    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      clearTimeout(connectionTimeout);
      setIsConnecting(false);
      setIsConnected(false);
      setConnectionError("Failed to connect to server. Please check your internet connection.");
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("⚠️ Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socketRef.current.connect();
      }
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);
    });

    socketRef.current.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error);
      setConnectionError("Reconnection failed. Please refresh the page.");
    });

    socketRef.current.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed completely");
      setIsConnecting(false);
      setConnectionError("Could not reconnect to server. Please refresh the page.");
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      clearTimeout(connectionTimeout);
      // Extract room code from URL path and normalize it
      const roomCode = window.location.pathname.replace(/\//g, '') || 'default-room';
      console.log("✅ Socket connected! ID:", socketRef.current.id);
      console.log("🔗 Joining room:", roomCode);
      socketRef.current.emit("join-call", roomCode);
      socketIdRef.current = socketRef.current.id;
      
      // Update state - React should batch these updates
      setIsConnecting(false);
      setIsConnected(true);
      console.log("✅ Connection established - UI should now show meeting room");

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        console.log("❌ User left:", id);
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        console.log("👥 User joined event - ID:", id, "Clients:", clients);
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    if (window.localStream) {
      // Toggle the enabled state of the first video track
      window.localStream.getVideoTracks()[0].enabled = !video;
      // Update the state to re-render the icon
      setVideo(!video);
    }
  };

  let handleAudio = () => {
    if (window.localStream) {
      // Toggle the enabled state of the first audio track
      window.localStream.getAudioTracks()[0].enabled = !audio;
      // Update the state to re-render the icon
      setAudio(!audio);
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    // This effect runs when the view changes from the lobby to the conference.
    if (localVideoref.current && window.localStream) {
      // Re-apply the stream to the video element.
      localVideoref.current.srcObject = window.localStream;
      // Ensure video plays (especially important on mobile)
      localVideoref.current.play().catch(e => {
        console.log("⚠️ Auto-play prevented:", e);
      });
      console.log("✅ Local video stream applied to self-video window");
    } else {
      console.log("⚠️ Local video not ready:", {
        hasVideoRef: !!localVideoref.current,
        hasStream: !!window.localStream
      });
    }
    // It depends on `askForUsername` because changing this state causes the view to switch.
  }, [askForUsername]);

  // Additional effect to ensure local video shows when connected
  useEffect(() => {
    if (isConnected && localVideoref.current && window.localStream) {
      console.log("🎥 Connection established - attaching local stream to self-video");
      localVideoref.current.srcObject = window.localStream;
      localVideoref.current.play().catch(e => {
        console.log("⚠️ Auto-play prevented on connection:", e);
      });
    }
  }, [isConnected]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  // Drag handlers for local video
  const handleMouseDown = (e) => {
    if (e.target.classList.contains(styles.resizeHandle)) {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - localVideoPos.x,
        y: e.clientY - localVideoPos.y
      });
    }
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (e.target.classList.contains(styles.resizeHandle)) {
      setIsResizing(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else {
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - localVideoPos.x,
        y: touch.clientY - localVideoPos.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - localVideoSize.width;
      const maxY = window.innerHeight - localVideoSize.height - 100; // 100px for controls
      
      setLocalVideoPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newWidth = Math.max(120, Math.min(400, localVideoSize.width + deltaX));
      const newHeight = Math.max(90, Math.min(300, localVideoSize.height + deltaY));
      
      setLocalVideoSize({ width: newWidth, height: newHeight });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (isDragging) {
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - localVideoSize.width;
      const maxY = window.innerHeight - localVideoSize.height - 100;
      
      setLocalVideoPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    } else if (isResizing) {
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      const newWidth = Math.max(120, Math.min(400, localVideoSize.width + deltaX));
      const newHeight = Math.max(90, Math.min(300, localVideoSize.height + deltaY));
      
      setLocalVideoSize({ width: newWidth, height: newHeight });
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, isResizing]);

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/home";
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let connect = () => {
    console.log("🚀 Connect button clicked - joining meeting");
    setAskForUsername(false);
    setIsConnecting(true);
    setIsConnected(false);
    getMedia();
  };

  // Log render decision
  const showLobby = askForUsername === true;
  const showLoading = !askForUsername && (isConnecting || !isConnected);
  const showMeeting = !askForUsername && !isConnecting && isConnected;
  
  console.log("🎬 Render decision:", { showLobby, showLoading, showMeeting });

  return (
    <div>
      {showLobby ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <h2 className={styles.lobbyTitle}>Join Meeting</h2>
            
            <div className={styles.lobbyPreview}>
              <video 
                ref={(el) => {
                  lobbyVideoRef.current = el;
                  if (el && window.localStream && el.srcObject !== window.localStream) {
                    console.log("🎥 Setting local stream on lobby preview");
                    el.srcObject = window.localStream;
                    el.play().catch(e => console.log("Lobby auto-play prevented:", e));
                  }
                }}
                autoPlay 
                playsInline
                muted
              ></video>
            </div>

            <input
              className={styles.lobbyInput}
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && username.trim()) connect();
              }}
            />
            
            <button 
              className={styles.lobbyButton} 
              onClick={connect}
              disabled={!username.trim()}
            >
              Join Now
            </button>
          </div>
        </div>
      ) : showLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner}></div>
            <h2 className={styles.loadingTitle}>
              {isConnecting ? 'Connecting to meeting...' : 'Waiting for connection...'}
            </h2>
            <p className={styles.loadingSubtitle}>
              {connectionError ? connectionError : 'Please wait while we connect you to other participants'}
            </p>
            {connectionError && (
              <button 
                className={styles.retryButton}
                onClick={() => {
                  setConnectionError(null);
                  connectToSocketServer();
                }}
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                  <h1>Chat</h1>
                  <button 
                    className={styles.closeChatButton}
                    onClick={() => setModal(false)}
                    aria-label="Close chat"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div className={styles.messageItem} key={index}>
                          <p>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                      No Messages Yet
                    </p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <div>
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && message.trim()) sendMessage();
                      }}
                    />
                  </div>
                  <div>
                    <button onClick={sendMessage}>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.buttonContainers}>
            <button 
              onClick={handleVideo} 
              style={{ 
                backgroundColor: video ? '#4CAF50' : '#f44336' 
              }}
            >
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </button>
            
            <button 
              onClick={handleAudio}
              style={{ 
                backgroundColor: audio ? '#4CAF50' : '#f44336' 
              }}
            >
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </button>
            
            <button 
              onClick={handleEndCall}
              style={{ 
                backgroundColor: '#f44336',
                width: '65px',
                height: '65px'
              }}
            >
              <CallEndIcon />
            </button>

            {screenAvailable === true ? (
              <button 
                onClick={handleScreen}
                style={{ 
                  backgroundColor: screen ? '#FF9800' : '#666' 
                }}
              >
                {screen === true ? (
                  <StopScreenShareIcon />
                ) : (
                  <ScreenShareIcon />
                )}
              </button>
            ) : null}

            <Badge badgeContent={newMessages} max={9} color="error">
              <button
                onClick={() => setModal(!showModal)}
                style={{ 
                  backgroundColor: showModal ? '#667eea' : '#666' 
                }}
              >
                <ChatIcon />
              </button>
            </Badge>
          </div>

          <div
            ref={dragRef}
            className={styles.meetUserVideo}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              left: `${localVideoPos.x}px`,
              top: `${localVideoPos.y}px`,
              width: `${localVideoSize.width}px`,
              height: `${localVideoSize.height}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
              position: 'absolute',
              touchAction: 'none'
            }}
          >
            <video
              ref={(el) => {
                localVideoref.current = el;
                if (el && window.localStream && el.srcObject !== window.localStream) {
                  console.log("🎥 Setting local stream on self-video element mount");
                  el.srcObject = window.localStream;
                  el.play().catch(e => console.log("Auto-play prevented:", e));
                }
              }}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '16px',
                pointerEvents: 'none'
              }}
            ></video>
            <div 
              className={styles.resizeHandle}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
                setDragStart({ x: e.clientX, y: e.clientY });
              }}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '20px',
                height: '20px',
                cursor: 'nwse-resize',
                background: 'rgba(22, 160, 133, 0.6)',
                borderRadius: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white',
                userSelect: 'none'
              }}
            >
              ⤡
            </div>
          </div>

          <div className={`${styles.conferenceView} ${styles[`participants${Math.min(videos.length + 1, 6)}`]}`}>
            {videos.length === 0 ? (
              <div className={styles.waitingMessage}>
                <div className={styles.waitingContent}>
                  <VideocamIcon style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
                  <h3>Waiting for others to join...</h3>
                  <p>Share the meeting link to invite participants</p>
                </div>
              </div>
            ) : (
              videos.map((video, index) => (
                <div 
                  key={video.socketId} 
                  className={styles.videoBlock}
                  data-participant-index={index}
                >
                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                  ></video>
                  <div className={styles.videoLabel}>
                    Participant {index + 1}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
