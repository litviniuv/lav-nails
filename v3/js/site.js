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

  /* Lock layout viewport height once — ignore mobile URL-bar resize jitter */
  (function lockAppVh() {
    var lastW = window.innerWidth;
    function set() {
      document.documentElement.style.setProperty("--app-vh", window.innerHeight + "px");
    }
    set();
    window.addEventListener("resize", function () {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      set();
    });
    window.addEventListener("orientationchange", function () {
      setTimeout(function () {
        lastW = window.innerWidth;
        set();
      }, 120);
    });
  })();


  function lockScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("is-menu-open");
    document.body.classList.add("is-menu-open");
    document.body.style.top = "-" + scrollY + "px";
    if (main) main.setAttribute("inert", "");
  }

  function unlockScroll(toY) {
    var y = typeof toY === "number" ? toY : scrollY;
    document.documentElement.classList.remove("is-menu-open");
    document.body.classList.remove("is-menu-open");
    document.body.style.top = "";
    if (main) main.removeAttribute("inert");
    window.scrollTo(0, y);
  }

  function setOpen(open, unlockToY) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    menu.classList.toggle("is-open", open);
    if (header) header.classList.toggle("is-menu-open", open);
    if (open) {
      menu.removeAttribute("hidden");
      lockScroll();
      var first = menu.querySelector("a");
      if (first) {
        try { first.focus({ preventScroll: true }); }
        catch (err) { first.focus(); }
      }
    } else {
      menu.setAttribute("hidden", "");
      unlockScroll(unlockToY);
    }
  }

  function scrollPaddingTop() {
    var pad = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop);
    return isNaN(pad) ? 0 : pad;
  }

  /* Document Y for hash while scroll-lock may be active (saved scrollY + rect). */
  function hashDocumentY(hash) {
    if (!hash || hash.charAt(0) !== "#") return null;
    if (hash === "#" || hash === "#top") return 0;
    var target = document.getElementById(hash.slice(1));
    if (!target) return null;
    return Math.max(0, Math.round(scrollY + target.getBoundingClientRect().top - scrollPaddingTop()));
  }

  function focusBurger() {
    if (!burger || typeof burger.focus !== "function") return;
    try { burger.focus({ preventScroll: true }); }
    catch (err) { burger.focus(); }
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
      if (!open) focusBurger();
    });

    menu.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      var hash = link.getAttribute("href") || "";
      if (hash.charAt(0) === "#") {
        e.preventDefault();
        /* Destination while lock active — no unlock→0→scrollIntoView flash from hero */
        var destY = hashDocumentY(hash);
        if (destY === null) {
          setOpen(false);
          focusBurger();
          return;
        }
        var startY = scrollY;
        if (reduceMotion || destY === startY) {
          setOpen(false, destY);
        } else {
          setOpen(false, startY);
          window.scrollTo({ top: destY, behavior: "smooth" });
        }
        if (history.replaceState) {
          history.replaceState(null, "", hash === "#" ? "#top" : hash);
        }
        focusBurger();
        return;
      }
      setOpen(false);
      focusBurger();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        focusBurger();
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

  /* Scroll pans the photo clipped inside ЛАВ. Rest position matches the static crop. */
  if (hero && !reduceMotion) {
    var fillRaf = 0;
    function syncHeroFill() {
      fillRaf = 0;
      if (document.documentElement.classList.contains("is-menu-open")) return;
      var travel = Math.max((hero.offsetHeight || window.innerHeight) * 0.72, 1);
      var y = window.scrollY || window.pageYOffset || 0;
      var p = Math.max(0, Math.min(1, y / travel));
      document.documentElement.style.setProperty("--fill-x", (50 - p * 28).toFixed(2) + "%");
      document.documentElement.style.setProperty("--fill-y", (40 + p * 58).toFixed(2) + "%");
    }
    window.addEventListener("scroll", function () {
      if (!fillRaf) fillRaf = requestAnimationFrame(syncHeroFill);
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (!fillRaf) fillRaf = requestAnimationFrame(syncHeroFill);
    }, { passive: true });
    syncHeroFill();
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

/* Click-to-load Yandex map (avoids eager long task) */
(function () {
  var wrap = document.querySelector(".map-wrap[data-map-src]");
  if (!wrap) return;
  var btn = wrap.querySelector("[data-map-load]");
  if (!btn) return;
  function loadMap() {
    if (wrap.classList.contains("is-loaded")) return;
    var src = wrap.getAttribute("data-map-src");
    if (!src) return;
    var iframe = document.createElement("iframe");
    iframe.title = "Лав Студия на Яндекс Картах";
    iframe.src = src;
    iframe.width = "560";
    iframe.height = "400";
    iframe.allowFullscreen = true;
    iframe.setAttribute("loading", "lazy");
    wrap.appendChild(iframe);
    wrap.classList.add("is-loaded");
  }
  btn.addEventListener("click", loadMap);
})();
