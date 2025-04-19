import React, { useRef, useEffect, useState } from 'react';
import { CycleResult } from '../types';
import { formatTime } from '../utils/helpers';
import { Hand as HandStop } from 'lucide-react';

interface BreathHoldChartProps {
  results: CycleResult[];
}

const BreathHoldChart: React.FC<BreathHoldChartProps> = ({ results }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Constants for chart dimensions
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  
  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement?.clientWidth || 600;
        const containerHeight = Math.min(400, window.innerHeight * 0.6);
        setDimensions({ width: containerWidth, height: containerHeight });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  if (results.length === 0) {
    return <div className="text-center text-ocean-300 py-4">No breath hold data available.</div>;
  }
  
  // Calculate chart data
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;
  
  // Find the max values for scaling
  const maxTime = Math.max(
    ...results.map(r => Math.max(r.breatheTime, r.actualHoldTime, r.holdTime)),
    // Add a small buffer to ensure bars don't touch the top
    30
  );
  
  // Calculate time scale (x-axis)
  const timeScale = (value: number) => (value / maxTime) * chartWidth;
  
  // Calculate bar height and spacing
  const barHeight = 40;
  const barSpacing = 30;
  const totalBarHeight = (barHeight + barSpacing) * results.length;
  
  // Ensure the chart is tall enough
  const adjustedChartHeight = Math.max(chartHeight, totalBarHeight);
  
  // Generate time ticks for x-axis
  const timeTickCount = 6;
  const timeTicks = Array.from({ length: timeTickCount }, (_, i) => 
    Math.round((maxTime / (timeTickCount - 1)) * i)
  );
  
  // Calculate top margin for the chart based on screen size
  // Add additional space for the legend on small screens
  const topMarginWithLegend = window.innerWidth < 640 ? margin.top + 80 : margin.top;
  
  return (
    <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg border border-ocean-700/30 p-6 my-6">
      <h2 className="text-xl font-semibold text-ocean-100 mb-4">Breath Hold Performance</h2>
      
      {/* Legend - Positioned outside the SVG for better mobile layout */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#34D399] rounded mr-2"></div>
          <span className="text-sm text-ocean-300">Breathe Time</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#3B82F6] rounded mr-2"></div>
          <span className="text-sm text-ocean-300">Target Hold Time</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#8B5CF6] rounded mr-2"></div>
          <span className="text-sm text-ocean-300">Actual Hold Time</span>
        </div>
      </div>
      
      <div className="relative">
        <svg 
          ref={svgRef}
          width={dimensions.width} 
          height={dimensions.height}
          className="overflow-visible"
        >
          {/* X-axis (time) */}
          <line 
            x1={margin.left} 
            y1={margin.top + adjustedChartHeight} 
            x2={margin.left + chartWidth} 
            y2={margin.top + adjustedChartHeight} 
            stroke="#4B5563" 
            strokeWidth="1"
          />
          
          {/* X-axis ticks and labels */}
          {timeTicks.map((tick, i) => (
            <g key={i}>
              <line 
                x1={margin.left + timeScale(tick)} 
                y1={margin.top + adjustedChartHeight} 
                x2={margin.left + timeScale(tick)} 
                y2={margin.top + adjustedChartHeight + 5} 
                stroke="#4B5563" 
                strokeWidth="1"
              />
              <text 
                x={margin.left + timeScale(tick)} 
                y={margin.top + adjustedChartHeight + 20}
                textAnchor="middle" 
                fontSize="12" 
                fill="#9CA3AF"
              >
                {formatTime(tick)}
              </text>
            </g>
          ))}
          
          {/* X-axis label */}
          <text 
            x={margin.left + chartWidth / 2} 
            y={margin.top + adjustedChartHeight + 45}
            textAnchor="middle" 
            fontSize="14" 
            fill="#D1D5DB"
            fontWeight="500"
          >
            Time (mm:ss)
          </text>
          
          {/* Y-axis */}
          <line 
            x1={margin.left} 
            y1={margin.top} 
            x2={margin.left} 
            y2={margin.top + adjustedChartHeight} 
            stroke="#4B5563" 
            strokeWidth="1"
          />
          
          {/* Chart title */}
          <text 
            x={margin.left + chartWidth / 2} 
            y={margin.top - 15}
            textAnchor="middle" 
            fontSize="16" 
            fill="#E5E7EB"
            fontWeight="bold"
          >
            Breath Hold Performance by Cycle
          </text>
          
          {/* Bars for each cycle */}
          {results.map((result, index) => {
            const y = margin.top + (barHeight + barSpacing) * index;
            
            return (
              <g key={index}>
                {/* Cycle label */}
                <text 
                  x={margin.left - 10} 
                  y={y + barHeight / 2}
                  textAnchor="end" 
                  fontSize="12" 
                  fill="#9CA3AF"
                >
                  Cycle {result.cycleIndex + 1}
                </text>
                
                {/* Breathe time bar - always show this */}
                <rect
                  x={margin.left}
                  y={y}
                  width={timeScale(result.breatheTime)}
                  height={result.wasTapMode ? barHeight / 2 : barHeight / 2}
                  fill="#34D399"
                  fillOpacity="0.7"
                  rx="2"
                />
                <text
                  x={margin.left + timeScale(result.breatheTime) + 5}
                  y={y + barHeight / 4 + 4}
                  fontSize="11"
                  fill="#34D399"
                >
                  {formatTime(result.breatheTime)}
                </text>
                
                {/* Target hold time bar - only show for non-tap mode */}
                {!result.wasTapMode && (
                  <>
                    <rect
                      x={margin.left}
                      y={y + barHeight / 2}
                      width={timeScale(result.holdTime)}
                      height={barHeight / 2}
                      fill="#3B82F6"
                      fillOpacity="0.7"
                      rx="2"
                    />
                    <text
                      x={margin.left + timeScale(result.holdTime) + 5}
                      y={y + barHeight / 2 + barHeight / 4 + 4}
                      fontSize="11"
                      fill="#3B82F6"
                    >
                      {formatTime(result.holdTime)}
                    </text>
                  </>
                )}
                
                {/* Actual hold time bar - only show for tap mode */}
                {result.wasTapMode && (
                  <>
                    <rect
                      x={margin.left}
                      y={y + barHeight / 2}
                      width={timeScale(result.actualHoldTime)}
                      height={barHeight / 2}
                      fill="#8B5CF6"
                      fillOpacity="0.7"
                      rx="2"
                    />
                    <text
                      x={margin.left + timeScale(result.actualHoldTime) + 5}
                      y={y + barHeight / 2 + barHeight / 4 + 4}
                      fontSize="11"
                      fill="#8B5CF6"
                    >
                      {formatTime(result.actualHoldTime)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="mt-6 text-ocean-400 text-sm">
        <p>The chart shows your breathe times (green) for each cycle. For standard cycles, the blue bar represents your target hold time. For tap mode cycles, the purple bar shows your actual hold time.</p>
        {results.some(r => r.wasTapMode) && (
          <p className="mt-2 flex items-center">
            <HandStop size={14} className="mr-1 text-purple-400" />
            <span className="text-purple-400">Purple bars indicate tap mode cycles where you manually ended the breath hold.</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default BreathHoldChart;