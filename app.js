// ===============================
// Clase Cita
// ===============================
class Cita {
  constructor(id, fecha, paciente, dni, telefono, nacimiento, observaciones) {
    this.id = id; // identificador único (timestamp)
    this.fecha = fecha; // string con fecha y hora
    this.paciente = paciente; // nombre + apellidos
    this.dni = dni;
    this.telefono = telefono;
    this.nacimiento = nacimiento;
    this.observaciones = observaciones;
  }
}

// ===============================
// Variables globales
// ===============================
const form = document.getElementById("citaForm");
const tbody = document.getElementById("tbodyCitas");
const filaVacia = document.getElementById("filaVacia");
const btnCancelar = document.getElementById("btnCancelar");
const btnGuardar = document.getElementById("btnGuardar");

let citas = [];

// ===============================
// Cookies (guardar / cargar)
// ===============================
const COOKIE_NAME = "citasClinicaDentalBeatriz";

function setCookie(name, value, days) {
  const fecha = new Date();
  fecha.setTime(fecha.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie =
    `${name}=${encodeURIComponent(value)}; expires=${fecha.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function guardarCitasEnCookies() {
  setCookie(COOKIE_NAME, JSON.stringify(citas), 30);
}

function cargarCitasDeCookies() {
  const data = getCookie(COOKIE_NAME);
  if (!data) {
    citas = [];
    return;
  }

  try {
    const parsed = JSON.parse(data);
    citas = parsed.map(
      (c) => new Cita(c.id, c.fecha, c.paciente, c.dni, c.telefono, c.nacimiento, c.observaciones)
    );
  } catch (err) {
    console.error("Error leyendo cookies:", err);
    citas = [];
  }
}

// ===============================
// Validación (helpers)
// ===============================
function limpiarErrores() {
  document.getElementById("formAlert").hidden = true;
  document.getElementById("formAlert").textContent = "";

  const fields = document.querySelectorAll(".field");
  fields.forEach((f) => f.classList.remove("invalid"));

  const errors = document.querySelectorAll(".error");
  errors.forEach((e) => (e.textContent = ""));
}

function marcarError(inputId, mensaje) {
  const input = document.getElementById(inputId);
  const field = input.closest(".field");
  if (field) field.classList.add("invalid");

  const small = document.getElementById(`error-${inputId}`);
  if (small) small.textContent = mensaje;
}

function mostrarAlerta(mensaje) {
  const alert = document.getElementById("formAlert");
  alert.textContent = mensaje;
  alert.hidden = false;
}

function validarFormulario(datos) {
  let ok = true;

  // Obligatorios
  if (datos.nombre.trim() === "") { marcarError("nombre", "El nombre es obligatorio."); ok = false; }
  if (datos.apellidos.trim() === "") { marcarError("apellidos", "Los apellidos son obligatorios."); ok = false; }
  if (datos.dni.trim() === "") { marcarError("dni", "El DNI es obligatorio."); ok = false; }
  if (datos.nacimiento.trim() === "") { marcarError("nacimiento", "La fecha de nacimiento es obligatoria."); ok = false; }

  // Fecha cita
  if (!Number.isInteger(datos.dia) || datos.dia < 1 || datos.dia > 31) { marcarError("dia", "Día inválido (1-31)."); ok = false; }
  if (!Number.isInteger(datos.mes) || datos.mes < 1 || datos.mes > 12) { marcarError("mes", "Mes inválido (1-12)."); ok = false; }
  if (!Number.isInteger(datos.anio) || datos.anio < 1900 || datos.anio > 2100) { marcarError("anio", "Año inválido."); ok = false; }
  if (!Number.isInteger(datos.hora) || datos.hora < 0 || datos.hora > 23) { marcarError("hora", "Hora inválida (0-23)."); ok = false; }
  if (!Number.isInteger(datos.minuto) || datos.minuto < 0 || datos.minuto > 59) { marcarError("minuto", "Minuto inválido (0-59)."); ok = false; }

  // Teléfono
  const telLimpio = datos.telefono.trim();
  if (!/^\d+$/.test(telLimpio)) {
    marcarError("telefono", "El teléfono solo puede contener números.");
    ok = false;
  } else if (telLimpio.length < 9) {
    marcarError("telefono", "El teléfono debe tener al menos 9 dígitos.");
    ok = false;
  }

  // DNI simple
  if (!/^\d{8}[A-Za-z]$/.test(datos.dni.trim())) {
    marcarError("dni", "Formato de DNI inválido (ej. 12345678Z).");
    ok = false;
  }

  if (!ok) mostrarAlerta("Revisa los campos marcados en rojo.");
  return ok;
}

// ===============================
// Pintar citas en la tabla
// ===============================
function renderTabla() {
  tbody.innerHTML = "";

  if (citas.length === 0) {
    tbody.appendChild(filaVacia);
    return;
  }

  citas.forEach((cita, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${cita.fecha}</td>
      <td>${cita.paciente}</td>
      <td>${cita.dni}</td>
      <td>${cita.telefono}</td>
      <td>${cita.nacimiento}</td>
      <td>${cita.observaciones || ""}</td>
      <td>
        <button type="button" data-id="${cita.id}" class="btn-editar">Editar</button>
        <button type="button" data-id="${cita.id}" class="btn-eliminar">Eliminar</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ===============================
// Eliminar cita
// ===============================
function eliminarCitaPorId(id) {
  citas = citas.filter((c) => Number(c.id) !== Number(id));
  guardarCitasEnCookies();
  renderTabla();
}

// ===============================
// Editar cita (helpers)
// ===============================
function obtenerCitaDeCookiesPorId(id) {
  const data = getCookie(COOKIE_NAME);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    const encontrada = parsed.find((c) => Number(c.id) === Number(id));
    return encontrada || null;
  } catch (err) {
    console.error("Error leyendo cookies para editar:", err);
    return null;
  }
}

function separarFechaTexto(fechaTexto) {
  // formato: "d/m/a hh:mm"
  const [fechaParte, horaParte] = fechaTexto.split(" ");
  const [dia, mes, anio] = fechaParte.split("/").map((n) => parseInt(n, 10));
  const [hora, minuto] = horaParte.split(":").map((n) => parseInt(n, 10));
  return { dia, mes, anio, hora, minuto };
}

function cargarCitaEnFormulario(cita) {
  // Guardar id en el input oculto
  document.getElementById("citaId").value = cita.id;

  // Fecha
  const f = separarFechaTexto(cita.fecha);
  document.getElementById("dia").value = f.dia;
  document.getElementById("mes").value = f.mes;
  document.getElementById("anio").value = f.anio;
  document.getElementById("hora").value = f.hora;
  document.getElementById("minuto").value = f.minuto;

  // Paciente (nombre + apellidos)
  const partes = (cita.paciente || "").split(" ");
  document.getElementById("nombre").value = partes.shift() || "";
  document.getElementById("apellidos").value = partes.join(" ") || "";

  // Resto
  document.getElementById("dni").value = cita.dni || "";
  document.getElementById("telefono").value = cita.telefono || "";
  document.getElementById("nacimiento").value = cita.nacimiento || "";
  document.getElementById("observaciones").value = cita.observaciones || "";

  // UI edición
  btnCancelar.disabled = false;
  btnGuardar.textContent = "Guardar cambios";
}

function salirModoEdicion() {
  document.getElementById("citaId").value = "";
  btnCancelar.disabled = true;
  btnGuardar.textContent = "Guardar cita";
  limpiarErrores();
  form.reset();
}

// ===============================
// Click en botones de la tabla (Eliminar / Editar)
// ===============================
tbody.addEventListener("click", function (e) {
  const btnEliminar = e.target.closest("button.btn-eliminar");
  if (btnEliminar) {
    const id = btnEliminar.getAttribute("data-id");
    eliminarCitaPorId(id);
    return;
  }

  const btnEditar = e.target.closest("button.btn-editar");
  if (btnEditar) {
    const id = btnEditar.getAttribute("data-id");

    // IMPORTANTE: cargar desde cookies por ID
    const cita = obtenerCitaDeCookiesPorId(id);
    if (!cita) {
      alert("No se ha podido cargar la cita desde cookies.");
      return;
    }

    cargarCitaEnFormulario(cita);
    return;
  }
});

// ===============================
// Cancelar edición
// ===============================
btnCancelar.addEventListener("click", function () {
  salirModoEdicion();
});

console.log("JS cargado correctamente");

// ===============================
// Evento submit del formulario (crear / actualizar)
// ===============================
form.addEventListener("submit", function (e) {
  e.preventDefault();
  limpiarErrores();

  const datos = {
    dia: parseInt(document.getElementById("dia").value, 10),
    mes: parseInt(document.getElementById("mes").value, 10),
    anio: parseInt(document.getElementById("anio").value, 10),
    hora: parseInt(document.getElementById("hora").value, 10),
    minuto: parseInt(document.getElementById("minuto").value, 10),

    nombre: document.getElementById("nombre").value,
    apellidos: document.getElementById("apellidos").value,
    dni: document.getElementById("dni").value,
    telefono: document.getElementById("telefono").value,
    nacimiento: document.getElementById("nacimiento").value,
    observaciones: document.getElementById("observaciones").value
  };

  const esValido = validarFormulario(datos);
  if (!esValido) return;

  const fechaTexto =
    `${datos.dia}/${datos.mes}/${datos.anio} ${String(datos.hora).padStart(2, "0")}:${String(datos.minuto).padStart(2, "0")}`;
  const pacienteTexto = `${datos.nombre} ${datos.apellidos}`;

  const idEdicion = document.getElementById("citaId").value;

  // ACTUALIZAR
  if (idEdicion) {
    const idNum = Number(idEdicion);

    citas = citas.map((c) => {
      if (Number(c.id) !== idNum) return c;

      return new Cita(
        idNum,
        fechaTexto,
        pacienteTexto,
        datos.dni,
        datos.telefono,
        datos.nacimiento,
        datos.observaciones
      );
    });

    guardarCitasEnCookies();
    renderTabla();
    salirModoEdicion();

    console.log("✏️ Cita actualizada:", idNum);
    return;
  }

  // CREAR
  const nuevaCita = new Cita(
    Date.now(),
    fechaTexto,
    pacienteTexto,
    datos.dni,
    datos.telefono,
    datos.nacimiento,
    datos.observaciones
  );

  citas.push(nuevaCita);
  guardarCitasEnCookies();
  renderTabla();
  form.reset();

  console.log("✅ Cita creada:", nuevaCita);
});

// ===============================
// Al iniciar la aplicación
// ===============================
cargarCitasDeCookies();
renderTabla();
salirModoEdicion();
