import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createServerSupabase();

  // Check if user is authenticated
  const { data, error } = await supabase.auth.getUser();
  
  // If authenticated, redirect to dashboard
  if (!error && data?.user) {
    redirect("/dashboard");
  }

  // If not authenticated, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Linguosity
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI-Powered Report Generation for Speech-Language Pathologists
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Streamline your evaluation reports with intelligent templates, 
              AI-assisted content generation, and professional formatting.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600 text-sm">
                Transform unstructured notes into professional report sections with Claude AI
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-600 text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">Smart Templates</h3>
              <p className="text-gray-600 text-sm">
                Pre-built templates for common evaluation sections with customizable fields
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-purple-600 text-3xl mb-4">✏️</div>
              <h3 className="text-lg font-semibold mb-2">Rich Text Editor</h3>
              <p className="text-gray-600 text-sm">
                Professional formatting with drag-and-drop organization and real-time editing
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              Sign in with Google to start creating professional evaluation reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}