import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AboutCard() {
  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Linguosity AI Assistant</CardTitle>
          <CardDescription>Your speech-language pathology companion</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground/90 leading-normal prose"> 
          <p className="mb-3">Welcome to your specialized SLP AI assistant. Ask me anything related to speech and language pathology!</p>
          <p className="mb-3">I can help you with:</p>
          <ul className="flex flex-col mb-4 space-y-2">
            <li>→ Report writing suggestions and templates</li>
            <li>→ Evidence-based intervention strategies</li>
            <li>→ Eligibility criteria interpretation</li>
            <li>→ Therapy activity ideas for specific goals</li>
            <li>→ Professional development resources</li>
          </ul>
          <p className="mb-3">Try asking:</p>
          <ul className="flex flex-col mb-4 space-y-2">
            <li>• "Help me write a goal for a 5-year-old with apraxia"</li>
            <li>• "What assessments are recommended for bilingual students?"</li>
            <li>• "Generate a paragraph about articulation progress for my report"</li>
          </ul>
          <p><Link href="/dashboard" className="underline">Return to dashboard</Link></p>
        </CardContent>
      </Card>
    </div>
  )
}
