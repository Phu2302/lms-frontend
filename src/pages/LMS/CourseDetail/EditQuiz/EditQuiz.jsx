import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import { useToast } from '../../../../components/Toast/ToastContext';
import QuizForm from '../QuizForm/QuizForm';

function EditQuiz() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [courseName, setCourseName] = useState('');
  const [initialData, setInitialData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId, courseId]);

  const fetchQuizDetails = async () => {
    setLoadingDetails(true);
    try {
      // 1. Lấy thông tin quiz (kèm câu hỏi + options)
      const quizRes = await api.get(`/quizzes/${quizId}/questions`);
      const quiz = quizRes.data;

      if (quiz) {
        // Map câu hỏi từ DB về dạng state local cho QuizForm
        const mappedQuestions = (quiz.questions || []).map(q => {
          // correct_answer_indexes lưu 1-based (e.g. [1, 3]), convert về 0-based array ([0, 2])
          const correctIndexes0Based = (q.correct_answer_indexes || [1]).map(idx => Number(idx) - 1);

          // Map options
          const opts = (q.options || []).map(opt => opt.text_content || '');
          // If fewer than 4 options, pad to 4
          while (opts.length < 4) opts.push('');

          return {
            id: q.question_id,
            question_id: q.question_id,
            isNew: false,
            question_type: q.question_type || 'MULTIPLE_CHOICE',
            description: q.description || '',
            image_url: q.image_url || '',
            question_score: q.question_score ?? 2.5,
            options: opts,
            correct_indexes: correctIndexes0Based,
            short_answer_key: q.short_answer_key || '',
            coding_language: q.coding_language || 'cpp',
            s3_object_code: q.s3_object_code || '',
            hidden_code: q.hidden_code || '',
            test_cases: q.test_cases || [],
            originalOptions: q.options || []
          };
        });

        setInitialData({
          title: quiz.title || '',
          time_limit: quiz.time_limit ?? 30,
          max_entry: quiz.max_entry ?? 1,
          total_score: quiz.total_score ?? 10,
          open_time: quiz.open_time,
          deadline_time: quiz.deadline_time,
          shuffle_questions: quiz.shuffle_questions !== false,
          show_answers_mode: quiz.show_answers_mode || 'AFTER_DEADLINE',
          chapter_id: quiz.chapter_id,
          questions: mappedQuestions
        });
      }

      // 2. Lấy tên lớp
      const classRes = await api.get(`/classes/view/${courseId}`);
      const cName = classRes.data?.class?.course_name || classRes.data?.class_name || `Lớp học ${courseId}`;
      setCourseName(cName);
    } catch (err) {
      console.error('Lỗi tải chi tiết Quiz:', err);
      showToast('Không thể tải thông tin bài Quiz.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmitQuiz = async (formData) => {
    setLoading(true);
    try {
      // 1. Cập nhật thông tin Quiz
      await api.put(`/quizzes/${quizId}`, {
        chapter_id: initialData?.chapter_id ? Number(initialData.chapter_id) : undefined,
        class_id: Number(courseId),
        title: formData.title,
        time_limit: formData.time_limit,
        max_entry: formData.max_entry,
        total_score: formData.total_score,
        open_time: formData.open_time,
        deadline_time: formData.deadline_time,
        shuffle_questions: formData.shuffle_questions,
        show_answers_mode: formData.show_answers_mode
      });

      // 2. Xử lý từng câu hỏi
      for (let i = 0; i < (formData.questions || []).length; i++) {
        const q = formData.questions[i];
        if (!q.description || !q.description.trim()) continue;

        const correctIndexes1Based = (q.correct_indexes || [0]).map(idx => idx + 1);

        const qPayload = {
          quiz_id: Number(quizId),
          question_index: i + 1,
          question_type: q.question_type,
          description: q.description.trim(),
          image_url: q.image_url ? q.image_url.trim() : undefined,
          question_score: Number(q.question_score) || 0,
          correct_answer_indexes: q.question_type === 'MULTIPLE_CHOICE' ? correctIndexes1Based : undefined,
          short_answer_key: q.question_type === 'SHORT_ANSWER' ? (q.short_answer_key || '').trim() : undefined,
          coding_language: q.question_type === 'CODE' ? q.coding_language : undefined,
          s3_object_code: q.question_type === 'CODE' ? q.s3_object_code : undefined,
          hidden_code: q.question_type === 'CODE' ? q.hidden_code : undefined,
          test_cases: q.question_type === 'CODE' ? q.test_cases : undefined
        };

        if (q.isNew) {
          // Tạo mới
          const qRes = await api.post('/questions', qPayload);
          const newQuestionId = qRes.data.question_id;

          if (q.question_type === 'MULTIPLE_CHOICE' && q.options) {
            for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
              const optText = q.options[optIdx];
              if (optText && optText.trim()) {
                await api.post('/question-options', {
                  question_id: newQuestionId,
                  option_index: optIdx + 1,
                  text_content: optText.trim()
                });
              }
            }
          }
        } else {
          // Cập nhật câu hỏi cũ
          await api.put(`/questions/${q.question_id}`, qPayload);

          if (q.question_type === 'MULTIPLE_CHOICE') {
            // Xóa options cũ
            for (const origOpt of (q.originalOptions || [])) {
              if (origOpt.option_id) {
                try { await api.delete(`/question-options/${origOpt.option_id}`); } catch (_) {}
              }
            }
            // Tạo options mới
            for (let optIdx = 0; optIdx < (q.options || []).length; optIdx++) {
              const optText = q.options[optIdx];
              if (optText && optText.trim()) {
                await api.post('/question-options', {
                  question_id: q.question_id,
                  option_index: optIdx + 1,
                  text_content: optText.trim()
                });
              }
            }
          }
        }
      }

      showToast('Đã cập nhật bài Quiz và câu hỏi thành công!', 'success');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error updating quiz:', err);
      showToast(err.response?.data?.error || 'Không thể cập nhật bài Quiz. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDetails) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>
        ⏳ Đang tải thông tin chi tiết bài Quiz...
      </div>
    );
  }

  return (
    <QuizForm
      isEdit={true}
      courseId={courseId}
      quizId={quizId}
      courseName={courseName}
      initialData={initialData}
      onSubmit={handleSubmitQuiz}
      loading={loading}
    />
  );
}

export default EditQuiz;
