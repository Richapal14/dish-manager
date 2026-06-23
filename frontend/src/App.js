import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Bell, Shield, User } from 'lucide-react';
import './App.css';

const socket = io('http://localhost:5000');

function Dashboard() {
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    fetchDishes();

    socket.on('dishUpdated', (updatedDish) => {
      setDishes((prevDishes) =>
        prevDishes.map((dish) =>
          dish.dishId === updatedDish.dishId ? updatedDish : dish
        )
      );
    });

    return () => socket.off('dishUpdated');
  }, []);

  const fetchDishes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dishes');
      setDishes(res.data);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
  };

  const togglePublish = async (dishId) => {
    try {
      setDishes((prevDishes) =>
        prevDishes.map((dish) =>
          dish.dishId === dishId ? { ...dish, isPublished: !dish.isPublished } : dish
        )
      );
      await axios.put(`http://localhost:5000/api/dishes/${dishId}/toggle`);
    } catch (error) {
      console.error("Error toggling status:", error);
      fetchDishes(); 
    }
  };

  return (
    <div className="page-container">
      <div className="dish-grid">
        {dishes.map((dish) => (
          <div key={dish.dishId} className="dish-card">
            <img src={dish.imageUrl} alt={dish.dishName} className="dish-image" />
            <div className="dish-info">
              <h3>{dish.dishName}</h3>
              <p className={dish.isPublished ? "status published" : "status unpublished"}>
                {dish.isPublished ? "Published" : "Unpublished"}
              </p>
            </div>
            <button 
              className={`toggle-btn ${dish.isPublished ? 'active' : ''}`}
              onClick={() => togglePublish(dish.dishId)}
            >
              {dish.isPublished ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emailsEnabled, setEmailsEnabled] = useState(false);

  const handleAlertToggle = (e) => {
    setAlertsEnabled(e.target.checked);
    console.log("Real-Time Alerts are now:", e.target.checked ? "ON" : "OFF");
  };

  const handleEmailToggle = (e) => {
    setEmailsEnabled(e.target.checked);
    console.log("Email Reports are now:", e.target.checked ? "ON" : "OFF");
  };

  return (
    <div className="page-container">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your dashboard preferences and profile details.</p>
      </div>

      <div className="settings-grid">
        
        <div className="settings-card profile-card">
          <div className="card-header">
            <User className="icon" size={20} />
            <h3>Profile Information</h3>
          </div>
          <div className="profile-content">
            <div className="profile-avatar">RP</div>
            <div className="profile-details">
              <h4>Richa Pal</h4>
              <p className="role-badge">Administrator</p>
              <p className="email-text">admin@dishmanager.com</p>
            </div>
          </div>
          <button className="outline-btn">Edit Profile</button>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <Bell className="icon" size={20} />
            <h3>Notifications & Display</h3>
          </div>
          <div className="settings-list">
            
            <div className="setting-item">
              <div className="setting-info">
                <h4>Real-Time Alerts</h4>
                <p>Get notified when dishes are updated.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={alertsEnabled} 
                  onChange={handleAlertToggle} 
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div className="setting-item">
              <div className="setting-info">
                <h4>Weekly Email Reports</h4>
                <p>Receive a summary of dashboard activity.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={emailsEnabled} 
                  onChange={handleEmailToggle} 
                />
                <span className="slider round"></span>
              </label>
            </div>

          </div>
        </div>

        <div className="settings-card danger-zone">
          <div className="card-header">
            <Shield className="icon danger-icon" size={20} />
            <h3>Security</h3>
          </div>
          <p className="security-text">Update your password or log out of all active sessions.</p>
          <div className="security-actions">
            <button className="outline-btn">Change Password</button>
            <button className="danger-btn">Log Out</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <header className="app-header">
          <div className="header-content">
            <h1>Dish Manager</h1>
            <nav className="nav-links">
              <Link to="/">Dashboard</Link>
              <Link to="/settings">Settings</Link>
            </nav>
          </div>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;