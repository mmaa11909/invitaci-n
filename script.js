// --- CONFIGURACIÓN DE RUTAS Y FECHAS ---
var URL_ASISTENCIA = "https://script.google.com/macros/s/AKfycbyP5rAqVFmlDjt10fGKylTDH4R90d2hg7TamJFYCB9_agbfGJL4oqJZJtkRx_7d76-v-Q/exec";
var URL_FOTOS = "https://script.google.com/macros/s/AKfycbzqAmczsKY0dzkIlqpIy0Df8wZAZi4qfr8vG582E6I7-yVtsBjiF3CA96xCEPBkumfOSA/exec";

// Fecha de la boda según el boleto: 26 de Diciembre de 2026 a las 18:00 hrs
var FECHA_BODA = new Date("2026-12-26T18:00:00-04:00");
var FECHA_HABILITACION_FOTOS = new Date("2026-12-26T18:00:00-04:00");
var FECHA_LIMITE_RSVP = new Date("2026-12-20T23:59:59-04:00");

var fotoSeleccionada = null;
var invitadoActual = null;
var audio = document.getElementById("musicaBoda");
var btnMusica = document.getElementById("btnMusica");

document.addEventListener("DOMContentLoaded", function () {
  validarInvitadoDesdeURL();
  iniciarContador();
  prepararInputsFoto();
  manejarFormularioRSVP();
});

// --- 1. ABRIR SOBRE Y LANZAR AVIÓN ---
function abrirInvitacion(irARsvp) {
  var envelope = document.getElementById("envelope-screen");
  var planeIntro = document.getElementById("plane-intro");
  var mainInv = document.getElementById("main-invitation");

  // Reproducir música al hacer clic en abrir
  if (audio) {
    audio.play().then(function() {
      if (btnMusica) btnMusica.classList.remove("oculto");
    }).catch(function() {});
  }

  // Desvanecer el sobre
  envelope.style.opacity = "0";
  envelope.style.transform = "scale(1.05)";

  setTimeout(function() {
    envelope.classList.add("oculto");
    planeIntro.classList.remove("oculto");

    // Esperar a que pase el avión (3.6 segundos)
    setTimeout(function() {
      planeIntro.style.opacity = "0";
      mainInv.classList.remove("oculto");

      setTimeout(function() {
        planeIntro.classList.add("oculto");
        if (irARsvp) {
          var seccionRsvp = document.getElementById("seccion-rsvp");
          if (seccionRsvp) seccionRsvp.scrollIntoView({ behavior: "smooth" });
        }
      }, 800);
    }, 3600);
  }, 700);
}

// --- 2. CONTROL DE MÚSICA ---
function controlarMusica() {
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    btnMusica.innerText = "♪";
  } else {
    audio.pause();
    btnMusica.innerText = "🔇";
  }
}

// --- 3. VALIDAR INVITADO DESDE URL (?id=...) ---
function validarInvitadoDesdeURL() {
  var parametros = new URLSearchParams(window.location.search);
  var id = parametros.get("id");

  var inputNombre = document.getElementById("nombreCompleto");
  var sobreNombre = document.getElementById("sobre-nombre");
  var sobrePases = document.getElementById("sobre-pases");
  var boletoPasajero = document.getElementById("boleto-pasajero");

  if (!id) {
    if (inputNombre) inputNombre.removeAttribute("readonly");
    return;
  }

  fetch(URL_ASISTENCIA + "?id=" + encodeURIComponent(id))
    .then(function(res) { return res.json(); })
    .then(function(datos) {
      if (datos.encontrado) {
        invitadoActual = { id: id, ...datos };

        // Actualizar nombre en el sobre inicial, en el boleto y en el formulario
        if (sobreNombre) sobreNombre.innerText = datos.nombre;
        if (boletoPasajero) boletoPasajero.innerText = datos.nombre;
        if (inputNombre) inputNombre.value = datos.nombre;

        var textoAdultos = datos.pasesPermitidos === 1 ? "1 Adulto" : datos.pasesPermitidos + " Adultos";
        if (sobrePases) sobrePases.innerText = textoAdultos;

        var elNumPases = document.getElementById("numeroPasesForm");
        if (elNumPases) elNumPases.innerText = datos.pasesPermitidos;

        if (datos.confirmado) {
          bloquearFormularioConfirmado(datos.pasesConfirmados);
        } else {
          generarOpcionesPases(datos.pasesPermitidos);
        }
      } else {
        if (inputNombre) inputNombre.removeAttribute("readonly");
      }
    })
    .catch(function() {
      if (inputNombre) inputNombre.removeAttribute("readonly");
    });
}

function generarOpcionesPases(maxPases) {
  var select = document.getElementById("selectPases");
  if (!select) return;
  select.innerHTML = "";

  var opCero = document.createElement("option");
  opCero.value = "0";
  opCero.text = "Lamentablemente no podremos asistir";
  select.appendChild(opCero);

  for (var i = 1; i <= maxPases; i++) {
    var opt = document.createElement("option");
    opt.value = i;
    opt.text = i === 1 ? "Asistirá 1 persona" : "Asistirán " + i + " personas";
    if (i === maxPases) opt.selected = true;
    select.appendChild(opt);
  }
}

function bloquearFormularioConfirmado(pasesUsados) {
  var bloque = document.getElementById("bloqueYaConfirmado");
  var texto = document.getElementById("textoYaConfirmado");
  var form = document.getElementById("formularioAsistencia");

  if (bloque) bloque.classList.remove("oculto");
  if (form) form.classList.add("oculto");

  if (texto) {
    if (parseInt(pasesUsados) === 0) {
      texto.innerText = "✓ Ya registraste tu respuesta: Indicaste que no podrás asistir.";
    } else {
      texto.innerText = "✓ ¡Check-In completado! Confirmaste asistencia para " + pasesUsados + " persona(s).";
    }
  }
}

// --- 4. ENVIAR CONFIRMACIÓN RSVP ---
function manejarFormularioRSVP() {
  var form = document.getElementById("formularioAsistencia");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    var nombre = document.getElementById("nombreCompleto").value.trim();
    var pases = document.getElementById("selectPases").value;
    var btn = document.getElementById("botonConfirmar");

    if (!nombre) {
      alert("Por favor ingresa tu nombre completo.");
      return;
    }

    btn.disabled = true;
    btn.innerText = "Registrando Check-In...";

    var payload = {
      id: invitadoActual ? invitadoActual.id : "MANUAL",
      nombre: nombre,
      pasesConfirmados: pases
    };

    fetch(URL_ASISTENCIA, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(respuesta) {
      if (respuesta.exito) {
        bloquearFormularioConfirmado(pases);
      } else {
        alert(respuesta.mensaje || "Error al registrar. Intenta nuevamente.");
        btn.disabled = false;
        btn.innerText = "✈ Confirmar Check-In";
      }
    })
    .catch(function() {
      alert("Error de conexión. Inténtalo de nuevo.");
      btn.disabled = false;
      btn.innerText = "✈ Confirmar Check-In";
    });
  });
}

// --- 5. CONTADOR REGRESIVO ---
function iniciarContador() {
  actualizarContador();
  setInterval(actualizarContador, 1000);
}

function actualizarContador() {
  var ahora = new Date();
  var distancia = FECHA_BODA.getTime() - ahora.getTime();

  if (distancia <= 0) {
    escribirTiempo("dias", "00");
    escribirTiempo("horas", "00");
    escribirTiempo("minutos", "00");
    escribirTiempo("segundos", "00");
    return;
  }

  var dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
  var horas = Math.floor((distancia / (1000 * 60 * 60)) % 24);
  var minutos = Math.floor((distancia / (1000 * 60)) % 60);
  var segundos = Math.floor((distancia / 1000) % 60);

  escribirTiempo("dias", dias);
  escribirTiempo("horas", horas);
  escribirTiempo("minutos", minutos);
  escribirTiempo("segundos", segundos);
}

function escribirTiempo(id, valor) {
  var el = document.getElementById(id);
  if (el) el.innerText = String(valor).padStart(2, "0");
}

// --- 6. MODAL DE MAPAS ---
function abrirMapa(url) {
  var modal = document.getElementById("modalMapa");
  var iframe = document.getElementById("iframeMapaModal");
  if (iframe) iframe.src = url;
  if (modal) modal.classList.remove("oculto");
}

function cerrarMapa() {
  var modal = document.getElementById("modalMapa");
  var iframe = document.getElementById("iframeMapaModal");
  if (modal) modal.classList.add("oculto");
  if (iframe) iframe.src = "";
}

// --- 7. SUBIDA DE FOTOS ---
function verificarFechaFoto(evento) {
  var ahora = new Date();
  if (ahora < FECHA_HABILITACION_FOTOS) {
    evento.preventDefault();
    alert("¡Prepara tu cámara! La subida de fotos se habilitará el día de la boda (26 de diciembre a las 18:00 hrs).");
  }
}

function prepararInputsFoto() {
  var inGaleria = document.getElementById("subirFoto");
  var inCamara = document.getElementById("tomarFoto");

  [inGaleria, inCamara].forEach(function(input) {
    if (!input) return;
    input.addEventListener("change", function() {
      fotoSeleccionada = input.files[0] || null;
      var msg = document.getElementById("mensajeFoto");
      if (fotoSeleccionada && msg) {
        msg.innerText = "Foto preparada: " + fotoSeleccionada.name;
      }
    });
  });
}

function procesarFoto() {
  var msg = document.getElementById("mensajeFoto");
  if (new Date() < FECHA_HABILITACION_FOTOS) {
    if (msg) msg.innerText = "Habilitado a partir del 26 de diciembre a las 18:00 hrs.";
    return;
  }
  if (!fotoSeleccionada) {
    if (msg) msg.innerText = "Selecciona una foto primero.";
    return;
  }
  var lector = new FileReader();
  if (msg) msg.innerText = "Subiendo recuerdo...";
  lector.onload = function(e) {
    fetch(URL_FOTOS, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "foto",
        nombreArchivo: fotoSeleccionada.name,
        archivoB64: e.target.result
      })
    }).then(function() {
      if (msg) msg.innerText = "¡Foto subida con éxito!";
    });
  };
  lector.readAsDataURL(fotoSeleccionada);
}
