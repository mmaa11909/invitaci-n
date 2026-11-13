// --- CONFIGURACIÓN ---
var URL_ASISTENCIA = "https://script.google.com/macros/s/AKfycbyP5rAqVFmlDjt10fGKylTDH4R90d2hg7TamJFYCB9_agbfGJL4oqJZJtkRx_7d76-v-Q/exec";
var URL_FOTOS = "https://script.google.com/macros/s/AKfycbzqAmczsKY0dzkIlqpIy0Df8wZAZi4qfr8vG582E6I7-yVtsBjiF3CA96xCEPBkumfOSA/exec";

// Fecha de la boda de Nayra & Armando: 26 de Diciembre de 2026, 18:00 hrs
var FECHA_BODA = new Date("2026-12-26T18:00:00-04:00");
var FECHA_HABILITACION_FOTOS = new Date("2026-12-26T18:00:00-04:00");
var FECHA_LIMITE_RSVP = new Date("2026-12-20T23:59:59-04:00");

var invitadoActual = null;
var fotoSeleccionada = null;
var audio = document.getElementById("musicaBoda");
var playBtn = document.getElementById("play-btn");
var isPlaying = false;

document.addEventListener("DOMContentLoaded", function () {
  validarInvitadoDesdeURL();
  iniciarContador();
  prepararAnimaciones();
  prepararInputsFoto();
  manejarFormularioRSVP();
});

// --- 1. ABRIR SOBRE Y VOLAR AVIÓN ---
function abrirInvitacion(irARsvp) {
  var envelope = document.getElementById("envelope-screen");
  var planeIntro = document.getElementById("plane-intro");
  var appContainer = document.getElementById("app-container");

  // Iniciar música al abrir el sobre
  if (audio && !isPlaying) {
    audio.play().then(function () {
      if (playBtn) playBtn.innerText = "⏸";
      isPlaying = true;
    }).catch(function () {});
  }

  envelope.style.opacity = "0";
  envelope.style.transform = "scale(1.05)";

  setTimeout(function () {
    envelope.classList.add("oculto");
    planeIntro.classList.remove("oculto");

    setTimeout(function () {
      planeIntro.style.opacity = "0";
      appContainer.classList.remove("oculto");
      prepararAnimaciones();

      setTimeout(function () {
        planeIntro.classList.add("oculto");
        if (irARsvp) {
          mostrarFormulario();
          var rsvpSec = document.getElementById("seccion-rsvp");
          if (rsvpSec) rsvpSec.scrollIntoView({ behavior: "smooth" });
        }
      }, 800);
    }, 3400);
  }, 600);
}

// --- 2. REPRODUCTOR DE MÚSICA ---
function controlarMusica() {
  if (!audio) return;
  if (isPlaying) {
    audio.pause();
    if (playBtn) playBtn.innerText = "▶";
    isPlaying = false;
  } else {
    audio.play().then(function () {
      if (playBtn) playBtn.innerText = "⏸";
      isPlaying = true;
    }).catch(function () {});
  }
}

// --- 3. CONTADOR ---
function iniciarContador() {
  actualizarContador();
  setInterval(actualizarContador, 1000);
}

function actualizarContador() {
  var ahora = new Date();
  var distancia = FECHA_BODA.getTime() - ahora.getTime();

  if (distancia <= 0) {
    document.getElementById("dias").innerText = "00";
    document.getElementById("horas").innerText = "00";
    document.getElementById("minutos").innerText = "00";
    document.getElementById("segundos").innerText = "00";
    return;
  }

  var dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
  var horas = Math.floor((distancia / (1000 * 60 * 60)) % 24);
  var minutos = Math.floor((distancia / (1000 * 60)) % 60);
  var segundos = Math.floor((distancia / 1000) % 60);

  document.getElementById("dias").innerText = String(dias).padStart(2, "0");
  document.getElementById("horas").innerText = String(horas).padStart(2, "0");
  document.getElementById("minutos").innerText = String(minutos).padStart(2, "0");
  document.getElementById("segundos").innerText = String(segundos).padStart(2, "0");
}

// --- 4. VALIDAR INVITADO DESDE URL (?id=...) ---
function validarInvitadoDesdeURL() {
  var parametros = new URLSearchParams(window.location.search);
  var id = parametros.get("id");

  var inputNombre = document.getElementById("nombreCompleto");
  var sobreNombre = document.getElementById("sobre-nombre");
  var sobrePases = document.getElementById("sobre-pases");

  if (!id) {
    if (inputNombre) inputNombre.removeAttribute("readonly");
    llenarSelectPases(2);
    return;
  }

  fetch(URL_ASISTENCIA + "?id=" + encodeURIComponent(id))
    .then(function (res) { return res.json(); })
    .then(function (datos) {
      if (datos.encontrado) {
        invitadoActual = { id: id, ...datos };

        if (sobreNombre) sobreNombre.innerText = datos.nombre;
        if (sobrePases) {
          sobrePases.innerText = datos.pasesPermitidos === 1 ? "1 Adulto" : datos.pasesPermitidos + " Adultos";
        }

        document.getElementById("numeroPasesForm").innerText = datos.pasesPermitidos;
        if (inputNombre) inputNombre.value = datos.nombre;

        if (datos.confirmado) {
          bloquearYaConfirmado(datos.pasesConfirmados);
        } else {
          llenarSelectPases(datos.pasesPermitidos);
        }
      } else {
        if (inputNombre) inputNombre.removeAttribute("readonly");
      }
    })
    .catch(function () {
      if (inputNombre) inputNombre.removeAttribute("readonly");
    });
}

function llenarSelectPases(max) {
  var select = document.getElementById("selectPases");
  if (!select) return;
  select.innerHTML = '<option value="0">No podremos asistir</option>';
  for (var i = 1; i <= max; i++) {
    var selected = i === max ? "selected" : "";
    select.innerHTML += '<option value="' + i + '" ' + selected + '>Asistirán ' + i + ' persona(s)</option>';
  }
}

function mostrarFormulario() {
  document.getElementById("btn-revelar-form").classList.add("oculto");
  document.getElementById("formularioAsistencia").classList.remove("oculto");
}

function bloquearYaConfirmado(pasesConfirmados) {
  document.getElementById("btn-revelar-form").classList.add("oculto");
  document.getElementById("formularioAsistencia").classList.add("oculto");

  var bloque = document.getElementById("bloqueYaConfirmado");
  var texto = document.getElementById("textoYaConfirmado");
  bloque.classList.remove("oculto");

  if (parseInt(pasesConfirmados) === 0) {
    texto.innerText = "Respuesta registrada: No podrán asistir. Los extrañaremos.";
  } else {
    texto.innerText = "¡Gracias! Asistencia confirmada para " + pasesConfirmados + " persona(s).";
  }
}

// --- 5. ENVIAR RSVP ---
function manejarFormularioRSVP() {
  var form = document.getElementById("formularioAsistencia");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (new Date() > FECHA_LIMITE_RSVP) {
      alert("La fecha límite para confirmar ha expirado.");
      return;
    }

    var nombre = document.getElementById("nombreCompleto").value.trim();
    var pases = document.getElementById("selectPases").value;
    var btn = document.getElementById("botonConfirmar");

    if (!nombre) {
      alert("Por favor escribe tu nombre completo.");
      return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    fetch(URL_ASISTENCIA, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        id: invitadoActual ? invitadoActual.id : "MANUAL",
        nombre: nombre,
        pasesConfirmados: pases
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (res) {
      if (res.exito) {
        bloquearYaConfirmado(pases);
      } else {
        alert("Error al guardar confirmación.");
        btn.innerText = "Enviar Confirmación";
        btn.disabled = false;
      }
    })
    .catch(function () {
      alert("Error de conexión.");
      btn.innerText = "Enviar Confirmación";
      btn.disabled = false;
    });
  });
}

// --- 6. MODAL DE MAPA ---
function abrirMapa(url) {
  var modal = document.getElementById("modalMapa");
  document.getElementById("iframeMapaModal").src = url;
  modal.classList.remove("oculto");
}

function cerrarMapa() {
  document.getElementById("modalMapa").classList.add("oculto");
  document.getElementById("iframeMapaModal").src = "";
}

// --- 7. SUBIDA DE FOTOS ---
function verificarFechaFoto(evento) {
  if (new Date() < FECHA_HABILITACION_FOTOS) {
    evento.preventDefault();
    alert("La subida de fotos se habilitará el día de la boda (26 de diciembre a las 18:00 hrs).");
  }
}

function prepararInputsFoto() {
  var inGaleria = document.getElementById("subirFoto");
  var inCamara = document.getElementById("tomarFoto");

  [inGaleria, inCamara].forEach(function (input) {
    if (!input) return;
    input.addEventListener("change", function () {
      fotoSeleccionada = input.files[0] || null;
      var msg = document.getElementById("mensajeFoto");
      if (fotoSeleccionada && msg) {
        msg.innerText = "Foto lista: " + fotoSeleccionada.name;
      }
    });
  });
}

function procesarFoto() {
  var msg = document.getElementById("mensajeFoto");
  if (new Date() < FECHA_HABILITACION_FOTOS) {
    if (msg) msg.innerText = "Habilitado el 26 de diciembre a las 18:00 hrs.";
    return;
  }
  if (!fotoSeleccionada) {
    if (msg) msg.innerText = "Selecciona una foto primero.";
    return;
  }
  var lector = new FileReader();
  if (msg) msg.innerText = "Subiendo recuerdo...";
  lector.onload = function (e) {
    fetch(URL_FOTOS, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "foto",
        nombreArchivo: fotoSeleccionada.name,
        archivoB64: e.target.result
      })
    }).then(function () {
      if (msg) msg.innerText = "¡Foto agregada al álbum!";
    });
  };
  lector.readAsDataURL(fotoSeleccionada);
}

// --- 8. EFECTO REVEAL AL HACER SCROLL ---
function prepararAnimaciones() {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });
}
