"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Clock, CheckCircle } from "lucide-react";

export default function PlannerPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    exam_date: "",
    subjects: [] as string[],
    available_hours_per_day: 2,
    current_confidence: "Medium",
    target_score: "90%"
  });

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await fetchApi("/api/subjects");
        setSubjects(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadSubjects();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Convert subject IDs to names for the AI prompt
    const subjectNames = formData.subjects.map(id => {
      const s = subjects.find(sub => sub.id === id);
      return s ? s.name : id;
    });

    try {
      const result = await fetchApi("/api/study-plan/generate", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          subjects: subjectNames.length > 0 ? subjectNames : ["General Studies"]
        }),
      });
      setPlan(result.plan);
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(id) 
        ? prev.subjects.filter(s => s !== id)
        : [...prev.subjects, id]
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Study Planner</h1>
      <p className="text-gray-600">Generate a personalized, day-by-day study schedule to hit your target score.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-3 py-2 border rounded-md"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Study Hours/Day</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  className="w-full pl-10 pr-3 py-2 border rounded-md"
                  value={formData.available_hours_per_day}
                  onChange={(e) => setFormData({...formData, available_hours_per_day: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Score / Grade</label>
              <div className="relative">
                <Target className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. 90%, A+, Pass"
                  required
                  className="w-full pl-10 pr-3 py-2 border rounded-md"
                  value={formData.target_score}
                  onChange={(e) => setFormData({...formData, target_score: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Confidence</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.current_confidence}
                onChange={(e) => setFormData({...formData, current_confidence: e.target.value})}
              >
                <option value="Low">Low - I need to start from scratch</option>
                <option value="Medium">Medium - I know the basics</option>
                <option value="High">High - Just need revision</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subjects to Include</label>
              <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {subjects.length === 0 && <span className="text-sm text-gray-500">No subjects created yet.</span>}
                {subjects.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(sub.id)}
                      onChange={() => toggleSubject(sub.id)}
                      className="rounded text-blue-600"
                    />
                    {sub.name}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Generating Plan..." : "Generate AI Plan"}
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500">AI is analyzing your timeline and crafting the perfect schedule...</p>
              </div>
            </div>
          ) : plan && plan.schedule ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold border-b pb-2">Your Personalized Schedule</h2>
              <div className="space-y-4">
                {plan.schedule.map((day: any, i: number) => (
                  <div key={i} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-bold text-lg text-blue-700 mb-3">{day.day}</h3>
                    <div className="space-y-2">
                      {day.tasks.map((task: any, j: number) => (
                        <div key={j} className="flex items-start gap-3 bg-white p-3 rounded shadow-sm">
                          <CheckCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">{task.topic} <span className="text-sm text-gray-500 ml-2 px-2 py-0.5 bg-gray-100 rounded-full">{task.subject}</span></div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {task.hours} hours
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[400px] text-gray-400">
              Fill out the details and click generate to see your plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
