import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/userApi";

interface FormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const navigate = useNavigate(); // Initialize navigate
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const token = btoa(`${formData.email}:${formData.password}`); // Create Base64 token
      const response = await loginUser(token);
      if (response.data.errors) {
        alert(response.data.errors[0]?.message || "Login Failed");
        return;
      }
      localStorage.setItem("token", token); // Save token
      navigate("/market"); // Redirect to Pet Page
      
    } catch (err: any) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Login</button>
        <div className="register-section">
          <p>Don't have an account?</p>
          <button type="button" className="register-button" onClick={() => navigate("/register")}>Register</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
