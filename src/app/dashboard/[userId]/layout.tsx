'use client';

import { useParams } from "next/navigation";
import { StoriesProvider } from '@/components/contexts/stories-context';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const userId = params?.userId as string;

  // In a real application, this would fetch the user's data
  // For now, we're just passing the children through and wrapping with providers
  
  return (
    <div className="flex-1">
      <StoriesProvider>
        {children}
      </StoriesProvider>
    </div>
  );
}