export const COMPANY = {
  name: "Ironridge",
  full: "Ironridge Constructions",
  email: "build@ironridge.co",
  phone: "+91 20 4000 1987",
  address: "Ironridge House, Baner Road, Pune 411045",
  est: 1987,
};

export const PHASES = [
  { no: "01", name: "Mobilise", beat: "hero" },
  { no: "02", name: "Haul", beat: "haul" },
  { no: "03", name: "Excavate", beat: "dig" },
  { no: "04", name: "Frame", beat: "frame" },
  { no: "05", name: "Engineer", beat: "blueprint" },
  { no: "06", name: "Portfolio", beat: "projects" },
  { no: "07", name: "Handover", beat: "contact" },
] as const;

export const SERVICES = [
  {
    name: "Civil & Earthworks",
    img: "/images/s-civil.jpg",
    body: "Bulk excavation, rock breaking, shoring and dewatering — 40-tonne fleets moving a city block of earth a week.",
    tags: ["Excavation", "Piling", "Retaining"],
  },
  {
    name: "Structural Frame",
    img: "/images/s-structural.jpg",
    body: "Post-tensioned concrete and erected steel to 60 storeys, with in-house formwork and a four-day floor cycle.",
    tags: ["RCC", "Steel", "PT slabs"],
  },
  {
    name: "Roads & Highways",
    img: "/images/s-roads.jpg",
    body: "Six-lane expressways, interchanges and urban arterials — designed, paved and maintained under one contract.",
    tags: ["EPC", "Bitumen", "Concrete"],
  },
  {
    name: "Design–Build",
    img: "/images/s-design.jpg",
    body: "Architects, structural engineers and site leads at one table from first sketch — one contract, one accountable team.",
    tags: ["BIM", "Value eng.", "Permits"],
  },
  {
    name: "Fit-out & Interiors",
    img: "/images/s-interiors.jpg",
    body: "Core-and-shell to keys-in-hand: MEP, façades and Grade-A interiors, handed over with a 10-year workmanship warranty.",
    tags: ["MEP", "Façade", "Interiors"],
  },
];

export const PROJECTS = [
  { name: "Meridian Tower", place: "Mumbai", year: 2025, type: "Commercial · 34 floors", value: "₹ 1,240 Cr", img: "/images/p1-tower.jpg" },
  { name: "Krishna Valley Bridge", place: "Karnataka", year: 2024, type: "Infrastructure · 1.8 km", value: "₹ 860 Cr", img: "/images/p2-bridge.jpg" },
  { name: "Northgate Logistics Park", place: "Chakan", year: 2024, type: "Industrial · 1.2M sq ft", value: "₹ 410 Cr", img: "/images/p3-warehouse.jpg" },
  { name: "Banyan Residences", place: "Bengaluru", year: 2023, type: "Residential · 412 homes", value: "₹ 530 Cr", img: "/images/p4-residential.jpg" },
  { name: "Sahyadri Expressway, Pkg 4", place: "Maharashtra", year: 2023, type: "Highway · 42 km", value: "₹ 1,980 Cr", img: "/images/p5-highway.jpg" },
  { name: "Arcadia Tech Campus", place: "Hyderabad", year: 2022, type: "Campus · 2.1M sq ft", value: "₹ 1,120 Cr", img: "/images/p6-campus.jpg" },
];

export const PROCESS = [
  { no: "01", name: "Survey", body: "Drone photogrammetry and geotech bores give us the ground truth before a single line is drawn." },
  { no: "02", name: "Design", body: "A federated BIM model — architecture, structure, MEP — clash-checked weekly with your team." },
  { no: "03", name: "Engineer", body: "Sequencing, crane studies and temporary works planned to the hour, not the month." },
  { no: "04", name: "Build", body: "Our own crews, fleet and formwork. No middle layers between the plan and the pour." },
  { no: "05", name: "Handover", body: "Commissioned, documented, and warranted — with a digital twin of everything we built." },
];

export const CLIENTS = [
  "Northline Infra",
  "Kestrel Realty",
  "Aravali Capital",
  "Monsoon REIT",
  "Halden Group",
  "Sterling Ports",
  "Vantage Parks",
  "Coastal Works",
];
