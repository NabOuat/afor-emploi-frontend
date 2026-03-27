/**
 * Dashboard Export Utilities — AFOR Emploi
 * ─────────────────────────────────────────
 * Excel  : xlsx-js-style  (SheetJS + cell styling, browser-compatible)
 * PowerPoint : pptxgenjs
 */

import XLSXStyle from 'xlsx-js-style';
import pptxgen from 'pptxgenjs';

// ─── Theme ──────────────────────────────────────────────────────────────────
const C = {
  navy:    '1F2D3D',
  orange:  'FF8C00',
  green:   '27AE60',
  red:     'E74C3C',
  blue:    '3498DB',
  purple:  '9B59B6',
  yellow:  'F39C12',
  light:   'F4F6F9',
  white:   'FFFFFF',
  gray1:   'F8FAFC',  // even row bg
  gray2:   'EDF2F7',  // sub-header bg
  gray3:   'CBD5E0',  // border
  darkText:'2D3748',
  mutedText:'718096',
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ExportEmployee {
  nom: string; prenom: string; matricule: string;
  poste: string; type_contrat: string;
  date_debut: string | null; date_fin: string | null;
  validiteContrat: string; region: string;
  acteur_nom: string; type_acteur: string;
  genre: string; age: number; diplome: string;
  projets: { nom: string }[];
}

export interface DashboardExportData {
  filterLabel: string;
  stats: {
    total: number; cdi: number; cdd: number; consultant: number;
    hommes: number; femmes: number; tauxFem: number;
    ageMin: number; ageMax: number; ageMoyen: number;
    actifs: number; expires: number;
    tauxRenouvellement: number; ratioPermanentTemp: string; dureeMoy: number;
  };
  contratsEcheance: { dans3mois: number; dans6mois: number; dans12mois: number };
  regions:   { label: string; effectif: number; pct: number }[];
  ages:      { tranche: string; nombre: number; pct: number }[];
  embauches: { mois: string; nombre: number }[];
  education: { diplome: string; nombre: number; pct: number }[];
  contrats:  { type: string; nombre: number; pct: number }[];
  employees: ExportEmployee[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const todayFR = () => new Date().toLocaleDateString('fr-FR');
const dateSlug = () => new Date().toISOString().slice(0, 10);
const pctOf = (n: number, total: number) => total ? `${Math.round(n * 100 / total)}%` : '0%';

function dlBlob(buf: ArrayBuffer | Uint8Array, mime: string, name: string) {
  const b   = new Blob([buf], { type: mime });
  const url = URL.createObjectURL(b);
  const a   = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// ─── xlsx-js-style cell constructors ─────────────────────────────────────────
type CellStyle = XLSXStyle.CellStyle;

const border = (color = C.gray3): CellStyle['border'] => ({
  top:    { style: 'thin', color: { rgb: color } },
  bottom: { style: 'thin', color: { rgb: color } },
  left:   { style: 'thin', color: { rgb: color } },
  right:  { style: 'thin', color: { rgb: color } },
});

// Styled cell builder
function c(
  v: string | number,
  style: Partial<CellStyle> = {},
): XLSXStyle.Cell {
  const t = typeof v === 'number' ? 'n' : 's';
  return { v, t, s: style } as XLSXStyle.Cell;
}

// Style presets
const S = {
  // ── Title row (very large, full-width) ──────────────────────────────────
  title: (): CellStyle => ({
    font: { bold: true, sz: 16, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
  }),

  // ── Sub-title row (orange bar) ───────────────────────────────────────────
  subtitle: (): CellStyle => ({
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.orange } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
    border: border(C.orange),
  }),

  // ── Column header ────────────────────────────────────────────────────────
  header: (bg = C.navy): CellStyle => ({
    font: { bold: true, sz: 10, color: { rgb: C.white } },
    fill: { fgColor: { rgb: bg } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: border('000000'),
  }),

  // ── Even row ─────────────────────────────────────────────────────────────
  even: (align: 'left'|'center'|'right' = 'center'): CellStyle => ({
    font: { sz: 10, color: { rgb: C.darkText } },
    fill: { fgColor: { rgb: C.gray1 } },
    alignment: { horizontal: align, vertical: 'center' },
    border: border(),
  }),

  // ── Odd row ──────────────────────────────────────────────────────────────
  odd: (align: 'left'|'center'|'right' = 'center'): CellStyle => ({
    font: { sz: 10, color: { rgb: C.darkText } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: align, vertical: 'center' },
    border: border(),
  }),

  // ── Highlight number (KPI value) ──────────────────────────────────────────
  kpiVal: (color = C.orange): CellStyle => ({
    font: { bold: true, sz: 14, color: { rgb: color } },
    fill: { fgColor: { rgb: C.gray1 } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: border(color),
  }),

  // ── Label for KPI ────────────────────────────────────────────────────────
  kpiLabel: (): CellStyle => ({
    font: { sz: 10, color: { rgb: C.mutedText } },
    fill: { fgColor: { rgb: C.gray1 } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
    border: border(),
  }),

  // ── Section separator ────────────────────────────────────────────────────
  separator: (): CellStyle => ({
    font: { bold: true, sz: 10, color: { rgb: C.navy } },
    fill: { fgColor: { rgb: C.gray2 } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
    border: border(C.gray3),
  }),

  // ── Alert: danger ────────────────────────────────────────────────────────
  danger: (): CellStyle => ({
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.red } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: border(C.red),
  }),
  warning: (): CellStyle => ({
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.yellow } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: border(C.yellow),
  }),
  info: (): CellStyle => ({
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.blue } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: border(C.blue),
  }),
};

// ─── Sheet builder helper ────────────────────────────────────────────────────
function buildSheet(
  rows: XLSXStyle.Cell[][],
  colWidths: number[],
  rowHeights?: number[],
): XLSXStyle.WorkSheet {
  const ws: XLSXStyle.WorkSheet = {};
  let maxRow = 0; let maxCol = 0;

  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (cell === null || cell === undefined) return;
      const addr = XLSXStyle.utils.encode_cell({ r: ri, c: ci });
      ws[addr] = cell;
      if (ri > maxRow) maxRow = ri;
      if (ci > maxCol) maxCol = ci;
    });
  });

  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  if (rowHeights) ws['!rows'] = rowHeights.map(h => ({ hpt: h }));
  return ws;
}

// Merge helper — returns range string like "A1:E1"
function mr(r: number, c1: number, c2: number): XLSXStyle.Range {
  return { s: { r, c: c1 }, e: { r, c: c2 } };
}

// Empty styled cell (for merged cells padding)
const EMPTY = (bg = C.white): XLSXStyle.Cell => ({ v: '', t: 's', s: { fill: { fgColor: { rgb: bg } } } } as XLSXStyle.Cell);

// ─── Employee table rows (reusable) ──────────────────────────────────────────
const EMP_HEADERS = [
  'Matricule', 'Nom', 'Prénom', 'Poste', 'Type Contrat',
  'Statut', 'Région', 'Acteur', 'Type', 'Genre', 'Âge', 'Diplôme', 'Projets', 'Début', 'Fin',
];
const EMP_WIDTHS = [12, 18, 16, 22, 14, 12, 20, 24, 8, 8, 7, 24, 28, 12, 12];

function empHeaderRow(): XLSXStyle.Cell[] {
  return EMP_HEADERS.map(h => c(h, S.header(C.navy)));
}

function empDataRow(e: ExportEmployee, ri: number): XLSXStyle.Cell[] {
  const a = ri % 2 === 0 ? S.even : S.odd;
  return [
    c(e.matricule || '—', a('center')),
    c(`${e.nom} ${e.prenom}`, a('left')),
    c(e.prenom, a('left')),
    c(e.poste, a('left')),
    c(e.type_contrat, a('center')),
    c(e.validiteContrat, a('center')),
    c(e.region, a('left')),
    c(e.acteur_nom, a('left')),
    c(e.type_acteur, a('center')),
    c(e.genre === 'M' ? 'Homme' : 'Femme', a('center')),
    c(e.age || 0, a('center')),
    c(e.diplome || '—', a('left')),
    c(e.projets.map(p => p.nom).join(', ') || '—', a('left')),
    c(e.date_debut ?? '—', a('center')),
    c(e.date_fin   ?? '—', a('center')),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  FULL EXCEL EXPORT (multi-sheet, all stats + employee list)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportToExcel(data: DashboardExportData): Promise<void> {
  const wb = XLSXStyle.utils.book_new();
  const { stats: s, contratsEcheance: ce, filterLabel, employees: emps } = data;
  const date = todayFR();

  // ── Sheet 1 : Couverture ────────────────────────────────────────────────
  {
    const ncols = 3;
    const rows: XLSXStyle.Cell[][] = [
      // Title
      [c('DASHBOARD RH — VUE RESPONSABLE', S.title()), EMPTY(C.navy), EMPTY(C.navy)],
      [c('Système AFOR Emploi', { font: { sz: 11, color: { rgb: C.orange }, bold: true }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), EMPTY(C.navy), EMPTY(C.navy)],
      [c(`Rapport généré le ${date}`, { font: { sz: 10, color: { rgb: 'A0AABA' } }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), EMPTY(C.navy), EMPTY(C.navy)],
      [c(`Filtres : ${filterLabel}`, { font: { sz: 10, italic: true, color: { rgb: '8A98B0' } }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), EMPTY(C.navy), EMPTY(C.navy)],
      [EMPTY(C.navy), EMPTY(C.navy), EMPTY(C.navy)],
      // KPI block header
      [c('INDICATEURS CLÉS', S.subtitle()), EMPTY(C.orange), EMPTY(C.orange)],
      // KPI rows
      [c('Indicateur', S.header()), c('Valeur', S.header()), c('Détail', S.header())],
      [c('Effectif Total',       S.kpiLabel()), c(s.total,                 S.kpiVal(C.orange)), c('Tous acteurs OF+AF', S.even('left'))],
      [c('Contrats Actifs',      S.kpiLabel()), c(s.actifs,                S.kpiVal(C.green)),  c('En cours',          S.even('left'))],
      [c('Contrats Expirés',     S.kpiLabel()), c(s.expires,               S.kpiVal(C.red)),    c('',                  S.even('left'))],
      [c('Taux d\'Activation',   S.kpiLabel()), c(pctOf(s.actifs, s.total),S.kpiVal(C.blue)),   c('',                  S.even('left'))],
      [EMPTY(), EMPTY(), EMPTY()],
      [c('GENRE', S.separator()), EMPTY(), EMPTY()],
      [c('Indicateur', S.header()), c('Nombre', S.header()), c('%', S.header())],
      [c('Hommes',   S.kpiLabel()), c(s.hommes, S.kpiVal(C.blue)),   c(pctOf(s.hommes, s.total), S.even())],
      [c('Femmes',   S.kpiLabel()), c(s.femmes, S.kpiVal(C.red)),    c(pctOf(s.femmes, s.total), S.even())],
      [c('Taux Féminisation', S.kpiLabel()), c(`${s.tauxFem}%`, S.kpiVal(C.blue)), c('', S.even())],
      [EMPTY(), EMPTY(), EMPTY()],
      [c('ÂGES', S.separator()), EMPTY(), EMPTY()],
      [c('Âge Moyen',  S.kpiLabel()), c(`${s.ageMoyen} ans`, S.kpiVal(C.purple)), c('', S.even('left'))],
      [c('Âge Min',    S.kpiLabel()), c(`${s.ageMin} ans`,   S.kpiVal(C.mutedText)), c('', S.even('left'))],
      [c('Âge Max',    S.kpiLabel()), c(`${s.ageMax} ans`,   S.kpiVal(C.mutedText)), c('', S.even('left'))],
      [EMPTY(), EMPTY(), EMPTY()],
      [c('CONTRATS', S.separator()), EMPTY(), EMPTY()],
      [c('Indicateur', S.header()), c('Nombre', S.header()), c('%', S.header())],
      [c('CDI',                         S.kpiLabel()), c(s.cdi,        S.kpiVal(C.green)),  c(pctOf(s.cdi, s.total),        S.even())],
      [c('CDD',                         S.kpiLabel()), c(s.cdd,        S.kpiVal(C.blue)),   c(pctOf(s.cdd, s.total),        S.even())],
      [c('Consultant',                  S.kpiLabel()), c(s.consultant, S.kpiVal(C.purple)), c(pctOf(s.consultant, s.total), S.even())],
      [c('Taux Renouvellement',         S.kpiLabel()), c(`${s.tauxRenouvellement}%`, S.kpiVal(C.yellow)), c('', S.even())],
      [c('Ratio Permanent/Temporaire',  S.kpiLabel()), c(s.ratioPermanentTemp, S.kpiVal(C.navy)), c('', S.even())],
      [c('Durée Moy. Contrats',         S.kpiLabel()), c(`${s.dureeMoy} mois`,  S.kpiVal(C.navy)), c('', S.even())],
      [EMPTY(), EMPTY(), EMPTY()],
      [c('ALERTES ÉCHÉANCES', S.separator()), EMPTY(), EMPTY()],
      [c('Contrats expirant < 3 mois',  S.kpiLabel()), c(ce.dans3mois,  S.danger()),  c('CRITIQUE',     S.even('left'))],
      [c('Contrats expirant < 6 mois',  S.kpiLabel()), c(ce.dans6mois,  S.warning()), c('ATTENTION',    S.even('left'))],
      [c('Contrats expirant < 12 mois', S.kpiLabel()), c(ce.dans12mois, S.info()),    c('À surveiller', S.even('left'))],
    ];

    const ws = buildSheet(rows, [34, 18, 22], rows.map((_, i) => i < 5 ? 22 : 18));
    ws['!merges'] = [mr(0,0,2), mr(1,0,2), mr(2,0,2), mr(3,0,2), mr(4,0,2), mr(5,0,2), mr(11,0,2), mr(12,0,2), mr(17,0,2), mr(18,0,2), mr(22,0,2), mr(23,0,2), mr(31,0,2), mr(32,0,2)];
    ws['!freeze'] = { xSplit: 0, ySplit: 6 };
    XLSXStyle.utils.book_append_sheet(wb, ws, '📊 Vue Générale');
  }

  // ── Sheet 2 : Effectif par Région ───────────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c('EFFECTIF PAR RÉGION', S.subtitle()), EMPTY(C.orange), EMPTY(C.orange), EMPTY(C.orange)],
      [c('Région', S.header()), c('Effectif', S.header()), c('% du Total', S.header()), c('Visuel', S.header())],
      ...data.regions.map((r, i) => {
        const a = i % 2 === 0 ? S.even : S.odd;
        const bar = '█'.repeat(Math.max(1, Math.round(r.pct / 5)));
        return [c(r.label, a('left')), c(r.effectif, a('center')), c(`${r.pct}%`, a('center')), c(bar, { ...a('left'), font: { sz: 8, color: { rgb: C.orange } } })];
      }),
    ];
    const ws = buildSheet(rows, [26, 12, 14, 20]);
    ws['!merges'] = [mr(0,0,3)];
    ws['!freeze'] = { xSplit: 0, ySplit: 2 };
    ws['!autofilter'] = { ref: `A2:C${rows.length}` };
    XLSXStyle.utils.book_append_sheet(wb, ws, '🗺️ Régions');
  }

  // ── Sheet 3 : Genre ─────────────────────────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c('RÉPARTITION PAR GENRE', S.subtitle()), EMPTY(C.orange), EMPTY(C.orange)],
      [c('Genre', S.header()), c('Nombre', S.header()), c('% du Total', S.header())],
      [c('Hommes', { ...S.even('left'), font: { bold: true, color: { rgb: C.blue }, sz: 10 } }), c(s.hommes, { ...S.even(), font: { bold: true, color: { rgb: C.blue }, sz: 11 } }), c(pctOf(s.hommes, s.total), S.even())],
      [c('Femmes', { ...S.odd('left'),  font: { bold: true, color: { rgb: C.red },  sz: 10 } }), c(s.femmes, { ...S.odd(),  font: { bold: true, color: { rgb: C.red },  sz: 11 } }), c(pctOf(s.femmes, s.total), S.odd())],
      [EMPTY(), EMPTY(), EMPTY()],
      [c(`Taux de Féminisation : ${s.tauxFem}%`, { font: { bold: true, sz: 12, color: { rgb: C.navy } }, alignment: { horizontal: 'center' } }), EMPTY(), EMPTY()],
    ];
    const ws = buildSheet(rows, [22, 14, 16]);
    ws['!merges'] = [mr(0,0,2), mr(5,0,2)];
    XLSXStyle.utils.book_append_sheet(wb, ws, '👥 Genre');
  }

  // ── Sheet 4 : Pyramide des Âges ─────────────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c('PYRAMIDE DES ÂGES', S.subtitle()), EMPTY(C.orange), EMPTY(C.orange), EMPTY(C.orange)],
      [c('Tranche', S.header()), c('Nombre', S.header()), c('% du Total', S.header()), c('Visuel', S.header())],
      ...data.ages.map((a, i) => {
        const st = i % 2 === 0 ? S.even : S.odd;
        const bar = '▓'.repeat(Math.max(1, Math.round(a.pct / 3)));
        return [c(a.tranche, st('left')), c(a.nombre, st('center')), c(`${a.pct}%`, st('center')), c(bar, { ...st('left'), font: { sz: 8, color: { rgb: C.purple } } })];
      }),
    ];
    const ws = buildSheet(rows, [14, 12, 14, 22]);
    ws['!merges'] = [mr(0,0,3)];
    ws['!freeze'] = { xSplit: 0, ySplit: 2 };
    XLSXStyle.utils.book_append_sheet(wb, ws, '📐 Pyramide Âges');
  }

  // ── Sheet 5 : Types de Contrats ─────────────────────────────────────────
  {
    const contractColors: Record<string, string> = { CDI: C.green, CDD: C.blue, Consultant: C.purple };
    const rows: XLSXStyle.Cell[][] = [
      [c('TYPES DE CONTRATS', S.subtitle()), EMPTY(C.orange), EMPTY(C.orange)],
      [c('Type de Contrat', S.header()), c('Nombre', S.header()), c('% du Total', S.header())],
      ...data.contrats.map((ct, i) => {
        const clr = contractColors[ct.type] || C.navy;
        const a = i % 2 === 0 ? S.even : S.odd;
        return [
          c(ct.type, { ...a('left'), font: { bold: true, sz: 10, color: { rgb: clr } } }),
          c(ct.nombre, { ...a(), font: { bold: true, sz: 11, color: { rgb: clr } } }),
          c(`${ct.pct}%`, a()),
        ];
      }),
    ];
    const ws = buildSheet(rows, [22, 14, 16]);
    ws['!merges'] = [mr(0,0,2)];
    XLSXStyle.utils.book_append_sheet(wb, ws, '📋 Types Contrats');
  }

  // ── Sheet 6 : Embauches Mensuelles ──────────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c('EMBAUCHES MENSUELLES (12 DERNIERS MOIS)', S.subtitle()), EMPTY(C.orange)],
      [c('Mois', S.header()), c("Nombre d'Embauches", S.header())],
      ...data.embauches.map((e, i) => {
        const a = i % 2 === 0 ? S.even : S.odd;
        return [c(e.mois, a('left')), c(e.nombre, { ...a(), font: { bold: e.nombre > 0, sz: 10, color: { rgb: e.nombre > 0 ? C.green : C.mutedText } } })];
      }),
    ];
    const ws = buildSheet(rows, [18, 22]);
    ws['!merges'] = [mr(0,0,1)];
    ws['!freeze'] = { xSplit: 0, ySplit: 2 };
    XLSXStyle.utils.book_append_sheet(wb, ws, '📅 Embauches');
  }

  // ── Sheet 7 : Niveau d'Éducation ────────────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c("NIVEAU D'ÉDUCATION", S.subtitle()), EMPTY(C.orange), EMPTY(C.orange), EMPTY(C.orange)],
      [c('Diplôme / Niveau', S.header()), c('Nombre', S.header()), c('% du Total', S.header()), c('Visuel', S.header())],
      ...data.education.map((e, i) => {
        const a = i % 2 === 0 ? S.even : S.odd;
        const bar = '◆'.repeat(Math.max(1, Math.round(e.pct / 4)));
        return [c(e.diplome, a('left')), c(e.nombre, a('center')), c(`${e.pct}%`, a('center')), c(bar, { ...a('left'), font: { sz: 8, color: { rgb: C.purple } } })];
      }),
    ];
    const ws = buildSheet(rows, [34, 12, 14, 20]);
    ws['!merges'] = [mr(0,0,3)];
    ws['!freeze'] = { xSplit: 0, ySplit: 2 };
    ws['!autofilter'] = { ref: `A2:C${rows.length}` };
    XLSXStyle.utils.book_append_sheet(wb, ws, '🎓 Éducation');
  }

  // ── Sheet 8 : Alertes Contrats ──────────────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c('ALERTES — CONTRATS ARRIVANT À ÉCHÉANCE', S.subtitle()), EMPTY(C.orange), EMPTY(C.orange)],
      [c('Échéance', S.header()), c('Nombre de Contrats', S.header()), c('Niveau d\'Urgence', S.header())],
      [c('Dans moins de 3 mois',  S.kpiLabel()), c(ce.dans3mois,  S.danger()),  c('CRITIQUE — Action immédiate',    S.even('left'))],
      [c('Dans 3 à 6 mois',       S.kpiLabel()), c(ce.dans6mois,  S.warning()), c('ATTENTION — Planifier',          S.odd('left'))],
      [c('Dans 6 à 12 mois',      S.kpiLabel()), c(ce.dans12mois, S.info()),    c('À surveiller — Préparer',        S.even('left'))],
      [EMPTY(), EMPTY(), EMPTY()],
      [c('⚠ Pensez à anticiper les renouvellements pour éviter les ruptures de contrats.', {
        font: { italic: true, sz: 10, color: { rgb: '856404' } },
        fill: { fgColor: { rgb: 'FFF3CD' } },
        alignment: { horizontal: 'left', indent: 1, wrapText: true },
        border: { top: { style: 'thin', color: { rgb: C.yellow } }, bottom: { style: 'thin', color: { rgb: C.yellow } }, left: { style: 'thick', color: { rgb: C.yellow } }, right: { style: 'thin', color: { rgb: C.yellow } } },
      }), EMPTY(), EMPTY()],
    ];
    const ws = buildSheet(rows, [28, 22, 30], [18, 18, 18, 18, 18, 8, 28]);
    ws['!merges'] = [mr(0,0,2), mr(6,0,2)];
    XLSXStyle.utils.book_append_sheet(wb, ws, '⚠️ Alertes');
  }

  // ── Sheet 9 : Liste Complète Employés ───────────────────────────────────
  {
    const rows: XLSXStyle.Cell[][] = [
      [c(`LISTE COMPLÈTE DES EMPLOYÉS (${emps.length})`, S.subtitle()), ...Array(EMP_HEADERS.length - 1).fill(EMPTY(C.orange))],
      [c(`Filtres : ${filterLabel}`, { font: { italic: true, sz: 9, color: { rgb: C.mutedText } }, fill: { fgColor: { rgb: C.gray2 } }, alignment: { horizontal: 'left', indent: 1 } }), ...Array(EMP_HEADERS.length - 1).fill(EMPTY(C.gray2))],
      empHeaderRow(),
      ...emps.map((e, i) => empDataRow(e, i)),
    ];
    const ws = buildSheet(rows, EMP_WIDTHS);
    ws['!merges'] = [mr(0,0,EMP_HEADERS.length-1), mr(1,0,EMP_HEADERS.length-1)];
    ws['!freeze'] = { xSplit: 0, ySplit: 3 };
    ws['!autofilter'] = { ref: `A3:O${rows.length}` };
    XLSXStyle.utils.book_append_sheet(wb, ws, '👤 Liste Employés');
  }

  const buf = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  dlBlob(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    `dashboard_afor_${dateSlug()}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION EXCEL EXPORT (per-section stats + employee list)
// ─────────────────────────────────────────────────────────────────────────────
export interface SectionExportData {
  title: string;
  filterLabel: string;
  icon: string;
  statsHeaders: string[];
  statsRows: (string | number)[][];
  employees: ExportEmployee[];
}

export async function exportSectionToExcel(data: SectionExportData): Promise<void> {
  const wb = XLSXStyle.utils.book_new();
  const date = todayFR();
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20);

  // ── Sheet 1 : Statistiques de la section ──────────────────────────────
  {
    const nCols = Math.max(data.statsHeaders.length, 3);
    const fill = Array(nCols - 1).fill(null).map(() => EMPTY(C.orange));
    const fillNav = Array(nCols - 1).fill(null).map(() => EMPTY(C.navy));

    const rows: XLSXStyle.Cell[][] = [
      [c(`${data.icon} ${data.title.toUpperCase()}`, S.title()), ...fillNav],
      [c(`Rapport AFOR Emploi — ${date}`, { font: { sz: 10, italic: true, color: { rgb: 'A0AABA' } }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), ...fillNav],
      [c(`Filtres : ${data.filterLabel}`, { font: { sz: 9, italic: true, color: { rgb: '8A98B0' } }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), ...fillNav],
      [EMPTY(C.navy), ...fillNav],
      [c('STATISTIQUES', S.subtitle()), ...fill],
      data.statsHeaders.map(h => c(h, S.header())),
      ...data.statsRows.map((row, ri) =>
        row.map((cell, ci) => {
          const st = ri % 2 === 0 ? S.even : S.odd;
          return c(cell, ci === 0 ? st('left') : st('center'));
        })
      ),
    ];

    const colWidths = data.statsHeaders.map((h, i) => {
      const maxLen = Math.max(h.length, ...data.statsRows.map(r => String(r[i] ?? '').length));
      return Math.min(Math.max(maxLen + 2, 14), 40);
    });

    const ws = buildSheet(rows, colWidths);
    ws['!merges'] = Array.from({ length: 5 }, (_, i) => mr(i, 0, nCols - 1));
    ws['!freeze'] = { xSplit: 0, ySplit: 6 };
    XLSXStyle.utils.book_append_sheet(wb, ws, `${data.icon} Stats`);
  }

  // ── Sheet 2 : Liste des Employés ──────────────────────────────────────
  if (data.employees.length > 0) {
    const fill = Array(EMP_HEADERS.length - 1).fill(null).map(() => EMPTY(C.orange));
    const fillNav = Array(EMP_HEADERS.length - 1).fill(null).map(() => EMPTY(C.navy));

    const rows: XLSXStyle.Cell[][] = [
      [c(`LISTE DES EMPLOYÉS — ${data.title.toUpperCase()} (${data.employees.length})`, S.title()), ...fillNav],
      [c(`Filtres : ${data.filterLabel}`, { font: { sz: 9, italic: true, color: { rgb: '8A98B0' } }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), ...fillNav],
      [c(`Date : ${date}`, { font: { sz: 9, italic: true, color: { rgb: '8A98B0' } }, fill: { fgColor: { rgb: C.navy } }, alignment: { horizontal: 'left', indent: 1 } }), ...fillNav],
      [EMPTY(C.navy), ...fillNav],
      [c('DÉTAIL', S.subtitle()), ...fill],
      empHeaderRow(),
      ...data.employees.map((e, i) => empDataRow(e, i)),
    ];

    const ws = buildSheet(rows, EMP_WIDTHS);
    ws['!merges'] = Array.from({ length: 5 }, (_, i) => mr(i, 0, EMP_HEADERS.length - 1));
    ws['!freeze'] = { xSplit: 0, ySplit: 6 };
    ws['!autofilter'] = { ref: `A6:O${rows.length}` };
    XLSXStyle.utils.book_append_sheet(wb, ws, '👤 Employés');
  }

  const buf = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  dlBlob(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    `${slug}_afor_${dateSlug()}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  POWERPOINT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const PPT_FONT = 'Calibri';

function addSlide(prs: pptxgen, title: string, subtitle?: string): pptxgen.Slide {
  const slide = prs.addSlide();
  slide.background = { color: C.light };

  // Top gradient bar (thick)
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.navy },  line: { color: C.navy } });
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0.08, w: '100%', h: 0.06, fill: { color: C.orange }, line: { color: C.orange } });

  // Left accent sidebar
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0.14, w: 0.08, h: 5.46, fill: { color: C.navy }, line: { color: C.navy } });

  // Title background
  slide.addShape(prs.ShapeType.rect, { x: 0.08, y: 0.14, w: 9.92, h: 0.72, fill: { color: C.navy }, line: { color: C.navy } });

  slide.addText(title, {
    x: 0.22, y: 0.18, w: 9.2, h: 0.42,
    fontSize: 17, bold: true, color: C.white, fontFace: PPT_FONT,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.22, y: 0.56, w: 9.2, h: 0.26,
      fontSize: 9, color: C.orange, fontFace: PPT_FONT, italic: true,
    });
  }

  return slide;
}

function kpiBox(
  slide: pptxgen.Slide, prs: pptxgen,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  color = C.orange, bgColor = C.white,
) {
  // Shadow card
  slide.addShape(prs.ShapeType.roundRect, {
    x: x + 0.03, y: y + 0.03, w, h,
    fill: { color: 'D0D8E4' }, line: { color: 'D0D8E4' }, rectRadius: 0.1,
  });
  // Card
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: bgColor }, line: { color: 'E2EAF4', width: 1 }, rectRadius: 0.1,
  });
  // Colored top strip on card
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.06,
    fill: { color }, line: { color },
  });
  // Value
  slide.addText(value, {
    x: x + 0.08, y: y + 0.1, w: w - 0.16, h: h * 0.54,
    fontSize: 22, bold: true, color, fontFace: PPT_FONT, align: 'center',
  });
  // Label
  slide.addText(label, {
    x: x + 0.08, y: y + h * 0.6, w: w - 0.16, h: h * 0.36,
    fontSize: 8.5, color: '6B7A90', fontFace: PPT_FONT, align: 'center',
  });
}

function addTable(
  slide: pptxgen.Slide,
  headers: string[],
  rows: string[][],
  x = 0.22, y = 1.0, w = 9.56, maxH = 4.5,
) {
  const tableData: pptxgen.TableRow[] = [
    headers.map(h => ({
      text: h,
      options: {
        bold: true, color: C.white,
        fill: { color: C.navy },
        fontSize: 10, align: 'center' as pptxgen.HAlign,
        fontFace: PPT_FONT, valign: 'middle' as pptxgen.VAlign,
      },
    })),
    ...rows.map((row, ri) =>
      row.map((cell, ci) => ({
        text: cell,
        options: {
          fontSize: 9, color: C.navy, fontFace: PPT_FONT,
          fill: { color: ri % 2 === 0 ? 'F0F4F8' : C.white },
          align: ci === 0 ? 'left' as pptxgen.HAlign : 'center' as pptxgen.HAlign,
          valign: 'middle' as pptxgen.VAlign,
        },
      }))
    ),
  ];

  slide.addTable(tableData, {
    x, y, w, h: maxH,
    border: { type: 'solid', color: 'D9E4EE', pt: 0.5 },
    rowH: 0.3,
    colW: headers.map(() => w / headers.length),
  });
}

function addProgressBar(
  slide: pptxgen.Slide, prs: pptxgen,
  x: number, y: number, w: number, h: number,
  label: string, pctVal: number, color = C.orange,
) {
  // Background
  slide.addShape(prs.ShapeType.rect, { x, y: y + 0.18, w, h: h - 0.18, fill: { color: 'E2EAF4' }, line: { color: 'E2EAF4' } });
  // Fill
  const fillW = Math.max(0.01, w * Math.min(pctVal, 100) / 100);
  slide.addShape(prs.ShapeType.rect, { x, y: y + 0.18, w: fillW, h: h - 0.18, fill: { color }, line: { color } });
  // Label
  slide.addText(`${label}  ${pctVal}%`, { x, y, w, h: 0.2, fontSize: 8, color: C.darkText, fontFace: PPT_FONT });
}

export async function exportToPowerPoint(data: DashboardExportData): Promise<void> {
  const prs = new pptxgen();
  prs.layout  = 'LAYOUT_16x9';
  prs.author  = 'AFOR Emploi';
  prs.subject = 'Dashboard Responsable';
  prs.title   = 'Dashboard RH — Vue Responsable';

  const { stats: s, contratsEcheance: ce } = data;
  const date = todayFR();

  // ── Slide 1 : Titre ──────────────────────────────────────────────────────
  {
    const sl = prs.addSlide();
    sl.background = { color: C.navy };

    // Top stripe
    sl.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.14, fill: { color: C.orange }, line: { color: C.orange } });
    // Bottom stripe
    sl.addShape(prs.ShapeType.rect, { x: 0, y: 5.36, w: '100%', h: 0.24, fill: { color: C.orange }, line: { color: C.orange } });
    // Left accent
    sl.addShape(prs.ShapeType.rect, { x: 0, y: 0.14, w: 0.18, h: 5.22, fill: { color: C.orange }, line: { color: C.orange } });

    sl.addText('Dashboard RH', { x: 0.45, y: 0.9, w: 9, h: 1.0, fontSize: 48, bold: true, color: C.white, fontFace: PPT_FONT });
    sl.addText('Vue Responsable — AFOR Emploi', { x: 0.45, y: 1.95, w: 9, h: 0.6, fontSize: 22, color: C.orange, fontFace: PPT_FONT });

    // Divider
    sl.addShape(prs.ShapeType.rect, { x: 0.45, y: 2.65, w: 5, h: 0.03, fill: { color: C.orange }, line: { color: C.orange } });

    sl.addText(`Rapport du ${date}`, { x: 0.45, y: 2.8, w: 8, h: 0.4, fontSize: 13, color: 'A0AABA', fontFace: PPT_FONT });
    sl.addText(`Filtres : ${data.filterLabel}`, { x: 0.45, y: 3.3, w: 8.8, h: 0.36, fontSize: 11, color: '8090A8', fontFace: PPT_FONT, italic: true });

    // Effectif badge
    sl.addShape(prs.ShapeType.roundRect, { x: 0.45, y: 3.8, w: 3.5, h: 0.9, fill: { color: C.orange }, line: { color: C.orange }, rectRadius: 0.12 });
    sl.addText(`${s.total}`, { x: 0.45, y: 3.82, w: 1.2, h: 0.86, fontSize: 32, bold: true, color: C.white, fontFace: PPT_FONT, align: 'center' });
    sl.addText('employés\nOF+AF', { x: 1.65, y: 3.9, w: 2.2, h: 0.7, fontSize: 13, color: C.white, fontFace: PPT_FONT, valign: 'middle' });
  }

  // ── Slide 2 : KPI Principaux ─────────────────────────────────────────────
  {
    const sl = addSlide(prs, 'KPI Principaux', `${s.total} employés · ${date}`);
    kpiBox(sl, prs, 0.22, 1.0, 2.18, 1.1, 'Effectif Total',    String(s.total),         C.orange);
    kpiBox(sl, prs, 2.55, 1.0, 2.18, 1.1, 'Contrats Actifs',   String(s.actifs),        C.green);
    kpiBox(sl, prs, 4.88, 1.0, 2.18, 1.1, 'Contrats Expirés',  String(s.expires),       C.red);
    kpiBox(sl, prs, 7.21, 1.0, 2.18, 1.1, 'Taux Féminisation', `${s.tauxFem}%`,         C.blue);

    kpiBox(sl, prs, 0.22, 2.3, 2.18, 1.0, 'CDI',               String(s.cdi),           C.green);
    kpiBox(sl, prs, 2.55, 2.3, 2.18, 1.0, 'CDD',               String(s.cdd),           C.blue);
    kpiBox(sl, prs, 4.88, 2.3, 2.18, 1.0, 'Consultant',        String(s.consultant),    C.purple);
    kpiBox(sl, prs, 7.21, 2.3, 2.18, 1.0, 'Âge Moyen',         `${s.ageMoyen} ans`,     C.navy);

    // Info bar
    sl.addShape(prs.ShapeType.roundRect, {
      x: 0.22, y: 3.5, w: 9.56, h: 0.6,
      fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.06,
    });
    sl.addText(
      `Ratio Permanent/Temp : ${s.ratioPermanentTemp}   ·   Taux Renouvellement : ${s.tauxRenouvellement}%   ·   Durée Moy : ${s.dureeMoy} mois   ·   Âge : ${s.ageMin}–${s.ageMax} ans`,
      { x: 0.3, y: 3.55, w: 9.4, h: 0.5, fontSize: 10, color: 'C8D0DE', fontFace: PPT_FONT, align: 'center' }
    );
  }

  // ── Slide 3 : Effectif par Région ────────────────────────────────────────
  {
    const sl = addSlide(prs, 'Effectif par Région', `Top ${Math.min(data.regions.length, 8)} régions`);
    // Table left
    addTable(sl,
      ['Région', 'Effectif', '% du Total'],
      data.regions.slice(0, 10).map(r => [r.label, String(r.effectif), `${r.pct}%`]),
      0.22, 1.0, 4.5
    );
    // Progress bars right
    let py = 1.0;
    data.regions.slice(0, 8).forEach((r, i) => {
      const colors = [C.orange, C.blue, C.green, C.purple, C.red, C.yellow, C.navy, C.blue];
      addProgressBar(sl, prs, 5.0, py, 4.5, 0.42, r.label, r.pct, colors[i % colors.length]);
      py += 0.48;
    });
  }

  // ── Slide 4 : Genre & Âges ───────────────────────────────────────────────
  {
    const sl = addSlide(prs, 'Genre & Pyramide des Âges');

    // Genre — large KPI boxes
    kpiBox(sl, prs, 0.22, 1.0, 2.8, 1.5, 'Hommes', `${s.hommes}\n(${pctOf(s.hommes, s.total)})`, C.blue);
    kpiBox(sl, prs, 3.22, 1.0, 2.8, 1.5, 'Femmes', `${s.femmes}\n(${pctOf(s.femmes, s.total)})`, C.red);
    kpiBox(sl, prs, 0.22, 2.7, 5.8, 0.9, 'Taux de Féminisation', `${s.tauxFem}%`, C.blue);

    // Age pyramid table (right)
    addTable(sl,
      ['Tranche', 'Nombre', '%'],
      data.ages.map(a => [a.tranche, String(a.nombre), `${a.pct}%`]),
      6.3, 1.0, 3.4
    );
  }

  // ── Slide 5 : Types de Contrats ──────────────────────────────────────────
  {
    const sl = addSlide(prs, 'Types de Contrats');

    kpiBox(sl, prs, 0.22, 1.0, 2.8, 1.4, 'CDI',        String(s.cdi),        C.green);
    kpiBox(sl, prs, 3.22, 1.0, 2.8, 1.4, 'CDD',        String(s.cdd),        C.blue);
    kpiBox(sl, prs, 6.22, 1.0, 2.8, 1.4, 'Consultant', String(s.consultant), C.purple);

    addTable(sl,
      ['Type', 'Nombre', '% du Total'],
      data.contrats.map(ct => [ct.type, String(ct.nombre), `${ct.pct}%`]),
      0.22, 2.65, 9.56
    );
  }

  // ── Slide 6 : Embauches Mensuelles ───────────────────────────────────────
  {
    const sl = addSlide(prs, 'Embauches Mensuelles', '12 derniers mois');
    addTable(sl,
      ['Mois', "Embauches"],
      data.embauches.map(e => [e.mois, String(e.nombre)]),
      0.22, 1.0, 9.56
    );
  }

  // ── Slide 7 : Niveau d'Éducation ─────────────────────────────────────────
  {
    const sl = addSlide(prs, "Niveau d'Éducation");
    addTable(sl,
      ['Diplôme / Niveau', 'Nombre', '% du Total'],
      data.education.map(e => [e.diplome, String(e.nombre), `${e.pct}%`])
    );
  }

  // ── Slide 8 : Alertes Contrats ────────────────────────────────────────────
  {
    const sl = addSlide(prs, 'Alertes — Contrats Arrivant à Échéance');

    kpiBox(sl, prs, 0.6,  1.05, 2.9, 1.5, '< 3 mois — CRITIQUE',  String(ce.dans3mois),  C.red,    'FFF5F5');
    kpiBox(sl, prs, 3.65, 1.05, 2.9, 1.5, '3–6 mois — ATTENTION', String(ce.dans6mois),  C.yellow, 'FFFBF0');
    kpiBox(sl, prs, 6.7,  1.05, 2.9, 1.5, '6–12 mois',            String(ce.dans12mois), C.blue,   'F0F8FF');

    // Warning box
    sl.addShape(prs.ShapeType.roundRect, {
      x: 0.22, y: 2.8, w: 9.56, h: 0.7,
      fill: { color: 'FFF8E1' }, line: { color: C.yellow, width: 1.5 }, rectRadius: 0.08,
    });
    sl.addText('⚠  Anticipez les renouvellements pour maintenir la continuité des services. Contacter les responsables RH pour les contrats à moins de 3 mois.', {
      x: 0.35, y: 2.86, w: 9.3, h: 0.58, fontSize: 10, color: '795548', fontFace: PPT_FONT, italic: true, align: 'center',
    });
  }

  // ── Slide 9 : Liste Employés (30 premiers) ───────────────────────────────
  {
    const sl = addSlide(prs, `Liste des Employés — ${data.employees.length} au total`, '30 premiers affichés · voir Excel pour la liste complète');
    const sample = data.employees.slice(0, 30);
    addTable(sl,
      ['Nom & Prénom', 'Poste', 'Contrat', 'Région', 'Statut', 'Acteur'],
      sample.map(e => [`${e.nom} ${e.prenom}`, e.poste, e.type_contrat, e.region, e.validiteContrat, `[${e.type_acteur}] ${e.acteur_nom}`])
    );
  }

  // ── Slide 10 : Fin ───────────────────────────────────────────────────────
  {
    const sl = prs.addSlide();
    sl.background = { color: C.navy };
    sl.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.14, fill: { color: C.orange }, line: { color: C.orange } });
    sl.addShape(prs.ShapeType.rect, { x: 0, y: 5.36, w: '100%', h: 0.24, fill: { color: C.orange }, line: { color: C.orange } });
    sl.addShape(prs.ShapeType.rect, { x: 0, y: 0.14, w: 0.18, h: 5.22, fill: { color: C.orange }, line: { color: C.orange } });

    sl.addText('Merci', {
      x: 0.45, y: 1.5, w: 9.1, h: 1.2, fontSize: 54, bold: true,
      color: C.white, fontFace: PPT_FONT, align: 'center',
    });
    sl.addText('AFOR Emploi — Système de Gestion RH', {
      x: 0.45, y: 2.8, w: 9.1, h: 0.55, fontSize: 18,
      color: C.orange, fontFace: PPT_FONT, align: 'center',
    });
    sl.addShape(prs.ShapeType.rect, { x: 3.5, y: 3.45, w: 3, h: 0.04, fill: { color: C.orange }, line: { color: C.orange } });
    sl.addText(date, {
      x: 0.45, y: 3.6, w: 9.1, h: 0.4, fontSize: 12,
      color: '8A98B0', fontFace: PPT_FONT, align: 'center',
    });
    sl.addText(`Effectif total : ${s.total} employés  ·  Filtres : ${data.filterLabel}`, {
      x: 0.45, y: 4.1, w: 9.1, h: 0.35, fontSize: 10,
      color: '5A6880', fontFace: PPT_FONT, align: 'center', italic: true,
    });
  }

  const buf = await prs.write({ outputType: 'arraybuffer' }) as ArrayBuffer;
  dlBlob(buf, 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    `dashboard_afor_${dateSlug()}.pptx`);
}
