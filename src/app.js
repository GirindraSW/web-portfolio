import express from "express";
import hbs from "hbs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool();
const app = express();

const fallbackProjects = [
  {
    id: 1,
    slug: "qibla-compass-app",
    name: "Qibla Direction Recommender App",
    description:
      "Built a Flutter app that recommends Qibla direction and stores app data in Firebase. The related journal was published in SINTA 3.",
    tech: ["Flutter", "Dart", "Firebase"]
  },
  {
    id: 2,
    slug: "flight-booking-app",
    name: "Flight Booking App",
    description:
      "Developed a full stack mobile app for airplane ticket and seat booking with Firebase integration.",
    tech: ["Flutter", "Dart", "Firebase"]
  }
];

const experiences = [
  {
    company: "Universitas Ahmad Dahlan",
    role: "Informatics Laboratory Assistant",
    duration: "Jan 2020 - Feb 2022",
    mark: "UAD",
    responsibilities: [
      "Trained 50+ students in statistics laboratory sessions.",
      "Guided students to solve technical and analytical problems.",
      "Reported semester learning outcomes to lecturers."
    ],
    skills: ["Communication", "Teaching", "Problem Solving"]
  },
  {
    company: "Bidang Publikasi Ilmiah UAD",
    role: "Web Support, Graphic Design, and Front Desk",
    duration: "Sep 2020 - Mar 2021",
    mark: "BPI",
    responsibilities: [
      "Updated web content based on stakeholder requests.",
      "Created design assets, pamphlets, and edited videos.",
      "Handled front desk and publication support tasks."
    ],
    skills: ["Web Support", "CorelDraw", "Teamwork"]
  }
];

const techStack = [
  { label: "Dart", icon: "devicon-dart-plain colored" },
  { label: "Flutter", icon: "devicon-flutter-plain colored" },
  { label: "Firebase", icon: "devicon-firebase-plain colored" },
  { label: "MySQL", icon: "devicon-mysql-original colored" },
  { label: "C++", icon: "devicon-cplusplus-plain colored" },
  { label: "PHP", icon: "devicon-php-plain colored" },
  { label: "Bootstrap", icon: "devicon-bootstrap-plain colored" }
];

const projectDetailLinks = {
  "flight-booking-app": "https://github.com/GirindraSW/AirPlaneCourseREH",
  "qibla-compass-app": "https://github.com/GirindraSW/RSD_Qibla"
};

const projectImages = {
  "flight-booking-app": "/img/airplane.png",
  "qibla-compass-app": "/img/qibla.png"
};

const seedProjects = [
  {
    slug: "qibla-compass-app",
    name: "Qibla Direction Recommender App",
    description:
      "Built a Flutter app that recommends Qibla direction and stores app data in Firebase. The related journal was published in SINTA 3.",
    tech_stack: ["Flutter", "Dart", "Firebase"]
  },
  {
    slug: "flight-booking-app",
    name: "Flight Booking App",
    description:
      "Developed a full stack mobile app for airplane ticket and seat booking with Firebase integration.",
    tech_stack: ["Flutter", "Dart", "Firebase"]
  }
];

let dbReadyPromise;

function enrichProjects(list) {
  return list.map((item) => {
    const detailUrl = projectDetailLinks[item.slug] || `/projects/${item.slug}`;
    const isExternal = Boolean(projectDetailLinks[item.slug]);
    const imageUrl = projectImages[item.slug] || null;

    return {
      ...item,
      imageUrl,
      detailUrl,
      detailTarget: isExternal ? "_blank" : "_self",
      detailRel: isExternal ? "noopener noreferrer" : ""
    };
  });
}

async function ensureDatabaseSetup() {
  if (dbReadyPromise) return dbReadyPromise;

  dbReadyPromise = (async () => {
    const setupQuery = `
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(120) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        tech_stack TEXT[] NOT NULL DEFAULT '{}'
      );
    `;

    await pool.query(setupQuery);

    const upsertQuery = `
      INSERT INTO projects (slug, name, description, tech_stack)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        tech_stack = EXCLUDED.tech_stack
    `;

    for (const project of seedProjects) {
      await pool.query(upsertQuery, [
        project.slug,
        project.name,
        project.description,
        project.tech_stack
      ]);
    }
  })().catch((error) => {
    console.error("DB setup failed. App will use fallback data.", error.message);
    return null;
  });

  return dbReadyPromise;
}

async function getProjects() {
  try {
    await ensureDatabaseSetup();

    const query = `
      SELECT id, slug, name, description, tech_stack
      FROM projects
      ORDER BY id ASC
    `;

    const { rows } = await pool.query(query);

    if (!rows.length) {
      return enrichProjects(fallbackProjects);
    }

    return enrichProjects(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        tech: Array.isArray(row.tech_stack) ? row.tech_stack : []
      }))
    );
  } catch (error) {
    console.error("PostgreSQL read failed. Using fallback projects.", error.message);
    return enrichProjects(fallbackProjects);
  }
}

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

hbs.registerPartials(path.join(__dirname, "views", "partials"));
hbs.registerPartials(path.join(__dirname, "views", "pages"));

hbs.registerHelper("year", () => new Date().getFullYear());

app.use(express.static(path.join(__dirname, "assets")));

app.get("/", async (req, res) => {
  const projects = await getProjects();

  res.render("layouts/main", {
    title: "Girindra Sulistiyo Wardoyo | Mobile Developer",
    bodyPartial: "home",
    name: "Girindra Sulistiyo Wardoyo",
    subtitle: "Mobile Developer (Flutter) & Web Developer (JavaScript)",
    description:
      "Informatics graduate from Universitas Ahmad Dahlan (GPA 3.54) with hands-on experience building mobile apps. Focused on Flutter and Firebase, with strong communication, critical thinking, and teamwork skills.",
    location: "Cilacap, Central Java, Indonesia",
    whatsappLink: "https://wa.me/6285156796968",
    cvLink: "/cv/cv_girindra.pdf",
    projects,
    experiences,
    techStack
  });
});

app.get("/projects/:slug", async (req, res) => {
  const projects = await getProjects();
  const project = projects.find((item) => item.slug === req.params.slug);

  if (!project) {
    return res.status(404).render("layouts/main", {
      title: "Project Not Found",
      bodyPartial: "project-not-found"
    });
  }

  return res.render("layouts/main", {
    title: `${project.name} | Project Detail`,
    bodyPartial: "project-detail",
    project
  });
});

export { app, ensureDatabaseSetup };
