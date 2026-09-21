const J2000_MS = 946728000000

export interface PlanetMission {
  name:   string
  type:   "orbiter" | "lander" | "rover" | "flyby" | "probe"
  active: boolean
  year:   number
}

export interface Planet {
  id:                string
  name:              string
  color:             string
  emissive:          string
  atmosphere?:       string
  hasRings:          boolean
  ringColor?:        string
  threeRadius:       number
  orbitalPeriodDays: number
  orbitalRadiusAU:   number
  moons:             number
  diameterKm:        number
  type:              string
  axialTilt:         number
  missions:          PlanetMission[]
  fact:              string
}

export const PLANETS: Planet[] = [
  {
    id: "sun", name: "Sun",
    color: "#FF9030", emissive: "#FF4400", atmosphere: "#FF903080",
    hasRings: false, threeRadius: 1.5, axialTilt: 7.25,
    orbitalPeriodDays: 1, orbitalRadiusAU: 0,
    moons: 0, diameterKm: 1392700, type: "Star",
    fact: "The Sun contains 99.86% of the total mass of the entire solar system.",
    missions: [
      { name: "Parker Solar Probe", type: "probe",   active: true, year: 2018 },
      { name: "Solar Orbiter",      type: "orbiter", active: true, year: 2020 },
      { name: "SOHO",               type: "orbiter", active: true, year: 1995 },
    ],
  },
  {
    id: "mercury", name: "Mercury",
    color: "#8C7853", emissive: "#2A2010",
    hasRings: false, threeRadius: 0.38, axialTilt: 0.03,
    orbitalPeriodDays: 87.97,    orbitalRadiusAU: 0.387,
    moons: 0, diameterKm: 4879, type: "Terrestrial",
    fact: "Temperatures swing from -180°C to 430°C in a single Mercurian day.",
    missions: [
      { name: "MESSENGER",   type: "orbiter", active: false, year: 2004 },
      { name: "BepiColombo", type: "flyby",   active: true,  year: 2018 },
    ],
  },
  {
    id: "venus", name: "Venus",
    color: "#E8C46A", emissive: "#5A3A10", atmosphere: "#D4A85080",
    hasRings: false, threeRadius: 0.95, axialTilt: 177.4,
    orbitalPeriodDays: 224.7,    orbitalRadiusAU: 0.723,
    moons: 0, diameterKm: 12104, type: "Terrestrial",
    fact: "A day on Venus is longer than its year.",
    missions: [
      { name: "Magellan", type: "orbiter", active: false, year: 1989 },
    ],
  },
  {
    id: "mars", name: "Mars",
    color: "#C1440E", emissive: "#4A1500", atmosphere: "#C1705050",
    hasRings: false, threeRadius: 0.53, axialTilt: 25.2,
    orbitalPeriodDays: 686.97,   orbitalRadiusAU: 1.524,
    moons: 2, diameterKm: 6779, type: "Terrestrial",
    fact: "Olympus Mons on Mars is the largest volcano in the solar system - 22km high.",
    missions: [
      { name: "Curiosity",    type: "rover",   active: true, year: 2011 },
      { name: "Perseverance", type: "rover",   active: true, year: 2020 },
      { name: "MAVEN",        type: "orbiter", active: true, year: 2013 },
      { name: "MRO",          type: "orbiter", active: true, year: 2005 },
      { name: "Mars Odyssey", type: "orbiter", active: true, year: 2001 },
    ],
  },
  {
    id: "jupiter", name: "Jupiter",
    color: "#C88B3A", emissive: "#3A1F00", atmosphere: "#C88B3A60",
    hasRings: false, threeRadius: 1.4, axialTilt: 3.1,
    orbitalPeriodDays: 4332.59,  orbitalRadiusAU: 5.203,
    moons: 95, diameterKm: 139820, type: "Gas Giant",
    fact: "Jupiter's Great Red Spot is a storm larger than Earth that has raged for 350+ years.",
    missions: [
      { name: "Juno",           type: "orbiter", active: true, year: 2011 },
      { name: "Europa Clipper", type: "orbiter", active: true, year: 2024 },
    ],
  },
  {
    id: "saturn", name: "Saturn",
    color: "#E4D191", emissive: "#3A3000", atmosphere: "#E4D19140",
    hasRings: true, ringColor: "#C8B87A",
    threeRadius: 1.2, axialTilt: 26.7,
    orbitalPeriodDays: 10759.22, orbitalRadiusAU: 9.537,
    moons: 146, diameterKm: 116460, type: "Gas Giant",
    fact: "Saturn is less dense than water - it would float in a large enough ocean.",
    missions: [
      { name: "Cassini", type: "orbiter", active: false, year: 1997 },
    ],
  },
  {
    id: "uranus", name: "Uranus",
    color: "#7DE8E8", emissive: "#003A3A", atmosphere: "#7DE8E840",
    hasRings: true, ringColor: "#3A7878",
    threeRadius: 1.0, axialTilt: 97.8,
    orbitalPeriodDays: 30688.5,  orbitalRadiusAU: 19.19,
    moons: 28, diameterKm: 50724, type: "Ice Giant",
    fact: "Uranus rotates on its side - its poles sit where other planets have their equators.",
    missions: [
      { name: "Voyager 2", type: "flyby", active: false, year: 1977 },
    ],
  },
  {
    id: "neptune", name: "Neptune",
    color: "#3F54BA", emissive: "#0A0F40", atmosphere: "#3F54BA50",
    hasRings: false, threeRadius: 0.95, axialTilt: 28.3,
    orbitalPeriodDays: 60182.0,  orbitalRadiusAU: 30.07,
    moons: 16, diameterKm: 49244, type: "Ice Giant",
    fact: "Neptune has the strongest winds in the solar system - up to 2,100 km/h.",
    missions: [
      { name: "Voyager 2", type: "flyby", active: false, year: 1977 },
    ],
  },
]

export const PLANET_MAP = Object.fromEntries(PLANETS.map(p => [p.id, p]))

export function realAngle(p: Planet, date = new Date()): number {
  const days = (date.getTime() - J2000_MS) / 86400000
  return (2 * Math.PI * days) / p.orbitalPeriodDays
}