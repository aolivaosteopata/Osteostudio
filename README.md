# OsteoStudio 3

Gestionale snello per lo studio osteopatico, pensato per **iPad in orizzontale con Magic Keyboard**.
Funziona **offline** e tutti i dati restano nel database locale dell'iPad: nessun server, nessun account.

## Cosa fa

- **Pazienti**: ricerca rapida, anagrafica, anamnesi completa con red flags sempre in evidenza.
- **Cicli di trattamento**: motivo della consulenza e sintomi si inseriscono una volta per ciclo.
- **Sedute**: data, VAS 0–10 e un unico campo di note. A fianco trovi lo storico del ciclo e l'andamento del VAS.
- **Mappa corporea** per ogni seduta, vista anteriore e posteriore, da disegnare con Apple Pencil:
  - colori per dolore, tensione e zona trattata;
  - gomma e annulla.
- **Consenso informato**: il paziente firma con Apple Pencil e l'app genera il PDF.
  - Intestazione con nome, titolo e P.IVA.
  - Il testo si modifica in Impostazioni.
- **Cartella paziente in PDF** con anagrafica, anamnesi, cicli, sedute e mappe.
- **Pagamenti**: importo, metodo e pagato/da saldare per ogni seduta, totali mensili e annuali, elenco dei pagamenti in sospeso, esportazione CSV.
- **PIN** all'apertura e blocco automatico per inattività.
- **Backup cifrato** (AES-256) da salvare sull'SSD esterno, con promemoria periodico.

## Installazione sull'iPad

1. Pubblica il repository con **GitHub Pages**: Settings → Pages → *Deploy from a branch* → scegli il branch → cartella `/ (root)`.
2. Apri l'indirizzo della pagina con **Safari** sull'iPad.
3. Tocca **Condividi → Aggiungi alla schermata Home**.
4. Da qui in avanti apri l'app **sempre dall'icona** sulla Home, non da Safari: è lì che vive il database dei pazienti.

L'app funziona anche senza connessione. Quando la rete c'è, gli aggiornamenti si scaricano da soli e diventano attivi all'apertura successiva.

## Backup sull'SSD SanDisk

1. Collega l'SSD all'iPad tramite USB-C.
2. In OsteoStudio vai su **Impostazioni → Esegui backup** e scegli una password di almeno 8 caratteri.
3. Nel menu di condivisione scegli **Salva in File** e seleziona l'SSD.

Per ripristinare i dati usa **Impostazioni → Ripristina da backup**.
Conserva la password del backup: **senza di essa il file non si può aprire**.

## Scorciatoie da tastiera

| Tasti | Azione |
|---|---|
| ⌘K oppure / | Cerca un paziente (Invio apre il primo risultato) |
| ↑ ↓ | Scorre l'elenco dei pazienti |
| ⌥N | Nuovo paziente |
| ⌥S | Nuova seduta per il paziente aperto |
| ⌘↩ / Esc | Chiude la seduta (il salvataggio è automatico) |
| ⌥1 ⌥2 ⌥3 | Pazienti, Pagamenti, Impostazioni |
| ⌥L | Blocca l'app |

## Note importanti

- Il **testo del consenso** è una bozza impostata su:
  - L. 219/2017 (consenso informato);
  - L. 3/2018 (osteopatia come professione sanitaria);
  - artt. 9 e 13 del GDPR.

  Va fatto verificare da un consulente legale/privacy o dall'associazione di categoria prima dell'uso.
- Il **PIN** impedisce l'accesso all'app. Il database però è protetto davvero dal codice/Face ID dell'iPad, che va tenuto sempre attivo.
- Se dimentichi il PIN, l'unica strada è cancellare i dati e ripristinarli dal backup.

## Struttura

```
index.html          pagina dell'app
app.css             stile (chiaro/scuro automatico)
js/app.js           logica: database, schermate, PIN, backup
js/body.js          mappa corporea
js/pdf.js           generatore PDF interno (nessuna libreria esterna)
js/consent.js       testo predefinito del consenso
sw.js               uso offline
```
