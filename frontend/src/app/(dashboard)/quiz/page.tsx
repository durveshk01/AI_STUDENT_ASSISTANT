"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";

export default function QuizPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [generationError, setGenerationError] = useState("");

  const [formData, setFormData] = useState({
    subject_id: "",
    num_questions: 5,
    difficulty: "Medium"
  });

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await fetchApi("/api/subjects");
        setSubjects(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, subject_id: data[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSubjects();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id) return alert("Select a subject");
    
    setLoading(true);
    setGenerationError("");
    try {
      const generated = await fetchApi("/api/quizzes/generate", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setQuiz(generated);
      setAnswers({});
      setResult(null);
    } catch (err) {
      console.error(err);
      setGenerationError(err instanceof Error ? err.message : "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      if (!confirm("You haven't answered all questions. Submit anyway?")) return;
    }

    setLoading(true);
    const submission = {
      answers: Object.entries(answers).map(([qId, optIdx]) => ({
        question_id: qId,
        selected_option: optIdx
      }))
    };

    try {
      const res = await fetchApi(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify(submission),
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Failed to submit quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quizzes</h1>
      
      {!quiz ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-xl">
          <h2 className="text-xl font-bold mb-4">Generate New Quiz</h2>
          {generationError && (
            <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {generationError}
            </div>
          )}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.subject_id}
                onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                required
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
              <input
                type="number"
                min="1"
                max="20"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.num_questions}
                onChange={(e) => setFormData({...formData, num_questions: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <Button type="submit" disabled={loading || subjects.length === 0} className="w-full">
              {loading ? "Generating with AI..." : "Generate Quiz"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold">{quiz.title}</h2>
              <p className="text-gray-500">{quiz.num_questions} questions • {quiz.difficulty} difficulty</p>
            </div>
            {result && (
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{result.percentage.toFixed(0)}%</div>
                <div className="text-sm text-gray-500">Score: {result.score} / {result.total_questions}</div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {quiz.questions.map((q: any, i: number) => {
              const explanation = result?.explanations.find((e: any) => e.question_id === q.id);
              
              return (
                <div key={q.id} className="space-y-3">
                  <h3 className="font-medium text-lg"><span className="text-gray-400 mr-2">{i + 1}.</span> {q.question_text}</h3>
                  <div className="space-y-2 pl-6">
                    {q.options.map((opt: string, optIdx: number) => {
                      let btnClass = "w-full text-left px-4 py-3 border rounded-lg transition-colors";
                      
                      if (result) {
                        if (explanation?.correct_index === optIdx) {
                          btnClass += " bg-green-100 border-green-500 font-medium";
                        } else if (answers[q.id] === optIdx) {
                          btnClass += " bg-red-100 border-red-500";
                        } else {
                          btnClass += " bg-gray-50 opacity-50";
                        }
                      } else {
                        if (answers[q.id] === optIdx) {
                          btnClass += " bg-blue-50 border-blue-500 ring-1 ring-blue-500";
                        } else {
                          btnClass += " hover:bg-gray-50";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={!!result}
                          onClick={() => setAnswers({...answers, [q.id]: optIdx})}
                          className={btnClass}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {explanation && (
                    <div className="mt-3 pl-6 text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                      <span className="font-bold text-gray-900 block mb-1">Explanation:</span>
                      {explanation.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t flex justify-between">
            <Button variant="outline" onClick={() => { setQuiz(null); setResult(null); }}>
              New Quiz
            </Button>
            {!result && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Answers"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
