// --- CONFIGURACIÓN DE RUTAS ---
var URL_ASISTENCIA = "https://script.google.com/macros/s/AKfycbyP5rAqVFmlDjt10fGKylTDH4R90d2hg7TamJFYCB9_agbfGJL4oqJZJtkRx_7d76-v-Q/exec";
var URL_FOTOS = "https://script.google.com/macros/s/AKfycbzqAmczsKY0dzkIlqpIy0Df8wZAZi4qfr8vG582E6I7-yVtsBjiF3CA96xCEPBkumfOSA/exec";

// FECHAS
var FECHA_BODA = new Date("2026-09-18T15:45:00-04:00");
var FECHA_HABILITACION_FOTOS = new Date("2026-09-18T15:45:00-04:00"); 
// FECHA LÍMITE ACTUALIZADA AL 29 DE AGOSTO PARA TODOS
var FECHA_LIMITE_RSVP = new Date("2026-09-3T23:59:59-04:00"); 

var fotoSeleccionada = null;
var invitadoActual = null; 

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", function () {
  validarInvitadoDesdeURL();
  iniciarContador();
  prepararAnimaciones();
  prepararInputsFoto();
  generarFloresCayendo();
  manejarFormularioRSVP();
});

// --- CONSULTAR Y VALIDAR INVITADO EN GOOGLE SHEETS ---
function validarInvitadoDesdeURL() {
  var parametros = new URLSearchParams(window.location.search);
  var id = parametros.get('id');

  if (!id) {
    var inputNombre = document.getElementById("nombreCompleto");
    if (inputNombre) inputNombre.removeAttribute("readonly");
    
    var select = document.getElementById("selectPases");
    if (select) {
      select.innerHTML = '<option value="1">1 Persona</option><option value="2">2 Personas</option>';
    }
    return;
  }

  fetch(URL_ASISTENCIA + "?id=" + encodeURIComponent(id))
    .then(function(respuesta) { return respuesta.json(); })
    .then(function(datos) {
      if (datos.encontrado) {
        invitadoActual = { id: id, ...datos };

        // Saludo personalizado
        var elSaludo = document.getElementById('saludo-personalizado');
        var elPases = document.getElementById('pases-personalizados');
        var elContenedor = document.getElementById('contenedor-saludo');

        if (elSaludo) elSaludo.innerText = "¡Bienvenido/a, " + datos.nombre + "!";
        if (elPases) elPases.innerText = "Tienen " + datos.pasesPermitidos + " pases reservados.";
        if (elContenedor) elContenedor.classList.remove('oculto');

        // Nombre en formulario
        var inputNombre = document.getElementById('nombreCompleto');
        if (inputNombre) inputNombre.value = datos.nombre;
        
        // Pases destacados
        var elNumPases = document.getElementById('numeroPasesForm');
        var elContPases = document.getElementById('infoPasesRSVP');
        if (elNumPases && elContPases) {
          elNumPases.innerText = datos.pasesPermitidos;
          elContPases.classList.remove('oculto');
        }

        if (datos.confirmado) {
          bloquearFormularioConfirmado(datos.pasesConfirmados);
        } else {
          generarOpcionesPases(datos.pasesPermitidos);
        }
      } else {
        var inputNombre = document.getElementById("nombreCompleto");
        if (inputNombre) inputNombre.removeAttribute("readonly");
      }
    })
    .catch(function(error) {
      var inputNombre = document.getElementById("nombreCompleto");
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
  var formulario = document.getElementById("formularioAsistencia");

  if (bloque) bloque.classList.remove("oculto");
  if (texto) {
    var msjBase = "";
    if (parseInt(pasesUsados) === 0) {
      msjBase = "✓ Ya registraste tu respuesta: Indicaste que no podrás asistir. Lamentamos mucho que no nos puedas acompañar.";
    } else {
      msjBase = "✓ Ya confirmaste tu asistencia para " + pasesUsados + " persona(s). ¡Gracias!";
    }
    
    // Enlace directo a WhatsApp en caso de error
    var linkWhatsApp = "https://wa.me/59163889661?text=Hola%2C%20tengo%20una%20duda%20sobre%20mi%20confirmaci%C3%B3n%20de%20asistencia";
    texto.innerHTML = msjBase + "<br><br><span style='font-size: 0.9em; color: var(--salmon-oscuro);'>Si crees que es un error, comunícate al <a href='" + linkWhatsApp + "' target='_blank' style='color: var(--azul-acento); font-weight: bold; text-decoration: underline;'>+591 63889661</a><br>Arcani Software</span>";
  }

  if (formulario) formulario.style.display = "none";
}

// --- SUBMIT DEL FORMULARIO RSVP ---
function manejarFormularioRSVP() {
  var formulario = document.getElementById("formularioAsistencia");
  if (!formulario) return;

  formulario.addEventListener("submit", function(evento) {
    evento.preventDefault(); 
    confirmarAsistencia();
  });
}

function confirmarAsistencia() {
  var ahora = new Date();
  
  // Comparamos directamente con la fecha límite general
  if (ahora > FECHA_LIMITE_RSVP) {
    alert("Lo sentimos, la fecha límite para confirmar tu asistencia ha expirado. Por favor contáctate directamente con los novios.");
    return;
  }

  var nombre = document.getElementById("nombreCompleto").value.trim();
  var selectPases = document.getElementById("selectPases");
  var pases = selectPases ? selectPases.value : "1";
  var botonConfirmar = document.getElementById("botonConfirmar");

  if (nombre === "") {
    alert("Por favor escribe tu nombre completo.");
    return;
  }

  var datos = {
    id: invitadoActual ? invitadoActual.id : "MANUAL",
    nombre: nombre,
    pasesConfirmados: pases
  };

  if (botonConfirmar) {
    botonConfirmar.disabled = true;
    botonConfirmar.innerText = "Enviando...";
  }

  fetch(URL_ASISTENCIA, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(datos)
  })
  .then(function(res) { return res.json(); })
  .then(function(respuesta) {
    if (respuesta.exito) {
      if (parseInt(pases) === 0) {
        bloquearFormularioConfirmado(0);
        window.scrollTo({ top: document.getElementById('seccion-rsvp').offsetTop, behavior: "smooth" });
      } else {
        mostrarPaginaConfirmacion();
      }
    } else {
      alert(respuesta.mensaje || "Ocurrió un error al registrar tu asistencia.");
      if (botonConfirmar) {
        botonConfirmar.disabled = false;
        botonConfirmar.innerText = "Confirmar asistencia";
      }
    }
  })
  .catch(function (error) {
    alert("No se pudo enviar. Inténtalo de nuevo.");
    if (botonConfirmar) {
      botonConfirmar.disabled = false;
      botonConfirmar.innerText = "Confirmar asistencia";
    }
  });
}

function mostrarPaginaConfirmacion() {
  if (audio) {
    audio.pause();
    if (boton) boton.classList.remove("activa");
  }

  // Oculta la invitación principal y despliega la pantalla de éxito
  document.getElementById("paginaInvitacion").style.display = "none";
  document.getElementById("paginaConfirmacion").classList.remove("oculto");
  
  // Ocultar también el botón flotante si existiera todavía
  var btnNotificacion = document.getElementById('btnNotificacionRSVP');
  if (btnNotificacion) btnNotificacion.style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- LÓGICA DE MAPAS (MODAL) ---
function abrirMapa(url) {
  var modal = document.getElementById("modalMapa");
  var iframe = document.getElementById("iframeMapaModal");
  if (iframe) iframe.src = url;
  if (modal) modal.classList.remove("oculto");
  document.body.style.overflow = "hidden";
}

function cerrarMapa() {
  var modal = document.getElementById("modalMapa");
  var iframe = document.getElementById("iframeMapaModal");
  if (modal) modal.classList.add("oculto");
  if (iframe) iframe.src = ""; 
  document.body.style.overflow = "auto";
}

var elModalMapa = document.getElementById('modalMapa');
if (elModalMapa) {
  elModalMapa.addEventListener('click', function(e) {
    if (e.target === this) cerrarMapa(); 
  });
}

// --- GENERAR FLORES ---
function generarFloresCayendo() {
  const contenedor = document.getElementById("contenedorFlores");
  if (!contenedor) return;
  
  const colores = ['#FAD6D0', '#E88B7B', '#F5F0E1'];
  const cantidad = 15;

  for (let i = 0; i < cantidad; i++) {
    let petalo = document.createElement("div");
    petalo.classList.add("petalo");
    petalo.style.left = Math.random() * 100 + "vw";
    petalo.style.animationDuration = (Math.random() * 6 + 6) + "s";
    petalo.style.animationDelay = (Math.random() * 5) + "s";
    petalo.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
    let escala = Math.random() * 0.6 + 0.6;
    petalo.style.transform = `scale(${escala})`;
    contenedor.appendChild(petalo);
  }
}

// --- MÚSICA & AUDIO AUTOMÁTICO ---
var audio = document.getElementById("musicaBoda");
var boton = document.querySelector(".boton-musica");

function reproducirAutonomo() {
  if (!audio) return;
  audio.play().then(function () {
    if (boton) boton.classList.add("activa");
    document.removeEventListener('click', reproducirAutonomo);
    document.removeEventListener('touchstart', reproducirAutonomo);
  }).catch(function (error) {});
}

window.addEventListener('load', reproducirAutonomo);
document.addEventListener('click', reproducirAutonomo);
document.addEventListener('touchstart', reproducirAutonomo); 

function controlarMusica() {
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    if (boton) boton.classList.add("activa");
  } else {
    audio.pause();
    if (boton) boton.classList.remove("activa");
  }
}

function pausarMusicaForzado() {
  if (audio && !audio.paused) {
    audio.pause();
  }
}

document.addEventListener("visibilitychange", function() {
  if (document.hidden) {
    pausarMusicaForzado();
  } else {
    if (audio && boton && boton.classList.contains("activa")) {
      audio.play().catch(e => {});
    }
  }
});

window.addEventListener("blur", pausarMusicaForzado);
window.addEventListener("focus", function() {
  if (audio && boton && boton.classList.contains("activa")) {
    audio.play().catch(e => {});
  }
});
window.addEventListener("pagehide", pausarMusicaForzado);

// --- CONTADOR ---
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
  var elemento = document.getElementById(id);
  if (elemento) {
    elemento.innerText = String(valor).padStart(2, "0");
  }
}

// --- ANIMACIONES FLUIDAS ---
function prepararAnimaciones() {
  var secciones = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    secciones.forEach(s => s.classList.add("visible"));
    return;
  }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visible");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });

  secciones.forEach(s => observador.observe(s));
}

// --- ENVIAR MAPAS AL CELULAR ---
function enviarMapasCelular() {
  var elCelular = document.getElementById("celularMapa");
  var celular = elCelular ? elCelular.value.trim() : "";
  var regexBolivia = /^[67]\d{7}$/;

  if (!regexBolivia.test(celular)) {
    alert("Por favor, ingresa un número de celular válido de Bolivia (8 dígitos que comiencen con 6 o 7).");
    return;
  }

  pausarMusicaForzado();

  const mensaje = "¡Hola! Te comparto la información de la boda:\n\n📅 La boda de Ramiro y Janneth es el 18 de septiembre de 2026 a las 15:45 hrs.\n\n - Ubicación Iglesia:\nhttps://maps.app.goo.gl/EuFd8qyN9rFG9ic3A\n\n📍 \n\n - Ubicación Salón de Convenciones:\nhttps://maps.app.goo.gl/Kfsjnvcr4CRgxQsc6\n\n¡Te \n\n¡Te esperamos!";
  const urlWhatsapp = "https://wa.me/591" + celular + "?text=" + encodeURIComponent(mensaje);
  
  window.open(urlWhatsapp, "_blank");
}

// --- LÓGICA DE FOTOS ---
function verificarFechaFoto(evento) {
  var ahora = new Date();
  if (ahora < FECHA_HABILITACION_FOTOS) {
    evento.preventDefault(); 
    alert("¡Guarda tus mejores ángulos! La subida de fotos se habilitará el día de la boda (18 de septiembre a las 15:45 hrs).");
  }
}

function prepararInputsFoto() {
  var inputGaleria = document.getElementById("subirFoto");
  var inputCamara = document.getElementById("tomarFoto");

  [inputGaleria, inputCamara].forEach(function (input) {
    if (!input) return;
    input.addEventListener("change", function () {
      fotoSeleccionada = input.files[0] || null;
      if (fotoSeleccionada) {
        var mensaje = document.getElementById("mensajeFoto");
        if (mensaje) {
          mensaje.innerText = "Foto lista: " + fotoSeleccionada.name;
          mensaje.style.color = "var(--azul-profundo)";
        }
      }
    });
  });
}

function procesarFoto() {
  var ahora = new Date();
  var mensaje = document.getElementById("mensajeFoto");

  if (ahora < FECHA_HABILITACION_FOTOS) {
    if (mensaje) {
      mensaje.innerText = "La subida se habilita el 18 de septiembre a las 15:45 hrs.";
      mensaje.style.color = "var(--salmon-oscuro)";
    }
    return;
  }

  var archivo = fotoSeleccionada;
  if (!archivo) {
    if (mensaje) {
      mensaje.innerText = "Por favor, selecciona una foto primero.";
      mensaje.style.color = "var(--salmon-oscuro)";
    }
    return;
  }

  if (archivo.size > 4000000) {
    if (mensaje) mensaje.innerText = "El archivo es muy pesado (Máximo 4MB).";
    return;
  }

  var lector = new FileReader();
  if (mensaje) {
    mensaje.innerText = "Subiendo recuerdo...";
    mensaje.style.color = "var(--azul-acento)";
  }

  lector.onload = function (evento) {
    var datos = {
      tipo: "foto",
      nombreArchivo: archivo.name,
      archivoB64: evento.target.result
    };

    fetch(URL_FOTOS, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    })
    .then(function () {
      if (mensaje) {
        mensaje.innerText = "¡Foto agregada al álbum!";
        mensaje.style.color = "green";
      }
      agregarFotoAGaleria(evento.target.result, archivo.name);
      limpiarFotos();
    })
    .catch(function () {
      if (mensaje) {
        mensaje.innerText = "Fallo en la subida. Vuelve a intentarlo.";
        mensaje.style.color = "red";
      }
    });
  };

  lector.readAsDataURL(archivo);
}

function agregarFotoAGaleria(src, nombre) {
  var galeria = document.getElementById("galeriaFotos");
  if (!galeria) return;
  var img = document.createElement("img");
  img.src = src;
  img.alt = "Recuerdo boda";
  galeria.prepend(img); 
}

function limpiarFotos() {
  fotoSeleccionada = null;
  if(document.getElementById("subirFoto")) document.getElementById("subirFoto").value = "";
  if(document.getElementById("tomarFoto")) document.getElementById("tomarFoto").value = "";
}

// --- OCULTAR BOTÓN FLOTANTE AL LLEGAR AL FORMULARIO ---
window.addEventListener('scroll', function() {
  var btnNotificacion = document.getElementById('btnNotificacionRSVP');
  var seccionForm = document.getElementById('seccion-rsvp');
  
  if (btnNotificacion && seccionForm) {
    var posicionForm = seccionForm.getBoundingClientRect().top;
    if (posicionForm < window.innerHeight) {
      btnNotificacion.style.opacity = '0';
      btnNotificacion.style.pointerEvents = 'none';
    } else {
      btnNotificacion.style.opacity = '1';
      btnNotificacion.style.pointerEvents = 'auto';
    }
  }
});
