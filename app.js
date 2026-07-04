/* =============================================================
   SPA Administrador de Prompts — Lógica JavaScript
   Autor: Generado por Antigravity
   Versión: 1.0.0
   ============================================================= */

'use strict';

// ── CONFIGURACIÓN ─────────────────────────────────────────────
const CONFIG_KEY = 'promptmanager_api_url';
const THEME_KEY = 'promptmanager_theme';
const TOAST_DURATION = 4000; // ms
// Pegá aquí tu URL de Apps Script (terminada en /exec) para que sea la base de datos por defecto en GitHub
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbwgYhE2UyDLhxhenXufhzEOkPqGCgQq95KxAbxlQObOAsTOxxb-MPMrDoDffWv2XU3MFA/exec';

// ── ESTADO GLOBAL ─────────────────────────────────────────────
const State = {
  prompts: [],      // todos los prompts de la API
  filtered: [],      // prompts después de filtrar
  currentEditId: null,    // ID del prompt siendo editado
  currentDeleteId: null,    // ID del prompt siendo eliminado
  currentDetailId: null,    // ID del prompt visto en detalle
  apiUrl: '',      // URL del Apps Script Web App
  sortCol: '',      // columna de ordenamiento actual
  sortDir: 'asc',   // 'asc' | 'desc'
  isLoading: false,
};

// ── DOM REFERENCES ────────────────────────────────────────────
const $ = id => document.getElementById(id);

const DOM = {
  // Header
  themeToggle: $('themeToggle'),
  statTotal: $('statTotal'),
  statCategories: $('statCategories'),

  // Config banner
  configBanner: $('configBanner'),
  appsScriptUrl: $('appsScriptUrl'),
  saveConfigBtn: $('saveConfigBtn'),
  configToggleBtn: $('configToggleBtn'),

  // Toolbar
  searchInput: $('searchInput'),
  categoryFilter: $('categoryFilter'),
  newPromptBtn: $('newPromptBtn'),

  // Table
  promptsTbody: $('promptsTbody'),
  resultsCount: $('resultsCount'),

  // Form Modal
  formModal: $('formModal'),
  formModalIcon: $('formModalIcon'),
  formModalTitle: $('formModalTitle'),
  formModalSubtitle: $('formModalSubtitle'),
  formModalClose: $('formModalClose'),
  promptForm: $('promptForm'),
  fieldCategoria: $('fieldCategoria'),
  fieldNombrePrompt: $('fieldNombrePrompt'),
  fieldPrompt: $('fieldPrompt'),
  fieldEjemplos: $('fieldEjemplos'),
  promptCharCount: $('promptCharCount'),
  formCancelBtn: $('formCancelBtn'),
  formSubmitBtn: $('formSubmitBtn'),
  formSubmitIcon: $('formSubmitIcon'),
  formSubmitText: $('formSubmitText'),
  categoriasDatalist: $('categoriasDatalist'),

  // Delete Modal
  deleteModal: $('deleteModal'),
  deleteModalClose: $('deleteModalClose'),
  deleteItemName: $('deleteItemName'),
  deleteItemCat: $('deleteItemCat'),
  deleteCancelBtn: $('deleteCancelBtn'),
  deleteConfirmBtn: $('deleteConfirmBtn'),

  // Detail Modal
  detailModal: $('detailModal'),
  detailModalTitle: $('detailModalTitle'),
  detailModalCategory: $('detailModalCategory'),
  detailModalClose: $('detailModalClose'),
  detailPromptText: $('detailPromptText'),
  detailEjemplosText: $('detailEjemplosText'),
  detailEjemplosSection: $('detailEjemplosSection'),
  detailFechaText: $('detailFechaText'),
  detailFechaSection: $('detailFechaSection'),
  detailCloseBtn: $('detailCloseBtn'),
  detailEditBtn: $('detailEditBtn'),

  // Connection Status
  connectionStatus: $('connectionStatus'),

  // Toast
  toastContainer: $('toastContainer'),
};

// ── PROMPTS POR DEFECTO (LOCALFALLBACK) ────────────────────────
const DEFAULT_PROMPTS = [
  {
    id: "1",
    categoria: "Redacción",
    nombrePrompt: "Email profesional persuasivo",
    prompt: "Actúa como un copywriter experto en comunicaciones B2B. Redactá un email profesional con el siguiente objetivo: [OBJETIVO]. El destinatario es [CARGO] de [EMPRESA]. El tono debe ser [formal/amigable/urgente]. Incluí un asunto atractivo, cuerpo conciso de máximo 150 palabras y un CTA claro al final.",
    ejemplos: "OBJETIVO: agendar una demo del producto\nCARGO: Gerente de Marketing\nEMPRESA: empresa mediana del sector retail\nTono: amigable",
    fecha: "04/07/2026"
  },
  {
    id: "2",
    categoria: "Redacción",
    nombrePrompt: "Reescribir párrafo con tono diferente",
    prompt: "Reescribí el siguiente párrafo adaptando el tono a [TONO: formal / casual / técnico / motivacional]. Mantené el significado original pero ajustá el vocabulario, la estructura de las oraciones y el nivel de formalidad. Párrafo original: [TEXTO]",
    ejemplos: "TONO: casual\nTEXTO: La implementación del sistema de gestión documental redundará en una optimización de los flujos de trabajo interdepartamentales.",
    fecha: "04/07/2026"
  },
  {
    id: "3",
    categoria: "Redacción",
    nombrePrompt: "Resumen ejecutivo de documento",
    prompt: "Leé el siguiente documento y generá un resumen ejecutivo de máximo 200 palabras. El resumen debe incluir: (1) contexto y objetivo principal, (2) hallazgos o puntos clave (máx. 3 viñetas), (3) conclusión o recomendación accionable. Usá lenguaje claro, evitá jerga técnica innecesaria. Documento: [TEXTO DEL DOCUMENTO]",
    ejemplos: "",
    fecha: "04/07/2026"
  },
  {
    id: "4",
    categoria: "Código",
    nombrePrompt: "Revisar y optimizar función",
    prompt: "Sos un desarrollador senior especializado en [LENGUAJE]. Revisá la siguiente función e identificá: (1) bugs o errores lógicos, (2) oportunidades de optimización de rendimiento, (3) mejoras de legibilidad y buenas prácticas. Luego reescribí la función corregida con comentarios explicando cada cambio relevante.\n\nFunción original:\n```[LENGUAJE]\n[CÓDIGO]\n```",
    ejemplos: "LENGUAJE: JavaScript\nCÓDIGO: function sumar(a,b){return a+b} // función de ejemplo",
    fecha: "04/07/2026"
  },
  {
    id: "5",
    categoria: "Código",
    nombrePrompt: "Generar tests unitarios",
    prompt: "Generá tests unitarios completos para la siguiente función usando [FRAMEWORK DE TESTING]. Cubrí: (1) casos felices (happy path), (2) casos límite (edge cases), (3) entradas inválidas o nulas, (4) errores esperados. Usá nombres describivos para cada test que expliquen qué se está probando.\n\nFunción a testear:\n```[LENGUAJE]\n[CÓDIGO]\n```",
    ejemplos: "FRAMEWORK: Jest\nLENGUAJE: TypeScript\nCÓDIGO: function dividir(a: number, b: number): number { return a / b; }",
    fecha: "04/07/2026"
  },
  {
    id: "6",
    categoria: "Código",
    nombrePrompt: "Explicar código complejo",
    prompt: "Actuá como un docente de programación paciente y didáctico. Explicá el siguiente bloque de código paso a paso como si el lector fuera [NIVEL: principiante / intermedio / avanzado]. Usá analogías simples donde sea útil. Al final, resumí en una oración qué hace el código en términos de negocio.\n\nCódigo:\n```\n[CÓDIGO]\n```",
    ejemplos: "NIVEL: principiante\nCÓDIGO: const result = arr.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {});",
    fecha: "04/07/2026"
  },
  {
    id: "7",
    categoria: "Análisis",
    nombrePrompt: "Análisis FODA de negocio",
    prompt: "Actuá como un consultor estratégico de negocios. Realizá un análisis FODA completo para [EMPRESA/PRODUCTO] en el contexto de [INDUSTRIA/MERCADO]. Para cada cuadrante (Fortalezas, Oportunidades, Debilidades, Amenazas) listá entre 3 y 5 puntos concretos y accionables. Contexto adicional: [CONTEXTO]",
    ejemplos: "EMPRESA: startup de fintech enfocada en pagos móviles para pymes\nINDUSTRIA: servicios financieros en Latinoamérica\nCONTEXTO: lleva 2 años en el mercado, 500 clientes activos, sin financiamiento externo aún",
    fecha: "04/07/2026"
  },
  {
    id: "8",
    categoria: "Análisis",
    nombrePrompt: "Comparar opciones y recomendar",
    prompt: "Comparás las siguientes [N] opciones para resolver [PROBLEMA]. Para cada opción evaluá los criterios: [CRITERIO 1], [CRITERIO 2], [CRITERIO 3]. Presentá la comparación en una tabla y luego hacé una recomendación fundamentada indicando cuál elegirías y por qué, considerando el contexto de [CONTEXTO].\n\nOpciones:\n[LISTA DE OPCIONES]",
    ejemplos: "N: 3\nPROBLEMA: elegir una base de datos para una app de e-commerce con alta concurrencia\nCRITERIOS: escalabilidad, costo, facilidad de implementación\nCONTEXTO: equipo pequeño, presupuesto limitado, lanzamiento en 3 meses\nOPCIONES: PostgreSQL, MongoDB, Firebase Firestore",
    fecha: "04/07/2026"
  },
  {
    id: "9",
    categoria: "Análisis",
    nombrePrompt: "Detectar sesgos en un texto",
    prompt: "Analizá el siguiente texto e identificá posibles sesgos cognitivos, narrativos o estadísticos presentes. Para cada sesgo encontrado: (1) nombralo, (2) citá la frase o sección donde aparece, (3) explicá por qué es un sesgo, (4) sugerí cómo podría reformularse de manera más neutral.\n\nTexto: [TEXTO]",
    ejemplos: "",
    fecha: "04/07/2026"
  },
  {
    id: "10",
    categoria: "Marketing",
    nombrePrompt: "Generar 5 ideas de contenido para redes",
    prompt: "Sos un estratega de contenido digital especializado en [RED SOCIAL]. Generá 5 ideas de contenido originales y relevantes para una cuenta de [TIPO DE NEGOCIO/MARCA] con el objetivo de [OBJETIVO: ganar seguidores / aumentar engagement / generar leads / educar a la audiencia]. Para cada idea incluí: título, formato sugerido (carrusel, reel, story, post estático), gancho de apertura y hashtags relevantes.",
    ejemplos: "RED SOCIAL: Instagram\nTIPO DE NEGOCIO: estudio de yoga\nOBJETIVO: aumentar engagement",
    fecha: "04/07/2026"
  },
  {
    id: "11",
    categoria: "Marketing",
    nombrePrompt: "Crear propuesta de valor única",
    prompt: "Ayudame a construir la Propuesta de Valor Única (UVP) para [PRODUCTO/SERVICIO]. El público objetivo es [AUDIENCIA]. Los principales problemas que resuelve son [PROBLEMA 1], [PROBLEMA 2]. Los diferenciadores clave frente a la competencia son [DIFERENCIADOR]. Generá 3 versiones de UVP: una larga (2-3 oraciones), una corta (1 oración) y una ultra-corta (tagline de menos de 8 palabras).",
    ejemplos: "PRODUCTO: app de gestión de tareas para equipos remotos\nAUDIENCIA: equipos de trabajo distribuidos en diferentes zonas horarias\nPROBLEMAS: falta de visibilidad, reuniones innecesarias\nDIFERENCIADOR: sincronización automática por zona horaria y resumen diario por WhatsApp",
    fecha: "04/07/2026"
  },
  {
    id: "12",
    categoria: "Marketing",
    nombrePrompt: "Brief de campaña publicitaria",
    prompt: "Redactá un brief de campaña publicitaria completo para [PRODUCTO/SERVICIO]. Incluí las siguientes secciones: (1) Objetivo de la campaña, (2) Público objetivo y buyer persona, (3) Mensaje clave y tono de comunicación, (4) Canales recomendados, (5) KPIs de éxito, (6) Presupuesto estimado y distribución sugerida. Contexto: [CONTEXTO DE LA CAMPAÑA]",
    ejemplos: "PRODUCTO: lanzamiento de una línea de snacks saludables\nCONTEXTO: presupuesto total de USD 5.000, duración 4 semanas, mercado Argentina",
    fecha: "04/07/2026"
  },
  {
    id: "13",
    categoria: "Productividad",
    nombrePrompt: "Planificar semana con método timeboxing",
    prompt: "Actuá como un coach de productividad experto en el método timeboxing. Tengo las siguientes tareas pendientes para esta semana: [LISTA DE TAREAS]. Mi disponibilidad horaria es de [HORARIO DE TRABAJO]. Mis prioridades son [PRIORIDADES]. Generá un plan semanal dividido por día con bloques de tiempo asignados, respetando pausas activas de 10 minutos cada 90 minutos y un bloque diario de trabajo profundo sin interrupciones.",
    ejemplos: "TAREAS: preparar presentación para cliente, revisar propuesta de socio, responder emails pendientes, actualizar documentación técnica, sesión 1:1 con equipo\nHORARIO: lunes a viernes de 9:00 a 18:00\nPRIORIDADES: presentación para cliente (urgente), responder emails",
    fecha: "04/07/2026"
  },
  {
    id: "14",
    categoria: "Productividad",
    nombrePrompt: "Convertir notas en acta de reunión",
    prompt: "Transformá las siguientes notas desordenadas de una reunión en un acta profesional y estructurada. El acta debe incluir: fecha y participantes (si se mencionan), resumen ejecutivo (2-3 oraciones), decisiones tomadas, tareas asignadas con responsable y fecha límite, y próximos pasos. Usá formato claro con encabezados y viñetas.\n\nNotas: [NOTAS DE LA REUNIÓN]",
    ejemplos: "NOTAS: hablamos con juan y maria, decidimos lanzar el producto en agosto, juan se encarga del diseño para el viernes, maria habla con el proveedor la semana que viene, el precio queda en 299, revisar si hay que cambiar el packaging",
    fecha: "04/07/2026"
  },
  {
    id: "15",
    categoria: "Productividad",
    nombrePrompt: "Crear checklist de proceso repetible",
    prompt: "Creá una checklist detallada y reutilizable para el proceso de [NOMBRE DEL PROCESO]. El proceso lo ejecuta [ROL/PERSONA] con una frecuencia de [FRECUENCIA]. Organizá los pasos en etapas lógicas, incluí casillas de verificación ([ ]) y agregá notas aclaratorias donde sea necesario. Al final, incluí una sección de 'Criterios de calidad' con 3-5 puntos para validar que el proceso se completó correctamente.",
    ejemplos: "PROCESO: onboarding de nuevo cliente de agencia de marketing\nROL: account manager\nFRECUENCIA: cada vez que entra un nuevo cliente",
    fecha: "04/07/2026"
  }
];

// ══════════════════════════════════════════════════════════════
//  THEME MANAGER
// ══════════════════════════════════════════════════════════════
const ThemeManager = {
  init() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    this.apply(saved);
    DOM.themeToggle.addEventListener('click', () => this.toggle());
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.apply(current === 'dark' ? 'light' : 'dark');
  },
};

// ══════════════════════════════════════════════════════════════
//  API SERVICE
// ══════════════════════════════════════════════════════════════
const ApiService = {
  isApiMode() {
    return !!State.apiUrl;
  },

  async get(params = {}) {
    const url = new URL(State.apiUrl);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async post(body) {
    const res = await fetch(State.apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** Obtiene todos los prompts */
  async getAllPrompts() {
    if (this.isApiMode()) {
      return this.get({ action: 'getAll' });
    } else {
      let local = localStorage.getItem('promptmanager_local_prompts');
      if (!local) {
        local = JSON.stringify(DEFAULT_PROMPTS);
        localStorage.setItem('promptmanager_local_prompts', local);
      }
      return { success: true, data: JSON.parse(local) };
    }
  },

  /** Crea un nuevo prompt */
  async createPrompt(data) {
    if (this.isApiMode()) {
      return this.post({ action: 'create', data });
    } else {
      let local = JSON.parse(localStorage.getItem('promptmanager_local_prompts') || '[]');
      const newPrompt = {
        id: String(Date.now()),
        categoria: data.categoria,
        nombrePrompt: data.nombrePrompt,
        prompt: data.prompt,
        ejemplos: data.ejemplos,
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
      local.push(newPrompt);
      localStorage.setItem('promptmanager_local_prompts', JSON.stringify(local));
      return { success: true, id: newPrompt.id };
    }
  },

  /** Actualiza un prompt existente */
  async updatePrompt(id, data) {
    if (this.isApiMode()) {
      return this.post({ action: 'update', id, data });
    } else {
      let local = JSON.parse(localStorage.getItem('promptmanager_local_prompts') || '[]');
      const index = local.findIndex(p => p.id === id);
      if (index === -1) return { success: false, error: 'Prompt no encontrado' };
      local[index] = {
        ...local[index],
        categoria: data.categoria,
        nombrePrompt: data.nombrePrompt,
        prompt: data.prompt,
        ejemplos: data.ejemplos,
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
      localStorage.setItem('promptmanager_local_prompts', JSON.stringify(local));
      return { success: true };
    }
  },

  /** Elimina un prompt */
  async deletePrompt(id) {
    if (this.isApiMode()) {
      return this.post({ action: 'delete', id });
    } else {
      let local = JSON.parse(localStorage.getItem('promptmanager_local_prompts') || '[]');
      local = local.filter(p => p.id !== id);
      localStorage.setItem('promptmanager_local_prompts', JSON.stringify(local));
      return { success: true };
    }
  },
};

// ══════════════════════════════════════════════════════════════
//  CONFIG MANAGER
// ══════════════════════════════════════════════════════════════
const ConfigManager = {
  init() {
    let saved = localStorage.getItem(CONFIG_KEY);
    // Si la URL en tu navegador es la rota por defecto del demo anterior, la eliminamos para usar la nueva DEFAULT_API_URL
    if (saved === 'https://script.google.com/macros/s/AKfycbvV76Bzl4NnoM4ljxBmCZCLHKfDaFXicRNqMJzqcXZxH-Io9zkMkHG9IFR7REc6Azfm4A/exec') {
      localStorage.removeItem(CONFIG_KEY);
      saved = null;
    }

    const activeUrl = saved || DEFAULT_API_URL;
    if (activeUrl) {
      State.apiUrl = activeUrl;
      DOM.appsScriptUrl.value = activeUrl;
      DOM.configBanner.classList.add('hidden');
    } else {
      State.apiUrl = '';
      DOM.appsScriptUrl.value = '';
      DOM.configBanner.classList.remove('hidden');
    }

    DOM.saveConfigBtn.addEventListener('click', () => this.save());
    DOM.appsScriptUrl.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.save();
    });

    if (DOM.configToggleBtn) {
      DOM.configToggleBtn.addEventListener('click', () => {
        DOM.configBanner.classList.toggle('hidden');
        if (!DOM.configBanner.classList.contains('hidden')) {
          DOM.appsScriptUrl.focus();
        }
      });
    }

    this.updateStatusBadge();
  },

  save() {
    const url = DOM.appsScriptUrl.value.trim();
    if (!url) {
      Toast.show('error', 'URL requerida', 'Ingresá la URL del Web App de Apps Script.');
      return;
    }
    if (!url.startsWith('https://script.google.com')) {
      Toast.show('error', 'URL inválida', 'La URL debe comenzar con https://script.google.com');
      return;
    }

    State.apiUrl = url;
    localStorage.setItem(CONFIG_KEY, url);
    DOM.configBanner.classList.add('hidden');
    Toast.show('success', 'Configuración guardada', 'Conectando con Google Sheets...');
    this.updateStatusBadge();
    DataController.loadAll();
  },

  reset() {
    localStorage.removeItem(CONFIG_KEY);
    State.apiUrl = '';
    DOM.appsScriptUrl.value = '';
    DOM.configBanner.classList.remove('hidden');
    this.updateStatusBadge();
    DataController.loadAll();
  },

  updateStatusBadge() {
    const badge = DOM.connectionStatus;
    if (!badge) return;
    if (State.apiUrl) {
      badge.className = 'status-badge cloud';
      badge.querySelector('.status-label').textContent = 'Conectado a Sheets';
      badge.setAttribute('title', 'Conectado a Google Sheets en la nube. Hacé clic en el engranaje para configurar/desconectar.');
    } else {
      badge.className = 'status-badge local';
      badge.querySelector('.status-label').textContent = 'Modo Local';
      badge.setAttribute('title', 'Almacenando localmente en el navegador. Hacé clic en el engranaje para conectar a Google Sheets.');
    }
  }
};

// ══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
const Toast = {
  show(type, title, message = '') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="toast-content">
        <div class="toast-title">${this._esc(title)}</div>
        ${message ? `<div class="toast-message">${this._esc(message)}</div>` : ''}
      </div>
    `;

    DOM.toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, TOAST_DURATION);
  },

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

// ══════════════════════════════════════════════════════════════
//  TABLE RENDERER
// ══════════════════════════════════════════════════════════════
const TableRenderer = {
  render(prompts) {
    const tbody = DOM.promptsTbody;
    tbody.innerHTML = '';

    // Actualizar contador
    DOM.resultsCount.textContent = `${prompts.length} resultado${prompts.length !== 1 ? 's' : ''}`;

    if (prompts.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <div class="empty-title">No se encontraron prompts</div>
            <div class="empty-description">
              Probá cambiando los filtros o creá tu primer prompt con el botón "Nuevo Prompt".
            </div>
            <button class="btn btn-primary" onclick="ModalController.openCreate()">✨ Nuevo Prompt</button>
          </div>
        </td></tr>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    prompts.forEach(p => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', p.id);

      tr.innerHTML = `
        <td class="td-category">
          <span class="category-badge">${this._esc(p.categoria || '—')}</span>
        </td>
        <td class="td-name">${this._esc(p.nombrePrompt || '—')}</td>
        <td class="td-prompt">
          <div class="cell-text">${this._esc(p.prompt || '—')}</div>
          ${(p.prompt || '').length > 80
          ? `<button class="expand-btn" data-id="${this._esc(p.id)}" data-action="detail">Ver completo</button>`
          : ''}
        </td>
        <td class="td-examples">
          <div class="cell-text">${this._esc(p.ejemplos || '—')}</div>
          ${(p.ejemplos || '').length > 60
          ? `<button class="expand-btn" data-id="${this._esc(p.id)}" data-action="detail">Ver completo</button>`
          : ''}
        </td>
        <td class="td-fecha">${this._esc((p.fecha || '').split(' ')[0] || '—')}</td>
        <td class="td-actions">
          <div class="actions-group">
            <button
              class="btn btn-icon edit"
              data-id="${this._esc(p.id)}"
              data-action="edit"
              title="Editar prompt"
              aria-label="Editar ${this._esc(p.nombrePrompt)}"
            >✏️</button>
            <button
              class="btn btn-icon delete"
              data-id="${this._esc(p.id)}"
              data-action="delete"
              title="Eliminar prompt"
              aria-label="Eliminar ${this._esc(p.nombrePrompt)}"
            >🗑️</button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
  },

  showLoading() {
    DOM.promptsTbody.innerHTML = `
      <tr><td colspan="6">
        <div class="loading-state">
          <div class="spinner"></div>
          <div class="loading-text">Cargando prompts...</div>
        </div>
      </td></tr>
    `;
    DOM.resultsCount.textContent = '—';
  },

  _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

// ══════════════════════════════════════════════════════════════
//  FILTER & SORT
// ══════════════════════════════════════════════════════════════
const FilterController = {
  apply() {
    const search = DOM.searchInput.value.trim().toLowerCase();
    const category = DOM.categoryFilter.value;

    let result = State.prompts.filter(p => {
      const matchCat = !category || p.categoria === category;
      const matchSearch = !search || [
        p.categoria, p.nombrePrompt, p.prompt, p.ejemplos
      ].some(v => (v || '').toLowerCase().includes(search));
      return matchCat && matchSearch;
    });

    // Ordenamiento
    if (State.sortCol) {
      result = [...result].sort((a, b) => {
        if (State.sortCol === 'fecha') {
          const parseDate = str => {
            if (!str) return 0;
            const [dmy, hm] = str.split(' ');
            if (!dmy) return 0;
            const [d, m, y] = dmy.split('/').map(Number);
            const [h, min] = hm ? hm.split(':').map(Number) : [0, 0];
            return new Date(y, m - 1, d, h, min).getTime();
          };
          const va = parseDate(a.fecha);
          const vb = parseDate(b.fecha);
          return State.sortDir === 'asc' ? va - vb : vb - va;
        }
        const va = (a[State.sortCol] || '').toLowerCase();
        const vb = (b[State.sortCol] || '').toLowerCase();
        return State.sortDir === 'asc'
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      });
    }

    State.filtered = result;
    TableRenderer.render(result);
  },

  updateCategories() {
    const cats = [...new Set(State.prompts.map(p => p.categoria).filter(Boolean))].sort();
    const current = DOM.categoryFilter.value;

    DOM.categoryFilter.innerHTML = '<option value="">📂 Todas las categorías</option>';
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      DOM.categoryFilter.appendChild(opt);
    });

    // Restaurar selección si sigue existiendo
    if (cats.includes(current)) DOM.categoryFilter.value = current;

    // Actualizar datalist del formulario
    DOM.categoriasDatalist.innerHTML = '';
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      DOM.categoriasDatalist.appendChild(opt);
    });

    // Stats del header
    DOM.statCategories.textContent = cats.length;
  },

  updateStats() {
    DOM.statTotal.textContent = State.prompts.length;
  },
};

// ══════════════════════════════════════════════════════════════
//  DATA CONTROLLER
// ══════════════════════════════════════════════════════════════
const DataController = {
  async loadAll() {
    if (!State.apiUrl) return;

    TableRenderer.showLoading();

    try {
      const res = await ApiService.getAllPrompts();
      if (!res.success) throw new Error(res.error || 'Error al obtener datos');

      State.prompts = res.data || [];
      FilterController.updateCategories();
      FilterController.updateStats();
      FilterController.apply();

    } catch (err) {
      console.error('[DataController.loadAll]', err);
      Toast.show('error', 'Error de conexión', err.message);
      DOM.configBanner.classList.remove('hidden');
      DOM.promptsTbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <span class="empty-icon">⚠️</span>
            <div class="empty-title">Error al cargar los prompts</div>
            <div class="empty-description">${err.message}. Verificá la URL del Apps Script y volvé a intentarlo.</div>
            <button class="btn btn-secondary" onclick="DataController.loadAll()">🔄 Reintentar</button>
          </div>
        </td></tr>
      `;
    }
  },

  async create(data) {
    const res = await ApiService.createPrompt(data);
    if (!res.success) throw new Error(res.error || 'Error al crear');
    Toast.show('success', 'Prompt creado', `"${data.nombrePrompt}" agregado correctamente.`);
    await this.loadAll();
    return res;
  },

  async update(id, data) {
    const res = await ApiService.updatePrompt(id, data);
    if (!res.success) throw new Error(res.error || 'Error al actualizar');
    Toast.show('success', 'Prompt actualizado', `"${data.nombrePrompt}" actualizado correctamente.`);
    await this.loadAll();
    return res;
  },

  async delete(id) {
    const res = await ApiService.deletePrompt(id);
    if (!res.success) throw new Error(res.error || 'Error al eliminar');
    Toast.show('success', 'Prompt eliminado', 'El prompt fue borrado permanentemente.');
    await this.loadAll();
    return res;
  },
};

// ══════════════════════════════════════════════════════════════
//  MODAL CONTROLLER
// ══════════════════════════════════════════════════════════════
const ModalController = {
  // ── FORM MODAL ──────────────────────────────────────────────
  openCreate() {
    State.currentEditId = null;

    DOM.formModalIcon.className = 'modal-icon create';
    DOM.formModalIcon.textContent = '✨';
    DOM.formModalTitle.textContent = 'Nuevo Prompt';
    DOM.formModalSubtitle.textContent = 'Completá los campos para agregar un prompt';
    DOM.formSubmitIcon.textContent = '✨';
    DOM.formSubmitText.textContent = 'Crear Prompt';
    DOM.promptForm.reset();
    DOM.promptCharCount.textContent = '0';

    this.openModal(DOM.formModal);
    setTimeout(() => DOM.fieldCategoria.focus(), 100);
  },

  openEdit(id) {
    const prompt = State.prompts.find(p => p.id === id);
    if (!prompt) return;

    State.currentEditId = id;

    DOM.formModalIcon.className = 'modal-icon edit';
    DOM.formModalIcon.textContent = '✏️';
    DOM.formModalTitle.textContent = 'Editar Prompt';
    DOM.formModalSubtitle.textContent = `Modificando: ${prompt.nombrePrompt}`;
    DOM.formSubmitIcon.textContent = '💾';
    DOM.formSubmitText.textContent = 'Guardar Cambios';

    DOM.fieldCategoria.value = prompt.categoria || '';
    DOM.fieldNombrePrompt.value = prompt.nombrePrompt || '';
    DOM.fieldPrompt.value = prompt.prompt || '';
    DOM.fieldEjemplos.value = prompt.ejemplos || '';
    DOM.promptCharCount.textContent = (prompt.prompt || '').length;

    this.openModal(DOM.formModal);
    setTimeout(() => DOM.fieldCategoria.focus(), 100);
  },

  closeForm() {
    this.closeModal(DOM.formModal);
    State.currentEditId = null;
  },

  // ── DELETE MODAL ─────────────────────────────────────────────
  openDelete(id) {
    const prompt = State.prompts.find(p => p.id === id);
    if (!prompt) return;

    State.currentDeleteId = id;
    DOM.deleteItemName.textContent = prompt.nombrePrompt || 'Sin nombre';
    DOM.deleteItemCat.textContent = `Categoría: ${prompt.categoria || '—'}`;

    this.openModal(DOM.deleteModal);
    setTimeout(() => DOM.deleteConfirmBtn.focus(), 100);
  },

  closeDelete() {
    this.closeModal(DOM.deleteModal);
    State.currentDeleteId = null;
  },

  // ── DETAIL MODAL ─────────────────────────────────────────────
  openDetail(id) {
    const prompt = State.prompts.find(p => p.id === id);
    if (!prompt) return;

    State.currentDetailId = id;
    DOM.detailModalTitle.textContent = prompt.nombrePrompt || '—';
    DOM.detailModalCategory.textContent = `Categoría: ${prompt.categoria || '—'}`;
    DOM.detailPromptText.textContent = prompt.prompt || '—';
    DOM.detailEjemplosText.textContent = prompt.ejemplos || '—';
    DOM.detailFechaText.textContent = (prompt.fecha || '').split(' ')[0] || '—';

    DOM.detailEjemplosSection.style.display =
      (prompt.ejemplos || '').trim() ? '' : 'none';
    DOM.detailFechaSection.style.display =
      (prompt.fecha || '').trim() ? '' : 'none';

    this.openModal(DOM.detailModal);
  },

  closeDetail() {
    this.closeModal(DOM.detailModal);
    State.currentDetailId = null;
  },

  // ── HELPERS ──────────────────────────────────────────────────
  openModal(overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  closeAll() {
    [DOM.formModal, DOM.deleteModal, DOM.detailModal].forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  },
};

// ══════════════════════════════════════════════════════════════
//  SORT CONTROLLER
// ══════════════════════════════════════════════════════════════
const SortController = {
  init() {
    document.querySelectorAll('thead th[data-col]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;

        if (State.sortCol === col) {
          State.sortDir = State.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          State.sortCol = col;
          State.sortDir = 'asc';
        }

        // Actualizar clases visuales
        document.querySelectorAll('thead th[data-col]').forEach(t => {
          t.classList.remove('sorted', 'desc');
          t.setAttribute('aria-sort', 'none');
        });

        th.classList.add('sorted');
        if (State.sortDir === 'desc') th.classList.add('desc');
        th.setAttribute('aria-sort', State.sortDir === 'asc' ? 'ascending' : 'descending');

        FilterController.apply();
      });
    });
  },
};

// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════
function initEventListeners() {

  // Toolbar
  DOM.newPromptBtn.addEventListener('click', () => ModalController.openCreate());
  DOM.searchInput.addEventListener('input', () => FilterController.apply());
  DOM.categoryFilter.addEventListener('change', () => FilterController.apply());

  // Char counter del prompt
  DOM.fieldPrompt.addEventListener('input', () => {
    DOM.promptCharCount.textContent = DOM.fieldPrompt.value.length;
  });

  // ── FORM SUBMIT ────────────────────────────────────────────
  DOM.promptForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (!State.apiUrl) {
      Toast.show('error', 'Sin conexión', 'Configurá la URL del Apps Script primero.');
      return;
    }

    const data = {
      categoria: DOM.fieldCategoria.value.trim(),
      nombrePrompt: DOM.fieldNombrePrompt.value.trim(),
      prompt: DOM.fieldPrompt.value.trim(),
      ejemplos: DOM.fieldEjemplos.value.trim(),
    };

    if (!data.categoria) {
      DOM.fieldCategoria.focus();
      Toast.show('error', 'Campo requerido', 'Ingresá una categoría.');
      return;
    }
    if (!data.nombrePrompt) {
      DOM.fieldNombrePrompt.focus();
      Toast.show('error', 'Campo requerido', 'Ingresá el nombre del prompt.');
      return;
    }
    if (!data.prompt) {
      DOM.fieldPrompt.focus();
      Toast.show('error', 'Campo requerido', 'El contenido del prompt no puede estar vacío.');
      return;
    }

    const btn = DOM.formSubmitBtn;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></span> Guardando...';

    try {
      if (State.currentEditId) {
        await DataController.update(State.currentEditId, data);
      } else {
        await DataController.create(data);
      }
      ModalController.closeForm();
    } catch (err) {
      console.error('[Form submit]', err);
      Toast.show('error', 'Error al guardar', err.message);
    } finally {
      btn.disabled = false;
      const isEdit = !!State.currentEditId;
      btn.innerHTML = `<span>${isEdit ? '💾' : '✨'}</span> <span>${isEdit ? 'Guardar Cambios' : 'Crear Prompt'}</span>`;
    }
  });

  // ── FORM MODAL CLOSE ───────────────────────────────────────
  DOM.formModalClose.addEventListener('click', () => ModalController.closeForm());
  DOM.formCancelBtn.addEventListener('click', () => ModalController.closeForm());
  DOM.formModal.addEventListener('click', e => {
    if (e.target === DOM.formModal) ModalController.closeForm();
  });

  // ── DELETE CONFIRM ─────────────────────────────────────────
  DOM.deleteConfirmBtn.addEventListener('click', async () => {
    if (!State.currentDeleteId) return;

    DOM.deleteConfirmBtn.disabled = true;
    DOM.deleteConfirmBtn.textContent = 'Eliminando...';

    try {
      await DataController.delete(State.currentDeleteId);
      ModalController.closeDelete();
    } catch (err) {
      console.error('[Delete confirm]', err);
      Toast.show('error', 'Error al eliminar', err.message);
    } finally {
      DOM.deleteConfirmBtn.disabled = false;
      DOM.deleteConfirmBtn.innerHTML = '🗑️ Sí, eliminar';
    }
  });

  DOM.deleteModalClose.addEventListener('click', () => ModalController.closeDelete());
  DOM.deleteCancelBtn.addEventListener('click', () => ModalController.closeDelete());
  DOM.deleteModal.addEventListener('click', e => {
    if (e.target === DOM.deleteModal) ModalController.closeDelete();
  });

  // ── DETAIL MODAL ───────────────────────────────────────────
  DOM.detailModalClose.addEventListener('click', () => ModalController.closeDetail());
  DOM.detailCloseBtn.addEventListener('click', () => ModalController.closeDetail());
  DOM.detailModal.addEventListener('click', e => {
    if (e.target === DOM.detailModal) ModalController.closeDetail();
  });

  DOM.detailEditBtn.addEventListener('click', () => {
    const id = State.currentDetailId;
    ModalController.closeDetail();
    setTimeout(() => ModalController.openEdit(id), 200);
  });

  // ── TABLE DELEGATION ───────────────────────────────────────
  DOM.promptsTbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'edit') ModalController.openEdit(id);
    if (action === 'delete') ModalController.openDelete(id);
    if (action === 'detail') ModalController.openDetail(id);
  });

  // ── KEYBOARD (ESC para cerrar modales) ─────────────────────
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (DOM.formModal.classList.contains('active')) ModalController.closeForm();
    if (DOM.deleteModal.classList.contains('active')) ModalController.closeDelete();
    if (DOM.detailModal.classList.contains('active')) ModalController.closeDetail();
  });
}

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  ConfigManager.init();
  SortController.init();
  initEventListeners();

  // Siempre cargar datos (se adaptará a modo local o Sheets automáticamente)
  DataController.loadAll();
});
