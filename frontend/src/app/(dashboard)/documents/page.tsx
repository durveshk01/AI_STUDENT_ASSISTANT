"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import type { DocumentResponse } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { FileText, Trash2, ExternalLink } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      const data = await fetchApi<DocumentResponse[]>("/api/documents");
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialDocuments = async () => {
      try {
        const data = await fetchApi<DocumentResponse[]>("/api/documents");
        if (active) setDocuments(data);
      } catch (err) {
        if (active) console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInitialDocuments();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!documents.some((doc) => doc.status === "uploading" || doc.status === "processing")) return;
    const interval = setInterval(async () => {
      try {
        setDocuments(await fetchApi<DocumentResponse[]>("/api/documents"));
      } catch (err) {
        console.error(err);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [documents]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetchApi(`/api/documents/${docId}`, { method: "DELETE" });
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async (docId: string) => {
    setRetryingId(docId);
    try {
      await fetchApi(`/api/documents/${docId}/retry`, { method: "POST" });
      await loadDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not retry document processing.");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) return <div>Loading documents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Documents</h1>
        <Link href="/subjects" className={buttonVariants({ variant: "outline" })}>Upload via Subjects</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
            <p className="text-gray-500 mt-1">Upload study materials in your subjects to see them here.</p>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {doc.filename}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {(doc.status === "failed" || doc.status === "completed") && (
                        <Button variant="outline" size="sm" onClick={() => handleRetry(doc.id)} disabled={retryingId === doc.id}>
                          {retryingId === doc.id ? "Processing..." : doc.status === "failed" ? "Retry" : "Reindex"}
                        </Button>
                      )}
                      <Link href={`/chat/new?subject=${doc.subject_id}&doc=${doc.id}`} title="Ask AI" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
