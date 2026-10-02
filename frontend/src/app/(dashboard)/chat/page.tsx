"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import type { ConversationResponse } from "@/lib/types";
import { MessageSquare, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ChatIndexPage() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await fetchApi<ConversationResponse[]>("/api/chat/conversations");
        setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, []);

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Conversations</h1>
        <Link href="/chat/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conversations.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No conversations yet</h3>
            <p className="text-gray-500 mt-1">Start a new chat to ask questions about your study materials.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.id} href={`/chat/${conv.id}`} className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 truncate">{conv.title}</h3>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(conv.updated_at || conv.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
