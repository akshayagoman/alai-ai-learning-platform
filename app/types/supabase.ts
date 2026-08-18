export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: number
          name: string
          description: string | null
          icon: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          icon?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          icon?: string | null
        }
      }
      chapters: {
        Row: {
          id: number
          subject_id: number | null
          name: string
          description: string | null
        }
        Insert: {
          id?: number
          subject_id?: number | null
          name: string
          description?: string | null
        }
        Update: {
          id?: number
          subject_id?: number | null
          name?: string
          description?: string | null
        }
      }
      subtopics: {
        Row: {
          id: number
          chapter_id: number | null
          name: string
          content: string | null
          video_id: string | null
          quiz_data: string | null
          qa_data: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          chapter_id?: number | null
          name: string
          content?: string | null
          video_id?: string | null
          quiz_data?: string | null
          qa_data?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          chapter_id?: number | null
          name?: string
          content?: string | null
          video_id?: string | null
          quiz_data?: string | null
          qa_data?: string | null
          notes?: string | null
        }
      }
      videos: {
        Row: {
          id: number
          subtopic_id: number
          language: string
          youtube_id: string
          title: string
          description: string | null
          syllabus_type: string | null
        }
        Insert: {
          id?: number
          subtopic_id: number
          language: string
          youtube_id: string
          title: string
          description?: string | null
          syllabus_type?: string | null
        }
        Update: {
          id?: number
          subtopic_id?: number
          language?: string
          youtube_id?: string
          title?: string
          description?: string | null
          syllabus_type?: string | null
        }
      }
      video_ratings: {
        Row: {
          id: number
          video_id: number
          likes: number
          dislikes: number
        }
        Insert: {
          id?: number
          video_id: number
          likes?: number
          dislikes?: number
        }
        Update: {
          id?: number
          video_id?: number
          likes?: number
          dislikes?: number
        }
      }
      quiz_questions: {
        Row: {
          id: number
          subtopic_id: number
          question_text: string
          syllabus_type: string | null
        }
        Insert: {
          id?: number
          subtopic_id: number
          question_text: string
          syllabus_type?: string | null
        }
        Update: {
          id?: number
          subtopic_id?: number
          question_text?: string
          syllabus_type?: string | null
        }
      }
      quiz_options: {
        Row: {
          id: number
          question_id: number
          option_text: string
          is_correct: boolean
        }
        Insert: {
          id?: number
          question_id: number
          option_text: string
          is_correct?: boolean
        }
        Update: {
          id?: number
          question_id?: number
          option_text?: string
          is_correct?: boolean
        }
      }
      qa_items: {
        Row: {
          id: number
          subtopic_id: number
          question: string
          answer: string
          syllabus_type: string | null
        }
        Insert: {
          id?: number
          subtopic_id: number
          question: string
          answer: string
          syllabus_type?: string | null
        }
        Update: {
          id?: number
          subtopic_id?: number
          question?: string
          answer?: string
          syllabus_type?: string | null
        }
      }
      notes: {
        Row: {
          id: number
          subtopic_id: number
          title: string
          content: string
          syllabus_type: string | null
        }
        Insert: {
          id?: number
          subtopic_id: number
          title: string
          content: string
          syllabus_type?: string | null
        }
        Update: {
          id?: number
          subtopic_id?: number
          title?: string
          content?: string
          syllabus_type?: string | null
        }
      }
      user_settings: {
        Row: {
          user_id: string
          syllabus_type: string | null
          preferred_language: string | null
        }
        Insert: {
          user_id: string
          syllabus_type?: string | null
          preferred_language?: string | null
        }
        Update: {
          user_id?: string
          syllabus_type?: string | null
          preferred_language?: string | null
        }
      }
      user_video_ratings: {
        Row: {
          id: number
          user_id: string
          video_id: number
          rating: string
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          video_id: number
          rating: string
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          video_id?: number
          rating?: string
          created_at?: string | null
        }
      }
    }
  }
}
