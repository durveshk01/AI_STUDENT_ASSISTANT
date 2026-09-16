import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit, BookOpen, CheckCircle, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <BrainCircuit className="w-8 h-8" />
          <span>Study Assistant</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" asChild><Link href="/login">Log in</Link></Button>
          <Button asChild><Link href="/register">Get Started</Link></Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 max-w-4xl">
          Study Smarter With Your Own <span className="text-blue-600">AI Tutor</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl">
          Upload your notes, ask questions, generate quizzes, create flashcards, and build personalized study plans tailored exactly to your course material.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" className="text-lg px-8" asChild><Link href="/register">Start for free</Link></Button>
          <Button size="lg" variant="outline" className="text-lg px-8" asChild><Link href="/login">Live Demo</Link></Button>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Summaries</h3>
            <p className="text-gray-600">Instantly generate overviews and extract key concepts from long PDFs and lecture notes.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Auto Quizzes</h3>
            <p className="text-gray-600">Test your knowledge with AI-generated MCQs and flashcards based strictly on your material.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Study Planner</h3>
            <p className="text-gray-600">Get a personalized schedule targeting your weak spots before exam day.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t text-center text-gray-500">
        <p>© 2024 AI-Powered Study Assistant. Build for the future of learning.</p>
      </footer>
    </div>
  );
}
