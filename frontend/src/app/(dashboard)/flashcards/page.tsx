"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Play, ChevronRight, ChevronLeft } from "lucide-react";

export default function FlashcardsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<any>(null);
  
  // Study session state
  const [studying, setStudying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [formData, setFormData] = useState({
    subject_id: "",
    num_cards: 10
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
    try {
      const generated = await fetchApi("/api/flashcards/generate", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setDeck(generated);
      setStudying(true);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (err) {
      console.error(err);
      alert("Failed to generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality: number) => {
    const card = deck.cards[currentIndex];
    try {
      // In background, notify server of review quality for spaced repetition
      fetchApi(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        body: JSON.stringify({ quality }),
      }).catch(console.error);

      // Move to next card
      if (currentIndex < deck.cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        alert("Deck complete!");
        setStudying(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Flashcards</h1>
      
      {!studying ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-xl mx-auto mt-12">
          <div className="text-center mb-6">
            <BrainCircuit className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">AI Flashcard Generator</h2>
            <p className="text-gray-500 text-sm">Automatically extract key concepts into a study deck.</p>
          </div>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject to extract from</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Cards</label>
              <input
                type="number"
                min="5"
                max="30"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.num_cards}
                onChange={(e) => setFormData({...formData, num_cards: parseInt(e.target.value)})}
              />
            </div>
            
            <Button type="submit" disabled={loading || subjects.length === 0} className="w-full h-12 text-lg mt-4">
              {loading ? "Reading documents & generating..." : "Generate & Study Now"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-8">
          <div className="w-full flex justify-between items-center mb-4 text-sm text-gray-500">
            <button onClick={() => setStudying(false)} className="hover:text-gray-900 flex items-center">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span>Card {currentIndex + 1} of {deck.cards.length}</span>
            <span></span>
          </div>

          {/* Flashcard */}
          <div 
            className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden bg-white border-2 border-gray-100 rounded-2xl shadow-md flex items-center justify-center p-8 text-center text-2xl font-medium text-gray-900">
                {deck.cards[currentIndex].front}
              </div>
              {/* Back */}
              <div className="absolute w-full h-full backface-hidden bg-blue-50 border-2 border-blue-100 rounded-2xl shadow-md flex items-center justify-center p-8 text-center text-xl text-blue-900 rotate-y-180">
                {deck.cards[currentIndex].back}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            {!showAnswer ? "Click card to flip" : "How well did you know this?"}
          </div>

          {/* Controls */}
          {showAnswer && (
            <div className="flex gap-4 mt-6">
              <Button onClick={(e) => { e.stopPropagation(); handleReview(1); }} variant="outline" className="border-red-200 hover:bg-red-50 text-red-700">
                Forgot (1)
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); handleReview(3); }} variant="outline" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                Hard (3)
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); handleReview(5); }} variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                Easy (5)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
