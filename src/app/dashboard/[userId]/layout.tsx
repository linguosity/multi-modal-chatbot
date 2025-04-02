'use client';

import { useParams } from "next/navigation";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const userId = params?.userId as string;

  // In a real application, this would fetch the user's data
  // For now, we're just passing the children through
  
  return (
    <div className="flex-1">
      {children}
    </div>
  );
}