"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef } from "react"

export default function HeroSection() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Animation for nodes
    const nodes = svgRef.current.querySelectorAll(".node")
    nodes.forEach((node, index) => {
      const animation = node.animate(
        [{ transform: "translateY(0px)" }, { transform: "translateY(-5px)" }, { transform: "translateY(0px)" }],
        {
          duration: 3000 + index * 500,
          iterations: Number.POSITIVE_INFINITY,
          easing: "ease-in-out",
        },
      )
    })

    // Animation for connection lines
    const lines = svgRef.current.querySelectorAll(".connection")
    lines.forEach((line, index) => {
      const animation = line.animate([{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }], {
        duration: 2000 + index * 300,
        iterations: Number.POSITIVE_INFINITY,
        easing: "ease-in-out",
      })
    })

    // Animation for data flow
    const dataPoints = svgRef.current.querySelectorAll(".data-point")
    dataPoints.forEach((point) => {
      const pathLength = (point as SVGPathElement).getTotalLength()
      point.setAttribute("stroke-dasharray", pathLength.toString())
      point.setAttribute("stroke-dashoffset", pathLength.toString())

      const animation = point.animate([{ strokeDashoffset: pathLength }, { strokeDashoffset: 0 }], {
        duration: 3000,
        iterations: Number.POSITIVE_INFINITY,
        easing: "linear",
      })
    })
  }, [])

  return (
    <section id="hero" className="relative overflow-hidden bg-background min-h-screen flex items-center">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="block">Empowering</span>
                <span className="block bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                  Smarter Company
                </span>
                <span className="block">Management</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl">
                Effectively monitor employee performance, analyze revenue and cost trends, 
                and strategically drive business growth with comprehensive management insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/create-new-company">
                  Start Building
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
            </div>

            {/* Feature Indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-chart-2 mr-3" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-chart-1 mr-3" />
                <span>Team Collaboration</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-chart-4 mr-3" />
                <span>Easy Integration</span>
              </div>
            </div>
          </div>

          {/* Right Column - Animation */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-square">
              <svg
                ref={svgRef}
                viewBox="0 0 500 500"
                className="relative w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect width="500" height="500" fill="transparent" rx="20" />

                {/* Central node - Management Hub */}
                <circle cx="250" cy="250" r="45" fill="hsl(var(--primary))" className="node" filter="url(#glow)" />
                <circle cx="250" cy="250" r="35" fill="hsl(var(--primary))" fillOpacity="0.8" />
                <text
                  x="250"
                  y="245"
                  textAnchor="middle"
                  fill="hsl(var(--primary-foreground))"
                  fontSize="11"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Management
                </text>
                <text
                  x="250"
                  y="258"
                  textAnchor="middle"
                  fill="hsl(var(--primary-foreground))"
                  fontSize="8"
                  dominantBaseline="middle"
                >
                  Hub
                </text>

                {/* Team nodes */}
                <circle cx="150" cy="150" r="35" fill="hsl(var(--chart-2))" className="node" filter="url(#glow)" />
                <circle cx="150" cy="150" r="25" fill="hsl(var(--chart-2))" fillOpacity="0.8" />
                <text
                  x="150"
                  y="145"
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Team
                </text>
                <text x="150" y="157" textAnchor="middle" fill="white" fontSize="8" dominantBaseline="middle">
                  Alpha
                </text>

                <circle cx="350" cy="150" r="35" fill="hsl(var(--chart-2))" className="node" filter="url(#glow)" />
                <circle cx="350" cy="150" r="25" fill="hsl(var(--chart-2))" fillOpacity="0.8" />
                <text
                  x="350"
                  y="145"
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Team
                </text>
                <text x="350" y="157" textAnchor="middle" fill="white" fontSize="8" dominantBaseline="middle">
                  Beta
                </text>

                <circle cx="150" cy="350" r="35" fill="hsl(var(--chart-2))" className="node" filter="url(#glow)" />
                <circle cx="150" cy="350" r="25" fill="hsl(var(--chart-2))" fillOpacity="0.8" />
                <text
                  x="150"
                  y="345"
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Team
                </text>
                <text x="150" y="357" textAnchor="middle" fill="white" fontSize="8" dominantBaseline="middle">
                  Gamma
                </text>

                <circle cx="350" cy="350" r="35" fill="hsl(var(--chart-2))" className="node" filter="url(#glow)" />
                <circle cx="350" cy="350" r="25" fill="hsl(var(--chart-2))" fillOpacity="0.8" />
                <text
                  x="350"
                  y="345"
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Team
                </text>
                <text x="350" y="357" textAnchor="middle" fill="white" fontSize="8" dominantBaseline="middle">
                  Delta
                </text>

                {/* Project nodes */}
                <circle cx="100" cy="250" r="30" fill="hsl(var(--chart-4))" className="node" filter="url(#glow)" />
                <circle cx="100" cy="250" r="20" fill="hsl(var(--chart-4))" fillOpacity="0.8" />
                <text
                  x="100"
                  y="246"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Project
                </text>
                <text x="100" y="256" textAnchor="middle" fill="white" fontSize="7" dominantBaseline="middle">
                  Alpha
                </text>

                <circle cx="400" cy="250" r="30" fill="hsl(var(--chart-4))" className="node" filter="url(#glow)" />
                <circle cx="400" cy="250" r="20" fill="hsl(var(--chart-4))" fillOpacity="0.8" />
                <text
                  x="400"
                  y="246"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Project
                </text>
                <text x="400" y="256" textAnchor="middle" fill="white" fontSize="7" dominantBaseline="middle">
                  Beta
                </text>

                <circle cx="250" cy="100" r="30" fill="hsl(var(--chart-4))" className="node" filter="url(#glow)" />
                <circle cx="250" cy="100" r="20" fill="hsl(var(--chart-4))" fillOpacity="0.8" />
                <text
                  x="250"
                  y="96"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Project
                </text>
                <text x="250" y="106" textAnchor="middle" fill="white" fontSize="7" dominantBaseline="middle">
                  Gamma
                </text>

                <circle cx="250" cy="400" r="30" fill="hsl(var(--chart-4))" className="node" filter="url(#glow)" />
                <circle cx="250" cy="400" r="20" fill="hsl(var(--chart-4))" fillOpacity="0.8" />
                <text
                  x="250"
                  y="396"
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Project
                </text>
                <text x="250" y="406" textAnchor="middle" fill="white" fontSize="7" dominantBaseline="middle">
                  Delta
                </text>

                {/* Task nodes */}
                <circle cx="180" cy="200" r="18" fill="hsl(var(--chart-5))" className="node" filter="url(#glow)" />
                <circle cx="180" cy="200" r="12" fill="hsl(var(--chart-5))" fillOpacity="0.8" />
                <text
                  x="180"
                  y="200"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Task
                </text>

                <circle cx="320" cy="200" r="18" fill="hsl(var(--chart-5))" className="node" filter="url(#glow)" />
                <circle cx="320" cy="200" r="12" fill="hsl(var(--chart-5))" fillOpacity="0.8" />
                <text
                  x="320"
                  y="200"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Task
                </text>

                <circle cx="180" cy="300" r="18" fill="hsl(var(--chart-5))" className="node" filter="url(#glow)" />
                <circle cx="180" cy="300" r="12" fill="hsl(var(--chart-5))" fillOpacity="0.8" />
                <text
                  x="180"
                  y="300"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Task
                </text>

                <circle cx="320" cy="300" r="18" fill="hsl(var(--chart-5))" className="node" filter="url(#glow)" />
                <circle cx="320" cy="300" r="12" fill="hsl(var(--chart-5))" fillOpacity="0.8" />
                <text
                  x="320"
                  y="300"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  Task
                </text>

                {/* Main Connections */}
                <line
                  x1="250"
                  y1="250"
                  x2="150"
                  y2="150"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="350"
                  y2="150"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="150"
                  y2="350"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="350"
                  y2="350"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />

                <line
                  x1="250"
                  y1="250"
                  x2="100"
                  y2="250"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="400"
                  y2="250"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="250"
                  y2="100"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />
                <line
                  x1="250"
                  y1="250"
                  x2="250"
                  y2="400"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth="3"
                  className="connection"
                  opacity="0.8"
                />

                {/* Task Connections */}
                <line
                  x1="150"
                  y1="150"
                  x2="180"
                  y2="200"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth="2"
                  className="connection"
                  opacity="0.6"
                />
                <line
                  x1="350"
                  y1="150"
                  x2="320"
                  y2="200"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth="2"
                  className="connection"
                  opacity="0.6"
                />
                <line
                  x1="150"
                  y1="350"
                  x2="180"
                  y2="300"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth="2"
                  className="connection"
                  opacity="0.6"
                />
                <line
                  x1="350"
                  y1="350"
                  x2="320"
                  y2="300"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth="2"
                  className="connection"
                  opacity="0.6"
                />

                {/* Data flow animations */}
                <path
                  d="M250,250 C220,220 180,180 150,150"
                  fill="none"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth="2"
                  className="data-point"
                  opacity="0.7"
                />
                <path
                  d="M250,250 C280,220 320,180 350,150"
                  fill="none"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth="2"
                  className="data-point"
                  opacity="0.7"
                />
                <path
                  d="M250,250 C220,280 180,320 150,350"
                  fill="none"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth="2"
                  className="data-point"
                  opacity="0.7"
                />
                <path
                  d="M250,250 C280,280 320,320 350,350"
                  fill="none"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth="2"
                  className="data-point"
                  opacity="0.7"
                />

                {/* Decorative circles */}
                <circle
                  cx="250"
                  cy="250"
                  r="70"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="8,4"
                  opacity="0.3"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="90"
                  fill="none"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth="1"
                  strokeDasharray="6,6"
                  opacity="0.2"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="110"
                  fill="none"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth="1"
                  strokeDasharray="4,8"
                  opacity="0.1"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
