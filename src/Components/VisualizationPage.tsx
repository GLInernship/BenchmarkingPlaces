import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import hereLogo from './HERE_logo.svg.png';


interface VisualizationPageProps {}

export const VisualizationPage: React.FC<VisualizationPageProps> = () => {
  // ... component code ...

  const location = useLocation();
  const { matchingData } = location.state as { matchingData: { matches: number, nonMatches: number } };
  const barChartRef = useRef<SVGSVGElement | null>(null);
  const pieChartRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (barChartRef.current) {
        const { width } = barChartRef.current.getBoundingClientRect();
        setDimensions({ width, height: width * 0.6 });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (barChartRef.current && pieChartRef.current && dimensions.width > 0 && dimensions.height > 0) {
      createBarGraph();
      createPieChart();
    }
  }, [matchingData, dimensions]);
  const createBarGraph = () => {
    const { width, height } = dimensions;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    d3.select(barChartRef.current).selectAll("*").remove();

    const svg = d3.select(barChartRef.current)
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



  const createPieChart = () => {
    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2;

    d3.select(pieChartRef.current).selectAll("*").remove();

    const svg = d3.select(pieChartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(['Matches', 'Non-Matches'])
      .range(['#E0E1A7', '#A8DEC6']);

    const pie = d3.pie<any>()
      .value(d => d.value);

    const data = [
      { category: 'Matches', value: matchingData.matches },
      { category: 'Non-Matches', value: matchingData.nonMatches }
    ];

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc as any)
      .attr('fill', d => color(d.data.category) as string);

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d as any)})`)
      .attr('text-anchor', 'middle')
      .text(d => `${d.data.category}: ${d.data.value} (${((d.data.value / (matchingData.matches + matchingData.nonMatches)) * 100).toFixed(1)}%)`);
  };

  return (
    <div>
      <div style={{
        width: '100%',
        background: 'linear-gradient(to right, #A8DEC6, #E0E1A7)',
        padding: '20px 0',
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <img 
          src={hereLogo}
          alt="HERE Logo" 
          style={{
            height: '70px',
            marginLeft: '20px',
          }}
        />
        <h1 style={{
          textAlign: 'center',
          color: '#333',
          margin: 0,
          fontSize: '24px',
          flexGrow: 1,
        }}>
          HERE API Results Matching with Google Data
        </h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        <div style={{ width: '100%', maxWidth: '1000px', margin: '20px auto' }}>
          <h2 style={{ textAlign: 'center' }}>Bar Graph</h2>
          <svg ref={barChartRef} style={{ width: '100%', height: 'auto' }}></svg>
        </div>
        <div style={{ width: '100%', maxWidth: '1000px', margin: '20px auto' }}>
          <h2 style={{ textAlign: 'center' }}>Pie Chart</h2>
          <svg ref={pieChartRef} style={{ width: '100%', height: 'auto' }}></svg>
        </div>
      </div>
    </div>
  );
};