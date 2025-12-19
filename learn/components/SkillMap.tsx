import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SkillNode, MasteryLevel } from '../types';

interface SkillMapProps {
  skills: SkillNode[];
  onSkillClick: (skill: SkillNode) => void;
}

export const SkillMap: React.FC<SkillMapProps> = ({ skills, onSkillClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight || 600;
    
    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Define Glow Filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
        .attr("id", "glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "4.5")
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create links data
    const links: any[] = [];
    skills.forEach(skill => {
      skill.dependencies.forEach(depId => {
        links.push({ source: depId, target: skill.id });
      });
    });

    // Simulation setup
    const simulation = d3.forceSimulation(skills as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));

    // Draw lines
    const link = svg.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Draw nodes group
    const node = svg.append("g")
      .selectAll("g")
      .data(skills)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => onSkillClick(d))
      .call(drag(simulation) as any);

    // Hover interactions for pulse and shimmer effect
    node.on("mouseenter", function(event, d) {
        const circle = d3.select(this).select("circle");
        const text = d3.select(this).select("text");
        
        // Apply Glow Filter
        circle.style("filter", "url(#glow)");

        // Enhance text
        text.transition().duration(200)
            .attr("font-size", "14px")
            .attr("fill", "#ffffff")
            .style("text-shadow", "0 0 10px rgba(255,255,255,1)");

        // Pulse animation loop
        function pulse() {
            circle.transition()
                .duration(800)
                .ease(d3.easeQuadInOut)
                .attr("r", 28) // Expand larger
                .attr("stroke-width", 3)
                .attr("fill-opacity", 1)
                .transition()
                .duration(800)
                .ease(d3.easeQuadInOut)
                .attr("r", 20) // Return to normal
                .attr("stroke-width", 2)
                .attr("fill-opacity", 0.8)
                .on("end", pulse);
        }
        pulse();
    })
    .on("mouseleave", function(event, d) {
        const circle = d3.select(this).select("circle");
        const text = d3.select(this).select("text");

        // Stop animation
        circle.interrupt();
        text.interrupt();

        // Remove Filter
        circle.style("filter", null);

        // Reset state
        circle.transition().duration(300)
            .attr("r", 20)
            .attr("stroke-width", 2)
            .attr("fill-opacity", 0.8);

        text.transition().duration(300)
            .attr("font-size", "12px")
            .attr("fill", "#e2e8f0")
            .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");
    });

    // Node circles with color based on mastery
    node.append("circle")
      .attr("r", 20)
      .attr("fill", (d) => {
        switch (d.level) {
          case MasteryLevel.MASTERED: return "#10b981"; // Green
          case MasteryLevel.INTERMEDIATE: return "#3b82f6"; // Blue
          case MasteryLevel.BEGINNER: return "#f59e0b"; // Yellow
          default: return "#374151"; // Gray
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.8);

    // Node labels
    node.append("text")
      .text(d => d.name)
      .attr("x", 28)
      .attr("y", 5)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: d3.Simulation<any, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [skills, onSkillClick]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 text-white/50 text-sm">
        <i className="fas fa-project-diagram mr-2"></i> Skill Atom Map
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};