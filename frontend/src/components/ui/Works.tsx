import { useEffect, useRef, useState } from "react";
import { Search, Brain, BarChart3, ScrollText } from "lucide-react";

export default function HowItWorksGov() {
  const svgRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<SVGSVGElement | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    const prog = progressRef.current;
    if (!el || !prog) return;

    const path = prog.querySelector("path") as SVGPathElement | null;
    if (!path) return;
    const length = path.getTotalLength();

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !animated) {
            setAnimated(true);
            path.style.transition = "stroke-dashoffset 2.5s ease-in-out";
            setTimeout(() => {
              path.style.strokeDashoffset = "0";
            }, 100);
          }
        });
      },
      { threshold: 0.4 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [animated]);

  const steps = [
    {
      title: "Data Collection",
      desc: "Gather comments from public platforms and MCA E-Consultation.",
      Icon: Search,
    },
    {
      title: "AI Analysis & Insights",
      desc: "Use NLP to detect key topics, sentiment and themes.",
      Icon: Brain,
    },
    {
      title: "Reporting & Visualization",
      desc: "View interactive reports and real-time visualizations.",
      Icon: BarChart3,
    },
    {
      title: "Actionable Recommendations",
      desc: "Receive data-driven suggestions for policy adjustments.",
      Icon: ScrollText,
    },
  ];

  // Adjusted waypoints for a wider, full-screen curve
  const waypoints = [
    { left: "13%", top: "74%", height: "95px" },
    { left: "38%", top: "60%", height: "105px" },
    { left: "62%", top: "45%", height: "130px" },
    { left: "87%", top: "45%", height: "120px" },
  ];

  // Official Government Color Palette (Deep Blue & Gold/Orange)
  const govBlue = "#2563eb"; // blue-900

  return (
    <section className="relative w-full bg-white py-24 overflow-hidden font-sans">
      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-black-900 tracking-tight">
            How It Works
          </h2>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed font-medium">
            Our intelligent pipeline transforms raw public feedback into clear,
            actionable policy direction. Experience the flow of data-driven
            decision making.
          </p>
        </div>
      </div>

      {/* Desktop Timeline - Full Screen Width */}
      <div className="relative hidden md:block w-full max-w-7xl mx-auto">
        {/* 1. The Curve Container */}
        <div
          ref={svgRef}
          className="absolute top-0 left-0 w-full h-52 pointer-events-none z-0"
        >
          {/* Base Grey Line */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1400 180" // Wider viewBox for full-screen feel
            preserveAspectRatio="none"
          >
            <path
              d="M-50,120 C300,180 800,20 1450,100" // Path extending beyond viewbox for full width
              fill="none"
              stroke="#cbd5e1" // slate-300
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          {/* Animated Official Blue Line */}
          <svg
            ref={progressRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1400 180"
            preserveAspectRatio="none"
          >
            <path
              d="M-50,120 C300,180 800,20 1450,100"
              fill="none"
              stroke={govBlue}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* Dots & Connectors */}
          {waypoints.map((point, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: point.left, top: point.top }}
            >
              {/* The Dot */}
              <div className="relative h-4 w-4 -mt-2 rounded-full bg-[#2563eb] shadow-sm ring-4 ring-white z-10"></div>

              {/* Connector Line */}
              <div 
                className="w-px border-l-[2px] border-dotted border-blue-300"
                style={{ height: point.height }}
              ></div>
            </div>
          ))}
        </div>

        {/* 2. The Content Grid */}
        <div className="relative z-10 grid grid-cols-4 gap-8 px-6 pt-52 max-w-7xl mx-auto">
          {steps.map(({ title, desc, Icon }) => (
            <div
              key={title}
              className="group relative flex flex-col items-center text-center p-8  bg-white border-t-4 border-[#2563eb] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Icon Circle */}
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-blue-600 ring-4 ring-blue-50 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Icon size={40} strokeWidth={2} />
              </div>

              <h3 className="text-lg font-bold text-black mb-3">
                {title}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-slate-600 px-2">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View (Clean Vertical Stack) */}
      <div className="mt-16 flex flex-col gap-8 md:hidden relative px-6">
        {/* Absolute Timeline Line for Mobile */}
        <div className="absolute left-10 top-4 bottom-12 w-px bg-slate-300"></div>

        {steps.map(({ title, desc, Icon }) => (
          <div key={title} className="relative pl-16">
            {/* Timeline dot for mobile */}
            <div className="absolute left-10 -translate-x-1/2 top-8 h-4 w-4 rounded-full bg-blue-900 ring-2 ring-white z-10" />

            <div className="flex flex-col items-start rounded-lg border-l-4 border-blue-900 bg-white p-6 shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-blue-900">{title}</h3>
              <p className="mt-2 text-sm font-medium text-slate-600">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}