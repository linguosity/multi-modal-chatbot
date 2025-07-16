'use client';

import { Button } from '@/components/ui/button';
import { useReport } from '@/lib/context/ReportContext';

export default function ReportActions() {
  const { handleSave, handleDelete, showJson, setShowJson, loading, report } = useReport();

  const handleSaveClick = async () => {
    if (report) {
      await handleSave(report);
    }
  };

  return (
    <ul className="space-y-1 border-t border-gray-100 pt-4">
      <li>
        <Button
          onClick={handleSaveClick}
          disabled={loading}
          className="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span
            className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
          >
            {loading ? 'Saving...' : 'Save Report'}
          </span>
        </Button>
      </li>
      <li>
        <Button
          onClick={() => setShowJson(!showJson)}
          className="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h.875c.712 0 1.394-.27 1.902-.756a4.5 4.5 0 0 0 1.416-3.32M6.75 15.75H4.875c-.712 0-1.394-.27-1.902-.756A4.5 4.5 0 0 1 1.5 11.25v-1.5m11.25 11.25h-9M2.25 15.75v-1.5C2.25 12.109 4.109 10.25 6.45 10.25h.875m9.75 9.75H19.5a2.25 2.25 0 0 0 2.25-2.25V9.75m-4.5 1.5H12a.75.75 0 0 0-.75.75v2.25m-2.25-2.25H6.75m18 0A2.25 2.25 0 0 0 21.75 18v-1.5m-1.5-1.5H12a.75.75 0 0 0-.75.75v2.25m-2.25-2.25H6.75"
            />
          </svg>
          <span
            className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
          >
            {showJson ? 'Hide JSON' : 'Show JSON'}
          </span>
        </Button>
      </li>
      <li>
        <Button
          onClick={handleDelete}
          variant="destructive"
          className="group relative flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5 opacity-75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 00-2.244 2.077H8.084a2.25 2.25 0 00-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
          <span
            className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
          >
            Delete Report
          </span>
        </Button>
      </li>
    </ul>
  );
}
