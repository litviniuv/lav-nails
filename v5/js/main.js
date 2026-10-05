(function () {
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobile-menu");
  var header = document.querySelector(".site-header");
  var main = document.getElementById("main");
  if (!burger || !menu) return;

  var scrollY = 0;

  function lockScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("is-menu-open");
    document.body.classList.add("is-menu-open");
    document.body.style.top = "-" + scrollY + "px";
    if (main) main.setAttribute("inert", "");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("is-menu-open");
    document.body.classList.remove("is-menu-open");
    document.body.style.top = "";
    if (main) main.removeAttribute("inert");
    /* restore position instantly (html has smooth scroll-behavior) */
    var html = document.documentElement;
    var prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    html.style.scrollBehavior = prevBehavior;
  }

  function setOpen(open) {
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    menu.classList.toggle("is-open", open);
    if (header) header.classList.toggle("is-menu-open", open);
    if (open) {
      menu.removeAttribute("hidden");
      lockScroll();
      var first = menu.querySelector("a");
      if (first) first.focus();
    } else {
      menu.setAttribute("hidden", "");
      unlockScroll();
    }
  }

  burger.addEventListener("click", function () {
    var open = burger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
    if (!open) burger.focus();
  });

  menu.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link) return;
    setOpen(false);
    burger.focus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      burger.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 960px)").matches && burger.getAttribute("aria-expanded") === "true") {
      setOpen(false);
    }
  });
})();


/* Soft page-atmosphere dust (hero06 palette), skipped under reduced motion */
(function () {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) {}
  var c = document.createElement("canvas");
  c.className = "page-dust";
  c.setAttribute("aria-hidden", "true");
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext("2d");
  if (!ctx) return;
  var fine = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var pts = [], mx = 0, my = 0, W = 0, H = 0;
  function size() {
    W = window.innerWidth; H = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);
  var n = W < 700 ? 55 : 90;
  for (var i = 0; i < n; i++) {
    pts.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.25, v: Math.random() * 0.28 + 0.06, a: Math.random() });
  }
  if (fine) {
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX / W - 0.5;
      my = e.clientY / H - 0.5;
    }, { passive: true });
  }
  var color = "#d7e0c4";
  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.y -= p.v / 100;
      if (p.y < 0) p.y = 1;
      ctx.globalAlpha = 0.12 + p.a * 0.28;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc((p.x + mx * 0.03) * W, (p.y + my * 0.02) * H, p.r, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
