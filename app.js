/**
 * GMImporta — Prototipo frontend (sin BD)
 * Capas: Modelos · Servicios (IImportadorXML) · Lógica · Vista
 */

/** @typedef {'I'|'E'} TipoComprobante */
/** @typedef {'Pendiente'|'Listo'|'Error'|'Duplicado'|'Simulado'} EstadoFactura */

/**
 * @typedef {Object} FacturaCFDI
 * @property {string} id
 * @property {boolean} seleccionada
 * @property {TipoComprobante} tipo
 * @property {string} rfcEmisor
 * @property {string} nombreEmisor
 * @property {string} rfcReceptor
 * @property {string} documento
 * @property {string} fecha
 * @property {string} moneda
 * @property {number} total
 * @property {string} uuid
 * @property {string} concepto
 * @property {EstadoFactura} estado
 */

const EMISORES = [
  { rfc: "TRA850101AB1", nombre: "Transportes del Pacífico SA de CV" },
  { rfc: "LOG920315CD2", nombre: "Logística Norteamericana SA" },
  { rfc: "FLE780422EF3", nombre: "Fletes y Mudanzas del Desierto SC" },
  { rfc: "CAR901208GH4", nombre: "Carga Express Peninsular SA de CV" },
  { rfc: "SER880711IJ5", nombre: "Servicios de Remolque Baja SA" },
  { rfc: "DIE950503KL6", nombre: "Diésel y Lubricantes Mexicali SA" },
  { rfc: "TAL870919MN7", nombre: "Taller Diesel del Valle SC" },
  { rfc: "SEG930627OP8", nombre: "Seguros Camioneros del Noroeste SA" },
  { rfc: "LLA860214QR9", nombre: "Llantas y Rines Industriales SA" },
  { rfc: "COM910830ST0", nombre: "Comercializadora de Refacciones GM SA" },
];

const RECEPTORES = [
  "GMT120101AAA",
  "CLI850505BBB",
  "EMP900909CCC",
  "IND750202DDD",
  "TRA880808EEE",
];

const CONCEPTOS_I = [
  "Servicio de flete nacional",
  "Traslado de mercancía refrigerada",
  "Flete consolidado zona norte",
  "Servicio de mensajería express",
  "Renta de unidad con operador",
  "Maniobras de carga y descarga",
];

const CONCEPTOS_E = [
  "Compra de diésel ultra bajo azufre",
  "Mantenimiento preventivo unidad",
  "Reemplazo de llantas tractocamión",
  "Póliza de seguro de flota",
  "Refacciones sistema de frenos",
  "Servicio de grúa y remolque",
];

const SERIES = ["A", "B", "FAC", "ING", "EGR", "T"];
const MONEDAS = ["MXN", "MXN", "MXN", "USD", "MXN"];
const ESTADOS = /** @type {EstadoFactura[]} */ ([
  "Pendiente",
  "Pendiente",
  "Simulado",
  "Listo",
  "Error",
  "Duplicado",
  "Simulado",
]);

function uuidV4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function fechaAleatoria() {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2026, 6, 20).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().slice(0, 10);
}

/** Interfaz IImportadorXML — contrato para lector real futuro */
class IImportadorXML {
  /**
   * @param {{ cantidad?: number, nombres?: string[] }} opciones
   * @returns {Promise<FacturaCFDI[]>}
   */
  async cargarDocumentos(_opciones) {
    throw new Error("IImportadorXML.cargarDocumentos no implementado");
  }
}

/** Simulador: genera facturas ficticias a partir de documentos cargados */
class ImportadorXMLSimulado extends IImportadorXML {
  /**
   * @param {{ cantidad?: number, nombres?: string[] }} opciones
   */
  async cargarDocumentos(opciones = {}) {
    const total = opciones.cantidad ?? randomInt(50, 200);
    /** @type {FacturaCFDI[]} */
    const facturas = [];
    const uuidsUsados = new Set();

    for (let i = 0; i < total; i++) {
      const tipo = Math.random() < 0.62 ? "I" : "E";
      const emisor = pick(EMISORES);
      let uuid = uuidV4().toUpperCase();
      while (uuidsUsados.has(uuid)) uuid = uuidV4().toUpperCase();
      uuidsUsados.add(uuid);

      const serie = pick(SERIES);
      const folio = String(randomInt(1000, 99999));
      const moneda = pick(MONEDAS);
      const base = tipo === "I" ? randomInt(2500, 185000) : randomInt(800, 95000);
      const centavos = randomInt(0, 99);
      const totalImporte = Number(`${base}.${String(centavos).padStart(2, "0")}`);
      const nombreDoc = opciones.nombres?.[i];

      facturas.push({
        id: `sim-${i + 1}-${uuid.slice(0, 8)}`,
        seleccionada: false,
        tipo,
        rfcEmisor: emisor.rfc,
        nombreEmisor: emisor.nombre,
        rfcReceptor: pick(RECEPTORES),
        documento: nombreDoc
          ? nombreDoc.replace(/\.xml$/i, "").slice(0, 24)
          : `${serie}-${folio}`,
        fecha: fechaAleatoria(),
        moneda,
        total: totalImporte,
        uuid,
        concepto: tipo === "I" ? pick(CONCEPTOS_I) : pick(CONCEPTOS_E),
        estado: pick(ESTADOS),
      });
    }

    await delay(280 + Math.min(total, 120) * 4);
    return facturas;
  }
}

/** Stub futuro — sustituir simulación por lector real de XML */
class ImportadorXMLReal extends IImportadorXML {
  async cargarDocumentos(_opciones) {
    throw new Error("ImportadorXMLReal pendiente de implementación");
  }
}

class GMImportaServicio {
  /** @param {IImportadorXML} importador */
  constructor(importador) {
    this.importador = importador;
    /** @type {FacturaCFDI[]} */
    this.facturas = [];
    this.origen = "";
  }

  /**
   * @param {{ cantidad?: number, nombres?: string[], origen?: string }} opciones
   */
  async cargarDocumentos(opciones = {}) {
    this.origen = opciones.origen || "Documentos cargados";
    this.facturas = await this.importador.cargarDocumentos(opciones);
    return this.facturas;
  }

  limpiar() {
    this.facturas = [];
    this.origen = "";
  }

  /**
   * @param {object} filtros
   * @returns {FacturaCFDI[]}
   */
  filtrar(filtros) {
    return this.facturas.filter((f) => {
      if (filtros.tipo !== "todos" && f.tipo !== filtros.tipo) return false;
      if (filtros.rfcEmisor && !f.rfcEmisor.toLowerCase().includes(filtros.rfcEmisor)) return false;
      if (filtros.rfcReceptor && !f.rfcReceptor.toLowerCase().includes(filtros.rfcReceptor)) return false;
      if (filtros.uuid && !f.uuid.toLowerCase().includes(filtros.uuid)) return false;
      if (filtros.fechaIni && f.fecha < filtros.fechaIni) return false;
      if (filtros.fechaFin && f.fecha > filtros.fechaFin) return false;
      return true;
    });
  }

  importarSeleccionadas() {
    let n = 0;
    for (const f of this.facturas) {
      if (f.seleccionada && f.estado !== "Error" && f.estado !== "Duplicado") {
        f.estado = "Listo";
        f.seleccionada = false;
        n++;
      }
    }
    return n;
  }

  resumen(lista = this.facturas) {
    return {
      xml: lista.length,
      ingresos: lista.filter((f) => f.tipo === "I").length,
      egresos: lista.filter((f) => f.tipo === "E").length,
      importados: lista.filter((f) => f.estado === "Listo").length,
      pendientes: lista.filter((f) => f.estado === "Pendiente" || f.estado === "Simulado").length,
      errores: lista.filter((f) => f.estado === "Error").length,
      seleccionados: lista.filter((f) => f.seleccionada).length,
    };
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function dinero(n, moneda) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "MXN",
  }).format(n);
}

/* ========== Vista ========== */
const servicio = new GMImportaServicio(new ImportadorXMLSimulado());
void ImportadorXMLReal;

/** @type {FacturaCFDI[]} */
let vistaActual = [];
/** @type {string|null} */
let idActiva = null;
let ocupado = false;

const $ = (id) => document.getElementById(id);

function leerFiltros() {
  return {
    tipo: $("filtroTipo").value,
    rfcEmisor: $("filtroRfcEmisor").value.trim().toLowerCase(),
    rfcReceptor: $("filtroRfcReceptor").value.trim().toLowerCase(),
    fechaIni: $("filtroFechaIni").value,
    fechaFin: $("filtroFechaFin").value,
    uuid: $("filtroUuid").value.trim().toLowerCase(),
  };
}

function setProgreso(pct, texto) {
  $("barraProgreso").style.width = `${pct}%`;
  $("barraProgreso").parentElement.setAttribute("aria-valuenow", String(pct));
  $("lblProgreso").textContent = texto;
}

function actualizarIndicadores(lista) {
  const r = servicio.resumen(lista);
  $("indXml").textContent = String(r.xml);
  $("indIngresos").textContent = String(r.ingresos);
  $("indEgresos").textContent = String(r.egresos);
  $("indImportados").textContent = String(r.importados);
  $("indPendientes").textContent = String(r.pendientes);
  $("indErrores").textContent = String(r.errores);
  $("totXml").textContent = String(r.xml);
  $("totIngresos").textContent = String(r.ingresos);
  $("totEgresos").textContent = String(r.egresos);
  $("totSeleccionados").textContent = String(r.seleccionados);
}

function mostrarDetalle(f) {
  if (!f) {
    $("detalleHint").classList.remove("oculto");
    $("detalleLista").classList.add("oculto");
    return;
  }
  $("detalleHint").classList.add("oculto");
  $("detalleLista").classList.remove("oculto");
  $("dRfcEmisor").textContent = f.rfcEmisor;
  $("dRfcReceptor").textContent = f.rfcReceptor;
  $("dNombreEmisor").textContent = f.nombreEmisor;
  $("dFecha").textContent = f.fecha;
  $("dUuid").textContent = f.uuid;
  $("dConcepto").textContent = f.concepto;
  $("dTotal").textContent = dinero(f.total, f.moneda);
  $("dTipo").textContent = f.tipo === "I" ? "Ingreso" : "Egreso";
  $("dMoneda").textContent = f.moneda;
  $("dEstado").innerHTML = `<span class="estado estado-${f.estado.toLowerCase()}">${f.estado}</span>`;
}

function renderTabla() {
  vistaActual = servicio.filtrar(leerFiltros());
  const tbody = $("tbodyFacturas");
  tbody.innerHTML = "";
  $("emptyState").classList.toggle("oculto", vistaActual.length > 0);

  for (const f of vistaActual) {
    const tr = document.createElement("tr");
    if (f.id === idActiva) tr.classList.add("activa");
    tr.dataset.id = f.id;
    tr.innerHTML = `
      <td class="col-check"><input type="checkbox" data-check="${f.id}" ${f.seleccionada ? "checked" : ""} /></td>
      <td><span class="tipo-pill tipo-${f.tipo}">${f.tipo === "I" ? "Ing" : "Egr"}</span></td>
      <td>${f.rfcEmisor}</td>
      <td>${f.nombreEmisor}</td>
      <td>${f.rfcReceptor}</td>
      <td>${f.documento}</td>
      <td>${f.fecha}</td>
      <td>${f.moneda}</td>
      <td class="num">${dinero(f.total, f.moneda)}</td>
      <td class="uuid">${f.uuid}</td>
      <td>${f.concepto}</td>
      <td><span class="estado estado-${f.estado.toLowerCase()}">${f.estado}</span></td>
    `;
    tbody.appendChild(tr);
  }

  actualizarIndicadores(vistaActual);
  const activa = servicio.facturas.find((x) => x.id === idActiva) || null;
  mostrarDetalle(activa);
  actualizarBotones();
}

function actualizarBotones() {
  const hay = servicio.facturas.length > 0;
  const sel = servicio.facturas.some((f) => f.seleccionada);
  $("btnImportar").disabled = ocupado || !sel;
  $("btnLimpiar").disabled = ocupado || !hay;
  $("btnCargar").disabled = ocupado;
  $("btnDemo").disabled = ocupado;
  $("chkTodos").checked =
    vistaActual.length > 0 && vistaActual.every((f) => f.seleccionada);
}

function sincronizarChecksVisibles(marcar) {
  const ids = new Set(vistaActual.map((f) => f.id));
  for (const f of servicio.facturas) {
    if (ids.has(f.id)) f.seleccionada = marcar;
  }
  renderTabla();
}

/** Carga documentos ya seleccionados (sin escanear carpetas). */
async function cargarDocumentos(opciones) {
  if (ocupado) return;
  ocupado = true;
  actualizarBotones();
  setProgreso(15, "Leyendo documentos...");
  try {
    let p = 15;
    const tick = setInterval(() => {
      p = Math.min(p + 7, 85);
      setProgreso(p, "Procesando documentos cargados...");
    }, 120);

    await servicio.cargarDocumentos(opciones);
    clearInterval(tick);
    const n = servicio.facturas.length;
    $("lblDocumentos").textContent = `${n} documento(s) · ${servicio.origen}`;
    setProgreso(100, `${n} documentos cargados`);
    idActiva = null;
    renderTabla();
  } finally {
    ocupado = false;
    actualizarBotones();
  }
}

$("btnCargar").addEventListener("click", () => $("inputDocumentos").click());

$("btnDemo").addEventListener("click", async () => {
  await cargarDocumentos({
    cantidad: randomInt(50, 200),
    origen: "Demo simulada",
  });
});

$("inputDocumentos").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const nombres = files.map((f) => f.name);
  await cargarDocumentos({
    cantidad: files.length,
    nombres,
    origen: `${files.length} archivo(s) seleccionado(s)`,
  });
  e.target.value = "";
});

$("btnImportar").addEventListener("click", () => {
  const n = servicio.importarSeleccionadas();
  setProgreso(100, n ? `${n} factura(s) marcadas como Listo` : "Nada importado");
  renderTabla();
});

$("btnLimpiar").addEventListener("click", () => {
  servicio.limpiar();
  idActiva = null;
  $("lblDocumentos").textContent = "Ninguno cargado";
  $("inputDocumentos").value = "";
  setProgreso(0, "Listo");
  renderTabla();
});

$("btnBuscar").addEventListener("click", () => renderTabla());
["filtroTipo", "filtroRfcEmisor", "filtroRfcReceptor", "filtroFechaIni", "filtroFechaFin", "filtroUuid"].forEach(
  (id) => {
    $(id).addEventListener("change", () => renderTabla());
    $(id).addEventListener("keyup", (ev) => {
      if (ev.key === "Enter") renderTabla();
    });
  }
);

$("chkTodos").addEventListener("change", (e) => {
  sincronizarChecksVisibles(e.target.checked);
});

$("tbodyFacturas").addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  const check = t.closest("input[data-check]");
  if (check instanceof HTMLInputElement) {
    const id = check.getAttribute("data-check");
    const f = servicio.facturas.find((x) => x.id === id);
    if (f) {
      f.seleccionada = check.checked;
      actualizarIndicadores(vistaActual);
      actualizarBotones();
    }
    return;
  }

  const tr = t.closest("tr[data-id]");
  if (!tr) return;
  idActiva = tr.getAttribute("data-id");
  renderTabla();
});

renderTabla();
setProgreso(0, "Listo");

/* Menú: GMImporta vive bajo Configuración */
const grupoConfig = document.querySelector('[data-group="configuracion"]');
const btnConfig = $("btnConfiguracion");
if (btnConfig && grupoConfig) {
  btnConfig.addEventListener("click", () => {
    const abierto = grupoConfig.classList.toggle("open");
    btnConfig.setAttribute("aria-expanded", String(abierto));
  });
}

$("linkGMImporta")?.addEventListener("click", (e) => {
  e.preventDefault();
  // Ya estamos en el módulo; mantener activo visualmente
  document.querySelectorAll(".erp-nav a.sub").forEach((a) => a.classList.remove("active-sub"));
  e.currentTarget.classList.add("active-sub");
});
