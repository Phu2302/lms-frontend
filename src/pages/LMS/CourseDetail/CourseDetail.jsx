import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getClassDetailAPI } from '../../../api/LMS/CourseDetail/classes';
import { createChapterAPI, deleteChapterAPI } from '../../../api/LMS/CourseDetail/chapters';
import { createQuizAPI, deleteQuizAPI } from '../../../api/LMS/CourseDetail/quizzes';
import { createForumAPI, deleteForumAPI } from '../../../api/LMS/CourseDetail/forums';
import { createMaterialAPI, updateMaterialAPI, deleteMaterialAPI } from '../../../api/LMS/CourseDetail/materials';
import { getClassAnnouncementsAPI, createAnnouncementAPI, deleteAnnouncementAPI } from '../../../api/teacher/announcements';
import { getClassGradesAPI, saveBatchGradesAPI, getStudentGradeAPI, publishGradesAPI } from '../../../api/teacher/grades';
import { getAllQuizEntriesAPI } from '../../../api/LMS/CourseDetail/quizEntries';
import Header from '../../../components/Header/Header';
import { useToast } from '../../../components/Toast/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

import AnnouncementBanner from './AnnouncementBanner/AnnouncementBanner';
import CourseTabNav from './CourseTabNav/CourseTabNav';
import ChapterTab from './ChapterTab/ChapterTab';
import GradeTab from './GradeTab/GradeTab';
import {
  AddAnnouncementModal,
  AddChapterModal,
  AddQuizModal,
  AddForumModal,
  AddMaterialModal,
  EditMaterialModal,
  DeleteConfirmModal,
  QuizDetailsModal,
} from './CourseModals/CourseModals';

import './CourseDetail.css';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user, isTeacher, isAdmin } = useAuth();

  // State quản lý Tab đang bật
  const initialTab = searchParams.get('tab') || 'khoahoc';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName }, { replace: true });
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'khoahoc';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // State dữ liệu từ API
  const [classData, setClassData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');

  // State Grades (Bảng điểm)
  const [classGrades, setClassGrades] = useState([]);
  const [studentOwnGrade, setStudentOwnGrade] = useState(null);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [isGradesPublished, setIsGradesPublished] = useState(false);
  const [selectedQuizStudent, setSelectedQuizStudent] = useState(null);
  const [studentQuizDetails, setStudentQuizDetails] = useState({});

  // Cấu hình tỷ lệ phần trăm (Trọng số)
  const [quizWeight, setQuizWeight] = useState(10);
  const [assignmentWeight, setAssignmentWeight] = useState(20);
  const [midtermWeight, setMidtermWeight] = useState(30);
  const [finalWeight, setFinalWeight] = useState(40);

  // State quản lý trạng thái đóng/mở của các Accordion
  const [openSections, setOpenSections] = useState([]);

  // Quyền chỉnh sửa của giảng viên sở hữu lớp hoặc admin
  const currentUserId = user?.user_id;
  const isOwner = classData?.class?.owner_id === currentUserId;
  const hasEditingPrivileges = (isTeacher && isOwner) || isAdmin;

  // Modals state
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizOpenTime, setNewQuizOpenTime] = useState('');
  const [newQuizDeadline, setNewQuizDeadline] = useState('');

  const [showAddForumModal, setShowAddForumModal] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('DOCUMENT');
  const [newMaterialLink, setNewMaterialLink] = useState('');

  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchClassDetail();
    fetchAnnouncements();
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'diem') {
      fetchGradesData();
    }
  }, [activeTab, courseId, hasEditingPrivileges]);

  const fetchClassDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getClassDetailAPI(courseId);
      const data = res.data;

      setClassData(data);

      if (data.class && data.class.is_grades_published !== undefined) {
        setIsGradesPublished(Boolean(data.class.is_grades_published));
      }

      const chapterList = data.chapters || data.Chapters || [];
      const materials = data.materials || data.Materials || [];
      const quizzes = data.quizzes || data.Quizzes || [];
      const forums = data.forums || data.Forums || [];

      const chaptersWithContent = chapterList.map((chapter) => {
        const cId = Number(chapter.chapter_id);
        return {
          ...chapter,
          materials: materials.filter((m) => Number(m.chapter_id) === cId),
          quizzes: quizzes.filter((q) => Number(q.chapter_id) === cId),
          forums: forums.filter((f) => Number(f.chapter_id) === cId),
          assignments: [],
        };
      });

      setChapters(chaptersWithContent);

      if (data.class?.course_name || data.class_name) {
        document.title = `${data.class?.course_name || data.class_name} - BK LMS`;
      }

      const closedParam = searchParams.get('closed');
      let closedIndexes = [];
      if (closedParam !== null) {
        closedIndexes = closedParam ? closedParam.split(',').map(Number) : [];
      } else {
        try {
          const savedClosed = localStorage.getItem(`collapsed_chapters_${courseId}_${currentUserId}`);
          if (savedClosed) {
            closedIndexes = JSON.parse(savedClosed);
          }
        } catch (e) {}
      }
      setOpenSections(chapterList.map((_, i) => !closedIndexes.includes(i)));
    } catch (err) {
      console.error('Lỗi tải chi tiết lớp học:', err);
      const status = err.response?.status;
      if (status === 403) {
        setError('Bạn không có quyền truy cập lớp học này.');
      } else if (status === 404) {
        setError('Không tìm thấy lớp học này.');
      } else {
        setError('Không thể tải chi tiết lớp học. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await getClassAnnouncementsAPI(courseId);
      setAnnouncements(res.data || []);
    } catch (err) {
      console.warn('Lỗi tải thông báo lớp:', err);
    }
  };

  const fetchGradesData = async () => {
    try {
      if (hasEditingPrivileges) {
        const res = await getClassGradesAPI(courseId);
        let grades = res.data || [];

        if (grades.length > 0) {
          const first = grades[0];
          const parseWeight = (val, defaultVal) => {
            if (val === null || val === undefined || val === '') return defaultVal;
            const num = Number(val);
            if (isNaN(num)) return defaultVal;
            return num <= 1 && num > 0 ? Math.round(num * 100) : num;
          };
          setQuizWeight(parseWeight(first.percentage_1, 10));
          setAssignmentWeight(parseWeight(first.percentage_2, 20));
          setMidtermWeight(parseWeight(first.percentage_3, 30));
          setFinalWeight(parseWeight(first.percentage_4, 40));
        }

        const chapterList = classData?.chapters || classData?.Chapters || [];
        const quizzes = classData?.quizzes || classData?.Quizzes || [];
        const quizList = [];
        chapterList.forEach((chapter) => {
          quizzes.filter((q) => Number(q.chapter_id) === Number(chapter.chapter_id)).forEach((q) => quizList.push(q));
        });

        const quizDetailsMap = {};
        let totalQuizMaxScore = 0;

        await Promise.all(
          quizList.map(async (q) => {
            try {
              const entryRes = await getAllQuizEntriesAPI(q.quiz_id);
              const entries = entryRes.data || [];
              totalQuizMaxScore += Number(q.total_score || 0);

              entries.forEach((entry) => {
                const sid = entry.student_id;
                if (!quizDetailsMap[sid]) quizDetailsMap[sid] = [];
                quizDetailsMap[sid].push({
                  quiz_id: q.quiz_id,
                  title: q.title,
                  max_score: Number(q.total_score || 0),
                  achieved_score: Number(entry.entry_score || 0),
                  entry_start_time: entry.entry_start_time,
                });
              });
            } catch (e) {
              console.warn(`Lỗi tải entries cho quiz ${q.quiz_id}`);
            }
          })
        );

        setStudentQuizDetails(quizDetailsMap);

        grades = grades.map((g) => {
          const sid = g.student_id;
          const details = quizDetailsMap[sid] || [];
          let achievedSum = 0;
          details.forEach((d) => (achievedSum += d.achieved_score));

          let autoQuizGrade = 0;
          if (totalQuizMaxScore > 0) {
            autoQuizGrade = (achievedSum / totalQuizMaxScore) * 10;
          }
          return {
            ...g,
            quiz_grade: g.quiz_grade != null && g.quiz_grade !== '' ? g.quiz_grade : Number(autoQuizGrade.toFixed(2)),
          };
        });

        setClassGrades(grades);
      } else {
        const res = await getStudentGradeAPI(courseId);
        setStudentOwnGrade(res.data || null);
      }
    } catch (err) {
      console.warn('Lỗi tải điểm số:', err);
    }
  };

  const toggleSection = (index) => {
    const isCurrentlyOpen = openSections[index] !== false;
    const newOpenState = !isCurrentlyOpen;

    const updatedSections = [...openSections];
    updatedSections[index] = newOpenState;
    setOpenSections(updatedSections);

    const currentClosed = [];
    updatedSections.forEach((isOpen, i) => {
      if (isOpen === false) currentClosed.push(i);
    });

    try {
      localStorage.setItem(`collapsed_chapters_${courseId}_${currentUserId}`, JSON.stringify(currentClosed));
    } catch (e) {}

    const newSearchParams = new URLSearchParams(searchParams);
    if (currentClosed.length > 0) {
      newSearchParams.set('closed', currentClosed.join(','));
    } else {
      newSearchParams.delete('closed');
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;
    try {
      await createChapterAPI({
        class_id: Number(courseId),
        chapter_name: newChapterName.trim(),
        chapter_order: chapters.length + 1,
      });
      setNewChapterName('');
      setShowAddChapterModal(false);
      fetchClassDetail();
    } catch (err) {
      console.error('Error creating chapter:', err);
      showToast(err.response?.data?.error || 'Không thể tạo chương mới. Vui lòng thử lại.', 'error');
    }
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    if (!newQuizTitle.trim() || !targetChapterId) return;
    try {
      await createQuizAPI({
        chapter_id: Number(targetChapterId),
        class_id: Number(courseId),
        title: newQuizTitle.trim(),
        open_time: newQuizOpenTime ? new Date(newQuizOpenTime).toISOString() : undefined,
        deadline_time: newQuizDeadline ? new Date(newQuizDeadline).toISOString() : undefined,
      });
      setNewQuizTitle('');
      setNewQuizOpenTime('');
      setNewQuizDeadline('');
      setTargetChapterId(null);
      setShowAddQuizModal(false);
      fetchClassDetail();
      showToast('Đã tạo bài Quiz thành công!', 'success');
    } catch (err) {
      console.error('Error creating quiz:', err);
      showToast(err.response?.data?.error || 'Không thể tạo quiz mới. Vui lòng thử lại.', 'error');
    }
  };

  const handleAddForum = async (e) => {
    e.preventDefault();
    if (!newForumTitle.trim() || !targetChapterId) return;
    try {
      await createForumAPI({
        chapter_id: Number(targetChapterId),
        title: newForumTitle.trim(),
        description: newForumDescription.trim(),
      });
      setNewForumTitle('');
      setNewForumDescription('');
      setTargetChapterId(null);
      setShowAddForumModal(false);
      fetchClassDetail();
      showToast('Đã tạo diễn đàn thảo luận thành công!', 'success');
    } catch (err) {
      console.error('Error creating forum:', err);
      showToast(err.response?.data?.error || 'Không thể tạo diễn đàn thảo luận mới. Vui lòng thử lại.', 'error');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialTitle.trim() || !targetChapterId) return;

    const targetChapter = chapters.find((c) => Number(c.chapter_id) === Number(targetChapterId));
    const chapterOrder = targetChapter ? targetChapter.chapter_order : 1;

    try {
      await createMaterialAPI({
        chapter_id: Number(targetChapterId),
        class_id: Number(courseId),
        title: newMaterialTitle.trim(),
        material_type: newMaterialType,
        content_link: newMaterialLink.trim() || undefined,
        chapter_order: chapterOrder,
      });
      setNewMaterialTitle('');
      setNewMaterialType('DOCUMENT');
      setNewMaterialLink('');
      setTargetChapterId(null);
      setShowAddMaterialModal(false);
      fetchClassDetail();
      showToast('Đã tạo học liệu mới thành công!', 'success');
    } catch (err) {
      console.error('Error creating material:', err);
      showToast(err.response?.data?.error || 'Không thể tạo học liệu mới. Vui lòng thử lại.', 'error');
    }
  };

  const handleOpenEditMaterial = (e, mat) => {
    e.stopPropagation();
    setEditingMaterial({
      material_id: mat.material_id || mat.id,
      chapter_id: mat.chapter_id,
      title: mat.material_name || mat.title || '',
      material_type: mat.material_type || 'DOCUMENT',
      content_link: mat.content_link || '',
    });
    setShowEditMaterialModal(true);
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    if (!editingMaterial || !editingMaterial.title.trim()) return;

    try {
      await updateMaterialAPI(editingMaterial.material_id, {
        title: editingMaterial.title.trim(),
        material_type: editingMaterial.material_type,
        content_link: editingMaterial.content_link.trim() || undefined,
        chapter_id: editingMaterial.chapter_id,
      });
      setShowEditMaterialModal(false);
      setEditingMaterial(null);
      fetchClassDetail();
      showToast('Đã cập nhật học liệu thành công!', 'success');
    } catch (err) {
      console.error('Error updating material:', err);
      showToast(err.response?.data?.error || 'Không thể cập nhật học liệu. Vui lòng thử lại.', 'error');
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return;
    try {
      await createAnnouncementAPI({
        class_id: Number(courseId),
        title: newAnnouncementTitle.trim(),
        content: newAnnouncementContent.trim(),
      });
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setShowAddAnnouncementModal(false);
      fetchAnnouncements();
      showToast('Đã tạo thông báo mới thành công!', 'success');
    } catch (err) {
      console.error('Error creating announcement:', err);
      showToast(err.response?.data?.error || 'Không thể tạo thông báo. Vui lòng thử lại.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      await deleteAnnouncementAPI(id);
      fetchAnnouncements();
      showToast('Đã xóa thông báo.', 'info');
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const handleGradeChange = (studentId, field, val) => {
    const numVal = val === '' ? null : Number(val);
    setClassGrades((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          const updated = { ...item, [field]: numVal };
          const q = updated.quiz_grade ?? 0;
          const a = updated.assignment_grade ?? 0;
          const m = updated.midterm_grade ?? 0;
          const f = updated.final_grade ?? 0;
          if (
            updated.quiz_grade != null ||
            updated.assignment_grade != null ||
            updated.midterm_grade != null ||
            updated.final_grade != null
          ) {
            updated.total_grade = Number((q * 0.1 + a * 0.2 + m * 0.3 + f * 0.4).toFixed(2));
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSaveBatchGrades = async () => {
    if (quizWeight < 0 || assignmentWeight < 0 || midtermWeight < 0 || finalWeight < 0) {
      showToast('Trọng số tỷ lệ phần trăm các cột không được nhỏ hơn 0%!', 'error');
      return;
    }

    const totalWeight = quizWeight + assignmentWeight + midtermWeight + finalWeight;
    if (totalWeight !== 100) {
      showToast(`Tổng phần trăm trọng số các cột phải đúng bằng 100%! (Hiện tại tổng là ${totalWeight}%)`, 'error');
      return;
    }

    for (const g of classGrades) {
      const gradesToCheck = [
        { name: 'Quiz', val: g.quiz_grade },
        { name: 'Bài tập', val: g.assignment_grade },
        { name: 'Giữa kỳ', val: g.midterm_grade },
        { name: 'Cuối kỳ', val: g.final_grade },
      ];
      for (const item of gradesToCheck) {
        if (item.val !== '' && item.val !== null && item.val !== undefined) {
          const num = Number(item.val);
          if (isNaN(num) || num < 0 || num > 10) {
            showToast(
              `Điểm ${item.name} của sinh viên ${g.user_name || g.student_id} phải nằm trong khoảng từ 0 đến 10!`,
              'error'
            );
            return;
          }
        }
      }
    }

    setIsSavingGrades(true);
    try {
      const gradesToSave = classGrades.map((g) => {
        const computedTotal =
          (Number(g.quiz_grade || 0) * quizWeight +
            Number(g.assignment_grade || 0) * assignmentWeight +
            Number(g.midterm_grade || 0) * midtermWeight +
            Number(g.final_grade || 0) * finalWeight) /
          100;
        return {
          ...g,
          total_grade: Number(computedTotal.toFixed(2)),
          percentage_1: quizWeight,
          percentage_2: assignmentWeight,
          percentage_3: midtermWeight,
          percentage_4: finalWeight,
        };
      });

      await saveBatchGradesAPI({
        class_id: Number(courseId),
        grades: gradesToSave,
      });
      showToast('Đã lưu bảng điểm thành công!', 'success');
      fetchGradesData();
    } catch (err) {
      console.error('Error saving grades:', err);
      showToast(err.response?.data?.error || 'Không thể lưu bảng điểm. Vui lòng thử lại.', 'error');
    } finally {
      setIsSavingGrades(false);
    }
  };

  const confirmDelete = (e, type, id) => {
    e.stopPropagation();
    setItemToDelete({ type, id });
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    try {
      if (type === 'chapter') {
        await deleteChapterAPI(id);
      } else if (type === 'quiz') {
        await deleteQuizAPI(id);
      } else if (type === 'forum') {
        await deleteForumAPI(id);
      } else if (type === 'material') {
        await deleteMaterialAPI(id);
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchClassDetail();
      showToast(`Đã xóa thành công!`, 'info');
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      showToast(err.response?.data?.error || `Không thể xóa ${type}. Vui lòng thử lại.`, 'error');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const className =
    classData?.class?.course_name || classData?.class_name || classData?.course_name || `Lớp học ${courseId}`;

  const handleTogglePublishGrades = async () => {
    try {
      const newStatus = !isGradesPublished;
      await publishGradesAPI(courseId, newStatus);
      setIsGradesPublished(newStatus);
      showToast(newStatus ? 'Đã công bố điểm cho sinh viên.' : 'Đã ẩn điểm với sinh viên.', 'info');
    } catch (err) {
      console.error('Lỗi toggle publish grades:', err);
      showToast(err.response?.data?.error || 'Không thể cập nhật cờ công bố điểm. Vui lòng thử lại.', 'error');
    }
  };

  const openQuizModal = (studentId, userName) => {
    setSelectedQuizStudent({ id: studentId, name: userName });
  };

  const closeQuizModal = () => {
    setSelectedQuizStudent(null);
  };

  const handleRowClick = (e, g) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    openQuizModal(g.student_id, g.user_name);
  };

  return (
    <div className="course-detail-container">
      <Header view="courses" />

      <div className="course-detail-body">
        <button
          onClick={() => navigate('/lms/course')}
          className="back-to-courses-btn"
        >
          ← Trở về danh sách môn
        </button>

        {loading && (
          <div className="loading-indicator">
            ⏳ Đang tải chi tiết lớp học...
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
            <br />
            <button onClick={fetchClassDetail} className="retry-btn">
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <h1 className="course-detail-title">{className}</h1>
            {classData?.class?.falcuty_name && (
              <div className="faculty-subtitle">
                Khoa: {classData.class.falcuty_name}
              </div>
            )}

            <AnnouncementBanner
              announcements={announcements}
              hasEditingPrivileges={hasEditingPrivileges}
              onAddClick={() => setShowAddAnnouncementModal(true)}
              onDelete={handleDeleteAnnouncement}
            />

            <CourseTabNav activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'khoahoc' ? (
              <ChapterTab
                courseId={courseId}
                chapters={chapters}
                openSections={openSections}
                hasEditingPrivileges={hasEditingPrivileges}
                onToggleSection={toggleSection}
                onAddChapter={() => setShowAddChapterModal(true)}
                onDeleteItem={confirmDelete}
                onOpenEditMaterial={handleOpenEditMaterial}
              />
            ) : (
              <GradeTab
                courseId={courseId}
                hasEditingPrivileges={hasEditingPrivileges}
                isGradesPublished={isGradesPublished}
                onTogglePublishGrades={handleTogglePublishGrades}
                onSaveBatchGrades={handleSaveBatchGrades}
                isSavingGrades={isSavingGrades}
                classGrades={classGrades}
                quizWeight={quizWeight}
                setQuizWeight={setQuizWeight}
                assignmentWeight={assignmentWeight}
                setAssignmentWeight={setAssignmentWeight}
                midtermWeight={midtermWeight}
                setMidtermWeight={setMidtermWeight}
                finalWeight={finalWeight}
                setFinalWeight={setFinalWeight}
                onGradeChange={handleGradeChange}
                onRowClick={handleRowClick}
                studentOwnGrade={studentOwnGrade}
              />
            )}
          </>
        )}
      </div>

      <AddAnnouncementModal
        show={showAddAnnouncementModal}
        onClose={() => setShowAddAnnouncementModal(false)}
        onSubmit={handleAddAnnouncement}
        title={newAnnouncementTitle}
        setTitle={setNewAnnouncementTitle}
        content={newAnnouncementContent}
        setContent={setNewAnnouncementContent}
      />

      <AddChapterModal
        show={showAddChapterModal}
        onClose={() => setShowAddChapterModal(false)}
        onSubmit={handleAddChapter}
        chapterName={newChapterName}
        setChapterName={setNewChapterName}
      />

      <AddQuizModal
        show={showAddQuizModal}
        onClose={() => setShowAddQuizModal(false)}
        onSubmit={handleAddQuiz}
        title={newQuizTitle}
        setTitle={setNewQuizTitle}
        openTime={newQuizOpenTime}
        setOpenTime={setNewQuizOpenTime}
        deadline={newQuizDeadline}
        setDeadline={setNewQuizDeadline}
      />

      <AddForumModal
        show={showAddForumModal}
        onClose={() => setShowAddForumModal(false)}
        onSubmit={handleAddForum}
        title={newForumTitle}
        setTitle={setNewForumTitle}
        description={newForumDescription}
        setDescription={setNewForumDescription}
      />

      <AddMaterialModal
        show={showAddMaterialModal}
        onClose={() => setShowAddMaterialModal(false)}
        onSubmit={handleAddMaterial}
        type={newMaterialType}
        setType={setNewMaterialType}
        title={newMaterialTitle}
        setTitle={setNewMaterialTitle}
        link={newMaterialLink}
        setLink={setNewMaterialLink}
      />

      <EditMaterialModal
        show={showEditMaterialModal}
        onClose={() => setShowEditMaterialModal(false)}
        onSubmit={handleUpdateMaterial}
        editingMaterial={editingMaterial}
        setEditingMaterial={setEditingMaterial}
      />

      <DeleteConfirmModal
        show={showDeleteConfirm}
        itemToDelete={itemToDelete}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDelete}
      />

      <QuizDetailsModal
        selectedStudent={selectedQuizStudent}
        studentQuizDetails={studentQuizDetails}
        onClose={closeQuizModal}
      />
    </div>
  );
}

export default CourseDetail;