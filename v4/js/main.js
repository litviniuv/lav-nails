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
