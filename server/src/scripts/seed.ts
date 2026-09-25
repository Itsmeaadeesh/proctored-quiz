import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import quizData from '../data/quizSeedData.json';

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const QUIZ_ID = '11111111-1111-1111-1111-111111111111';

async function seedDatabase() {
  console.log('=====================================================');
  console.log('🌱 Starting Supabase Seeding for RHA DAY 26 Quiz...');
  console.log(`📡 Supabase Endpoint: ${supabaseUrl}`);
  console.log('=====================================================');

  try {
    // 1. Upsert Quiz
    const quizPayload = {
      id: QUIZ_ID,
      title: quizData.quiz_title || 'RHA DAY 26 Quiz',
      description: 'Official Red Hat Academy Day 26 Examination at Gyan Ganga Institute of Technology & Sciences (GGITS). 60 questions, 60 minutes, single attempt, strictly proctored.',
      duration_minutes: quizData.duration_minutes || 60,
      max_violations: 3,
      shuffle_questions: true,
      allow_backtracking: true, // Enabled per user request
      is_active: true,
    };

    console.log(`\n📌 1. Upserting Quiz "${quizPayload.title}" (${quizPayload.duration_minutes} mins, backtracking=${quizPayload.allow_backtracking})...`);
    const { data: quizResult, error: quizError } = await supabase
      .from('quizzes')
      .upsert(quizPayload, { onConflict: 'id' })
      .select()
      .single();

    if (quizError) {
      console.error('❌ Failed to upsert quiz:', quizError);
      process.exit(1);
    }
    console.log('✅ Quiz upserted successfully:', quizResult.title, `(${quizResult.duration_minutes}m)`);

    // 2. Remove existing questions for this quiz to prevent duplicates or stale records
    console.log('\n🧹 2. Clearing previous questions for quiz...');
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', QUIZ_ID);

    if (deleteError) {
      console.warn('⚠️ Warning while cleaning previous questions:', deleteError.message);
    } else {
      console.log('✅ Previous questions cleared.');
    }

    // 3. Format and insert all 60 questions
    console.log(`\n📝 3. Preparing and inserting ${quizData.questions.length} questions...`);
    const formattedQuestions = quizData.questions.map((q, idx) => {
      // Deterministic UUID based on index
      const hexIndex = (idx + 1).toString(16).padStart(12, '0');
      const questionId = `22222222-2222-2222-2222-${hexIndex}`;

      return {
        id: questionId,
        quiz_id: QUIZ_ID,
        text: q.text.trim(),
        type: 'mcq_single',
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks || 1,
        order_index: idx + 1,
      };
    });

    // Supabase supports bulk insert
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(formattedQuestions)
      .select('id, text, marks, order_index');

    if (insertError) {
      console.error('❌ Failed to insert questions:', insertError);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${insertedQuestions?.length || 0} questions into Supabase!`);
    console.log(`🎯 Total Marks: ${formattedQuestions.reduce((acc, q) => acc + q.marks, 0)} marks`);
    console.log('\nSample inserted question #1:', insertedQuestions?.[0]?.text);
    console.log('Sample inserted question #60:', insertedQuestions?.[59]?.text);
    console.log('\n=====================================================');
    console.log('🎉 Seeding completed successfully!');
    console.log('=====================================================');
  } catch (err: any) {
    console.error('💥 Unexpected error during seeding:', err);
    process.exit(1);
  }
}

seedDatabase();
