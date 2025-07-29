'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useReport } from '@/lib/context/ReportContext';

export default function ReportDependentSidebarLinks() {
  const { report } = useReport();

  return (
    <>
      {report?.id && (
        <Link href={`/dashboard/reports/${report.id}/view`} className="group flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          <Eye className="size-5 opacity-75" />
          <span
            className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
          >
            View Report
          </span>
        </Link>
      )}
    </>
  );
}
