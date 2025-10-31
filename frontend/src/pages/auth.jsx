import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../styles/auth.module.css";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";

export default function Authentication() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState(0); // 0 = login, 1 = register
  const router = useNavigate();

  const { handleRegister, handleLogin } = useContext(AuthContext);

  let handleAuth = async () => {
    try {
      setError('');
      setMessage('');
      
      if (formState === 0) {
        let result = await handleLogin(username, password);
        console.log(result);
        setMessage(result || "Login successful!");
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setMessage(result || "Registration successful!");
        setTimeout(() => {
          setFormState(0);
          setName("");
          setUsername("");
          setPassword("");
        }, 1500);
      }
    } catch (err) {
      let errorMessage = err.response?.data?.message || "An error occurred";
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <button className={styles.backButton} onClick={() => router("/")}>
          <ArrowBackIcon />
          <span>Back to Home</span>
        </button>

        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>
            {formState === 0 ? "Welcome Back" : "Create Account"}
          </h1>
          <p className={styles.authSubtitle}>
            {formState === 0 
              ? "Sign in to continue your journey" 
              : "Join us and start connecting"}
          </p>
        </div>

        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleButton} ${formState === 0 ? styles.active : ''}`}
            onClick={() => {
              setFormState(0);
              setError('');
              setMessage('');
            }}
          >
            Login
          </button>
          <button
            className={`${styles.toggleButton} ${formState === 1 ? styles.active : ''}`}
            onClick={() => {
              setFormState(1);
              setError('');
              setMessage('');
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {message && (
          <div className={styles.successMessage}>
            {message}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
          {formState === 1 && (
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <PersonIcon className={styles.inputIcon} />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <EmailIcon className={styles.inputIcon} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <LockIcon className={styles.inputIcon} />
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            {formState === 0 ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
