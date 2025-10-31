import { createContext, useContext, useState } from "react";
import axios from "axios";
import httpStatus from "http-status";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});
const backend = process.env.REACT_APP_BACKEND_URL;
const client = axios.create({
  baseURL: `${backend}api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const router = useNavigate();
  const handleRegister = async (name, username, password) => {
    try {
      let request = await client.post("/register", {
        name,
        username,
        password,
      });
      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username,
        password,
      });
      console.log(username, password);
      console.log(request.data);
      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        router('/home');
        return request.data.message || "Login successful";
      }
    } catch (err) {
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      let request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return request.data;
    } catch (err) {
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Saving to history - Token:", token ? "exists" : "missing", "Meeting code:", meetingCode);
      
      let request = await client.post("/add_to_activity", {
        token: token,
        meeting_code: meetingCode,
      });
      
      console.log("Save history response:", request.data);
      return request;
    } catch (e) {
      console.error("Error in addToUserHistory:", e.response?.data || e.message);
      throw e;
    }
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
