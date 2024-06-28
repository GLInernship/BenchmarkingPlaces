import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as d3 from 'd3';

interface VisualizationPageProps {}

const VisualizationPage: React.FC<VisualizationPageProps> = () => {
  const location = useLocation();
  const { matchingData } = location.state as { matchingData: { matches: number, nonMatches: number } };
  const chartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      createPieChart();
    }
  }, [matchingData]);

  const createPieChart = () => {
    const width = 900;
    const height = 900;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(['Matches', 'Non-Matches'])
      .range(['#4CAF50', '#F44336']);

    const pie = d3.pie<number>().value(d => d);

    const data = [matchingData.matches, matchingData.nonMatches];

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(i === 0 ? 'Matches' : 'Non-Matches') as string);

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d as any)})`)
      .attr('text-anchor', 'middle')
      .text((d, i) => `${d.data} (${((d.data / (matchingData.matches + matchingData.nonMatches)) * 100).toFixed(1)}%) ${i === 0 ? 'Data matching with Google' : 'Data not matching with Google'}`);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -height / 2 + 20)
      .text('HERE API Results Matching with Google Data');
  };

  return (
    <div>
      <h1>Data Visualization</h1>
      <svg ref={chartRef}></svg>
    </div>
  );
};

export default VisualizationPage;