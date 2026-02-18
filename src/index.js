import express from "express";
import hbs from "hbs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool();

const fallbackProjects = [
  {
    id: 1,
    slug: "taskflow",
    name: "TaskFlow",
    description: "Task management app with role-based access and progress tracking.",
    tech: ["Node.js", "Express", "PostgreSQL", "Bootstrap"]
  },
  {
    id: 2,
    slug: "shoplane",
    name: "ShopLane",
    description: "E-commerce storefront with product catalog and checkout flow.",
    tech: ["JavaScript", "Express", "PostgreSQL", "Bootstrap"]
  },
  {
    id: 3,
    slug: "devlink",
    name: "DevLink",
    description: "Developer profile and portfolio platform with social integrations.",
    tech: ["Node.js", "Handlebars", "Bootstrap", "REST API"]
  }
];

const experiences = [
  {
    company: "Noble Studio",
    role: "Full-Stack Developer",
    duration: "2024 - Present"
  },
  {
    company: "Freelance",
    role: "Web Developer",
    duration: "2022 - 2024"
  }
];

const techStack = [
  { label: "HTML5", icon: "fa-brands fa-html5" },
  { label: "CSS3", icon: "fa-brands fa-css3-alt" },
  { label: "JavaScript", icon: "fa-brands fa-js" },
  { label: "Node.js", icon: "fa-brands fa-node-js" },
  { label: "Express", icon: "fa-solid fa-server" },
  { label: "PostgreSQL", icon: "fa-solid fa-database" },
  { label: "Bootstrap", icon: "fa-brands fa-bootstrap" }
];

async function getProjects() {
  try {
    const query = `
      SELECT id, slug, name, description, tech_stack
      FROM projects
      ORDER BY id ASC
    `;

    const { rows } = await pool.query(query);

    if (!rows.length) {
      return fallbackProjects;
    }

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      tech: Array.isArray(row.tech_stack) ? row.tech_stack : []
    }));
  } catch (error) {
    console.error("PostgreSQL read failed. Using fallback projects.", error.message);
    return fallbackProjects;
  }
}

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

hbs.registerPartials(path.join(__dirname, "views", "partials"));
hbs.registerPartials(path.join(__dirname, "views", "pages"));

hbs.registerHelper("eq", (a, b) => a === b);
hbs.registerHelper("year", () => new Date().getFullYear());

app.use(express.static(path.join(__dirname, "assets")));

app.get("/", async (req, res) => {
  const projects = await getProjects();

  res.render("layouts/main", {
    title: "Girindra | Full-Stack Developer",
    bodyPartial: "home",
    name: "Girindra Sulistiyo",
    subtitle: "Indie Hacker & Full-Stack Developer",
    description:
      "I build scalable web apps with clean architecture and practical UX. I focus on fast iteration, maintainable code, and reliable deployment.",
    location: "Based in Jakarta, Indonesia",
    whatsappLink: "https://wa.me/6281234567890",
    cvLink: "/cv/cv-girindra.txt",
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
