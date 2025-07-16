import type { Metadata } from "next"
import "./globals.css"
import { createServerSupabase } from '@/lib/supabase/server';
import React from 'react';

export const metadata: Metadata = {
  title: "Linguosity",
  description: "A modular speech language report writer",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  console.log('Rendering RootLayout');
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full">
      <body className="h-full m-0 flex flex-col">
        <React.StrictMode>
          {!user && <header className="bg-white">
          <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
            <a className="block" href="/">
              <span className="sr-only">Home</span>
              <img 
                src="/logo-animation.gif" 
                alt="Linguosity Logo" 
                className="h-8 w-auto logo-pingpong"
                width="32"
                height="32"
              />
            </a>

            <div className="flex flex-1 items-center justify-end md:justify-between">
              <nav aria-label="Global" className="hidden md:block">
                <ul className="flex items-center gap-6 text-sm">
                  <li>
                    <a className="text-gray-500 transition hover:text-gray-500/75" href="/dashboard/reports">
                      Reports
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="flex items-center gap-4">
                <div className="sm:flex sm:gap-4">
                  {user ? null : (
                    <>
                      <a
                        className="block rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
                        href="/auth"
                      >
                        Login
                      </a>

                      <a
                        className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600 transition hover:text-teal-600/75 sm:block"
                        href="/auth"
                      >
                        Register
                      </a>
                    </>
                  )}
                </div>

                <button
                  className="block rounded-sm bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden"
                >
                  <span className="sr-only">Toggle menu</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>}
        {children}
        </React.StrictMode>
      </body>
    </html>
  )
}
