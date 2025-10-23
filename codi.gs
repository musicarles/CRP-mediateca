/**
 * Funció principal que SEMPRE mostra la vista de client.
 * MODIFICADA per permetre la incrustació en iframes.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Client')
      .setTitle('Catàleg de Recursos')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // <-- Permet iframes
}

/**
 * FUNCIÓ OPTIMITZADA AMB CACHE: Obté recursos (A-I)
 * i els valors únics individuals d'àmbits, etapes i tipus de recurs.
 * @returns {object} Un objecte amb les claus: resources, ambits, etapes, tipusRecursos.
 */
function getCatalogData() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'catalogData_v6_simple_images'; 
  const expirationTimeSeconds = 300; // 5 minuts

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log("getCatalogData: Dades trobades a la memòria cau.");
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Error parsejant dades de la cache:", e);
      cache.remove(cacheKey); 
    }
  }

  console.log("getCatalogData: Dades NO trobades a la cache. Llegint del full...");
  let output = {
    resources: [],
    ambits: [],
    etapes: [],
    tipusRecursos: []
  };
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Recursos");
    if (!sheet || sheet.getLastRow() < 2) {
      console.warn("Full 'Recursos' buit o no trobat.");
      cache.put(cacheKey, JSON.stringify(output), expirationTimeSeconds);
      return output;
    }

    // Llegim 9 columnes (A fins I)
    output.resources = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();

    // Funció auxiliar per processar valors múltiples (separats per coma)
    const getUniqueIndividualValues = (columnIndex) => {
      const values = sheet.getRange(2, columnIndex, sheet.getLastRow() - 1, 1).getValues();
      const allIndividualValues = [];
      values.flat().forEach(cellValue => {
        if (cellValue && typeof cellValue === 'string') {
          const parts = cellValue.split(',').map(part => part.trim()).filter(part => part !== "");
          allIndividualValues.push(...parts);
        } else if (cellValue) {
           allIndividualValues.push(String(cellValue));
        }
      });
      return [...new Set(allIndividualValues)].sort();
    };

    output.ambits = getUniqueIndividualValues(4); // Col D
    output.etapes = getUniqueIndividualValues(5); // Col E
    output.tipusRecursos = getUniqueIndividualValues(9); // Col I

    if (output.resources.length > 0) {
        cache.put(cacheKey, JSON.stringify(output), expirationTimeSeconds);
        console.log("getCatalogData: Dades llegides del full i guardades a la cache.");
    } else {
        console.log("getCatalogData: No s'han llegit recursos.");
    }
    return output;

  } catch (e) {
    console.error("Error crític en getCatalogData: " + e.toString());
    return output;
  }
}


/**
 * === FUNCIÓ PER A LES RESERVES ===
 * Obté totes les reserves del full "Respostes al formulari 1"
 * @returns {object} Ex: { "Recurs A": [{start: "2025-10-20", end: "2025-10-22"}], ... }
 */
function getReservationData() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'reservationData_v2_cols_FHI';
  const expirationTimeSeconds = 300; // 5 minuts

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log("getReservationData: Dades de reserves trobades a la memòria cau.");
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.error("Error parsejant dades de reserves de la cache:", e);
      cache.remove(cacheKey);
    }
  }

  console.log("getReservationData: Dades de reserves NO trobades. Llegint del full...");
  
  let reservations = {};

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari 1");
    if (!sheet || sheet.getLastRow() < 2) {
      console.warn("Full 'Respostes al formulari 1' buit o no trobat.");
      return reservations;
    }
    
    // Llegim F, G, H, I (4 columnes)
    const dataRange = sheet.getRange(2, 6, sheet.getLastRow() - 1, 4); 
    const values = dataRange.getValues();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const resourceName = row[0]; // Col F 
      const startDate = row[2]; // Col H
      const endDate = row[3]; // Col I 

      if (resourceName && startDate && endDate && 
          startDate instanceof Date && endDate instanceof Date) {
        
        // Formatem YYYY-MM-DD per a ús intern (calendari, comprovació)
        const formattedStart = Utilities.formatDate(startDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        const formattedEnd = Utilities.formatDate(endDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

        if (!reservations[resourceName]) {
          reservations[resourceName] = [];
        }

        reservations[resourceName].push({
          start: formattedStart,
          end: formattedEnd
        });
      }
    }

    cache.put(cacheKey, JSON.stringify(reservations), expirationTimeSeconds);
    console.log("getReservationData: Dades de reserves llegides i guardades a la cache.");
    return reservations;

  } catch (e) {
    console.error("Error crític a getReservationData: " + e.toString());
    return reservations; 
  }
}

/**
 * === FUNCIÓ AFEGIR RESERVA (AMB CHECK CONFLICTE + NOTIFICACIÓ EMAIL) ===
 * @param {object} formData Dades del formulari.
 * @param {string} resourceName Nom del recurs reservat.
 * @returns {boolean|string} True si èxit, false si error, "CONFLICT" si dates ocupades.
 */
function addReservation(formData, resourceName) {
  const recipientEmail = "a8930013@xtec.cat"; // Email per a notificacions

  try {
    // --- PAS 1: Comprovar Conflictes ---
    const allReservations = getReservationData(); // Obtenir reserves actuals (des de cache o full)
    const existingBookingsForResource = allReservations[resourceName] || [];
    
    const requestedStartDate = new Date(formData.startDate + "T00:00:00"); // Assegura inici del dia
    const requestedEndDate = new Date(formData.endDate + "T23:59:59"); // Assegura final del dia
    
    // Comprovem dates invàlides primer
    if (isNaN(requestedStartDate.getTime()) || isNaN(requestedEndDate.getTime())) {
        console.error("Dates invàlides rebudes per a comprovació:", formData.startDate, formData.endDate);
        return false; 
    }
    if (requestedEndDate < requestedStartDate) {
         console.warn("Data final anterior a la d'inici detectada abans de la comprovació.");
         // Encara que el client ho valida, fem una comprovació extra
         return false; 
    }

    const requestedStartTime = requestedStartDate.getTime();
    const requestedEndTime = requestedEndDate.getTime();

    for (const existingBooking of existingBookingsForResource) {
      // Les dates existents ja estan en YYYY-MM-DD
      const existingStartDate = new Date(existingBooking.start + "T00:00:00");
      const existingEndDate = new Date(existingBooking.end + "T23:59:59");

      if (isNaN(existingStartDate.getTime()) || isNaN(existingEndDate.getTime())) {
         console.warn("Saltant reserva existent amb data invàlida:", existingBooking);
         continue; // Salta aquesta reserva invàlida
      }
      
      const existingStartTime = existingStartDate.getTime();
      const existingEndTime = existingEndDate.getTime();

      // Comprovació d'Overlap: (StartA <= EndB) and (EndA >= StartB)
      if (requestedStartTime <= existingEndTime && requestedEndTime >= existingStartTime) {
        console.log("CONFLICTE DETECTAT:", formData, "vs", existingBooking);
        return "CONFLICT"; // Hi ha conflicte, retorna "CONFLICT"
      }
    }
    // --- Fi Comprovació Conflictes ---

    // --- PAS 2: Afegir la reserva si no hi ha conflicte ---
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostes al formulari 1");
    if (!sheet) {
      console.error("No s'ha trobat el full 'Respostes al formulari 1'.");
      return false;
    }

    const timestamp = new Date();
    // Re-creem les dates per formatar a DD/MM/AAAA
    const startDateForSheet = new Date(formData.startDate); 
    const endDateForSheet = new Date(formData.endDate);
    
    const formattedStartDate = Utilities.formatDate(startDateForSheet, Session.getScriptTimeZone(), "dd/MM/yyyy");
    const formattedEndDate = Utilities.formatDate(endDateForSheet, Session.getScriptTimeZone(), "dd/MM/yyyy");

    const newRow = [
      timestamp, formData.name, formData.email, formData.school, formData.municipality,
      resourceName, '', formattedStartDate, formattedEndDate, formData.students, formData.observations
    ];

    sheet.appendRow(newRow);
    
    // --- PAS 3: Enviar Email de Notificació ---
    try {
      const subject = `Nova sol·licitud de préstec: ${resourceName}`;
      let body = `Hem rebut una nova sol·licitud de préstec amb la següent informació:\n\n`;
      body += `Material sol·licitat: ${resourceName}\n`;
      body += `Nom de la persona que fa la demanda: ${formData.name}\n`;
      body += `Adreça de contacte: ${formData.email}\n`;
      body += `Centre educatiu: ${formData.school}\n`;
      body += `Municipi: ${formData.municipality}\n`;
      body += `Data d'inici del préstec: ${formattedStartDate}\n`; // Data formatada
      body += `Data final del préstec: ${formattedEndDate}\n`; // Data formatada
      body += `Nombre d'alumnes que en faran ús: ${formData.students || 'No especificat'}\n`;
      body += `Observacions: ${formData.observations || 'Cap'}\n\n`;
      
      MailApp.sendEmail(recipientEmail, subject, body);
      console.log("Email de notificació enviat a:", recipientEmail);
      
    } catch (emailError) {
      console.error("Error en enviar l'email de notificació: " + emailError.toString());
      // No retornem false aquí, la reserva s'ha guardat igualment
    }

    // --- PAS 4: Netejar Cache i Retornar Èxit ---
    CacheService.getScriptCache().remove('reservationData_v2_cols_FHI'); 
    console.log("Reserva afegida correctament per a:", resourceName);
    return true; 

  } catch (e) {
    console.error("Error crític a addReservation: " + e.toString());
    return false; 
  }
}