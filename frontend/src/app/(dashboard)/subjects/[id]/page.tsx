"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Upload, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  const router = useRouter();
  
  const [subject, setSubject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      const subjectData = await fetchApi(`/api/subjects/${subjectId}`);
      setSubject(subjectData);
      
      const docsData = await fetchApi(`/api/documents?subject_id=${subjectId}`);
      setDocuments(docsData);
    } catch (err) {
      console.error(err);
      router.push("/subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject_id", subjectId);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      loadData();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetchApi(`/api/documents/${docId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading subject...</div>;
  if (!subject) return <div>Subject not found</div>;

  return (
    <div className="space-y-6">
      <Link href="/subjects" className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>
      
      <div>
        <h1 className="text-3xl font-bold">{subject.name}</h1>
        <p className="text-gray-600 mt-1">{subject.description}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Study Materials</h2>
          
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.txt,.docx"
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button asChild disabled={uploading} className="cursor-pointer">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
            <p className="text-gray-500 mt-1">Upload your first study material to start learning with your AI tutor.</p>
          </div>
        ) : (
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition-colors -mx-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <Link href={`/documents/${doc.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {doc.filename}
                    </Link>
                    <div className="text-xs text-gray-500 flex gap-2">
                      <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className={`capitalize ${doc.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/chat?doc=${doc.id}`}>Ask AI</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
