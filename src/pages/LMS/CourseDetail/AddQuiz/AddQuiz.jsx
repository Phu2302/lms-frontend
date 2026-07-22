import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import { useToast } from '../../../../components/Toast/ToastContext';
import QuizForm from '../QuizForm/QuizForm';

function AddQuiz() {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [courseName, setCourseName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/classes/view/${courseId}`);
        const data = res.data;
        const cName = data?.class?.course_name || data?.class_name || data?.course_name || `Lớp học ${courseId}`;
        setCourseName(cName);

        const chapterList = data.chapters || data.Chapters || [];
        const currentChapter = chapterList.find(c => Number(c.chapter_id) === Number(chapterId));
        if (currentChapter) {
          setChapterName(currentChapter.chapter_name);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin chi tiết:', err);
      }
    };
    fetchDetails();
  }, [courseId, chapterId]);

  const handleSubmitQuiz = async (formData) => {
    setLoading(true);
    try {
      // 1. Tạo Quiz
      const quizRes = await api.post('/quizzes', {
        chapter_id: Number(chapterId),
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

      const newQuizId = quizRes.data.quiz_id;

      // 2. Tạo từng câu hỏi & options
      for (let i = 0; i < (formData.questions || []).length; i++) {
        const q = formData.questions[i];
        if (!q.description || !q.description.trim()) continue;

        // correct_answer_indexes: chuyển từ 0-based local index thành 1-based array
        const correctIndexes1Based = (q.correct_indexes || [0]).map(idx => idx + 1);

        const qPayload = {
          quiz_id: newQuizId,
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

        const qRes = await api.post('/questions', qPayload);
        const newQuestionId = qRes.data.question_id;

        // Nếu là MULTIPLE_CHOICE, tạo các Options
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
      }

      showToast('Tạo bài Quiz và danh sách câu hỏi thành công!', 'success');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      showToast(err.response?.data?.error || 'Không thể tạo quiz mới. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <QuizForm
      isEdit={false}
      courseId={courseId}
      chapterId={chapterId}
      courseName={courseName}
      chapterName={chapterName}
      onSubmit={handleSubmitQuiz}
      loading={loading}
    />
  );
}

export default AddQuiz;
