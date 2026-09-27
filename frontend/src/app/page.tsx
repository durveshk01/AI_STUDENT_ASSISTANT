import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrainCircuit, BookOpen, CheckCircle, Target, MessageSquare, Sparkles, Upload, ArrowRight, Zap, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <BrainCircuit className="w-8 h-8" />
          <span>Study Assistant</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
          <a href="#demo" className="hover:text-gray-900 transition-colors">Demo</a>
        </nav>
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Log in</Link>
          <Link href="/register" className={buttonVariants()}>Get Started Free</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Powered by Google Gemini AI
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 max-w-4xl leading-tight">
          Study Smarter With Your Own <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Tutor</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl leading-relaxed">
          Upload your notes and PDFs. Ask questions, generate quizzes, create flashcards, and build study plans — all powered by AI that actually reads your material.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/register" className={buttonVariants({ size: "lg", className: "text-lg px-8 py-6 shadow-lg shadow-blue-500/25" })}>
            Start Studying Free
          </Link>
          <a href="#demo" className={buttonVariants({ variant: "outline", size: "lg", className: "text-lg px-8 py-6" })}>
            See Demo ↓
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required • Free forever for students</p>
      </section>

      {/* Trusted Stats */}
      <section className="py-12 bg-gray-50 border-y">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">RAG</div>
            <div className="text-sm text-gray-500 mt-1">AI retrieval system</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">PDF</div>
            <div className="text-sm text-gray-500 mt-1">Document processing</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">Vector</div>
            <div className="text-sm text-gray-500 mt-1">Semantic search</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">Gemini</div>
            <div className="text-sm text-gray-500 mt-1">AI powered</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900">Everything You Need to Ace Your Exams</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Six powerful AI tools designed specifically for students. No generic chatbot — this AI reads YOUR notes.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Chat with Citations</h3>
              <p className="text-gray-600 leading-relaxed">Ask any question about your notes. The AI finds the exact relevant sections and answers with page-number citations so you can verify every fact.</p>
              <div className="mt-4 text-sm text-blue-600 font-medium flex items-center gap-1">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Auto Quiz Generator</h3>
              <p className="text-gray-600 leading-relaxed">Generate MCQ quizzes from your uploaded PDFs. Choose easy, medium, or hard difficulty. Get instant grading with detailed explanations.</p>
              <div className="mt-4 text-sm text-green-600 font-medium flex items-center gap-1">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Flashcards</h3>
              <p className="text-gray-600 leading-relaxed">AI automatically extracts key definitions and concepts into interactive flashcards. Rate your confidence and track progress with spaced repetition.</p>
              <div className="mt-4 text-sm text-purple-600 font-medium flex items-center gap-1">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Study Planner</h3>
              <p className="text-gray-600 leading-relaxed">Enter your exam date and available hours. The AI builds a personalized day-by-day schedule targeting your weakest topics first.</p>
              <div className="mt-4 text-sm text-orange-600 font-medium flex items-center gap-1">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Viva / Interview Mode</h3>
              <p className="text-gray-600 leading-relaxed">Practice oral exams with an AI examiner. It asks conceptual questions, evaluates your answers (0-100 score), and points out what you missed.</p>
              <div className="mt-4 text-sm text-red-600 font-medium flex items-center gap-1">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Summaries</h3>
              <p className="text-gray-600 leading-relaxed">Upload a 50-page PDF and get a concise, structured summary in seconds. Perfect for last-minute revision before exams.</p>
              <div className="mt-4 text-sm text-indigo-600 font-medium flex items-center gap-1">
                Try it <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Three simple steps to transform your study routine</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg shadow-blue-500/25">
                1
              </div>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Upload Your Notes</h3>
              <p className="text-gray-600">Drop your PDF lecture slides, textbook chapters, or study notes. The AI reads every page and builds a searchable knowledge base.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg shadow-blue-500/25">
                2
              </div>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ask & Generate</h3>
              <p className="text-gray-600">Chat with your notes, generate quizzes, create flashcards, or build a study schedule. Everything is based on YOUR material.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg shadow-blue-500/25">
                3
              </div>
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ace Your Exams</h3>
              <p className="text-gray-600">Track your progress, identify weak areas, and study smarter. The AI adapts to help you focus where it matters most.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section id="demo" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900">See It In Action</h2>
            <p className="mt-4 text-lg text-gray-600">Here is what a real study session looks like</p>
          </div>

          {/* Demo Chat Preview */}
          <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden shadow-xl">
            <div className="bg-white px-6 py-4 border-b flex items-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="ml-4 text-sm text-gray-500 font-medium">AI Chat — Biology 101</span>
            </div>
            <div className="p-6 space-y-6">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-br-md max-w-md text-sm">
                  What is the difference between mitosis and meiosis?
                </div>
              </div>
              {/* AI message */}
              <div className="flex justify-start">
                <div className="bg-white border px-5 py-4 rounded-2xl rounded-bl-md max-w-lg text-sm space-y-3 shadow-sm">
                  <p><strong>Mitosis</strong> produces two identical daughter cells with the same chromosome count (2n → 2n), used for growth and repair.</p>
                  <p><strong>Meiosis</strong> produces four genetically unique cells with half the chromosomes (2n → n), used for sexual reproduction.</p>
                  <div className="pt-3 border-t text-xs text-gray-400 flex items-center gap-1">
                    📄 Source: <span className="text-blue-500">Biology_Chapter_5.pdf</span> — Page 12
                  </div>
                </div>
              </div>
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-br-md max-w-md text-sm">
                  Generate a 5-question quiz on this topic
                </div>
              </div>
              {/* AI response */}
              <div className="flex justify-start">
                <div className="bg-white border px-5 py-4 rounded-2xl rounded-bl-md max-w-lg text-sm shadow-sm">
                  <p>✅ Quiz generated! 5 MCQ questions on <strong>Cell Division</strong> (Medium difficulty).</p>
                  <p className="text-blue-600 font-medium mt-2 cursor-pointer">→ Open Quiz</p>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border-2 border-green-100">
              <div className="text-3xl mb-3">📝</div>
              <h4 className="font-bold text-lg mb-2">Quiz Preview</h4>
              <p className="text-sm text-gray-600 mb-3">Q: Which phase of mitosis do chromosomes align at the cell plate?</p>
              <div className="space-y-2 text-sm">
                <div className="bg-white px-3 py-2 rounded border">A) Prophase</div>
                <div className="bg-green-100 px-3 py-2 rounded border border-green-300 font-medium">B) Metaphase ✓</div>
                <div className="bg-white px-3 py-2 rounded border">C) Anaphase</div>
                <div className="bg-white px-3 py-2 rounded border">D) Telophase</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border-2 border-purple-100">
              <div className="text-3xl mb-3">🃏</div>
              <h4 className="font-bold text-lg mb-2">Flashcard Preview</h4>
              <div className="bg-white p-4 rounded-xl border-2 border-purple-200 text-center min-h-[120px] flex flex-col items-center justify-center">
                <p className="text-xs text-purple-500 uppercase font-bold mb-2">Front</p>
                <p className="font-medium">What is Meiosis?</p>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">Click to flip • Rate: Easy / Hard / Forgot</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border-2 border-orange-100">
              <div className="text-3xl mb-3">📅</div>
              <h4 className="font-bold text-lg mb-2">Study Plan Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-white px-3 py-2 rounded border flex justify-between">
                  <span>Day 1: Cell Division</span>
                  <span className="text-gray-400">2h</span>
                </div>
                <div className="bg-white px-3 py-2 rounded border flex justify-between">
                  <span>Day 2: Genetics</span>
                  <span className="text-gray-400">1.5h</span>
                </div>
                <div className="bg-white px-3 py-2 rounded border flex justify-between">
                  <span>Day 3: Review Quiz</span>
                  <span className="text-gray-400">1h</span>
                </div>
                <div className="bg-orange-100 px-3 py-2 rounded border border-orange-200 flex justify-between font-medium">
                  <span>Day 4: Exam Day 🎯</span>
                  <span className="text-orange-600">Go!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack / Why Different */}
      <section className="py-24 px-4 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold">This Is NOT a ChatGPT Wrapper</h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Built with real AI engineering — RAG, vector search, embeddings, and structured outputs.</p>

          <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <Shield className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Your Data Stays Yours</h3>
              <p className="text-gray-400 text-sm">Documents are processed and stored securely in your own PostgreSQL database. Nothing is sent to third parties.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">RAG Architecture</h3>
              <p className="text-gray-400 text-sm">Uses Retrieval-Augmented Generation with pgvector embeddings. The AI searches your actual notes before answering — no hallucinations.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <Clock className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Real-Time Streaming</h3>
              <p className="text-gray-400 text-sm">Answers stream in real-time via Server-Sent Events. No waiting for long responses — see the AI think as it types.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold">Ready to Study Smarter?</h2>
          <p className="mt-4 text-lg text-blue-100">Create your free account and upload your first PDF in under 60 seconds.</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className={buttonVariants({ size: "lg", className: "text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-100 shadow-xl" })}>
              Create Free Account
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">Demo credentials: demo@example.com / password123</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold text-blue-600 mb-3">
              <BrainCircuit className="w-6 h-6" />
              <span>Study Assistant</span>
            </div>
            <p className="text-sm text-gray-500">AI-powered study platform built with Next.js, FastAPI, PostgreSQL, pgvector, and Google Gemini.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>AI Chat with RAG</li>
              <li>Quiz Generator</li>
              <li>Smart Flashcards</li>
              <li>Study Planner</li>
              <li>Viva Mode</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Tech Stack</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Next.js 16 + Tailwind CSS</li>
              <li>FastAPI + Python</li>
              <li>PostgreSQL + pgvector</li>
              <li>Google Gemini AI</li>
              <li>Docker</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-400">
          © 2024 AI-Powered Study Assistant. Built for the future of learning.
        </div>
      </footer>
    </div>
  );
}
