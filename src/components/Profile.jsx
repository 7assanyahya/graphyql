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
  const [activeGraph, setActiveGraph] = useState('xp');

  useEffect(() => {
    const fetchProfileData = async () => {
      console.log("Using Token for Profile API:", token);

      if (!token || token.split('.').length !== 3) {
        console.error("Invalid token format:", token);
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
        console.error("Error fetching profile data:", err);
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
    <div className="container">
      <div className="header">
        <div>
          <h1>{userInfo?.login}'s Profile</h1>
          <p>User ID: {userInfo?.id}</p>
        </div>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="profile-grid">
        <div className="card">
          <h2>Experience Points</h2>
          <div className="stat-item">
            <span className="stat-label">Total XP</span>
            <span className="stat-value">{stats.xp.totalXP?.toLocaleString() || 0}</span>
          </div>
          {stats.xp.topProjects?.map(([project, xp], index) => (
            <div className="stat-item" key={index}>
              <span className="stat-label">Top Project #{index + 1}</span>
              <span className="stat-value">
                {project} ({xp.toLocaleString()})
              </span>
            </div>
          ))}
        </div>

        <div className="card">
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

        <div className="card">
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
      </div>

      <div className="graph-container">
        <h2>Statistics</h2>
        <div className="graph-tabs">
          <div
            className={`graph-tab ${activeGraph === 'xp' ? 'active' : ''}`}
            onClick={() => setActiveGraph('xp')}
          >
            XP Progress
          </div>
          <div
            className={`graph-tab ${activeGraph === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveGraph('projects')}
          >
            Project Success Rate
          </div>
        </div>

        <div className="svg-container">
          {activeGraph === 'xp' ? (
            <XpProgressGraph data={xpData} />
          ) : (
            <ProjectsRatioGraph passCount={stats.projects.passCount} failCount={stats.projects.failCount} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;