"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import type { DocumentResponse, SubjectResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Book, Plus, Trash2, Upload, Sparkles } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const [syllabusUploading, setSyllabusUploading] = useState<string | null>(null);

  const loadSubjects = async () => {
    try {
      const data = await fetchApi<SubjectResponse[]>("/api/subjects");
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialSubjects = async () => {
      try {
        const data = await fetchApi<SubjectResponse[]>("/api/subjects");
        if (active) setSubjects(data);
      } catch (err) {
        if (active) console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInitialSubjects();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    
    try {
      await fetchApi("/api/subjects", {
        method: "POST",
        body: JSON.stringify(newSubject),
      });
      setNewSubject({ name: "", description: "" });
      setIsCreating(false);
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this subject?")) return;
    
    try {
      await fetchApi(`/api/subjects/${id}`, {
        method: "DELETE",
      });
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyllabusUpload = async (subjectId: string, file: File) => {
    setSyllabusUploading(subjectId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject_id", subjectId); // Added missing form field

    try {
      await fetchApi<DocumentResponse>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      alert(`Syllabus "${file.name}" uploaded! The AI is now processing it in the background.`);
      await loadSubjects();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed. Please check the file and try again.");
    } finally {
      setSyllabusUploading(null);
    }
  };

  // Color palette for subject cards
  const colors = [
    { bg: "bg-blue-50", border: "border-blue-200", icon: "bg-blue-100 text-blue-600", hover: "hover:border-blue-300" },
    { bg: "bg-green-50", border: "border-green-200", icon: "bg-green-100 text-green-600", hover: "hover:border-green-300" },
    { bg: "bg-purple-50", border: "border-purple-200", icon: "bg-purple-100 text-purple-600", hover: "hover:border-purple-300" },
    { bg: "bg-orange-50", border: "border-orange-200", icon: "bg-orange-100 text-orange-600", hover: "hover:border-orange-300" },
    { bg: "bg-red-50", border: "border-red-200", icon: "bg-red-100 text-red-600", hover: "hover:border-red-300" },
    { bg: "bg-indigo-50", border: "border-indigo-200", icon: "bg-indigo-100 text-indigo-600", hover: "hover:border-indigo-300" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-gray-500 mt-1">Organize your study materials by course. Click a subject to upload notes & chat with AI.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg">New Subject</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Machine Learning, Organic Chemistry"
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <input
              type="text"
              placeholder="e.g. Topics covered in the course, exam date, etc."
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button type="submit">Create Subject</Button>
          </div>
        </form>
      )}

      {subjects.length === 0 && !isCreating ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <Book className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No subjects yet</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">Create your first subject to start organizing study materials. Demo subjects are automatically added when you register!</p>
          <Button onClick={() => setIsCreating(true)} className="mt-6">
            <Plus className="w-4 h-4 mr-2" /> Create Your First Subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, idx) => {
            const color = colors[idx % colors.length];
            return (
              <div key={subject.id} className={`${color.bg} rounded-xl border-2 ${color.border} ${color.hover} transition-all hover:shadow-lg group`}>
                <Link href={`/subjects/${subject.id}`} className="block p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${color.icon}`}>
                      <Book className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, subject.id)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{subject.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{subject.description || "No description"}</p>
                  
                </Link>
                
                {/* Syllabus Upload Button */}
                <div className="px-6 pb-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.txt,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSyllabusUpload(subject.id, file);
                        e.target.value = "";
                      }}
                      disabled={syllabusUploading === subject.id}
                    />
                    <span className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-dashed border-gray-300 bg-white/70 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-white transition-all">
                      {syllabusUploading === subject.id ? (
                        <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Upload Syllabus / Notes</>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold text-blue-900">How subjects work</h3>
          <p className="text-sm text-blue-700 mt-1">
            Each subject acts as a folder for your study materials. Upload PDFs (lecture slides, textbook chapters, syllabus) into a subject, 
            and the AI will read and index every page. Then you can chat with the AI about that subject, generate quizzes, create flashcards, 
            and more — all based on YOUR actual notes, not generic internet knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}
