"use strict";

(() => {
  const year = document.getElementById("year");
  year.textContent = String(new Date().getFullYear());

  const menu = document.querySelector(".mobile-menu");
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => { menu.open = false; });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  const form = document.getElementById("project-form");
  const status = document.getElementById("form-status");
  const result = document.getElementById("prepared-result");
  const messageField = document.getElementById("prepared-message");
  const channelLink = document.getElementById("contact-channel");
  const config = window.LANDING_CONFIG || {};
  const rawWhatsapp = typeof config.whatsapp === "string" ? config.whatsapp.trim() : "";
  const whatsapp = /^\d{8,15}$/.test(rawWhatsapp) ? rawWhatsapp : "";
  const rawEmail = typeof config.email === "string" ? config.email.trim() : "";
  const email = /^[^\s@?&#<>]+@[^\s@?&#<>]+\.[^\s@?&#<>]+$/.test(rawEmail) ? rawEmail : "";

  if (whatsapp || email) {
    document.getElementById("preview-notice").hidden = true;
    document.getElementById("contact-intro").textContent = "Prepará el mensaje y revisalo antes de enviarlo.";
    document.getElementById("form-privacy").textContent = "No se guardan datos en esta web. Tu consulta se incluirá en el mensaje que abrirás en " + (whatsapp ? "WhatsApp." : "tu aplicación de correo.");
  } else {
    document.getElementById("preview-notice").hidden = false;
  }
  document.getElementById("prepare-button").disabled = false;

  document.querySelectorAll("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      form.elements.type.value = link.dataset.service;
      result.hidden = true;
      status.textContent = "";
    });
  });
  form.addEventListener("input", () => {
    // Un mensaje anterior deja de ser válido si cambia el formulario.
    result.hidden = true;
    channelLink.hidden = true;
    channelLink.href = "#contacto";
    messageField.value = "";
    status.textContent = "";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = form.elements.name.value.trim();
    const description = form.elements.description.value.trim();
    if (!name || description.length < 20) {
      status.textContent = "Escribí tu nombre y al menos 20 caracteres sobre el proyecto.";
      return;
    }
    const replyEmail = form.elements.email.value.trim();
    const message = [
      "Hola Ezequiel, soy " + name + ".",
      "Me interesa: " + form.elements.type.value + ".",
      "",
      description,
      ...(replyEmail ? ["", "Mi email: " + replyEmail] : []),
    ].join("\n");
    messageField.value = message;
    result.hidden = false;
    if (whatsapp) {
      channelLink.href = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message);
      channelLink.textContent = "Abrir WhatsApp ↗";
      channelLink.hidden = false;
      status.textContent = "Mensaje preparado, todavía no enviado. Abrí WhatsApp para revisarlo y enviarlo.";
    } else if (email) {
      channelLink.href = "mailto:" + email + "?subject=" + encodeURIComponent("Consulta de proyecto — " + form.elements.type.value) + "&body=" + encodeURIComponent(message);
      channelLink.textContent = "Abrir correo ↗";
      channelLink.hidden = false;
      status.textContent = "Mensaje preparado, todavía no enviado. Abrí tu aplicación de correo para revisarlo y enviarlo.";
    } else {
      channelLink.hidden = true;
      status.textContent = "Tu consulta está preparada, pero NO se envió. Esta vista previa todavía no tiene un contacto personal configurado. Podés copiar el texto.";
    }
  });
  document.getElementById("copy-message").addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Sin acceso al portapapeles");
      await navigator.clipboard.writeText(messageField.value);
      status.textContent = "Texto copiado. No se envió ningún mensaje.";
    } catch {
      messageField.focus();
      messageField.select();
      status.textContent = "Seleccioné el texto. Copialo con Ctrl+C o con la opción Copiar de tu dispositivo. No se envió ningún mensaje.";
    }
  });
})();
