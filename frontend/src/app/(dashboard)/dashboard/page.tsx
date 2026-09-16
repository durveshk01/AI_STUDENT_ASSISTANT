"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Book, FileText, CheckSquare, Clock } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    subjectsCount: 0,
    documentsCount: 0,
    quizzesCompleted: 0,
  });

  useEffect(() => {
    // In a real app, you'd fetch these from a dedicated analytics/dashboard endpoint
    const loadData = async () => {
      try {
        const subjects = await fetchApi("/api/subjects");
        const documents = await fetchApi("/api/documents");
        setStats({
          subjectsCount: subjects.length,
          documentsCount: documents.length,
          quizzesCompleted: 0, // Placeholder
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back!</h1>
      <p className="text-gray-600">Continue your learning journey.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Subjects</div>
            <div className="text-2xl font-bold">{stats.subjectsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Documents</div>
            <div className="text-2xl font-bold">{stats.documentsCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Quizzes Done</div>
            <div className="text-2xl font-bold">{stats.quizzesCompleted}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Study Time</div>
            <div className="text-2xl font-bold">0h</div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Recent Documents</h2>
          <div className="text-sm text-gray-500 text-center py-8">No recent documents</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Upcoming Study Plan</h2>
          <div className="text-sm text-gray-500 text-center py-8">Generate a study plan to see it here</div>
        </div>
      </div>
    </div>
  );
}
