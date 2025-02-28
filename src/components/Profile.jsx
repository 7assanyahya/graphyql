import { useState, useEffect } from 'react';
import { executeQuery, QUERY_USER_INFO, QUERY_USER_XP, QUERY_USER_PROJECTS, QUERY_USER_AUDITS } from '../services/api';
import { XpProgressGraph, ProjectsRatioGraph } from './SVGGraphs';

function Profile({ token, onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [projectsData, setProjectsData] = useState(null);
  const [auditsData, setAuditsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token || token.split('.').length !== 3) {
        setError("Invalid authentication token.");
        setLoading(false);
        return;
      }

      try {
        const [userInfoRes, xpRes, projectsRes, auditsRes] = await Promise.all([
          executeQuery(QUERY_USER_INFO, {}, token),
          executeQuery(QUERY_USER_XP, {}, token),
          executeQuery(QUERY_USER_PROJECTS, {}, token),
          executeQuery(QUERY_USER_AUDITS, {}, token),
        ]);

        setUserInfo(userInfoRes.user[0]);
        setXpData(xpRes.transaction);
        setProjectsData(projectsRes.progress);
        setAuditsData(auditsRes.transaction);
      } catch (err) {
        setError(err.message || "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token]);

  const calculateStats = () => {
    if (!xpData || !projectsData || !auditsData) {
      return { xp: {}, projects: {}, audits: {} };
    }

    const totalXP = xpData.reduce((sum, tx) => sum + tx.amount, 0);
    const xpByProject = xpData.reduce((acc, tx) => {
      const project = tx.path.split('/').pop();
      acc[project] = (acc[project] || 0) + tx.amount;
      return acc;
    }, {});
    const topProjects = Object.entries(xpByProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const passCount = projectsData.filter(p => p.grade === 1).length;
    const failCount = projectsData.filter(p => p.grade === 0).length;
    const totalProjects = passCount + failCount;
    const passRate = totalProjects ? (passCount / totalProjects) * 100 : 0;

    const upCount = auditsData.filter(a => a.type === 'up').length;
    const downCount = auditsData.filter(a => a.type === 'down').length;
    const auditRatio = (upCount + downCount) ? (upCount / (upCount + downCount)) * 100 : 0;

    return {
      xp: { totalXP, topProjects },
      projects: { passCount, failCount, passRate },
      audits: { upCount, downCount, auditRatio },
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="container">
        <div className="board-layout">
          {/* Profile Photo with Overlay */}
          <div className="profile-photo-container">
            <img src="/public/missing-person.jpg" alt={`${userInfo?.login}'s Photo`} className="profile-photo" />
            <div className="photo-overlay">?</div>
          </div>

          {/* Profile Info Card */}
          <div className="card profile-card">
            <h1>{userInfo?.login}'s Profile - MISSING</h1>
            <p>User ID: {userInfo?.id}</p>
            <button className="btn" onClick={onLogout}>Logout</button>
          </div>

          {/* Stats Cards with Varied Rotations */}
          <div className="card" style={{ transform: 'rotate(-3deg)', top: '10%', left: '30%' }}>
            <h2>Experience Points</h2>
            <div className="stat-item">
              <span className="stat-label">Total XP</span>
              <span className="stat-value">{stats.xp.totalXP?.toLocaleString() || 0}</span>
            </div>
            {stats.xp.topProjects?.map(([project, xp], index) => (
              <div className="stat-item" key={index}>
                <span className="stat-label">Top Project #{index + 1}</span>
                <span className="stat-value">{project} ({xp.toLocaleString()})</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ transform: 'rotate(2deg)', top: '40%', left: '45%' }}>
            <h2>Projects</h2>
            <div className="stat-item">
              <span className="stat-label">Pass Rate</span>
              <span className="stat-value">{stats.projects.passRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Passed Projects</span>
              <span className="stat-value">{stats.projects.passCount || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Failed Projects</span>
              <span className="stat-value">{stats.projects.failCount || 0}</span>
            </div>
          </div>

          <div className="card" style={{ transform: 'rotate(-1deg)', top: '15%', right: '10%' }}>
            <h2>Audits</h2>
            <div className="stat-item">
              <span className="stat-label">Audit Up/Down Ratio</span>
              <span className="stat-value">{stats.audits.auditRatio?.toFixed(1) || 0}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Up Votes</span>
              <span className="stat-value">{stats.audits.upCount || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Down Votes</span>
              <span className="stat-value">{stats.audits.downCount || 0}</span>
            </div>
          </div>

          {/* Graphs */}
          <div className="graph-tab" style={{ transform: 'rotate(3deg)', bottom: '10%', left: '10%' }}>
            <h3>XP Progress Over Time</h3>
            <XpProgressGraph data={xpData} />
          </div>
          <div className="graph-tab" style={{ transform: 'rotate(-2deg)', bottom: '10%', left: '40%' }}>
            <h3>Project Pass/Fail Ratio</h3>
            <ProjectsRatioGraph passCount={stats.projects.passCount} failCount={stats.projects.failCount} />
          </div>

          {/* Decorative Sticky Notes */}
          <div className="sticky-note" style={{ top: '10%', left: '5%' }}>Place?</div>
          <div className="sticky-note" style={{ top: '15%', left: '10%' }}>Time?</div>
          <div className="sticky-note" style={{ bottom: '10%', right: '5%' }}>Lake house?</div>

          {/* Decorative "MISSING" Poster */}
          <div className="missing-poster">
            <h2>MISSING</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;