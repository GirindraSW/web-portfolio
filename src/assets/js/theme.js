(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById("themeToggle");
  const toggleIcon = document.getElementById("themeToggleIcon");
  const navbar = document.querySelector(".site-navbar");
  const navLinks = document.querySelectorAll('.navbar a.nav-link[href^="#"]');
  const navCollapse = document.getElementById("mainNavbar");

  function setNavOffset() {
    if (!navbar) return;
    const navHeight = navbar.getBoundingClientRect().height;
    root.style.setProperty("--nav-offset", `${Math.ceil(navHeight)}px`);
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (!toggleIcon) return;
    const isDark = theme === "dark";
    toggleIcon.classList.toggle("fa-moon", !isDark);
    toggleIcon.classList.toggle("fa-sun", isDark);
  }

  const initialTheme =
    root.getAttribute("data-theme") ||
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  applyTheme(initialTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  setNavOffset();
  window.addEventListener("resize", setNavOffset);

  navLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      const targetId = this.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      const navOffset = parseInt(getComputedStyle(root).getPropertyValue("--nav-offset"), 10) || 88;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navOffset - 12;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth"
      });

      if (navCollapse && navCollapse.classList.contains("show") && window.bootstrap?.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
      }
    });
  });
})();
