import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Devis } from '@/types'
import { formatDate } from '@/lib/utils'

// Colors
const HEADER_BG = '#0B1120'
const TEXT_COLOR = '#333333'
const ACCENT = '#3B82F6'
const LINE_COLOR = '#E5E7EB'
const ROW_ALT = '#F8FAFC'
const WHITE = '#FFFFFF'

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function exportDevisPdf(devis: Devis) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Page border ──
  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.5)
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

  // ── Header area (dark background) ──
  doc.setFillColor(HEADER_BG)
  doc.rect(margin, y, contentWidth, 28, 'F')

  // Left: AluAtelier Pro
  doc.setTextColor(WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('AluAtelier Pro', margin + 5, y + 12)

  // Right: DEVIS title + reference
  doc.setFontSize(22)
  doc.text('DEVIS', pageWidth - margin - 5, y + 10, { align: 'right' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(devis.reference, pageWidth - margin - 5, y + 18, { align: 'right' })

  // Below header: date + validity
  doc.setTextColor(TEXT_COLOR)
  doc.setFontSize(9)
  const dateLine = `Date: ${formatDate(devis.dateDevis)}`
  const validLine = devis.dateValidite
    ? `Valide jusqu'au: ${formatDate(devis.dateValidite)}`
    : ''
  doc.text(dateLine, margin, y + 35)
  if (validLine) {
    doc.text(validLine, margin + 60, y + 35)
  }

  // Status badge
  const statutLabels: Record<string, string> = {
    BROUILLON: 'Brouillon',
    ENVOYE: 'Envoyé',
    ACCEPTE: 'Accepté',
    REFUSE: 'Refusé',
    CONVERTI: 'Converti',
  }
  const statutLabel = statutLabels[devis.statut] || devis.statut
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(ACCENT)
  doc.text(`Statut: ${statutLabel}`, pageWidth - margin, y + 35, { align: 'right' })

  // Separator line
  y = y + 40
  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5

  // ── Client section ──
  doc.setTextColor(ACCENT)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', margin, y)
  y += 5

  doc.setTextColor(TEXT_COLOR)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const clientName = devis.client
    ? `${devis.client.prenom ? devis.client.prenom + ' ' : ''}${devis.client.nom}`
    : 'Client inconnu'

  doc.text(`Nom: ${clientName}`, margin, y)
  y += 5

  if (devis.client?.telephone) {
    doc.text(`Téléphone: ${devis.client.telephone}`, margin, y)
    y += 5
  }
  if (devis.client?.adresse) {
    doc.text(`Adresse: ${devis.client.adresse}`, margin, y)
    y += 5
  }
  if (devis.client?.wilaya) {
    doc.text(`Wilaya: ${devis.client.wilaya}`, margin, y)
    y += 5
  }

  y += 5

  // ── Items table ──
  const lignes = devis.lignes || []

  const tableBody = lignes.map((ligne, index) => [
    (index + 1).toString(),
    ligne.designation,
    ligne.description || '',
    ligne.unite,
    formatNumber(ligne.quantite),
    `${formatNumber(ligne.prixUnitaire)} DA`,
    `${formatNumber(ligne.montantTotal)} DA`,
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['N°', 'Désignation', 'Description', 'Unité', 'Qté', 'P.U.', 'Total']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: TEXT_COLOR,
      lineColor: LINE_COLOR,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: HEADER_BG,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: ROW_ALT,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 30 },
    },
  })

  // Get the final Y position after the table
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  y = lastTable?.finalY
    ? Number(lastTable.finalY)
    : y + lignes.length * 8 + 10

  y += 8

  // ── Totals section (right-aligned) ──
  const totalsX = pageWidth - margin - 75
  const valueX = pageWidth - margin - 5

  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.2)

  // Montant HT
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(TEXT_COLOR)
  doc.text('Montant HT:', totalsX, y)
  doc.text(`${formatNumber(devis.montantHT)} DA`, valueX, y, { align: 'right' })
  y += 6

  // TVA
  doc.text(`TVA (${devis.tva}%):`, totalsX, y)
  const montantTVA = devis.montantTTC - devis.montantHT
  doc.text(`${formatNumber(montantTVA)} DA`, valueX, y, { align: 'right' })
  y += 2

  // Separator line before total
  doc.setLineWidth(0.5)
  doc.line(totalsX - 2, y, valueX + 2, y)
  y += 6

  // TOTAL TTC (bold, larger)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(HEADER_BG)
  doc.text('TOTAL TTC:', totalsX, y)
  doc.text(`${formatNumber(devis.montantTTC)} DA`, valueX, y, { align: 'right' })
  y += 12

  // ── Notes section ──
  if (devis.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(ACCENT)
    doc.text('Notes:', margin, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(TEXT_COLOR)
    doc.setFontSize(8)
    const lines = doc.splitTextToSize(devis.notes, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 4 + 8
  }

  // ── Footer area ──
  const footerY = pageHeight - margin - 10

  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 15, pageWidth - margin, footerY - 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(TEXT_COLOR)

  // Signature lines
  const signLeftX = margin + 30
  const signRightX = pageWidth - margin - 50

  doc.text('Signature client', signLeftX, footerY - 5)
  doc.line(margin, footerY, margin + 60, footerY)

  doc.text('Cachet & Signature', signRightX, footerY - 5)
  doc.line(pageWidth - margin - 80, footerY, pageWidth - margin, footerY)

  // ── Save ──
  doc.save(`Devis_${devis.reference}.pdf`)
}