"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { AnalyticsResponse, DocumentResponse, SubjectResponse, UserResponse } from "@/lib/types";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Book, FileText, CheckSquare, Clock, MessageSquare, BrainCircuit, Target, Upload, ArrowRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    subjectsCount: 0,
    documentsCount: 0,
    quizzesCompleted: 0,
  });
  const [userName, setUserName] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [user, subjects, documents, analytics] = await Promise.all([
          fetchApi<UserResponse>("/api/auth/me"),
          fetchApi<SubjectResponse[]>("/api/subjects"),
          fetchApi<DocumentResponse[]>("/api/documents"),
          fetchApi<AnalyticsResponse>("/api/analytics"),
        ]);
        if (!active) return;
        setUserName(user.name || "Student");
        setStats({
          subjectsCount: subjects.length,
          documentsCount: documents.length,
          quizzesCompleted: analytics.quizzes_completed,
        });
      } catch (err) {
        if (active) {
          console.error(err);
          setHasError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error loading dashboard</h2>
        <p className="text-gray-600">Please check your connection and try again.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20">Loading dashboard...</div>;
  }

  const isNewUser = stats.subjectsCount === 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userName}! 👋</h1>
        <p className="text-gray-600 mt-1">
          {isNewUser 
            ? "Let's get you set up. Follow the steps below to start studying with AI." 
            : "Continue your learning journey."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Onboarding Steps (shown when new user) */}
      {isNewUser && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-100">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Getting Started — 3 Easy Steps</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Create a Subject</h3>
              <p className="text-gray-600 text-sm mb-4">Organize your materials by course. For example: &quot;Biology 101&quot; or &quot;Data Structures&quot;.</p>
              <Link href="/subjects" className={buttonVariants({ size: "sm", className: "w-full" })}>
                <Book className="w-4 h-4 mr-2" /> Create Subject
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Upload a PDF</h3>
              <p className="text-gray-600 text-sm mb-4">Upload your lecture slides, textbook chapters, or notes. The AI will read and index every page.</p>
              <div className={`${buttonVariants({ size: "sm", variant: "outline" })} w-full opacity-60`}>
                <Upload className="w-4 h-4 mr-2" /> Upload in Subject
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Start Chatting!</h3>
              <p className="text-gray-600 text-sm mb-4">Ask questions about your notes. The AI will find the exact answers from your uploaded material.</p>
              <Link href="/chat/new" className={buttonVariants({ size: "sm", variant: "outline", className: "w-full" })}>
                <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/chat/new" className="group bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Chat with AI</div>
              <div className="text-xs text-gray-500">Ask about your notes</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" />
          </Link>

          <Link href="/quiz" className="group bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-green-200 hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Take a Quiz</div>
              <div className="text-xs text-gray-500">Test your knowledge</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-green-500 transition-colors" />
          </Link>

          <Link href="/flashcards" className="group bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Flashcards</div>
              <div className="text-xs text-gray-500">Review key concepts</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-purple-500 transition-colors" />
          </Link>

          <Link href="/planner" className="group bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Study Planner</div>
              <div className="text-xs text-gray-500">Plan your schedule</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-orange-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">💡 Tips for Best Results</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              <span>Upload PDFs with readable text (not scanned images)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              <span>Create separate subjects for each course to keep things organized</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              <span>Ask specific questions — &quot;Explain the Krebs cycle&quot; works better than &quot;Tell me about biology&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              <span>Use quizzes after reading to test what you actually retained</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">🛠️ What This App Can Do</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">💬</span>
              <span><strong>AI Chat:</strong> Ask questions about your notes with exact page citations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">📝</span>
              <span><strong>Quizzes:</strong> Auto-generate MCQs with explanations from your PDFs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">🃏</span>
              <span><strong>Flashcards:</strong> AI extracts key terms into interactive study cards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">📅</span>
              <span><strong>Study Planner:</strong> Get a personalized day-by-day schedule for your exam</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">🎤</span>
              <span><strong>Viva Mode:</strong> Practice answering questions like an oral exam</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
