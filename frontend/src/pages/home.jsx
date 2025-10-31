import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import styles from "../styles/home.module.css";
import { AuthContext } from "../contexts/AuthContext";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import VideocamIcon from "@mui/icons-material/Videocam";
import AddIcon from "@mui/icons-material/Add";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SettingsIcon from "@mui/icons-material/Settings";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  
  let handleJoinVideoCall = async () => {
    if (!meetingCode) {
      alert("Please enter a meeting code");
      return;
    }
    
    try {
      console.log("Adding meeting to history:", meetingCode);
      const response = await addToUserHistory(meetingCode);
      console.log("History response:", response);
      navigate(`/${meetingCode}`);
    } catch (error) {
      console.error("Error adding to history:", error);
      // Still navigate even if history save fails
      navigate(`/${meetingCode}`);
    }
  };

  const handleCreateMeeting = () => {
    const randomCode = Math.random().toString(36).substring(2, 10);
    navigate(`/${randomCode}`);
  };

  return (
    <div className={styles.homeContainer}>
      <nav className={styles.navbar}>
        <div className={styles.logoSection} onClick={() => navigate("/")}>
          <VideocamIcon className={styles.logoIcon} />
          <h2 className={styles.logoText}>NeoSetu</h2>
        </div>

        <div className={styles.navActions}>
          <button className={styles.navButton} onClick={() => navigate("/history")}>
            <RestoreIcon />
            <span>History</span>
          </button>
          <button
            className={styles.logoutButton}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </nav>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <h1 className={styles.welcomeText}>
            Welcome to NeoSetu
          </h1>
          <p className={styles.subText}>
            Connect with anyone, anywhere. Start or join a meeting in seconds.
          </p>

          <div className={styles.meetingCard}>
            <h2 className={styles.cardTitle}>Join a Meeting</h2>
            
            <div className={styles.inputGroup}>
              <input
                className={styles.meetingInput}
                type="text"
                placeholder="Enter meeting code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleJoinVideoCall();
                }}
              />
              <button className={styles.joinButton} onClick={handleJoinVideoCall}>
                Join
              </button>
            </div>

            <div className={styles.orDivider}>
              <span>OR</span>
            </div>

            <button className={styles.createButton} onClick={handleCreateMeeting}>
              <AddIcon /> Start New Meeting
            </button>

            <div className={styles.quickActions}>
              <div className={styles.quickAction} onClick={() => navigate("/history")}>
                <ScheduleIcon className={styles.quickActionIcon} />
                <span className={styles.quickActionText}>View History</span>
              </div>
              <div className={styles.quickAction}>
                <SettingsIcon className={styles.quickActionIcon} />
                <span className={styles.quickActionText}>Settings</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.illustrationContainer}>
            <svg 
              className={styles.illustration}
              viewBox="0 0 500 400" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Main video screen */}
              <rect x="50" y="50" width="400" height="250" rx="15" fill="url(#gradient1)" />
              <rect x="60" y="60" width="380" height="230" rx="10" fill="#1a1a2e" />
              
              {/* Participant videos */}
              <rect x="80" y="80" width="160" height="120" rx="8" fill="url(#gradient2)" opacity="0.9" />
              <rect x="260" y="80" width="160" height="120" rx="8" fill="url(#gradient3)" opacity="0.9" />
              <rect x="80" y="220" width="160" height="50" rx="8" fill="url(#gradient4)" opacity="0.8" />
              <rect x="260" y="220" width="160" height="50" rx="8" fill="url(#gradient5)" opacity="0.8" />
              
              {/* Person icons in video tiles */}
              <circle cx="160" cy="130" r="20" fill="rgba(255,255,255,0.2)" />
              <path d="M160 125 L160 140 M150 150 L160 140 L170 150" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
              
              <circle cx="340" cy="130" r="20" fill="rgba(255,255,255,0.2)" />
              <path d="M340 125 L340 140 M330 150 L340 140 L350 150" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
              
              {/* Control buttons at bottom */}
              <rect x="150" y="320" width="200" height="60" rx="30" fill="rgba(255,255,255,0.1)" />
              
              {/* Microphone button */}
              <circle cx="200" cy="350" r="18" fill="#16a085" />
              <rect x="197" y="345" width="6" height="10" rx="3" fill="white" />
              <path d="M192 357 Q200 362 208 357" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              
              {/* Video camera button */}
              <circle cx="250" cy="350" r="18" fill="#16a085" />
              <rect x="242" y="345" width="12" height="10" rx="2" fill="white" />
              <path d="M254 347 L260 344 L260 356 L254 353 Z" fill="white" />
              
              {/* End call button */}
              <circle cx="300" cy="350" r="18" fill="#e74c3c" />
              <rect x="292" y="347" width="16" height="6" rx="3" fill="white" transform="rotate(-45 300 350)" />
              
              {/* Decorative elements */}
              <circle cx="420" cy="100" r="30" fill="url(#gradient6)" opacity="0.3" />
              <circle cx="80" cy="330" r="25" fill="url(#gradient7)" opacity="0.3" />
              
              {/* Gradients */}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#16a085" />
                  <stop offset="100%" stopColor="#0f3460" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#16a085" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0f3460" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f3460" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#16a085" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#16a085" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0f3460" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0f3460" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#16a085" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="gradient6" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#16a085" />
                  <stop offset="100%" stopColor="#0f3460" />
                </linearGradient>
                <linearGradient id="gradient7" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f3460" />
                  <stop offset="100%" stopColor="#16a085" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
