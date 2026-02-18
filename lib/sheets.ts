import { google } from 'googleapis'

// ── Auth ───────────────────────────────────────────────────────────────────
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT env variable tidak ditemukan')

  let credentials: Record<string, string>
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT bukan JSON valid')
  }

  // Fix private key: pastikan \n benar-benar jadi newline character
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key
      .replace(/\\n/g, '\n')   // escape sequence → actual newline
      .replace(/\r\n/g, '\n')  // Windows line endings
      .replace(/\r/g, '\n')    // old Mac line endings
      .trim()
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
}

// ── Ekstrak spreadsheet ID dari URL ───────────────────────────────────────
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

// ── Daftar sheet yang tersedia ─────────────────────────────────────────────
export async function getAvailableSheets(
  spreadsheetUrl: string
): Promise<{ title: string; index: number }[]> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
  if (!spreadsheetId) throw new Error('URL tidak valid')

  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res    = await sheets.spreadsheets.get({ spreadsheetId })

  return (res.data.sheets ?? []).map((s, i) => ({
    title: s.properties?.title ?? `Sheet ${i + 1}`,
    index: i,
  }))
}

// ── Ambil semua data dari worksheet ───────────────────────────────────────
export async function getSheetData(
  spreadsheetUrl: string,
  worksheetIndex: number
): Promise<string[][]> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
  if (!spreadsheetId) throw new Error('URL tidak valid')

  const auth   = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  // Dapatkan nama sheet dari index
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const sheetName = meta.data.sheets?.[worksheetIndex]?.properties?.title
  if (!sheetName) throw new Error(`Sheet index ${worksheetIndex} tidak ditemukan`)

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })

  return (res.data.values ?? []) as string[][]
}