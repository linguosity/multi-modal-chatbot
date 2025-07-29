'use client';
import React from 'react';

export default function ReportView({ report }: { report: any }) {
  return (
    <div className="mx-auto max-w-3xl p-6 prose prose-neutral">
      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.75in;
        }
        .prose h1, .prose h2 {
          page-break-after: avoid;
        }
        .break-inside-avoid {
          break-inside: avoid;
        }
      `}</style>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">{report.title}</h1>
        <p className="text-sm opacity-70">{report.type?.toUpperCase()}</p>
      </header>

      {report.sections.map((s: any) => (
        <section key={s.id} className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: s.hydratedHtml }}
          />
        </section>
      ))}
    </div>
  );
}