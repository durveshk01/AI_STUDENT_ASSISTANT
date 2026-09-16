"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Send, User as UserIcon, Bot, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ChatInterface({ conversationId, initialSubjectId, initialDocumentId }: { conversationId?: string, initialSubjectId?: string, initialDocumentId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Real app: fetch subjects/documents to populate dropdowns
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId || "");
  const [selectedDocument, setSelectedDocument] = useState(initialDocumentId || "");

  useEffect(() => {
    if (conversationId) {
      // Load existing conversation
      const loadConv = async () => {
        try {
          const conv = await fetchApi(`/api/chat/conversations/${conversationId}`);
          setMessages(conv.messages || []);
          if (conv.subject_id) setSelectedSubject(conv.subject_id);
        } catch (err) {
          console.error(err);
        }
      };
      loadConv();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          subject_id: selectedSubject || undefined,
          document_id: selectedDocument || undefined,
          query: userMessage.content,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let aiContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let newConvId = conversationId;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                aiContent += data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = aiContent;
                  return newMsgs;
                });
              }
              if (data.sources) {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].sources = data.sources;
                  return newMsgs;
                });
              }
              if (data.conversation_id && !conversationId) {
                newConvId = data.conversation_id;
              }
            } catch (e) {}
          }
        }
      }
      
      if (!conversationId && newConvId) {
        router.replace(`/chat/${newConvId}`);
      }

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "system", content: "Error communicating with AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header filters */}
      <div className="p-4 border-b bg-gray-50 flex gap-4">
        {/* Simplified for demo, you'd use actual select elements mapped to subjects/documents */}
        <div className="text-sm text-gray-500 font-medium">Chatting with AI Tutor</div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Send a message to start the conversation...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
              }`}>
                {msg.role === "user" ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-900 rounded-tl-none"
              }`}>
                <div className={msg.role === "user" ? "text-white" : "prose prose-sm prose-emerald"}>
                  {msg.role === "user" ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sources</p>
                    <div className="space-y-1">
                      {msg.sources.map((s: any, idx: int) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-gray-600 bg-white/50 p-1.5 rounded">
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[200px]">{s.document_name}</span>
                          <span className="text-gray-400">pg. {s.page_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
               <Bot className="w-5 h-5" />
             </div>
             <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 bg-gray-50 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about your study materials..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="rounded-full w-12 h-12">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
