import * as XLSX from 'xlsx'

const removeTrailingEmptyRows = (rows: any[]): any[] => {
  let lastNonEmptyIndex = -1

  rows.forEach((row, index) => {
    const hasData = Object.values(row).some(
      val => String(val ?? '').trim() !== ''
    )
    if (hasData) lastNonEmptyIndex = index
  })

  return lastNonEmptyIndex >= 0
    ? rows.slice(0, lastNonEmptyIndex + 1)
    : []
}




const removeDecorativeMergedRows = (
  sheet: XLSX.WorkSheet,
  widthThreshold = 0.7
): XLSX.WorkSheet => {
  const range = XLSX.utils.decode_range(sheet['!ref']!)
  const totalCols = range.e.c - range.s.c + 1

  const merges = sheet['!merges'] || []
  const rowsToRemove = new Set<number>()

  merges.forEach(m => {
    const mergeWidth = m.e.c - m.s.c + 1
    if (mergeWidth / totalCols >= widthThreshold) {
      for (let r = m.s.r; r <= m.e.r; r++) {
        rowsToRemove.add(r)
      }
    }
  })

  if (!rowsToRemove.size) return sheet

  const newSheet: XLSX.WorkSheet = {}
  let newR = 0
  let maxCol = 0

  for (let r = range.s.r; r <= range.e.r; r++) {
    if (rowsToRemove.has(r)) continue

    for (let c = range.s.c; c <= range.e.c; c++) {
      const oldRef = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[oldRef]
      if (!cell) continue

      const newRef = XLSX.utils.encode_cell({ r: newR, c })
      newSheet[newRef] = cell
      maxCol = Math.max(maxCol, c)
    }
    newR++
  }

  newSheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: newR - 1, c: maxCol }
  })

  // keep PPT / header merges
  newSheet['!merges'] = merges.filter(m => {
    const mergeWidth = m.e.c - m.s.c + 1
    return mergeWidth / totalCols < widthThreshold
  })

  return newSheet
}


const removeFirstAndEmptyColumns = (rows: any[]): any[] => {
  if (!rows.length) return rows

  const keys = Object.keys(rows[0])

  // 1️⃣ Remove FIRST column (Serial No)
  const remainingKeys = keys.slice(1)

  // 2️⃣ Take EXACTLY first 10 columns (do NOT remove empty ones)
  const firstTenKeys = remainingKeys.slice(0, 10)

  // 3️⃣ Rebuild rows with those 10 columns only
  return rows.map(row => {
    const obj: any = {}
    firstTenKeys.forEach(key => {
      obj[key] = row[key] ?? ''
    })
    return obj
  })
}


const normalizeToMaxColumns = (rows: any[], maxCols: number) => {
  if (!rows.length) return rows

  const existingCols = Object.keys(rows[0])
  const missingCount = maxCols - existingCols.length

  if (missingCount <= 0) return rows

  // Generate placeholder column names
  const extraCols = Array.from({ length: missingCount }, (_, i) =>
    `Extra_${existingCols.length + i + 1}`
  )

  return rows.map(row => {
    const newRow = { ...row }
    extraCols.forEach(col => {
      newRow[col] = ''
    })
    return newRow
  })
}




export {removeFirstAndEmptyColumns, removeTrailingEmptyRows, normalizeToMaxColumns ,removeDecorativeMergedRows}
