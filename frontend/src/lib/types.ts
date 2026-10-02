export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SubjectResponse {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  subject_id: string;
  user_id: string;
  status: string;
  page_count: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface AnalyticsResponse {
  total_subjects: number;
  total_documents: number;
  quizzes_completed: number;
  average_quiz_score: number;
  study_time_minutes: number;
}

export interface ChatSource {
  document_id: string;
  document_name: string;
  page_number: number | null;
}

export interface ChatMessage {
  id?: string;
  role: string;
  content: string;
  sources?: ChatSource[] | null;
  created_at?: string;
}

export interface ConversationResponse {
  id: string;
  title: string;
  subject_id: string | null;
  created_at: string;
  updated_at: string | null;
  messages: ChatMessage[];
}

export interface QuizQuestionResponse {
  id: string;
  question_text: string;
  options: string[];
}

export interface QuizResponse {
  id: string;
  title: string;
  difficulty: string;
  num_questions: number;
  created_at: string;
  questions: QuizQuestionResponse[];
}

export interface QuizExplanation {
  question_id: string;
  correct_index: number;
  explanation: string;
}

export interface QuizResultResponse {
  score: number;
  total_questions: number;
  percentage: number;
  explanations: QuizExplanation[];
}

export interface FlashcardResponse {
  id: string;
  front: string;
  back: string;
  box: number;
  next_review: string;
}

export interface FlashcardDeckResponse {
  id: string;
  title: string;
  created_at: string;
  cards: FlashcardResponse[];
}

export interface StudyTask {
  subject: string;
  topic: string;
  hours: number;
}

export interface StudyDay {
  day: string;
  tasks: StudyTask[];
}

export interface StudyPlanResponse {
  plan: {
    schedule: StudyDay[];
  };
}
