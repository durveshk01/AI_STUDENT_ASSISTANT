import { use } from "react";
import ChatInterface from "@/components/layout/ChatInterface";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const resolvedParams = use(params);
  return <ChatInterface conversationId={resolvedParams.conversationId} />;
}
