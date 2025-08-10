import { PDFExtract } from 'pdf.js-extract'

export async function extractPdfTextFromArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const pdfExtract = new PDFExtract()
  const data = await pdfExtract.extractBuffer(Buffer.from(buffer), {})
  const pages = data.pages || []
  const text = pages
    .map(p => (p.content || []).map(c => c.str).join(' '))
    .join('\n\n')
  return text
}

