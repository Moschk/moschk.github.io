# Potrebbe essere meglio, ma qualcosa e' meglio di niente.

---

Vibe codato tutto come una bestia con bava alla bocca.

---

## Elenco sommario delle funzionalita'

1 - Il sito si aggiorna manualmente, caricando il file *vie_t.csv*;
poi si lancia il workflow che tramuta il file *vie_t.csv* in *vie.csv* completato delle informazioni di Latitudine e Longitudine se mancanti, cercando in Openstreet map con il nome (Nazione Italy messa in join nella query). Ovviamente puo' capitare che sbagli.
Il file *vie.csv* viene letto da riga 7 in poi (circa) per usare ogni riga come sorgente per la creazione dei punti sulla mappa.

2 - C'e' un bottone per refreshare manualmente la pagina in modo che non si basi sui cookies. Un secondo bottone a fine pagina permette di vedere il log.

3 - Ci sono dei filtri sulla colonna della difficolta' interna (colonna CN). 

4 - Le icone dei marker sono state messe personalizzate perche' si. Sono calcolate in base al grado CN.
