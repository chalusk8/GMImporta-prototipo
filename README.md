# GMImporta — Prototipo visual

Frontend-only (sin base de datos). Simula el flujo de importación de CFDI externos con el lenguaje visual de GM Transport (naranja / gris).

## Cómo verlo

Abre `index.html` en el navegador, o sirve la carpeta con cualquier servidor estático.

## Flujo

1. **Cargar documentos** (archivos XML) o **Cargar demo** → poblar el listado
2. Filtrar / seleccionar / ver detalle lateral
3. **Importar** marca seleccionadas como Listo
4. **Limpiar** reinicia la vista

No hay escaneo de carpetas: solo documentos cargados.

## Arquitectura preparada

- `IImportadorXML` → contrato `cargarDocumentos`
- `ImportadorXMLSimulado` → activo
- `ImportadorXMLReal` → stub pendiente
