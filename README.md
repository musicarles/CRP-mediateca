CATÀLEG INTERACTIU DE RECURSOS AMB RESERVES
------------------------------------------------------------
Aplicació web amb Google Apps Script per gestionar préstecs
de materials dels CRPs de manera senzilla i centralitzada.
Permet implementar-ho de manera senzilla al Nodes del
Servei Educatiu.

------------------------------------------------------------
CARACTERÍSTIQUES PRINCIPALS
------------------------------------------------------------
- Catàleg dinàmic basat en dades d’un full de Google Sheets
- Filtrat per àmbit, etapa, tipus i nom
- Popup amb informació detallada i calendari de disponibilitat
- Formulari integrat per sol·licitar préstecs
- Comprovació automàtica de dates ja ocupades
- Registre automàtic de sol·licituds en un full de respostes
- Full de seguiment per al control de préstecs
- Notificació automàtica per correu electrònic
- Optimització amb ús de memòria cau

------------------------------------------------------------
CONFIGURACIÓ DEL PROJECTE
------------------------------------------------------------

Podeu descarregar el fitxer "plantilla - gestió mediateca.ods"
amb l'estructura i les fórmules creades.

1. CREAR ELS FULLS DE GOOGLE SHEETS
-----------------------------------
Cal crear tres fulls dins del mateix fitxer:

FULL 1: "Recursos"
-  A - ID (opcional)
-  B - Nom del recurs (obligatori i únic)
-  C - Descripció
-  D - Àmbit (valors separats per comes)
-  E - Etapa (valors separats per comes)
-  F - Contingut del recurs
-  G - URL de la imatge
-  H - Enllaç d’interès
-  I - Tipus de recurs

FULL 2: "Respostes al formulari 1"
-  A - Marca de temps (automàtic)
-  B - Nom i cognoms del responsable
-  C - Correu electrònic
-  D - Centre educatiu
-  E - Municipi
-  F - Material sol·licitat
-  G - (buit)
-  H - Data inici préstec (DD/MM/AAAA)
-  I - Data final préstec (DD/MM/AAAA)
-  J - Nombre d’alumnes
-  K - Altres observacions

FULL 3: "Seguiment"
-  A - Persona de contacte
-  B - Correu electrònic
-  C - Préstec
-  D - (buit o ús intern)
-  E - S’ha escrit correu?
-  F - Data inici
-  G - L’ha vingut a buscar?
-  H - L’ha tornat?
-  I - Data retorn
-  J - Observacions

Si canvies els noms dels fulls, cal modificar-los també al fitxer Codi.gs.

------------------------------------------------------------
2. CREAR EL PROJECTE A GOOGLE APPS SCRIPT
------------------------------------------------------------

- Obre Extensions → Apps Script des del teu full de càlcul.
- Esborra el fitxer "Código.gs" que apareix per defecte.
- Copia i enganxa el contingut del fitxer "Codi.gs" del repositori.
- Modifica el correu electrònic on vols rebre notificacions
  dins la funció addReservation:

  const recipientEmail = "EL_TEU_EMAIL_AQUI";

- Afegeix un nou fitxer HTML anomenat "Client"
  i enganxa-hi el contingut del fitxer "Client.html".
- Desa tots els canvis.

------------------------------------------------------------
3. IMPLEMENTAR L’APLICACIÓ WEB
------------------------------------------------------------

- Clica "Implementa" → "Nova implementació".
- Selecciona "Aplicació web" com a tipus.
- Executa com a: "Jo (el teu email)".
- Accés: "Qualsevol usuari".
- Copia l’URL resultant i incrusta’l a la teva web, per exemple:

  <iframe src="URL_DE_LA_TEVA_APLICACIO_WEB"
          width="100%" height="800px" style="border:none;"></iframe>

Quan facis canvis al fitxer Codi.gs, cal fer una nova implementació.
Si només canvies Client.html, n’hi ha prou amb refrescar la pàgina.

------------------------------------------------------------
4. AUTORITZAR PERMISOS
------------------------------------------------------------

La primera vegada que l’executis, Google et demanarà autorització
per accedir als fulls i enviar correus.

Si apareix l’avís "Aplicació no verificada":
- Ves a "Configuració avançada"
- Prem "Ves a [Nom del projecte] (no segur)"
- Revisa els permisos i fes clic a "Permet"

------------------------------------------------------------
PERSONALITZACIÓ
------------------------------------------------------------

- Correu de notificació: dins de la funció addReservation
- Noms de fulls: "Recursos", "Respostes al formulari 1", "Seguiment"
- Estructura de columnes: si canvies columnes, revisa els índexs
  dins de Codi.gs i Client.html

------------------------------------------------------------
TECNOLOGIA UTILITZADA
------------------------------------------------------------

- Google Apps Script (JavaScript)
- Google Sheets
- HTML / CSS / JavaScript (frontend)
- Pikaday.js (calendari)

------------------------------------------------------------
ATRIBUCIONS
------------------------------------------------------------

- Pikaday.js — Autor: David Bushell
  Llicència: BSD i MIT
  https://github.com/Pikaday/Pikaday

------------------------------------------------------------
CONTRIBUCIONS
------------------------------------------------------------

Les contribucions són benvingudes.
Si detectes errors o vols millorar el projecte, obre una Issue
al repositori de GitHub.

------------------------------------------------------------
Llicència
------------------------------------------------------------

Aquest projecte està sota la Llicència MIT.
Pots utilitzar-lo, modificar-lo i redistribuir-lo mantenint-ne l’atribució.

------------------------------------------------------------
CRÈDITS
------------------------------------------------------------

Desenvolupament principal: Carles Ceacero (CRP Granollers - SE VOI)
Assistència IA: Gemini (Google)

------------------------------------------------------------
CONTACTE
------------------------------------------------------------

Per a dubtes o problemes, obre una Issue al repositori
o contacta amb l’autor.
