import ChatInterface from "@/components/layout/ChatInterface";

export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; doc?: string }>;
}) {
  const params = await searchParams;
  return <ChatInterface initialSubjectId={params.subject} initialDocumentId={params.doc} />;
}
