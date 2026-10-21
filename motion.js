"use strict";

(() => {
  if (!Element.prototype.animate || !window.IntersectionObserver) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const desktop = window.matchMedia("(min-width: 1000px)");
  const root = document.documentElement;
  const activeAnimations = new Set();
  let paused = reduced.matches;
  let frame = 0;
  let sceneEnabled = false;
  let sceneDistance = 0;
  let canvasFrame = 0;
  let marqueeAnimation;
  const cleanup = new AbortController();

  function play(element, frames, options) {
    if (!element || paused || reduced.matches) return null;
    const animation = element.animate(frames, { duration: 900, easing: "cubic-bezier(.16,1,.3,1)", ...options });
    activeAnimations.add(animation);
    animation.finished.then(() => activeAnimations.delete(animation)).catch(() => activeAnimations.delete(animation));
    return animation;
  }

  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  // Dos copias visuales del mismo contenido, una sola accesible para lectores de pantalla.
  const strip = document.querySelector(".stack-inner");
  const originalStack = strip.querySelector("p");
  const stackWindow = document.createElement("div");
  const stackTrack = document.createElement("div");
  stackWindow.className = "stack-motion-window";
  stackTrack.className = "stack-motion-track";
  const stackClone = originalStack.cloneNode(true);
  stackClone.setAttribute("aria-hidden", "true");
  strip.append(stackWindow);
  stackWindow.append(stackTrack);
  stackTrack.append(originalStack, stackClone);

  function updateMarquee() {
    marqueeAnimation?.cancel();
    if (paused || reduced.matches) { stackTrack.style.transform = "none"; return; }
    const distance = originalStack.getBoundingClientRect().width + 36;
    marqueeAnimation = stackTrack.animate([{ transform: "translateX(0)" }, { transform: `translateX(-${distance}px)` }], { duration: 23000, iterations: Infinity, easing: "linear" });
  }
  stackWindow.addEventListener("pointerenter", () => marqueeAnimation?.pause());
  stackWindow.addEventListener("pointerleave", () => { if (!paused && !reduced.matches) marqueeAnimation?.play(); });

  // Escena horizontal con scroll nativo. Sin interceptar rueda, touch ni teclado.
  const process = document.getElementById("proceso");
  const processTrack = process.querySelector(".process-grid");
  const processInner = process.querySelector(".wrap");
  const processProgress = document.createElement("div");
  processProgress.className = "process-progress";
  processProgress.setAttribute("aria-hidden", "true");
  const processIndicator = document.createElement("span");
  processProgress.append(processIndicator);
  processInner.append(processProgress);

  const projectCards = [...document.querySelectorAll(".project-card")];
  const serviceCards = [...document.querySelectorAll(".service-card")];
  const sectionScenes = [...document.querySelectorAll("main>.section")];
  const aboutSection = document.querySelector(".about");
  const contactPanel = document.querySelector(".contact-panel");
  const lastWaves = new WeakMap();
  const headingWords = new WeakMap();
  const ghostLabels = { proyectos: "PROYECTOS", servicios: "SERVICIOS", "sobre-mi": "TRATO DIRECTO", proceso: "PROCESO", contacto: "HABLEMOS" };
  serviceCards.forEach((card, index) => card.style.setProperty("--card-index", String(index)));

  sectionScenes.forEach((section) => {
    const sweep = document.createElement("div");
    sweep.className = "section-sweep";
    sweep.setAttribute("aria-hidden", "true");
    section.prepend(sweep);
    if (!ghostLabels[section.id]) return;
    const ghost = document.createElement("div");
    ghost.className = "section-ghost";
    ghost.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.textContent = ghostLabels[section.id];
    ghost.append(text);
    section.prepend(ghost);
  });

  // Mantener nodos, saltos y colores; solo envolver palabras para escalonar su entrada.
  document.querySelectorAll(".section h2").forEach((heading) => {
    const accessibleCopy = heading.cloneNode(true);
    accessibleCopy.querySelectorAll('[aria-hidden="true"]').forEach((element) => element.remove());
    accessibleCopy.querySelectorAll("br").forEach((element) => element.replaceWith(document.createTextNode(" ")));
    heading.setAttribute("aria-label", accessibleCopy.textContent.replace(/\s+/g, " ").trim());
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim() && !walker.currentNode.parentElement.closest('[aria-hidden="true"],.sr-only')) nodes.push(walker.currentNode);
    }
    const words = [];
    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part.trim()) { fragment.append(document.createTextNode(part)); return; }
        const clip = document.createElement("span");
        clip.className = "word-clip";
        const word = document.createElement("span");
        word.className = "motion-heading-word";
        word.textContent = part;
        clip.append(word);
        fragment.append(clip);
        words.push(word);
      });
      node.replaceWith(fragment);
    });
    headingWords.set(heading, words);
  });

  function renderSectionScenes() {
    if (paused || reduced.matches) return;
    const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
    const sections = sectionScenes.map((section) => ({ section, rect: section.getBoundingClientRect() }));
    const projects = projectCards.map((card, index) => ({ card, index, rect: card.getBoundingClientRect() }));
    const services = serviceCards.map((card) => ({ card, rect: card.getBoundingClientRect() }));
    sections.forEach(({ section, rect }) => {
      if (rect.bottom < -150 || rect.top > innerHeight + 150) return;
      const fraction = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
      section.style.setProperty("--section-progress", String(clamp((innerHeight * .75 - rect.top) / (innerHeight * .5))));
      section.style.setProperty("--ghost-x", `${(fraction - .5) * (innerWidth < 650 ? 90 : 230)}px`);
      if (section === aboutSection) {
        const opening = Math.sin(fraction * Math.PI);
        section.style.setProperty("--section-scale", String(.945 + opening * .055));
        section.style.setProperty("--section-radius", `${(1 - opening) * 36}px`);
      }
    });
    projects.forEach(({ card, rect, index }) => {
      if (rect.bottom < -150 || rect.top > innerHeight + 150) return;
      const stableTop = rect.top - (lastWaves.get(card) || 0);
      const fraction = clamp((innerHeight * .55 - stableTop) / (innerHeight + rect.height), -1, 1);
      const wave = (index % 3 - 1) * fraction * (innerWidth > 850 ? 38 : 12);
      card.style.setProperty("--project-wave", `${wave}px`);
      lastWaves.set(card, wave);
    });
    services.forEach(({ card }, index) => {
      const next = services[index + 1];
      const approaching = next ? clamp((innerHeight * .7 - next.rect.top) / Math.max(1, innerHeight * .7 - 150)) : 0;
      card.style.setProperty("--stack-scale", String(1 - approaching * .045));
    });
    if (contactPanel) {
      const rect = contactPanel.getBoundingClientRect();
      const fraction = clamp((innerHeight * .85 - rect.top) / (innerHeight * .7));
      contactPanel.style.setProperty("--contact-rx", contactPanel.matches(":focus-within") ? "0deg" : `${(1 - fraction) * 12}deg`);
    }
  }

  function resetSectionScenes() {
    sectionScenes.forEach((section) => ["--section-progress", "--ghost-x", "--section-scale", "--section-radius"].forEach((property) => section.style.removeProperty(property)));
    projectCards.forEach((card) => { card.style.removeProperty("--project-wave"); lastWaves.delete(card); });
    serviceCards.forEach((card) => card.style.removeProperty("--stack-scale"));
    contactPanel?.style.removeProperty("--contact-rx");
  }

  function measure() {
    sceneEnabled = desktop.matches && !reduced.matches && !paused;
    process.classList.toggle("has-scroll-scene", sceneEnabled);
    // Con letras grandes, no fijar una escena que no quepa en una pantalla baja.
    if (sceneEnabled && processInner.offsetHeight > innerHeight - 108) {
      sceneEnabled = false;
      process.classList.remove("has-scroll-scene");
    }
    processProgress.hidden = !sceneEnabled;
    sceneDistance = sceneEnabled ? Math.max(0, processTrack.scrollWidth - processInner.clientWidth) : 0;
    if (!sceneEnabled) processTrack.style.transform = "none";
    updateMarquee();
    drawOnce();
    requestRender();
  }

  function render() {
    frame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? scrollY / range : 0})`;
    if (!paused && !reduced.matches) {
      const hero = document.getElementById("inicio").getBoundingClientRect();
      const shift = Math.max(-55, Math.min(90, -hero.top * .1));
      const portrait = document.querySelector(".portrait-reveal");
      if (portrait) portrait.style.translate = `0 ${shift}px`;
      document.querySelector(".hero-name")?.style.setProperty("translate", `0 ${shift * -.3}px`);
    }
    if (sceneEnabled) {
      const bounds = process.getBoundingClientRect();
      const available = Math.max(1, bounds.height - processInner.offsetHeight);
      const fraction = Math.max(0, Math.min(1, (92 - bounds.top) / available));
      processTrack.style.transform = `translate3d(${-sceneDistance * fraction}px,0,0)`;
      processIndicator.style.transform = `scaleX(${fraction})`;
    }
    renderSectionScenes();
  }
  function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
  addEventListener("scroll", requestRender, { passive: true, signal: cleanup.signal });
  addEventListener("resize", measure, { passive: true, signal: cleanup.signal });

  // Reveal progresivo: si no hay JS, o el observador falla, nada queda oculto.
  const lastReveal = new WeakMap();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (paused || reduced.matches || performance.now() - (lastReveal.get(entry.target) || -5000) < 1600) return;
      lastReveal.set(entry.target, performance.now());
      if (entry.target.matches(".project-card")) {
        const index = projectCards.indexOf(entry.target);
        play(entry.target, [{ opacity: .08, transform: `perspective(900px) translateY(125px) rotateX(18deg) rotateY(${index % 2 ? -9 : 9}deg) scale(.9)`, clipPath: "inset(22% 0 0 0 round 14px)" }, { opacity: 1, transform: "perspective(900px) translateY(0) rotateX(0) rotateY(0) scale(1)", clipPath: "inset(0 0 0 0 round 0px)" }], { duration: 1350, delay: index % 3 * 100 });
      } else if (entry.target.matches("h2")) {
        (headingWords.get(entry.target) || []).forEach((word, index) => play(word, [{ opacity: 0, transform: "translateY(115%) rotateX(-75deg) rotateZ(3deg)" }, { opacity: 1, transform: "translateY(0) rotateX(0) rotateZ(0)" }], { duration: 1200, delay: Math.min(index * 65, 560), fill: "backwards" }));
      } else if (entry.target.matches(".service-card")) {
        play(entry.target, [{ opacity: .1, transform: "perspective(1000px) translateY(100px) rotateX(17deg) scale(.94)" }, { opacity: 1, transform: "perspective(1000px) translateY(0) rotateX(0) scale(1)" }], { duration: 1400 });
      } else {
        play(entry.target, [{ opacity: .05, transform: "translateY(75px) scale(.96)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 1250 });
      }
    });
  }, { threshold: .09 });
  document.querySelectorAll(".project-card, .service-card, .section h2, .about-copy, .contact-panel,.process-grid>li,.footer-top").forEach((element) => observer.observe(element));
  document.querySelectorAll(".faq-list details").forEach((details) => details.addEventListener("toggle", () => {
    if (details.open) play(details.querySelector("p"), [{ opacity: 0, transform: "translateY(-16px)", clipPath: "inset(0 0 90% 0)" }, { opacity: 1, transform: "translateY(0)", clipPath: "inset(0 0 0 0)" }], { duration: 650 });
    requestRender();
  }));
  contactPanel?.addEventListener("focusin", requestRender);
  contactPanel?.addEventListener("focusout", requestRender);

  function enterHero() {
    document.querySelectorAll(".hero-line>span").forEach((line, index) => {
      play(line, [{ transform: "translateY(115%) rotate(4deg)", opacity: 0 }, { transform: "translateY(0) rotate(0)", opacity: 1 }], { duration: 1200, delay: 100 + index * 140, fill: "backwards" });
    });
    document.querySelectorAll(".hero-eyebrow,.hero-description,.hero-actions,.hero-note").forEach((element, index) => {
      play(element, [{ opacity: 0, transform: "translateY(22px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 900, delay: 250 + index * 100, fill: "backwards" });
    });
    play(document.querySelector(".portrait-reveal"), [{ opacity: 0, transform: "translateY(95px) rotateY(-18deg) scale(.82)" }, { opacity: 1, transform: "translateY(0) rotateY(0) scale(1)" }], { duration: 1700, delay: 200, fill: "backwards" });
  }

  // Canvas geométrico detrás del portfolio del hero. DPR limitado y detenido fuera de vista.
  const visual = document.querySelector(".hero-visual");
  const canvas = document.createElement("canvas");
  canvas.className = "hero-canvas";
  canvas.setAttribute("aria-hidden", "true");
  visual.prepend(canvas);
  const context = canvas.getContext("2d");
  const portraitRig = visual.querySelector(".portrait-rig");
  const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };
  document.getElementById("inicio").addEventListener("pointermove", (event) => {
    if (paused || reduced.matches || !finePointer.matches || event.pointerType === "touch") return;
    const bounds = document.getElementById("inicio").getBoundingClientRect();
    pointer.targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    pointer.targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
  }, { passive: true });
  document.getElementById("inicio").addEventListener("pointerleave", () => { pointer.targetX = 0; pointer.targetY = 0; });
  let heroVisible = true;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let phase = 0;
  let lastCanvasTime = 0;
  function drawOnce() {
    if (!context) return;
    const bounds = visual.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGeometry();
  }
  function drawGeometry() {
    if (!context) return;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const radius = canvasWidth * .48;
    context.save();
    context.translate(canvasWidth * .51, canvasHeight * .5);
    context.rotate(phase * .14);
    context.lineWidth = .7;
    for (let i = 0; i < 15; i++) {
      const angle = i / 15 * Math.PI + phase * .15;
      context.strokeStyle = i % 3 === 0 ? "rgba(240,68,82,.48)" : "rgba(255,255,255,.14)";
      context.beginPath();
      context.ellipse(0, 0, Math.max(8, Math.abs(Math.cos(angle)) * radius), radius * .88, -.28, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }
  function animateCanvas(time) {
    canvasFrame = 0;
    if (paused || reduced.matches || document.hidden || !heroVisible) return;
    if (time - lastCanvasTime > 32) {
      phase += .015;
      drawGeometry();
      if (portraitRig) {
        pointer.x += (pointer.targetX - pointer.x) * .075;
        pointer.y += (pointer.targetY - pointer.y) * .075;
        const idle = Math.sin(phase * 1.8);
        portraitRig.style.setProperty("--face-x", `${pointer.x * 15}px`);
        portraitRig.style.setProperty("--face-y", `${pointer.y * 8 + idle * 9}px`);
        portraitRig.style.setProperty("--face-rx", `${pointer.y * -7 + Math.cos(phase) * 1.2}deg`);
        portraitRig.style.setProperty("--face-ry", `${pointer.x * 11 + Math.sin(phase * .7) * 2}deg`);
        portraitRig.style.setProperty("--face-rz", `${pointer.x * 1.5 + idle * .7}deg`);
        visual.style.setProperty("--shadow-scale", String(1 - idle * .08));
        visual.style.setProperty("--shadow-opacity", String(.45 - idle * .1));
      }
      lastCanvasTime = time;
    }
    canvasFrame = requestAnimationFrame(animateCanvas);
  }
  function startCanvas() { if (!canvasFrame && !paused && !reduced.matches && heroVisible && !document.hidden) canvasFrame = requestAnimationFrame(animateCanvas); }
  const heroObserver = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; if (heroVisible) startCanvas(); }, { threshold: 0 });
  heroObserver.observe(visual);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(canvasFrame); canvasFrame = 0; marqueeAnimation?.pause(); }
    else { startCanvas(); if (!paused && !reduced.matches) marqueeAnimation?.play(); }
  });

  // Interacciones solo para mouse: tilt, luz y botones magnéticos; sin alterar el foco.
  document.querySelectorAll(".project-card").forEach((card) => {
    const media = card.querySelector(".project-media");
    card.addEventListener("pointermove", (event) => {
      if (paused || reduced.matches || !finePointer.matches || event.pointerType === "touch") return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      media.style.setProperty("--tilt-x", `${(y - .5) * -7}deg`);
      media.style.setProperty("--tilt-y", `${(x - .5) * 9}deg`);
      media.style.setProperty("--shine-x", `${x * 100}%`);
      media.style.setProperty("--shine-y", `${y * 100}%`);
    });
    card.addEventListener("pointerleave", () => { media.style.setProperty("--tilt-x", "0deg"); media.style.setProperty("--tilt-y", "0deg"); });
  });
  document.querySelectorAll(".button:not(button),.header-cta").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      if (paused || reduced.matches || !finePointer.matches) return;
      const bounds = button.getBoundingClientRect();
      button.style.translate = `${(event.clientX - bounds.left - bounds.width / 2) * .12}px ${(event.clientY - bounds.top - bounds.height / 2) * .16}px`;
    });
    button.addEventListener("pointerleave", () => { button.style.translate = "0 0"; });
  });
  const cursor = document.createElement("div");
  cursor.className = "motion-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.hidden = true;
  document.body.append(cursor);
  document.addEventListener("pointermove", (event) => {
    const enabled = !paused && !reduced.matches && finePointer.matches && event.pointerType !== "touch";
    cursor.hidden = !enabled;
    if (!enabled) return;
    const project = event.target.closest(".project-card");
    cursor.classList.toggle("is-project", Boolean(project));
    cursor.classList.toggle("is-link", !project && Boolean(event.target.closest("a,button,summary")));
    cursor.textContent = project ? "VER PROYECTO ↗" : "";
    const size = project ? 80 : cursor.classList.contains("is-link") ? 34 : 18;
    cursor.style.transform = `translate3d(${event.clientX - size / 2}px,${event.clientY - size / 2}px,0)`;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { cursor.hidden = true; });

  function syncMotion() {
    const enabled = !paused && !reduced.matches;
    root.classList.toggle("motion-enabled", enabled);
    if (!enabled) {
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
      resetSectionScenes();
      cancelAnimationFrame(canvasFrame);
      canvasFrame = 0;
      canvas.hidden = true;
      cursor.hidden = true;
      document.querySelectorAll(".portrait-reveal,.hero-name,.button,.header-cta").forEach((element) => { element.style.translate = "0 0"; });
      if (portraitRig) {
        ["--face-x", "--face-y", "--face-rx", "--face-ry", "--face-rz"].forEach((property) => portraitRig.style.removeProperty(property));
        pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
      }
      document.querySelectorAll(".project-media").forEach((media) => { media.style.setProperty("--tilt-x", "0deg"); media.style.setProperty("--tilt-y", "0deg"); });
    } else { canvas.hidden = false; startCanvas(); }
    measure();
  }
  reduced.addEventListener("change", () => { paused = reduced.matches; syncMotion(); });
  desktop.addEventListener("change", measure);
  syncMotion();
  enterHero();
  // Las métricas cambian al cargar Poppins; nunca bloquear la página esperando la fuente.
  document.fonts?.ready.then(measure);
})();
