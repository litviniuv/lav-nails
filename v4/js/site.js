(function () {
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobile-menu");
  var header = document.querySelector(".site-header");
  var main = document.getElementById("main");
  var hero = document.querySelector("[data-hero]");
  var pageBgImg = document.querySelector(".page-bg__img");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
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
    window.scrollTo(0, scrollY);
  }

  function setOpen(open) {
    if (!burger || !menu) return;
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

  function scrollToHash(hash) {
    if (!hash || hash.charAt(0) !== "#") return false;
    if (hash === "#" || hash === "#top") {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", "#top");
      return true;
    }
    var target = document.getElementById(hash.slice(1));
    if (!target) return false;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", hash);
    return true;
  }

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (!open) burger.focus();
    });

    menu.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      var hash = link.getAttribute("href") || "";
      if (hash.charAt(0) === "#") {
        e.preventDefault();
        setOpen(false);
        burger.focus();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            scrollToHash(hash);
          });
        });
        return;
      }
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
  }

  document.querySelectorAll('.nav-desktop a[href^="#"], a.brand[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href") || "";
      if (hash.charAt(0) !== "#") return;
      if (hash !== "#" && hash !== "#top" && !document.getElementById(hash.slice(1))) return;
      e.preventDefault();
      scrollToHash(hash);
    });
  });

  /* Hero entrance: curtain + circular reveal + kerning settle */
  function readyHero() {
    if (!hero) return;
    hero.classList.add("is-ready");
  }

  if (hero) {
    if (reduceMotion) {
      readyHero();
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(readyHero);
      });
    }
  }

  /* Pointer parallax on page photo (fine pointer only) */
  if (pageBgImg && finePointer && !reduceMotion) {
    var raf = 0;
    var targetX = 0;
    var targetY = 0;

    window.addEventListener(
      "pointermove",
      function (e) {
        var cx = (e.clientX / window.innerWidth - 0.5) * 2;
        var cy = (e.clientY / window.innerHeight - 0.5) * 2;
        targetX = cx * -12;
        targetY = cy * -8;
        if (!raf) {
          raf = requestAnimationFrame(function () {
            var px = targetX.toFixed(2) + "px";
            var py = targetY.toFixed(2) + "px";
            pageBgImg.style.setProperty("--px", px);
            pageBgImg.style.setProperty("--py", py);
            document.documentElement.style.setProperty("--px", px);
            document.documentElement.style.setProperty("--py", py);
            raf = 0;
          });
        }
      },
      { passive: true }
    );
  }

  /* Section circle reveals */
  var shots = document.querySelectorAll(".shot--reveal");
  if (shots.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      shots.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.01 }
      );
      shots.forEach(function (el) {
        io.observe(el);
      });
    }
  }
})();


/* Soft page-atmosphere dust (cream #f3ecdf), skipped under reduced motion */
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
  function rnd() { return Math.random(); }
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
    pts.push({
      x: rnd() * W,
      y: rnd() * H,
      r: 0.45 + rnd() * 1.35,
      vx: (rnd() - 0.5) * 0.014,
      vy: -(0.016 + rnd() * 0.04),
      a: 0.12 + rnd() * 0.28,
      ph: rnd() * 6.28
    });
  }
  if (fine) {
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX / W - 0.5;
      my = e.clientY / H - 0.5;
    }, { passive: true });
  }
  var last = performance.now();
  function loop(now) {
    var dt = Math.min(now - last, 50);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx * dt + mx * 0.02;
      p.y += p.vy * dt + my * 0.01;
      if (p.y < -4) { p.y = H + 4; p.x = rnd() * W; }
      if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
      var tw = 0.65 + 0.35 * Math.sin(now * 0.0012 + p.ph);
      ctx.fillStyle = "rgba(243,236,223," + (p.a * tw).toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
