import { useMemo } from 'react'

// XP Progress Graph (Line Chart)
export const XpProgressGraph = ({ data }) => {
  // Process data for the graph
  const graphData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // Calculate accumulated XP over time
    let accumulatedXp = 0
    return data.map(transaction => {
      accumulatedXp += transaction.amount
      return {
        date: new Date(transaction.createdAt),
        xp: accumulatedXp
      }
    })
  }, [data])

  if (!graphData || graphData.length === 0) {
    return <div>No XP data available</div>
  }

  // Graph settings
  const width = 800
  const height = 400
  const padding = 60
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  // Find min and max values for scales
  const minDate = graphData[0].date
  const maxDate = graphData[graphData.length - 1].date
  const maxXp = graphData[graphData.length - 1].xp

  // Scale functions
  const xScale = (date) => {
    return padding + ((date - minDate) / (maxDate - minDate)) * innerWidth
  }

  const yScale = (xp) => {
    return height - padding - (xp / maxXp) * innerHeight
  }

  // Generate line path
  const linePath = graphData.map((point, i) => {
    const x = xScale(point.date)
    const y = yScale(point.xp)
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')

  // Format functions
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }

  const formatXp = (xp) => {
    return xp.toLocaleString()
  }

  // Generate axis ticks
  const generateXTicks = () => {
    // Create about 6 ticks along the x-axis
    const ticks = []
    const timeRange = maxDate - minDate
    const tickCount = Math.min(6, graphData.length)
    
    for (let i = 0; i <= tickCount; i++) {
      const tickDate = new Date(minDate.getTime() + (timeRange * i) / tickCount)
      const x = xScale(tickDate)
      
      ticks.push(
        <g key={`x-tick-${i}`}>
          <line 
            x1={x} 
            y1={height - padding} 
            x2={x} 
            y2={height - padding + 5} 
            stroke="#888" 
          />
          <text 
            x={x} 
            y={height - padding + 20} 
            textAnchor="middle" 
            fontSize="12" 
            fill="#888"
          >
            {formatDate(tickDate)}
          </text>
        </g>
      )
    }
    
    return ticks
  }

  const generateYTicks = () => {
    // Create about 5 ticks along the y-axis
    const ticks = []
    const tickCount = 5
    
    for (let i = 0; i <= tickCount; i++) {
      const tickValue = (maxXp * i) / tickCount
      const y = yScale(tickValue)
      
      ticks.push(
        <g key={`y-tick-${i}`}>
          <line 
            x1={padding - 5} 
            y1={y} 
            x2={padding} 
            y2={y} 
            stroke="#888" 
          />
          <text 
            x={padding - 10} 
            y={y + 5} 
            textAnchor="end" 
            fontSize="12" 
            fill="#888"
          >
            {formatXp(tickValue)}
          </text>
          {/* Horizontal grid line */}
          <line 
            x1={padding} 
            y1={y} 
            x2={width - padding} 
            y2={y} 
            stroke="#333" 
            strokeOpacity="0.2" 
            strokeDasharray="4"
          />
        </g>
      )
    }
    
    return ticks
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* Title */}
      <text 
        x={width / 2} 
        y={30} 
        textAnchor="middle" 
        fontSize="20" 
        fontWeight="bold"
        fill="currentColor"
      >
        XP Progress Over Time
      </text>
      
      {/* X-axis */}
      <line 
        x1={padding} 
        y1={height - padding} 
        x2={width - padding} 
        y2={height - padding} 
        stroke="#888" 
      />
      <text 
        x={width / 2} 
        y={height - 10} 
        textAnchor="middle" 
        fontSize="14"
        fill="#888"
      >
        Date
      </text>
      
      {/* Y-axis */}
      <line 
        x1={padding} 
        y1={padding} 
        x2={padding} 
        y2={height - padding} 
        stroke="#888" 
      />
      <text 
        transform={`rotate(-90, 20, ${height / 2})`}
        x={20} 
        y={height / 2} 
        textAnchor="middle" 
        fontSize="14"
        fill="#888"
      >
        Total XP
      </text>
      
      {/* Axis ticks */}
      {generateXTicks()}
      {generateYTicks()}
      
      {/* Data line */}
      <path 
        d={linePath} 
        fill="none" 
        stroke="#646cff" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Data points */}
      {graphData.map((point, i) => (
        <circle
          key={i}
          cx={xScale(point.date)}
          cy={yScale(point.xp)}
          r="4"
          fill="#646cff"
        />
      ))}
    </svg>
  )
}

// Projects Ratio Graph (Pie Chart)
export const ProjectsRatioGraph = ({ passCount, failCount }) => {
  if (passCount === 0 && failCount === 0) {
    return <div>No projects data available</div>
  }

  // Graph settings
  const width = 800
  const height = 400
  const radius = Math.min(width, height) / 3
  const centerX = width / 2
  const centerY = height / 2

  // Calculate percentages
  const total = passCount + failCount
  const passPercentage = (passCount / total) * 100
  const failPercentage = (failCount / total) * 100

  // Create pie chart segments
  const createPieSegment = (startAngle, endAngle, color) => {
    // Convert angles to radians
    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(" ")
    
    return (
      <path d={pathData} fill={color} />
    )
  }

  // Calculate pass segment
  const passEndAngle = (passCount / total) * 360
  
  // Calculate label positions
  const passLabelAngle = (passEndAngle / 2 - 90) * (Math.PI / 180)
  const passLabelX = centerX + (radius * 0.6) * Math.cos(passLabelAngle)
  const passLabelY = centerY + (radius * 0.6) * Math.sin(passLabelAngle)
  
  const failLabelAngle = (passEndAngle + (360 - passEndAngle) / 2 - 90) * (Math.PI / 180)
  const failLabelX = centerX + (radius * 0.6) * Math.cos(failLabelAngle)
  const failLabelY = centerY + (radius * 0.6) * Math.sin(failLabelAngle)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* Title */}
      <text 
        x={width / 2} 
        y={30} 
        textAnchor="middle" 
        fontSize="20" 
        fontWeight="bold"
        fill="currentColor"
      >
        Project Pass/Fail Ratio
      </text>
      
      {/* Pie chart segments */}
      {createPieSegment(0, passEndAngle, "#4ade80")} {/* Success color */}
      {createPieSegment(passEndAngle, 360, "#f87171")} {/* Error color */}
      
      {/* Segment labels */}
      <text 
        x={passLabelX} 
        y={passLabelY} 
        textAnchor="middle" 
        fill="white" 
        fontWeight="bold"
        fontSize="16"
      >
        PASS
      </text>
      <text 
        x={failLabelX} 
        y={failLabelY} 
        textAnchor="middle" 
        fill="white" 
        fontWeight="bold"
        fontSize="16"
      >
        FAIL
      </text>
      
      {/* Legend */}
      <g transform={`translate(${width - 150}, ${height - 100})`}>
        <rect x="0" y="0" width="20" height="20" fill="#4ade80" />
        <text 
          x="30" 
          y="15" 
          fontSize="14" 
          fill="currentColor"
        >
          PASS ({passCount}) - {passPercentage.toFixed(1)}%
        </text>
        
        <rect x="0" y="30" width="20" height="20" fill="#f87171" />
        <text 
          x="30" 
          y="45" 
          fontSize="14" 
          fill="currentColor"
        >
          FAIL ({failCount}) - {failPercentage.toFixed(1)}%
        </text>
      </g>
    </svg>
  )
}