
const form = document.querySelector('#inscripcion');
const campoSede = document.querySelector('#campo-sede');

// Cada regla recibe el valor y devuelve true o un mensaje.

const reglas = {
  nombre: v => {
    const t = v.trim();
    const palabras = t.split(/\s+/).filter(Boolean);
    if (palabras.length < 2) return 'Escribe tu nombre y apellido.';
    if (t.length < 5 || t.length > 60) return 'Entre 5 y 60 caracteres.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]+$/.test(t)) return 'Solo letras, tildes y espacios.';
    return true;
  },

  cedula: v => /^([1-9]|1[0-3]|PE|E|N)-\d{1,4}-\d{1,6}$/.test(v.trim()) || 'Usa el formato 1-111-1111.',

  correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Usa un correo como nombre@dominio.com.',

  celular: v => /^6\d{7}$/.test(v.trim()) || 'Numero de telefono debe empezar en 6 y tener 8 dijitos',

  nacimiento: v => {
    if (!v) return 'Indica tu fecha de nacimiento.';
    const fecha = new Date(v);
    if (isNaN(fecha)) return 'Fecha inválida.';
    const hoy = new Date();
    if (fecha > hoy) return 'No puede ser futura.';
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 16);
    if (fecha > limite) return 'Debes tener al menos 16 años.';
    return true;
  },

  curso: v => v !== '' || 'Elige un curso.',

  modalidad: v => v !== '' || 'Elige presencial o virtual.',

  sede: v => {
    const modalidad = form.querySelector('input[name="modalidad"]:checked');
    if (!modalidad || modalidad.value !== 'presencial') return true; // no aplica
    return v !== '' || 'Elige una sede.';
  },

  clave: v => {
    if (v.length < 8) return 'Mínimo 8 caracteres.';
    if (!/[A-Z]/.test(v)) return 'Falta una mayúscula.';
    if (!/[a-z]/.test(v)) return 'Falta una minúscula.';
    if (!/\d/.test(v)) return 'Falta un número.';
    if (!/[^\w\s]/.test(v)) return 'Te falta un símbolo.';
    return true;
  },

  clave2: v => {
    const c1 = form.clave.value;
    return v === c1 || 'Las contraseñas no coinciden.';
  },

  comentarios: v => v.length <= 200 || 'Máximo 200 caracteres.',

  terminos: (v, input) => input.checked || 'Debes aceptar los términos.',
};


// CAPA 2 — Aplicar las reglas a un campo

function validarCampo(input) {
  const regla = reglas[input.name];
  if (!regla) return true;

  const resultado = regla(input.value, input);
  const valido = resultado === true;

  input.setAttribute('aria-invalid', String(!valido));
  input.setCustomValidity(valido ? '' : resultado);

  const error = document.getElementById(`${input.name}-error`);
  if (error) error.textContent = valido ? '' : resultado;

  return valido;
}


// SECCIÓN 3.4 — Cuándo mostrar los errores

const tocados = new Set();

form.addEventListener('blur', (e) => {
  if (!reglas[e.target.name]) return;
  tocados.add(e.target.name);
  validarCampo(e.target);
}, true); // blur no burbujea → fase de captura

form.addEventListener('input', (e) => {
  // Revalidar en vivo solo si ya fue tocado, o si es comentarios (contador/limite)
  if (e.target.name === 'comentarios') {
    actualizarContador(e.target);
    if (tocados.has('comentarios')) validarCampo(e.target);
    return;
  }
  if (tocados.has(e.target.name)) validarCampo(e.target);

  // Al cambiar la contraseña, revalidar también la confirmación
  if (e.target.name === 'clave' && tocados.has('clave2')) {
    validarCampo(form.clave2);
  }

  // Fuerza de la contraseña
  if (e.target.name === 'clave') actualizarFuerza(e.target.value);
});

// Radios: change en lugar de input para que dispare bien
form.addEventListener('change', (e) => {
  if (e.target.name === 'modalidad') {
    manejarModalidad(e.target.value);
    if (tocados.has('modalidad')) validarCampo(e.target);
  }
  if (e.target.name === 'sede' && tocados.has('sede')) validarCampo(e.target);
  if (e.target.name === 'curso') {
    tocados.add('curso');
    validarCampo(e.target);
  }
  if (e.target.name === 'terminos') {
    tocados.add('terminos');
    validarCampo(e.target);
  }
});


// Comportamiento dinámico: modalidad → sede

function manejarModalidad(valor) {
  const presencial = valor === 'presencial';
  campoSede.hidden = !presencial;

  if (presencial) {
    form.sede.setAttribute('required', '');
  } else {
    form.sede.removeAttribute('required');
    form.sede.value = '';
    // Ocultar cualquier error previo de la sede
    form.sede.setAttribute('aria-invalid', 'false');
    document.getElementById('sede-error').textContent = '';
  }
}


// Contador de comentarios

function actualizarContador(textarea) {
  const span = document.getElementById('contador-comentarios');
  const n = textarea.value.length;
  span.textContent = n;
  const p = span.parentElement;
  p.classList.toggle('limite', n >= 143 && n < 180);
  p.classList.toggle('max',    n >= 180);
}


// Indicador de fuerza de contraseña
function actualizarFuerza(valor) {
  const barra = document.getElementById('barra-fuerza');
  let puntos = 0;
  if (valor.length >= 8) puntos++;
  if (/[A-Z]/.test(valor)) puntos++;
  if (/[a-z]/.test(valor)) puntos++;
  if (/\d/.test(valor)) puntos++;
  if (/[^\w\s]/.test(valor)) puntos++;

  const colores = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1a6b3c'];
  barra.style.width = (puntos * 20) + '%';
  barra.style.background = colores[Math.max(0, puntos - 1)] || '#eee';
}

// Submit — validar todo, foco al primero con error
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Lista de campos con regla, expandiendo los radios
  const campos = [
    form.nombre, form.cedula, form.correo, form.celular,
    form.nacimiento, form.curso, form.sede, form.clave,
    form.clave2, form.comentarios, form.terminos,
  ];

  // Modalidad necesita comprobación aparte (radio group)
  const modalidad = form.querySelector('input[name="modalidad"]:checked');
  const modalidadValida = !!modalidad;
  const errorModalidad = document.getElementById('modalidad-error');
  errorModalidad.textContent = modalidadValida ? '' : 'Elige una modalidad.';

  const invalidos = campos.filter(el => reglas[el.name] && !validarCampo(el));

  if (!modalidadValida) invalidos.unshift(form.querySelector('input[name="modalidad"]'));
  if (invalidos.length) {
    invalidos[0].focus();
    return;
  }

  mostrarConfirmacion(new FormData(form));
  form.reset();
  tocados.clear();
  document.querySelectorAll('[aria-invalid="true"]').forEach(el =>
    el.setAttribute('aria-invalid', 'false'));
  document.querySelectorAll('.error').forEach(p => p.textContent = '');
  document.getElementById('contador-comentarios').textContent = '0';
  document.getElementById('barra-fuerza').style.width = '0';
  campoSede.hidden = true;
});


// Tarjeta de confirmación (createElement + textContent)

function mostrarConfirmacion(datos) {
  const contenedor = document.getElementById('confirmacion');
  contenedor.textContent = ''; // limpiar anteriores

  const card = document.createElement('div');
  card.className = 'tarjeta';

  const titulo = document.createElement('h2');
  titulo.textContent = '✅ Inscripción registrada';
  card.appendChild(titulo);

  const dl = document.createElement('dl');

  const filas = [
    ['Nombre',      datos.get('nombre')],
    ['Cédula',      datos.get('cedula')],
    ['Correo',      datos.get('correo')],
    ['Celular',     datos.get('celular')],
    ['Nacimiento',  datos.get('nacimiento')],
    ['Curso',       datos.get('curso')],
    ['Modalidad',   datos.get('modalidad')],
  ];
  if (datos.get('modalidad') === 'presencial') {
    filas.push(['Sede', datos.get('sede')]);
  }
  const comentarios = (datos.get('comentarios') || '').trim();
  if (comentarios) filas.push(['Comentarios', comentarios]);

  for (const [k, v] of filas) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v || '—';
    dl.append(dt, dd);
  }

  card.appendChild(dl);
  contenedor.appendChild(card);
}