'use client';

import { useState, useEffect } from 'react';

// Supabase configuration
const SUPABASE_URL = "https://uyvkcyupnofxlcmurdjl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dmtjeXVwbm9meGxjbXVyZGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzU4NjgsImV4cCI6MjA3MDYxMTg2OH0.cb4EWvhx7jTI6U5psy-YMtdcpOr5jZSiataAcJbTR54";

// Simple credentials (in production, use proper authentication)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in (session storage)
  useEffect(() => {
    const loggedIn = sessionStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch contacts when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchContacts();
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('adminLoggedIn');
    setContacts([]);
  };

  const fetchContacts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        throw new Error('Failed to fetch contacts');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="admin-container">
        <div className="login-box">
          <div className="login-header">
            <span className="login-icon">🔐</span>
            <h1>Admin Login</h1>
            <p>ApexElement Contact Management</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-btn">Login</button>
          </form>
          <a href="/" className="back-link">← Back to Website</a>
        </div>

        <style jsx>{`
          .admin-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .login-box {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 400px;
          }
          .login-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .login-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 16px;
          }
          .login-header h1 {
            margin: 0 0 8px 0;
            color: #1a1a2e;
            font-size: 24px;
          }
          .login-header p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .login-form .form-group {
            margin-bottom: 20px;
          }
          .login-form label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
          }
          .login-form input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
            box-sizing: border-box;
          }
          .login-form input:focus {
            outline: none;
            border-color: #6366f1;
          }
          .login-error {
            background: #fee2e2;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            text-align: center;
          }
          .login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          }
          .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #6366f1;
            text-decoration: none;
            font-size: 14px;
          }
          .back-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <span className="logo-icon">⚡</span>
          <h1>ApexElement Admin</h1>
        </div>
        <div className="header-right">
          <span className="user-info">👤 Admin</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="admin-main">
        <div className="dashboard-header">
          <h2>Contact Submissions</h2>
          <button onClick={fetchContacts} className="refresh-btn" disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{contacts.length}</span>
            <span className="stat-label">Total Contacts</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No contacts yet</h3>
            <p>When visitors submit the contact form, their messages will appear here.</p>
          </div>
        ) : (
          <div className="contacts-table-wrapper">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, index) => (
                  <tr key={contact.id || index}>
                    <td className="date-cell">{formatDate(contact.created_at)}</td>
                    <td className="name-cell">{contact.name}</td>
                    <td className="email-cell">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </td>
                    <td className="company-cell">{contact.company || '-'}</td>
                    <td className="phone-cell">
                      {contact.phone ? (
                        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      ) : '-'}
                    </td>
                    <td className="message-cell">
                      <div className="message-content">{contact.message}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f7fa;
        }
        .admin-header {
          background: white;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          font-size: 28px;
        }
        .header-left h1 {
          margin: 0;
          font-size: 20px;
          color: #1a1a2e;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .user-info {
          color: #666;
          font-size: 14px;
        }
        .logout-btn {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .logout-btn:hover {
          background: #dc2626;
        }
        .admin-main {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .dashboard-header h2 {
          margin: 0;
          color: #1a1a2e;
          font-size: 28px;
        }
        .refresh-btn {
          padding: 10px 20px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .refresh-btn:hover:not(:disabled) {
          background: #4f46e5;
        }
        .refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .stats-bar {
          background: white;
          padding: 20px 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #6366f1;
        }
        .stat-label {
          color: #666;
          font-size: 14px;
        }
        .loading-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }
        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #1a1a2e;
        }
        .empty-state p {
          margin: 0;
          color: #666;
        }
        .contacts-table-wrapper {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .contacts-table {
          width: 100%;
          border-collapse: collapse;
        }
        .contacts-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #1a1a2e;
          border-bottom: 2px solid #e0e0e0;
          white-space: nowrap;
        }
        .contacts-table td {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: top;
        }
        .contacts-table tr:hover {
          background: #f8fafc;
        }
        .date-cell {
          white-space: nowrap;
          color: #666;
          font-size: 13px;
        }
        .name-cell {
          font-weight: 500;
          color: #1a1a2e;
        }
        .email-cell a, .phone-cell a {
          color: #6366f1;
          text-decoration: none;
        }
        .email-cell a:hover, .phone-cell a:hover {
          text-decoration: underline;
        }
        .company-cell, .phone-cell {
          color: #666;
        }
        .message-cell {
          max-width: 300px;
        }
        .message-content {
          max-height: 100px;
          overflow-y: auto;
          line-height: 1.5;
          color: #444;
        }
        @media (max-width: 1024px) {
          .admin-main {
            padding: 20px;
          }
          .contacts-table-wrapper {
            overflow-x: auto;
          }
          .contacts-table {
            min-width: 800px;
          }
        }
        @media (max-width: 640px) {
          .admin-header {
            padding: 12px 16px;
            flex-direction: column;
            gap: 12px;
          }
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
