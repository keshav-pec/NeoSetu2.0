import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../styles/history.module.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VideocamIcon from "@mui/icons-material/Videocam";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HistoryIcon from "@mui/icons-material/History";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await getHistoryOfUser();
        if (Array.isArray(history)) {
          setMeetings(history);
        } else {
          console.warn("Expected an array, got:", history);
          setMeetings([]);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleRejoinMeeting = (meetingCode) => {
    routeTo(`/${meetingCode}`);
  };

  return (
    <div className={styles.historyContainer}>
      <nav className={styles.navbar}>
        <button className={styles.backButton} onClick={() => routeTo("/home")}>
          <ArrowBackIcon />
          <span>Back to Home</span>
        </button>
        <h2 className={styles.pageTitle}>Meeting History</h2>
        <div style={{ width: '150px' }}></div> {/* Spacer for flex alignment */}
      </nav>

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Your Meetings</h1>
          <p className={styles.headerSubtitle}>
            View and rejoin your past video conferences
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading your history...</p>
          </div>
        ) : meetings && meetings.length > 0 ? (
          <div className={styles.historyGrid}>
            {meetings.map((meeting, i) => {
              if (!meeting || !meeting.meetingCode) {
                return null;
              }
              return (
                <div 
                  key={i} 
                  className={styles.meetingCard}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={styles.cardHeader}>
                    <VideocamIcon className={styles.cardIcon} />
                    <span className={styles.cardBadge}>Completed</span>
                  </div>

                  <div className={styles.cardContent}>
                    <p className={styles.codeLabel}>Meeting Code</p>
                    <h3 className={styles.meetingCode}>{meeting.meetingCode}</h3>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.dateInfo}>
                      <CalendarTodayIcon className={styles.dateIcon} />
                      <span>{formatDate(meeting.date)}</span>
                    </div>
                    <button 
                      className={styles.rejoinButton}
                      onClick={() => handleRejoinMeeting(meeting.meetingCode)}
                    >
                      <PlayArrowIcon />
                      Rejoin
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <HistoryIcon className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No Meeting History</h2>
            <p className={styles.emptyDescription}>
              You haven't joined any meetings yet. Start or join a meeting to see it here.
            </p>
            <button 
              className={styles.emptyButton}
              onClick={() => routeTo("/home")}
            >
              Start Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
