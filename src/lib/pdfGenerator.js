// src/lib/pdfGenerator.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generarSSCC, formatearFechaGS1, formatearPesoGS1 } from './gs1Utils';

/**
 * Genera un PDF de etiqueta logística GS1-128
 * @param {Object} datos - Datos para la etiqueta
 * @returns {Promise<Uint8Array>} - Documento PDF como array de bytes
 */
export async function generarEtiquetaLogistica(datos) {
  // Crear nuevo documento PDF
  const pdfDoc = await PDFDocument.create();
  
  // Configurar tamaño de página a 4x6 pulgadas (estándar para etiquetas logísticas)
  // 1 pulgada = 72 puntos en PDF
  const anchoEtiqueta = 4 * 72;
  const altoEtiqueta = 6 * 72;
  const pagina = pdfDoc.addPage([anchoEtiqueta, altoEtiqueta]);
  
  // Obtener fuentes
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Configurar márgenes
  const margen = 18; // 0.25 pulgadas de margen
  
  // Extraer datos de la etiqueta
  const { 
    empresa,
    direccion,
    gtin, 
    lote, 
    fecha, 
    cantidad, 
    peso 
  } = datos;
  
  // Generar SSCC para esta etiqueta
  const sscc = generarSSCC();
  
  // Formatear fecha para mostrar
  const fechaFormateada = new Date(fecha).toLocaleDateString();
  const fechaGS1 = formatearFechaGS1(fecha);
  
  // Calcular secciones
  const altoEncabezado = altoEtiqueta * 0.15; // 15% superior
  const altoMedio = altoEtiqueta * 0.35;      // 35% medio
  const altoCodigoBarras = altoEtiqueta * 0.5; // 50% inferior
  
  // ---- SECCIÓN SUPERIOR: INFORMACIÓN DE EMPRESA ----
  
  // Nombre de empresa (en negrita)
  pagina.drawText(empresa, {
    x: margen,
    y: altoEtiqueta - margen - 20,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  // Dirección de empresa
  pagina.drawText(direccion, {
    x: margen,
    y: altoEtiqueta - margen - 45,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Línea horizontal debajo del encabezado
  pagina.drawLine({
    start: { x: margen, y: altoEtiqueta - altoEncabezado },
    end: { x: anchoEtiqueta - margen, y: altoEtiqueta - altoEncabezado },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  
  // ---- SECCIÓN MEDIA: INFORMACIÓN LEGIBLE POR HUMANOS ----
  
  const textoY = altoEtiqueta - altoEncabezado - 40;
  const textoXIzquierda = margen;
  const textoXDerecha = anchoEtiqueta / 2 + 10;
  const alturaLinea = 30;
  
  // COLUMNA IZQUIERDA
  
  // GTIN con etiqueta AI
  pagina.drawText('(01) GTIN:', {
    x: textoXIzquierda,
    y: textoY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  pagina.drawText(gtin, {
    x: textoXIzquierda + 30,
    y: textoY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Número de lote con etiqueta AI
  pagina.drawText('(10) LOTE:', {
    x: textoXIzquierda,
    y: textoY - alturaLinea,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  pagina.drawText(lote, {
    x: textoXIzquierda + 30,
    y: textoY - alturaLinea,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Fecha de producción con etiqueta AI
  pagina.drawText('(11) FECHA PRD:', {
    x: textoXIzquierda,
    y: textoY - alturaLinea * 2,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  pagina.drawText(`${fechaFormateada} (${fechaGS1})`, {
    x: textoXIzquierda + 90,
    y: textoY - alturaLinea * 2,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // COLUMNA DERECHA
  
  // Cantidad con etiqueta AI
  pagina.drawText('(37) CANTIDAD:', {
    x: textoXDerecha,
    y: textoY,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  pagina.drawText(cantidad.toString(), {
    x: textoXDerecha + 90,
    y: textoY,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Peso con etiqueta AI
  pagina.drawText('(3201) PESO:', {
    x: textoXDerecha,
    y: textoY - alturaLinea,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  pagina.drawText(`${peso} lb`, {
    x: textoXDerecha + 90,
    y: textoY - alturaLinea,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // SSCC con etiqueta AI - Mostrando el SSCC completo
  pagina.drawText('(00) SSCC:', {
    x: textoXIzquierda,
    y: textoY - alturaLinea * 4,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  pagina.drawText(sscc, {
    x: textoXIzquierda + 90,
    y: textoY - alturaLinea * 4,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Línea horizontal debajo de la sección media
  pagina.drawLine({
    start: { x: margen, y: altoEtiqueta - altoEncabezado - altoMedio },
    end: { x: anchoEtiqueta - margen, y: altoEtiqueta - altoEncabezado - altoMedio },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  
  // ---- SECCIÓN INFERIOR: CÓDIGOS DE BARRAS ----
  
  // 1. Código de barras GTIN + LOTE + FECHA
  const codigoBarras1Y = altoEtiqueta - altoEncabezado - altoMedio - 60;
  pagina.drawRectangle({
    x: margen,
    y: codigoBarras1Y - 25,
    width: anchoEtiqueta - (margen * 2),
    height: 35,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  pagina.drawText(`(01)${gtin}(10)${lote}(11)${fechaGS1}`, {
    x: margen + 20,
    y: codigoBarras1Y - 12,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // 2. Código de barras CANTIDAD + PESO
  const codigoBarras2Y = codigoBarras1Y - 80;
  pagina.drawRectangle({
    x: margen,
    y: codigoBarras2Y - 25,
    width: anchoEtiqueta - (margen * 2),
    height: 35,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  // Formatear peso con 1 decimal para GS1-3201
  const pesoFormateado = formatearPesoGS1(peso, 1);
  pagina.drawText(`(37)${cantidad.toString().padStart(6, '0')}(3201)${pesoFormateado}`, {
    x: margen + 20,
    y: codigoBarras2Y - 12,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // 3. Código de barras SSCC
  const codigoBarras3Y = codigoBarras2Y - 80;
  pagina.drawRectangle({
    x: margen,
    y: codigoBarras3Y - 25,
    width: anchoEtiqueta - (margen * 2),
    height: 35,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  
  pagina.drawText(`(00)${sscc}`, {
    x: margen + 20,
    y: codigoBarras3Y - 12,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });
  
  // Agregar ID de etiqueta y fecha de creación en la parte inferior
  pagina.drawText(`SSCC: ${sscc} | Creado: ${new Date().toLocaleString()}`, {
    x: margen,
    y: margen,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // Generar PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Genera un PDF y crea un enlace de descarga
 * @param {Object} datos - Datos para la etiqueta
 * @returns {Promise<string>} - URL del PDF generado
 */
export async function generarYDescargarEtiqueta(datos) {
  try {
    // Generar el PDF
    const pdfBytes = await generarEtiquetaLogistica(datos);
    
    // Crear un Blob con los bytes del PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Crear una URL para el Blob
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal y activar la descarga
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `etiqueta_gs1_${datos.gtin}_${datos.lote}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    
    // Limpiar
    document.body.removeChild(enlace);
    
    return url;
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    throw error;
  }
}