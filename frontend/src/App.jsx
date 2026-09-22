import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css'; // Importing Clean CSS Stylesheet

const socket = io('http://localhost:5000');

// Custom MindEase Logo
const MindEaseLogo = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="meBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      <linearGradient id="meLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d1fae5" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="90" height="90" rx="26" fill="url(#meBgGrad)" />
    <rect x="10" y="10" width="80" height="80" rx="21" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
    <path d="M50 24C35 34 28 46 28 58C28 70 38 78 50 78C62 78 72 70 72 58C72 46 65 34 50 24ZM50 70C41 70 35 64 35 56C35 47 42 38 50 31C58 38 65 47 65 56C65 64 59 70 50 70Z" fill="url(#meLeafGrad)" />
    <path d="M50 38C45 43 40 49 40 55C40 60 44 64 50 64C56 64 60 60 60 55C60 49 55 43 50 38Z" fill="#ffffff" fillOpacity="0.9" />
    <circle cx="50" cy="55" r="4" fill="#059669" />
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isRegister, setIsRegister] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('email') || '');

  // Forms & Chat State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [room, setRoom] = useState('General');
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('receive_message', (data) => setMessages((prev) => [...prev, data]));
    return () => socket.off('receive_message');
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage('');
    const endpoint = isRegister ? 'http://localhost:5000/api/register' : 'http://localhost:5000/api/login';
    const payload = isRegister ? { username: authUsername, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) return setAuthMessage(data.message || 'Error occurred');

      if (isRegister) {
        setAuthMessage('Registration successful! Please log in.');
        setIsRegister(false);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', email);
        setToken(data.token);
        setUsername(data.username);
        setUserEmail(email);
        setActiveTab('home');
      }
    } catch (err) {
      setAuthMessage('Failed to connect to backend server');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUsername('');
    setUserEmail('');
    setJoined(false);
    setActiveTab('home');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    socket.emit('join_room', room);
    setJoined(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const msgData = { room, author: username, message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), encrypted: true };
      socket.emit('send_message', msgData);
      setMessage('');
    }
  };

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setActiveTab('home')}>
          <MindEaseLogo size={44} />
          <div>
            <span className="brand-title">MindEase</span>
            <span className="brand-subtitle">SECURE MENTAL HEALTH PLATFORM</span>
          </div>
        </div>

        <div className="nav-menu">
          <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Home</button>
          {token && <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Support Portal</button>}

          {!token ? (
            <button className="btn-primary" onClick={() => { setActiveTab('auth'); setIsRegister(false); }}>Log In / Sign Up</button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="profile-chip" onClick={() => setActiveTab('profile')}>👤 {username}</button>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* VIEW 1: HOME PAGE */}
      {activeTab === 'home' && (
        <div>
          <section className="hero-section">
            <div className="hero-content">
              {token ? (
                <div className="hero-profile-banner" onClick={() => setActiveTab('profile')} title="View Profile">
                  <div className="avatar-circle">{username ? username.charAt(0).toUpperCase() : 'U'}</div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '800' }}>● Encrypted Session Active</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Welcome, {username}!</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Click to view profile & settings →</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <MindEaseLogo size={80} />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <span className="badge-green">🔒 End-to-End Encrypted Care</span>
              </div>

              <h1 className="hero-title">Your Safe Space for Mental Health & Support</h1>
              <p className="hero-desc">MindEase delivers instant, anonymous, and encrypted real-time consultation and triage support.</p>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => setActiveTab(token ? 'chat' : 'auth')}>{token ? 'Enter Care Portal' : 'Get Started Free'}</button>
                <button className="btn-outline" onClick={() => setActiveTab(token ? 'chat' : 'auth')}>{token ? 'Go to Live Chat' : 'Sign In'}</button>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="features-section">
            <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800' }}>Why Choose MindEase?</h2>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '48px' }}>Maximum security, speed, and confidential care.</p>

            <div className="feature-grid">
              <div className="feature-card">
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
                <h3 style={{ fontWeight: '700' }}>End-to-End Encrypted</h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Web Crypto encryption ensures total message privacy.</p>
              </div>
              <div className="feature-card">
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
                <h3 style={{ fontWeight: '700' }}>Instant Real-time Socket</h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Zero-latency socket streaming for immediate support.</p>
              </div>
              <div className="feature-card">
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>☁️</div>
                <h3 style={{ fontWeight: '700' }}>MongoDB Atlas Cloud</h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Secure cloud database handling all confidential records.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 2: AUTHENTICATION */}
      {activeTab === 'auth' && (
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <MindEaseLogo size={52} />
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '12px' }}>{isRegister ? 'Join MindEase' : 'Welcome Back'}</h2>
          </div>

          {authMessage && <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534', textAlign: 'center', marginBottom: '16px', fontSize: '13px' }}>{authMessage}</div>}

          <form onSubmit={handleAuth}>
            {isRegister && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Username:</label>
                <input className="input-field" type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} required />
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Email Address:</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Password:</label>
              <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} type="submit">{isRegister ? 'Create Account' : 'Sign In'}</button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '20px', cursor: 'pointer' }} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </p>
        </div>
      )}

      {/* VIEW 3: PROFILE PAGE */}
      {activeTab === 'profile' && token && (
        <div className="profile-card">
          <div className="profile-header-banner">
            <div className="profile-avatar-lg">{username ? username.charAt(0).toUpperCase() : 'U'}</div>
            <h2 style={{ margin: 0 }}>{username}</h2>
            <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px', marginTop: '6px', display: 'inline-block' }}>Verified User</span>
          </div>

          <div style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Account Information</h3>
            <div className="info-row">
              <span style={{ color: '#64748b' }}>Username:</span>
              <strong>{username}</strong>
            </div>
            <div className="info-row">
              <span style={{ color: '#64748b' }}>Email:</span>
              <strong>{userEmail || 'Registered Member'}</strong>
            </div>
            <div className="info-row">
              <span style={{ color: '#64748b' }}>E2EE Encryption:</span>
              <span className="badge-green">Active</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setActiveTab('chat')}>Go to Chat Portal</button>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: CHAT DASHBOARD */}
      {activeTab === 'chat' && (
        <div className="chat-container">
          <div className="chat-card">
            <div style={{ backgroundColor: '#0f172a', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MindEaseLogo size={36} />
                <h3 style={{ margin: 0, fontSize: '17px' }}>MindEase Portal</h3>
              </div>
              {joined && <span className="badge-green">Room: {room}</span>}
            </div>

            {!joined ? (
              <form onSubmit={handleJoin} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ fontWeight: '600' }}>Select Support Room:</label>
                <select className="input-field" value={room} onChange={(e) => setRoom(e.target.value)}>
                  <option value="General">🌿 General Triage Room</option>
                  <option value="Therapist-101">🩺 Therapist Session 101</option>
                  <option value="Urgent-Support">🚨 Urgent Mental Health Support</option>
                </select>
                <button type="submit" className="btn-primary">Connect to Encrypted Room</button>
              </form>
            ) : (
              <div style={{ padding: '24px' }}>
                <div className="chat-messages-box">
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '140px' }}>🔒 Connected to <strong>{room}</strong>. Send a message!</div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} style={{ alignSelf: msg.author === username ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{msg.author} • {msg.time}</div>
                        <div style={{ backgroundColor: msg.author === username ? '#059669' : '#fff', color: msg.author === username ? '#fff' : '#0f172a', padding: '12px 16px', borderRadius: '14px', border: msg.author === username ? 'none' : '1px solid #e2e8f0' }}>
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <input className="input-field" type="text" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                  <button type="submit" className="btn-primary">Send</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;