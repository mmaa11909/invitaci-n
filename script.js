// --- 1. CONFIGURACIÓN DE RUTAS Y FECHAS ---
// REEMPLAZA ESTE LINK CON TU NUEVA URL DE APPS SCRIPT TERMINADA EN /exec
var URL_ASISTENCIA = "https://script.google.com/macros/s/AKfycbwbEX3kjAXlY0NRY-7DptreZ_fxVv05tj12UTTe6nzFgGbOkD750BXB43NgPR5GeHYa/exec"; 
var URL_FOTOS = "https://script.google.com/macros/s/AKfycbzqAmczsKY0dzkIlqpIy0Df8wZAZi4qfr8vG582E6I7-yVtsBjiF3CA96xCEPBkumfOSA/exec";

// Fecha de la boda: 26 de Diciembre de 2026, 15:30 hrs
var FECHA_BODA = new Date("2026-12-26T15:30:00-04:00");
var FECHA_HABILITACION_FOTOS = new Date("2026-11-17T15:30:00-03:00");
var FECHA_LIMITE_RSVP = new Date("2026-12-04T23:59:59-04:00");

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

// --- 2. ANIMACIÓN DE ABRIR EL SOBRE ---
function abrirInvitacion() {
  var envelopeScreen = document.getElementById("envelope-screen");
  var envelopeBox = document.getElementById("envelope-box");
  var appContainer = document.getElementById("app-container");

  if (audio && !isPlaying) {
    audio.play().then(function () {
      if (playBtn) playBtn.innerText = "⏸";
      isPlaying = true;
    }).catch(function () {});
  }

  if (envelopeBox) {
    envelopeBox.classList.add("open");
  }

  appContainer.classList.remove("oculto");

  setTimeout(function () {
    envelopeScreen.style.opacity = "0";
    envelopeScreen.style.transform = "scale(1.04)";

    setTimeout(function () {
      envelopeScreen.classList.add("oculto");
      prepararAnimaciones();
    }, 600);
  }, 850);
}

// --- 3. REPRODUCTOR DE MÚSICA ---
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

// --- 4. CONTADOR REGRESIVO ---
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

// --- 5. LÓGICA DE INVITADOS (ESTRICTA) ---
function validarInvitadoDesdeURL() {
  var parametros = new URLSearchParams(window.location.search);
  var id = parametros.get("id");
  var codigoSecreto = parametros.get("c");

  var inputNombre = document.getElementById("nombreCompleto");
  var sobreNombre = document.getElementById("sobre-nombre");
  var sobrePases = document.getElementById("sobre-pases");
  var elNumPases = document.getElementById("numeroPasesForm");

  // DICCIONARIO DE CÓDIGOS SECRETOS
  var mapaPases = {
    "xA9": 1, // 1 Pase
    "yB8": 2, // 2 Pases
    "zC7": 3, // 3 Pases
    "wD6": 4, // 4 Pases
    "vE5": 5  // 5 Pases
  };

  // CASO 1: Ingresó mediante link de código secreto (?c=...)
  if (codigoSecreto !== null) {
    if (mapaPases[codigoSecreto]) {
      // Código válido y correcto
      var cantidadPases = mapaPases[codigoSecreto];
      
      if (inputNombre) {
        inputNombre.removeAttribute("readonly");
        inputNombre.value = "";
      }
      if (sobreNombre) sobreNombre.innerText = "Invitación Especial";
      if (sobrePases) sobrePases.innerText = cantidadPases === 1 ? "1 Adulto" : cantidadPases + " Adultos";
      if (elNumPases) elNumPases.innerText = cantidadPases;

      invitadoActual = { id: "LIBRE", pasesPermitidos: cantidadPases };
      llenarSelectPases(cantidadPases);
    } else {
      // CÓDIGO INVÁLIDO (Intentaron hacer trampa)
      if (sobreNombre) sobreNombre.innerText = "Enlace Inválido";
      if (sobrePases) sobrePases.innerText = "0 Adultos";
      if (elNumPases) elNumPases.innerText = "0";
      
      // Bloqueamos el formulario con un mensaje de advertencia
      bloquearYaConfirmado(0, "⚠️ El enlace de invitación ha sido modificado o es inválido.");
    }
    return;
  }

  // CASO 2: Ingresó con el link base sin parámetros (https://invitacionboda2026.site/)
  if (!id) {
    // Por seguridad, el enlace público general dará estrictamente 1 solo pase
    if (inputNombre) {
      inputNombre.removeAttribute("readonly");
      inputNombre.value = "";
    }
    if (sobreNombre) sobreNombre.innerText = "Invitación Especial";
    if (sobrePases) sobrePases.innerText = "1 Adulto";
    if (elNumPases) elNumPases.innerText = "1";

    invitadoActual = { id: "LIBRE", pasesPermitidos: 1 };
    llenarSelectPases(1);
    return;
  }

  // CASO 3: Enlace con ID personalizado desde el Excel (?id=...)
  fetch(URL_ASISTENCIA + "?id=" + encodeURIComponent(id))
    .then(function (res) { return res.json(); })
    .then(function (datos) {
      if (datos.encontrado) {
        invitadoActual = { id: id, ...datos };

        if (sobreNombre) sobreNombre.innerText = datos.nombre;
        if (sobrePases) {
          sobrePases.innerText = datos.pasesPermitidos === 1 ? "1 Adulto" : datos.pasesPermitidos + " Adultos";
        }
        if (elNumPases) elNumPases.innerText = datos.pasesPermitidos;
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

function bloquearYaConfirmado(pasesConfirmados, mensajeOpcional) {
  var btnConfirma = document.getElementById("btn-revelar-form");
  var formAsistencia = document.getElementById("formularioAsistencia");
  var bloque = document.getElementById("bloqueYaConfirmado");
  var texto = document.getElementById("textoYaConfirmado");

  if (btnConfirma) btnConfirma.classList.add("oculto");
  if (formAsistencia) formAsistencia.classList.add("oculto");
  if (bloque) bloque.classList.remove("oculto");

  if (texto) {
    if (mensajeOpcional) {
      // Mensaje de trampa o error personalizado
      texto.innerText = mensajeOpcional;
    } else if (parseInt(pasesConfirmados) === 0) {
      texto.innerText = "Respuesta registrada: No podrán asistir. Los extrañaremos.";
    } else {
      texto.innerText = "¡Gracias! Asistencia confirmada para " + pasesConfirmados + " persona(s).";
    }
  }
}

// --- 6. ENVIAR CONFIRMACIÓN (RSVP) ---
function manejarFormularioRSVP() {
  var form = document.getElementById("formularioAsistencia");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (new Date() > FECHA_LIMITE_RSVP) {
      alert("La fecha límite para confirmar (04/12) ha expirado. Por favor contacta a los novios.");
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
        id: invitadoActual ? invitadoActual.id : "LIBRE",
        nombre: nombre,
        pasesPermitidos: invitadoActual ? invitadoActual.pasesPermitidos : parseInt(pases),
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

// --- 7. MODALES Y MAPAS ---
function avisarIglesiaPorDefinir() {
  alert("📍 La iglesia y su ubicación exacta están por definir. Te confirmaremos muy pronto.");
}

function abrirMapa(url) {
  var modal = document.getElementById("modalMapa");
  document.getElementById("iframeMapaModal").src = url;
  modal.classList.remove("oculto");
}

function cerrarMapa() {
  document.getElementById("modalMapa").classList.add("oculto");
  document.getElementById("iframeMapaModal").src = "";
}

// --- 8. SUBIDA DE FOTOS ---
function verificarFechaFoto(evento) {
  if (new Date() < FECHA_HABILITACION_FOTOS) {
    evento.preventDefault();
    alert("La subida de fotos se habilitará el día de la boda (26 de diciembre a las 15:30 hrs).");
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
    if (msg) msg.innerText = "Habilitado el 26 de diciembre a las 15:30 hrs.";
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

// --- 9. EFECTO REVEAL AL HACER SCROLL ---
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
