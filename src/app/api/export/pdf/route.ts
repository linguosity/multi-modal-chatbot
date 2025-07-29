import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { reportId, sectionId, narrative, sectionTitle } = await request.json()

    if (!narrative || !sectionTitle) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // For now, create a simple HTML-to-PDF conversion
    // In production, you'd want to use a proper PDF library like Puppeteer or jsPDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${sectionTitle} - Narrative Report</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            p {
              margin-bottom: 16px;
              text-align: justify;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${sectionTitle}</h1>
            <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
          </div>
          
          <div class="content">
            ${narrative.split('\n').map(paragraph => 
              paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).join('')}
          </div>
          
          <div class="footer">
            <p>This report was generated using Linguosity AI-powered assessment tools.</p>
          </div>
        </body>
      </html>
    `

    // Convert HTML to PDF (simplified version)
    // In production, you'd use a proper PDF generation service
    const pdfBuffer = Buffer.from(htmlContent, 'utf-8')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sectionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_narrative.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    )
  }
}

// Note: For production, you'd want to implement proper PDF generation
// using libraries like:
// - Puppeteer (for HTML to PDF)
// - jsPDF (for programmatic PDF creation)
// - PDFKit (for Node.js PDF generation)
// 
// Example with Puppeteer:
// import puppeteer from 'puppeteer'
// 
// const browser = await puppeteer.launch()
// const page = await browser.newPage()
// await page.setContent(htmlContent)
// const pdfBuffer = await page.pdf({
//   format: 'A4',
//   margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }
// })
// await browser.close()