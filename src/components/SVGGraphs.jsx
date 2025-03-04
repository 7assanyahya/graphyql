import React from 'react';

export const XpProgressGraph = ({ data }) => {
  // Early return if no data
  if (!data || data.length === 0) {
    return <div className="empty-graph">No XP data available</div>;
  }

  // Sort data by date (assuming path contains date information)
  const sortedData = [...data].sort((a, b) => {
    // Extract date from path if possible, or use index as fallback
    const getPathDate = (path) => {
      const matches = path.match(/\d{4}-\d{2}-\d{2}/);
      return matches ? new Date(matches[0]) : null;
    };
    
    const dateA = getPathDate(a.path);
    const dateB = getPathDate(b.path);
    
    if (dateA && dateB) return dateA - dateB;
    return 0;
  });

  // Calculate cumulative XP over time
  let cumulativeXP = 0;
  const cumulativeData = sortedData.map(item => {
    cumulativeXP += item.amount;
    return {
      path: item.path,
      xp: cumulativeXP
    };
  });

  // Calculate dimensions and scales
  const width = 400;
  const height = 200;
  const padding = 20;
  const maxXP = cumulativeXP;
  const dataPoints = cumulativeData.length;

  // If there are too few data points, return a simple message
  if (dataPoints < 2) {
    return <div className="empty-graph">Not enough XP data to generate graph</div>;
  }

  // Calculate points for the line
  const points = cumulativeData.map((point, index) => {
    const x = padding + (index / (dataPoints - 1)) * (width - 2 * padding);
    const y = height - padding - (point.xp / maxXP) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="xp-graph">
      {/* Background */}
      <rect x="0" y="0" width={width} height={height} fill="#f9f9f9" rx="5" ry="5" />
      
      {/* Grid lines */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" strokeWidth="1" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ddd" strokeWidth="1" />
      
      {/* XP Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#4a90e2"
        strokeWidth="2"
      />
      
      {/* Circles at each data point */}
      {cumulativeData.map((point, index) => {
        const x = padding + (index / (dataPoints - 1)) * (width - 2 * padding);
        const y = height - padding - (point.xp / maxXP) * (height - 2 * padding);
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill="#4a90e2"
          />
        );
      })}
      
      {/* Labels */}
      <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="10" fill="#666">Time</text>
      <text x="5" y={height / 2} textAnchor="start" fontSize="10" fill="#666" transform={`rotate(-90, 5, ${height / 2})`}>XP</text>
      
      {/* Max XP label */}
      <text x={width - padding} y={padding - 5} textAnchor="end" fontSize="10" fill="#666">{maxXP.toLocaleString()}</text>
    </svg>
  );
};

export const SkillsGraph = ({ skillsData }) => {
  // Early return if no data
  if (!skillsData || skillsData.length === 0) {
    return <div className="empty-graph">No skills data available</div>;
  }

  // Calculate dimensions
  const width = 400;
  const height = 180;
  const padding = 30;
  const barWidth = (width - 1.5 * padding) / skillsData.length;
  const maxAmount = Math.max(...skillsData.map(skill => skill.amount));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="skills-graph">
      {/* Background */}
      <rect x="0" y="0" width={width} height={height} fill="#f9f9f9" rx="5" ry="5" />
      
      {/* Horizontal axis */}
      <line 
        x1={padding} 
        y1={height - padding} 
        x2={width - padding} 
        y2={height - padding} 
        stroke="#ddd" 
        strokeWidth="1" 
      />
      
      {/* Vertical axis */}
      <line 
        x1={padding} 
        y1={padding} 
        x2={padding} 
        y2={height - padding} 
        stroke="#ddd" 
        strokeWidth="1" 
      />
      
      {/* Bars for each skill */}
      {skillsData.map((skill, index) => {
        const barHeight = (skill.amount / maxAmount) * (height - 2 * padding);
        const x = padding + index * barWidth;
        const y = height - padding - barHeight;
        
        return (
          <g key={index}>
            <rect
              x={x + barWidth * 0.1}
              y={y}
              width={barWidth * 0.8}
              height={barHeight}
              fill="#4a90e2"
              rx="2"
              ry="2"
            />
            {/* Skill name label (rotated for better fit) */}
            <text
              x={x + barWidth / 3}
              y={height - padding + 12}
              textAnchor="end"
              fontSize="9"
              fill="#666"
              transform={`rotate(-30, ${x + barWidth / 4}, ${height - padding + 1})`}
            >
              {skill.name}
            </text>
            {/* Amount label */}
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="8"
              fill="#666"
            >
              {skill.amount}
            </text>
          </g>
        );
      })}
      
      {/* Labels */}
      
      <text x="10" y={height / 1.8} textAnchor="middle" fontSize="10" fill="#666" transform={`rotate(-90, 10, ${height / 2})`}>Level</text>
    </svg>
  );
};

export const AuditRatioGraph = ({ auditRatio }) => {
  // Early return if no data
  if (!auditRatio && auditRatio !== 0) {
    return <div className="empty-graph">No audit data available</div>;
  }

  // Calculate dimensions
  const width = 50;
  const height = 150;
  const radius = 60;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate arc angles for the donut chart
  const ratio = Math.min(Math.max(auditRatio, 0), 100) / 100; // Ensure ratio is between 0 and 1
  const startAngle = 0;
  const endAngle = ratio * 2 * Math.PI;
  
  // Calculate arc path
  const arcPath = (startAngle, endAngle, radius) => {
    const start = {
      x: centerX + radius * Math.cos(startAngle - Math.PI / 2),
      y: centerY + radius * Math.sin(startAngle - Math.PI / 2)
    };
    const end = {
      x: centerX + radius * Math.cos(endAngle - Math.PI / 2),
      y: centerY + radius * Math.sin(endAngle - Math.PI / 2)
    };
    
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  // Calculate background circle path
  const bgPath = arcPath(0, 2 * Math.PI, radius);
  
  // Calculate foreground (ratio) path
  const fgPath = arcPath(0, endAngle, radius);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="audit-ratio-graph">
      {/* Background */}
      <rect x="0" y="0" width={width} height={height} fill="#f9f9f9" rx="5" ry="5" />
      
      {/* Background circle */}
      <path d={bgPath} fill="#eee" />
      
      {/* Foreground arc (representing the ratio) */}
      <path d={fgPath} fill="#4a90e2" />
      
      {/* Center circle (to create donut) */}
      <circle cx={centerX} cy={centerY} r={radius * 0.6} fill="#f9f9f9" />
      
      {/* Text label */}
      <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#444">
        {(ratio * 100).toFixed(1)}%
      </text>
      
      <text x={centerX} y={centerY + 20} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#666">
        Audit Ratio
      </text>
    </svg>
  );
};

// Main component that decides which graph to render based on the data
export const ProjectsRatioGraph = ({ skillsData, auditRatio }) => {
  if (skillsData && skillsData.length > 0) {
    return <SkillsGraph skillsData={skillsData} />;
  } else if (auditRatio !== undefined) {
    return <AuditRatioGraph auditRatio={auditRatio} />;
  } else {
    return <div className="empty-graph">No data available for visualization</div>;
  }
};