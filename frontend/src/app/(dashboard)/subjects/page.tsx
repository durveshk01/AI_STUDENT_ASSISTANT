"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Book, Plus, Trash2 } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });

  const loadSubjects = async () => {
    try {
      const data = await fetchApi("/api/subjects");
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
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

  if (loading) return <div>Loading subjects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subjects</h1>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg">New Subject</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 mt-1 border rounded-md"
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}

      {subjects.length === 0 && !isCreating ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Book className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No subjects yet</h3>
          <p className="text-gray-500 mt-1">Create a subject to start organizing your study materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`} className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">{subject.name}</h3>
                  <button 
                    onClick={(e) => handleDelete(e, subject.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-500 text-sm flex-1">{subject.description || "No description"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
