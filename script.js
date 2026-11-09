// --- CONFIGURACIÓN ---
const URL_ASISTENCIA = "https://script.google.com/macros/s/AKfycbyP5rAqVFmlDjt10fGKylTDH4R90d2hg7TamJFYCB9_agbfGJL4oqJZJtkRx_7d76-v-Q/exec";
const FECHA_BODA = new Date("2026-09-18T15:45:00-04:00");
const FECHA_LIMITE_RSVP = new Date("2026-09-13T23:59:59-04:00"); 

let invitadoActual = null; 

document.addEventListener("DOMContentLoaded", () => {
  validarInvitadoDesdeURL();
  iniciarContador();
  prepararAnimaciones();
  manejarFormularioRSVP();
});

// --- MÚSICA DESDE EL CUSTOM PLAYER ---
const audio = document.getElementById("musicaBoda");
const playBtn = document.getElementById("play-btn");
let isPlaying = false;

function controlarMusica() {
  if (!audio) return;
  if (isPlaying) {
    audio.pause();
    playBtn.innerText = "▶";
    isPlaying = false;
  } else {
    audio.play().then(() => {
      playBtn.innerText = "⏸";
      isPlaying = true;
    }).catch(e => console.log("Interacción requerida por el navegador"));
  }
}

// Reproducción automática con 1er clic en cualquier parte de la pantalla
document.addEventListener('click', () => {
  if (!isPlaying && audio) {
    audio.play().then(() => {
      playBtn.innerText = "⏸";
      isPlaying = true;
    }).catch(e => {});
  }
}, { once: true });


// --- CONTADOR ---
function iniciarContador() {
  setInterval(() => {
    const ahora = new Date();
    const distancia = FECHA_BODA.getTime() - ahora.getTime();

    if (distancia <= 0) {
      document.getElementById("dias").innerText = "00";
      document.getElementById("horas").innerText = "00";
      document.getElementById("minutos").innerText = "00";
      document.getElementById("segundos").innerText = "00";
      return;
    }

    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((distancia / (1000 * 60)) % 60);
    const segundos = Math.floor((distancia / 1000) % 60);

    document.getElementById("dias").innerText = String(dias).padStart(2, "0");
    document.getElementById("horas").innerText = String(horas).padStart(2, "0");
    document.getElementById("minutos").innerText = String(minutos).padStart(2, "0");
    document.getElementById("segundos").innerText = String(segundos).padStart(2, "0");
  }, 1000);
}


// --- LÓGICA DE INVITADOS (GOOGLE SHEETS) ---
function validarInvitadoDesdeURL() {
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get('id');

  if (!id) {
    document.getElementById("nombreCompleto").removeAttribute("readonly");
    document.getElementById("numeroPasesForm").innerText = "?";
    llenarSelectPases(2); // Por defecto si no hay ID
    return;
  }

  fetch(URL_ASISTENCIA + "?id=" + encodeURIComponent(id))
    .then(res => res.json())
    .then(datos => {
      if (datos.encontrado) {
        invitadoActual = { id: id, ...datos };
        
        // Pone el número de pases en el recuadro blanco de Canva
        document.getElementById("numeroPasesForm").innerText = datos.pasesPermitidos;
        document.getElementById('nombreCompleto').value = datos.nombre;

        if (datos.confirmado) {
          bloquearYaConfirmado(datos.pasesConfirmados);
        } else {
          llenarSelectPases(datos.pasesPermitidos);
        }
      }
    }).catch(e => {
       document.getElementById("nombreCompleto").removeAttribute("readonly");
    });
}

function llenarSelectPases(max) {
  const select = document.getElementById("selectPases");
  select.innerHTML = '<option value="0">No podremos asistir</option>';
  for (let i = 1; i <= max; i++) {
    select.innerHTML += `<option value="${i}" ${i===max ? 'selected' : ''}>Asistirán ${i} persona(s)</option>`;
  }
}

// --- MANEJO DE LA INTERFAZ DE CONFIRMACIÓN ---
function mostrarFormulario() {
  // Oculta el botón inicial y muestra el form
  document.getElementById("btn-revelar-form").classList.add("oculto");
  document.getElementById("formularioAsistencia").classList.remove("oculto");
}

function bloquearYaConfirmado(pasesConfirmados) {
  document.getElementById("btn-revelar-form").classList.add("oculto");
  document.getElementById("formularioAsistencia").classList.add("oculto");
  
  const bloque = document.getElementById("bloqueYaConfirmado");
  const texto = document.getElementById("textoYaConfirmado");
  bloque.classList.remove("oculto");
  
  if (parseInt(pasesConfirmados) === 0) {
    texto.innerText = "Respuesta registrada: No podrán asistir. Los extrañaremos.";
  } else {
    texto.innerText = `¡Gracias! Asistencia confirmada para ${pasesConfirmados} persona(s).`;
  }
}

function manejarFormularioRSVP() {
  const form = document.getElementById("formularioAsistencia");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    if (new Date() > FECHA_LIMITE_RSVP) {
      alert("La fecha límite para confirmar ha expirado. Por favor, contacta a los novios.");
      return;
    }

    const nombre = document.getElementById("nombreCompleto").value;
    const pases = document.getElementById("selectPases").value;
    const btn = document.getElementById("botonConfirmar");

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
    }).then(res => res.json()).then(res => {
      if (res.exito) {
        bloquearYaConfirmado(pases);
      } else {
        alert("Error al guardar confirmación.");
        btn.innerText = "Enviar Confirmación";
        btn.disabled = false;
      }
    }).catch(e => {
      alert("Error de conexión.");
      btn.innerText = "Enviar Confirmación";
      btn.disabled = false;
    });
  });
}

// --- MODAL DE MAPA ---
function abrirMapa(url) {
  const modal = document.getElementById("modalMapa");
  document.getElementById("iframeMapaModal").src = url;
  modal.classList.remove("oculto");
}
function cerrarMapa() {
  document.getElementById("modalMapa").classList.add("oculto");
  document.getElementById("iframeMapaModal").src = "";
}

// --- EFECTO REVEAL AL HACER SCROLL ---
function prepararAnimaciones() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}
