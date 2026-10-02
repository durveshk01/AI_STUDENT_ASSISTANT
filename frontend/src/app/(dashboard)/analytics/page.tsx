"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { AnalyticsResponse } from "@/lib/types";
import { BarChart, Book, FileText, CheckSquare, Target } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const result = await fetchApi<AnalyticsResponse>("/api/analytics");
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics & Progress</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Subjects</div>
            <div className="text-2xl font-bold">{data.total_subjects}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Documents</div>
            <div className="text-2xl font-bold">{data.total_documents}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Quizzes Done</div>
            <div className="text-2xl font-bold">{data.quizzes_completed}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Avg Quiz Score</div>
            <div className="text-2xl font-bold">{data.average_quiz_score}%</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-8 text-center py-16">
        <BarChart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900">More charts coming soon</h2>
        <p className="text-gray-500 mt-2">We are gathering more data on your study habits to build detailed visualizations.</p>
      </div>
    </div>
  );
}
