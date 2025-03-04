import { useState, useEffect } from 'react';
import { 
  executeQuery, 
  QUERY_USER_INFO, 
  QUERY_PROJECT_XP, 
  QUERY_USER_SKILLS,
  QUERY_USER_EVENTS
} from '../services/api';
import { XpProgressGraph, ProjectsRatioGraph, AuditRatioGraph } from './SVGGraphs';

function Profile({ token, onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [skillsData, setSkillsData] = useState(null);
  const [levelsData, setLevelsData] = useState(null);
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
        const [userInfoRes, projectXpRes, skillsRes, eventsRes] = await Promise.all([
          executeQuery(QUERY_USER_INFO, {}, token),
          executeQuery(QUERY_PROJECT_XP, {}, token),
          executeQuery(QUERY_USER_SKILLS, {}, token),
          executeQuery(QUERY_USER_EVENTS, {}, token),
        ]);

        setUserInfo(userInfoRes.user[0]);
        setXpData(projectXpRes.user[0]?.xps || []);
        setSkillsData(skillsRes.transaction || []);
        
        // Process levels data
        const processedLevels = eventsRes.event_user
          ? eventsRes.event_user.reduce((acc, event) => {
              // Group levels by their type/category
              const category = event.eventId === 72 ? 'Hackathon' :
                               event.eventId === 20 ? 'Web Dev' :
                               event.eventId === 250 ? 'AI' : 
                               'Other';
              
              if (!acc[category] || event.level > acc[category]) {
                acc[category] = event.level;
              }
              return acc;
            }, {})
          : {};

        setLevelsData(processedLevels);
      } catch (err) {
        setError(err.message || "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token]);

  const calculateStats = () => {
    if (!userInfo || !xpData || !skillsData) {
      return { xp: {}, audits: {}, skills: {}, levels: {} };
    }

    // Previous calculations remain the same
    const totalXP = xpData.reduce((sum, tx) => sum + tx.amount, 0);
    const xpByProject = xpData.reduce((acc, tx) => {
      const project = tx.path.split('/').pop();
      acc[project] = (acc[project] || 0) + tx.amount;
      return acc;
    }, {});
    const topProjects = Object.entries(xpByProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const auditRatio = userInfo.auditRatio || 0;
    const totalUp = userInfo.totalUp || 0;
    const totalDown = userInfo.totalDown || 0;

    const topSkills = skillsData
      .slice(0, 5)
      .map(skill => ({
        name: skill.path.split('/').pop(),
        amount: skill.amount
      }));

    return {
      xp: { totalXP, topProjects },
      audits: { auditRatio, totalUp, totalDown },
      skills: { topSkills },
      levels: levelsData || {}
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
          <div className="card profile-card" style={{ transform: 'rotate(5deg)', top: '15%', left: '17%' }} >
            <h1>{userInfo?.login}'s Profile</h1>
            <h1>{userInfo?.firstName} {userInfo?.lastName}</h1>
            <h1 style={{fontSize : "18px"}}>{userInfo?.email}</h1>
            
            <button className="btn" onClick={onLogout}>Logout</button>
          </div>

         

          {/* Rest of the existing components remain the same */}
          <div className="card" style={{ transform: 'rotate(-3deg)', top: '10%', left: '39%' }}>
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

          <div className="card" style={{ transform: 'rotate(2deg)', top: '46%', left: '62%' }}>
            <h2>Skills</h2>
            {stats.skills.topSkills?.map((skill, index) => (
              <div className="stat-item" key={index}>
                <span className="stat-label">{skill.name}</span>
                <span className="stat-value">{skill.amount}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ transform: 'rotate(9deg)', top: '13%', right: '20%' }}>
            <h2>Audits</h2>
            <div className="stat-item">
              <span className="stat-label">Audit Ratio</span>
              <span className="stat-value">{stats.audits.auditRatio?.toFixed(1) || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Up Votes</span>
              <span className="stat-value">{stats.audits.totalUp || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Down Votes</span>
              <span className="stat-value">{stats.audits.totalDown || 0}</span>
            </div>
          </div>

          {/* Graphs */}
          <div className="graph-tab" style={{ transform: 'rotate(-3deg)', bottom: '14%', left: '1%' }}>
            <h3>XP Progress Over Time</h3>
            <XpProgressGraph data={xpData} />
          </div>
          <div className="graph-tab" style={{ transform: 'rotate(2deg)', bottom: '9%', left: '32%' }}>
            <h3>Skills Distribution</h3>
            <ProjectsRatioGraph 
              skillsData={stats.skills.topSkills} 
              auditRatio={stats.audits.auditRatio} 
            />
          </div>
          
            
          {/* Decorative Sticky Notes */}
          <div className="sticky-note" style={{ top: '25%', left: '3%' }}><p>Campus: {userInfo?.campus}</p></div>
          <div className="sticky-note" style={{ top: '2%', left: '20%' }}><p>Joined: {new Date(userInfo?.createdAt).toLocaleDateString()}</p></div>
          <div className="sticky-note" style={{ bottom: '42%', right: '14%' }}><p>User ID: {userInfo?.id}</p></div>
          
          {/* Decorative "MISSING" Poster */}
          <div className="missing-poster" style={{ transform: 'rotate(-7deg)', bottom: '9%', right: '10%' }}>
            <h2>MISSING</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;