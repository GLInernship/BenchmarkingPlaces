import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import hereLogo from './HERE_logo.svg.png';

interface VisualizationPageProps {}

const VisualizationPage: React.FC<VisualizationPageProps> = () => {
  const location = useLocation();
  const { matchingData } = location.state as { matchingData: { matches: number, nonMatches: number } };
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const { width } = chartRef.current.getBoundingClientRect();
        setDimensions({ width, height: width * 0.6 }); // Adjust the aspect ratio as needed
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (chartRef.current && dimensions.width > 0 && dimensions.height > 0) {
      createBarGraph();
    }
  }, [matchingData, dimensions]);

  const createBarGraph = () => {
    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height);

      const color = {
        matches: '#E0E1A7',
        nonMatches: '#A8DEC6'
      };

    const data = [
      { category: 'Matches', value: matchingData.matches },
      { category: 'Non-Matches', value: matchingData.nonMatches }
    ];

    const x = d3.scaleBand()
      .range([0, chartWidth])
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([chartHeight, 0]);

    x.domain(data.map(d => d.category));
    y.domain([0, d3.max(data, d => d.value) as number]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .call(d3.axisLeft(y));

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.category) as number)
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.value))
      .attr('fill', d => d.category === 'Matches' ? color.matches : color.nonMatches)
      .attr('opacity', (d, i) => i === 0 ? 1 : 0.7);

    g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (x(d.category) as number) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(d => `${d.value} (${((d.value / (matchingData.matches + matchingData.nonMatches)) * 100).toFixed(1)}%)`);

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 40})`)
      .style('text-anchor', 'middle')
      .text('Category');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .style('text-anchor', 'middle')
      .text('Count');
  };

  return (
    <div>
      <div 
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #A8DEC6, #E0E1A7)',
          padding: '20px 0',
          marginBottom: '20px'
        }}
      >
        
        <div 
  style={{
    width: '100%',
    background: 'linear-gradient(to right, #A8DEC6, #E0E1A7)',
    padding: '10px 0',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}
>
  <img 
    src={hereLogo}
    alt="HERE Logo" 
    style={{
      height: '90px',
      marginLeft: '20px',
     
    }}
  />
 <h1 
  style={{
    textAlign: 'center',
    color: '#333',
    margin: 0,
    fontSize: '24px',
    flexGrow: 1,
  }}
>
  HERE API Results Matching with Google Data
</h1>
</div>
      </div>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        <svg ref={chartRef} style={{ width: '100%', height: 'auto' }}></svg>
      </div>
    </div>
  );
};

export default VisualizationPage;



