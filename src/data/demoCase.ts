import { TabbedLegalReport } from '@/types/case';

export const DEMO_CASE_DATA: TabbedLegalReport = {
  executive_summary: {
    summary: "Hai ricevuto una multa per divieto di sosta di €41 nel centro storico di Roma. La violazione contestata riguarda l'art. 7 del Codice della Strada. Dalle circostanze descritte, emergono possibili vizi di forma nella notifica e potenziali elementi per presentare ricorso. Il termine per il pagamento in misura ridotta è di 5 giorni, mentre per il ricorso hai 60 giorni dalla notifica.",
    key_points: [
      "Importo sanzione: €41 (ridotta a €28,70 se pagata entro 5 giorni)",
      "Violazione: sosta in area con divieto permanente",
      "Termine ricorso: 60 giorni dalla notifica",
      "Autorità competente: Prefetto o Giudice di Pace"
    ]
  },
  qualificazione_giuridica: {
    description: "La violazione contestata rientra nell'ambito delle infrazioni al Codice della Strada, specificamente l'art. 7 comma 1 lett. a) e l'art. 158. Si tratta di una sanzione amministrativa pecuniaria che non comporta decurtazione di punti dalla patente. La competenza territoriale è del Comando di Polizia Locale che ha elevato la sanzione.",
    articles: [
      "Art. 7 CdS - Regolamentazione della circolazione nei centri abitati",
      "Art. 158 CdS - Divieto di fermata e di sosta dei veicoli",
      "Art. 201 CdS - Notificazione delle violazioni",
      "Art. 203 CdS - Pagamento in misura ridotta",
      "Art. 204-bis CdS - Ricorso al Prefetto"
    ]
  },
  fonti: {
    items: [
      {
        title: "Codice della Strada - D.Lgs. 285/1992",
        official_url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285",
        description: "Testo completo del Codice della Strada con tutti gli articoli rilevanti per le sanzioni"
      },
      {
        title: "Legge 689/1981 - Sanzioni amministrative",
        official_url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1981-11-24;689",
        description: "Disciplina generale delle sanzioni amministrative pecuniarie"
      },
      {
        title: "Circolare MIT 300/A/1/44133/101/3/3/9 del 2023",
        official_url: "https://www.mit.gov.it/normativa/circolare-protocollo-44133-del-25072023",
        description: "Chiarimenti su notifiche e termini per sanzioni CdS"
      }
    ]
  },
  opzioni: {
    rows: [
      {
        name: "Pagamento in misura ridotta",
        pro: "Chiusura immediata della pratica, sconto del 30% sull'importo",
        contro: "Rinuncia a ogni contestazione, ammissione implicita di colpa",
        tempi: "Entro 5 giorni dalla notifica",
        costi: "€28,70 (invece di €41)",
        esito: "Estinzione del procedimento"
      },
      {
        name: "Ricorso al Prefetto",
        pro: "Gratuito, non serve avvocato, procedura semplice",
        contro: "In caso di rigetto, importo raddoppiato",
        tempi: "60 giorni per presentare, decisione entro 210 giorni",
        costi: "Nessun costo iniziale",
        esito: "Annullamento o conferma con raddoppio"
      },
      {
        name: "Ricorso al Giudice di Pace",
        pro: "Giudizio più approfondito, possibilità di testimoni",
        contro: "Contributo unificato €43, tempi più lunghi",
        tempi: "60 giorni per presentare, udienza entro 6-12 mesi",
        costi: "€43 di contributo + eventuali spese legali",
        esito: "Sentenza di annullamento o conferma"
      },
      {
        name: "Pagamento ordinario",
        pro: "Più tempo per valutare (60 giorni)",
        contro: "Nessuno sconto, stesso importo del ricorso perso",
        tempi: "Entro 60 giorni",
        costi: "€41",
        esito: "Estinzione del procedimento"
      }
    ]
  },
  passi_operativi: {
    checklist: [
      { id: "1", text: "Verificare data e ora esatta della notifica del verbale", completed: false },
      { id: "2", text: "Calcolare scadenza 5 giorni per pagamento ridotto", completed: false },
      { id: "3", text: "Fotografare il luogo della presunta violazione", completed: false },
      { id: "4", text: "Raccogliere prove (scontrini, testimoni, foto del giorno)", completed: false },
      { id: "5", text: "Verificare presenza e visibilità della segnaletica", completed: false },
      { id: "6", text: "Controllare regolarità formale del verbale", completed: false },
      { id: "7", text: "Decidere strategia entro 5 giorni", completed: false },
      { id: "8", text: "Se ricorso: preparare memoria difensiva", completed: false },
      { id: "9", text: "Protocollare ricorso entro 60 giorni", completed: false }
    ]
  },
  termini: {
    deadlines: [
      {
        description: "Pagamento in misura ridotta (sconto 30%)",
        date: "5 giorni dalla notifica",
        type: "other"
      },
      {
        description: "Termine per ricorso al Prefetto o Giudice di Pace",
        date: "60 giorni dalla notifica",
        type: "decadenza"
      },
      {
        description: "Termine per pagamento ordinario",
        date: "60 giorni dalla notifica",
        type: "other"
      }
    ],
    prescription: "5 anni per la riscossione coattiva",
    decadenza: "90 giorni dalla violazione per la notifica (se non contestata immediatamente)"
  },
  allegati: {
    present: [
      "Verbale di contestazione originale",
      "Fotografie del luogo della sosta"
    ],
    missing: [
      "Documentazione fotografica della segnaletica",
      "Eventuale permesso di sosta se posseduto"
    ],
    nice_to_have: [
      "Testimonianze scritte di eventuali presenti",
      "Scontrini o prove della brevità della sosta",
      "Precedenti annullamenti per vizi simili"
    ]
  },
  disclaimer: "Questo è un esempio dimostrativo. Le informazioni fornite hanno scopo puramente illustrativo e non costituiscono consulenza legale. Per il tuo caso specifico, genera un'analisi personalizzata dopo la registrazione."
};