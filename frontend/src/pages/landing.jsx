import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/landing.module.css";
import VideocamIcon from "@mui/icons-material/Videocam";
import GroupIcon from "@mui/icons-material/Group";
import SecurityIcon from "@mui/icons-material/Security";
import DevicesIcon from "@mui/icons-material/Devices";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";

export default function LandingPage() {
  const router = useNavigate();
  const [guestCode, setGuestCode] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);

  const handleGuestJoin = () => {
    if (guestCode.trim()) {
      router(`/${guestCode}`);
    }
  };

  const handleCreateInstant = () => {
    const randomCode = Math.random().toString(36).substring(2, 10);
    router(`/${randomCode}`);
  };
  
  return (
    <div 
      className={styles.landingContainer}
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)` }}
    >
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>
            <VideocamIcon />
          </span>
          <span className={styles.logoText}>NeoSetu</span>
        </div>
        <div className={styles.navButtons}>
          <button 
            className={styles.guestBtn}
            onClick={() => setShowGuestModal(true)}
          >
            <PersonIcon />
            Join as Guest
          </button>
          <button 
            className={styles.loginBtn}
            onClick={() => router("/auth")}
          >
            Login
          </button>
          <button 
            className={styles.registerBtn}
            onClick={() => router("/auth")}
          >
            Register
          </button>
        </div>
      </nav>

      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.highlight}>Connect</span> with Your Loved Ones
          </h1>
          <p className={styles.heroSubtitle}>
            Experience seamless video conferencing with crystal-clear quality. 
            Bridge distances and stay connected, anytime, anywhere.
          </p>
          
          <div className={styles.ctaButtons}>
            <button 
              className={styles.ctaButtonPrimary}
              onClick={() => router("/auth")}
            >
              Get Started Free
              <ArrowForwardIcon />
            </button>
            <button 
              className={styles.ctaButtonSecondary}
              onClick={handleCreateInstant}
            >
              <MeetingRoomIcon />
              Create Instant Meeting
            </button>
          </div>

          <div className={styles.quickJoin}>
            <p className={styles.quickJoinText}>Or join with a code:</p>
            <div className={styles.quickJoinInput}>
              <input
                type="text"
                placeholder="Enter meeting code"
                value={guestCode}
                onChange={(e) => setGuestCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleGuestJoin();
                }}
              />
              <button onClick={handleGuestJoin}>
                Join
                <ArrowForwardIcon />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.heroImage}>
          <div className={styles.videoContainer}>
            <div className={styles.mockVideoCall}>
              <div className={styles.videoParticipant}>
                <div className={styles.participantVideo}>
                  <VideocamIcon className={styles.participantIcon} />
                </div>
                <span className={styles.participantName}>John</span>
              </div>
              <div className={styles.videoParticipant} style={{ animationDelay: '0.2s' }}>
                <div className={styles.participantVideo}>
                  <VideocamIcon className={styles.participantIcon} />
                </div>
                <span className={styles.participantName}>Sarah</span>
              </div>
              <div className={styles.videoParticipant} style={{ animationDelay: '0.4s' }}>
                <div className={styles.participantVideo}>
                  <VideocamIcon className={styles.participantIcon} />
                </div>
                <span className={styles.participantName}>Mike</span>
              </div>
              <div className={styles.videoParticipant} style={{ animationDelay: '0.6s' }}>
                <div className={styles.participantVideo}>
                  <VideocamIcon className={styles.participantIcon} />
                </div>
                <span className={styles.participantName}>Emma</span>
              </div>
            </div>
            <div className={styles.videoControls}>
              <div className={styles.controlButton}>
                <VideocamIcon />
              </div>
              <div className={styles.controlButton}>
                <GroupIcon />
              </div>
              <div className={styles.controlButton} style={{ background: '#ff4444' }}>
                <SecurityIcon />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Why Choose NeoSetu?</h2>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <VideocamIcon className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>HD Video Quality</h3>
            <p className={styles.featureDescription}>
              Crystal clear video calls with adaptive quality for smooth experience
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <GroupIcon className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>Group Meetings</h3>
            <p className={styles.featureDescription}>
              Host unlimited participants with real-time collaboration features
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <SecurityIcon className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>Secure & Private</h3>
            <p className={styles.featureDescription}>
              End-to-end encryption ensures your conversations stay private
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <DevicesIcon className={styles.featureIcon} />
            </div>
            <h3 className={styles.featureTitle}>Cross-Platform</h3>
            <p className={styles.featureDescription}>
              Works seamlessly across desktop, mobile, and tablet devices
            </p>
          </div>
        </div>
      </div>

      {/* Guest Modal */}
      {showGuestModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGuestModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Join as Guest</h2>
            <p className={styles.modalSubtitle}>Enter a meeting code to join instantly</p>
            
            <input
              className={styles.modalInput}
              type="text"
              placeholder="Enter meeting code"
              value={guestCode}
              onChange={(e) => setGuestCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGuestJoin();
                  setShowGuestModal(false);
                }
              }}
              autoFocus
            />
            
            <div className={styles.modalButtons}>
              <button 
                className={styles.modalCancelBtn}
                onClick={() => setShowGuestModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.modalJoinBtn}
                onClick={() => {
                  handleGuestJoin();
                  setShowGuestModal(false);
                }}
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
