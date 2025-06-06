import Chat from "@/components/chat";

export default function ChatPage() {
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden pb-10 flex-col">
      <div className="mx-auto w-full max-w-4xl px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
        <p className="text-muted-foreground mb-6">
          Ask questions about speech and language pathology, get help with report writing, 
          or generate therapy activities for your students.
        </p>
      </div>
      <Chat />
    </div>
  );
}