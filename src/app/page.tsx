console.log('[PAGE] Home page - Starting to load');

export default function Home() {
  console.log('[PAGE] Home page - Rendering component');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-4 font-medium text-xl">Linguosity</div>
      <div className="text-gray-500">Welcome to Linguosity</div>
      <a href="/auth" className="mt-4 text-blue-500 underline">Go to Auth</a>
    </div>
  );
}