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
import './CourseDetail.css';

function CourseDetail() {
  const { courseId } = useParams(); // Lấy mã môn học từ URL (ví dụ: CO3005)
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // State quản lý Tab nào đang bật (Nếu có URL param ?tab= thì lấy tab đó khi Reload, nếu vào từ trang danh sách thì mặc định là 'khoahoc')
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
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const currentUserId = currentUser?.user_id;
  const userRole = currentUser?.role ? String(currentUser.role) : '1';
  
  const isTeacher = userRole === '2';
  const isOwner = classData?.class?.owner_id === currentUserId;
  const isAdmin = userRole === '3';
  const hasEditingPrivileges = (isTeacher && isOwner) || isAdmin;

  // Add Chapter state
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  // Add Quiz state
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizOpenTime, setNewQuizOpenTime] = useState('');
  const [newQuizDeadline, setNewQuizDeadline] = useState('');

  // Add Forum state
  const [showAddForumModal, setShowAddForumModal] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');

  // Add Material state
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('DOCUMENT');
  const [newMaterialLink, setNewMaterialLink] = useState('');

  // Edit Material state
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Delete state
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'chapter'|'quiz'|'forum'|'material', id: number }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Gọi API lấy chi tiết class khi component mount
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
      
      // Extract chapters từ response
      const chapterList = data.chapters || data.Chapters || [];
      const materials = data.materials || data.Materials || [];
      const quizzes = data.quizzes || data.Quizzes || [];
      const forums = data.forums || data.Forums || [];
      
      // Map materials, quizzes, forums to their corresponding chapter
      const chaptersWithContent = chapterList.map(chapter => {
        const chapterId = Number(chapter.chapter_id);
        return {
          ...chapter,
          materials: materials.filter(m => Number(m.chapter_id) === chapterId),
          quizzes: quizzes.filter(q => Number(q.chapter_id) === chapterId),
          forums: forums.filter(f => Number(f.chapter_id) === chapterId),
          assignments: []
        };
      });

      setChapters(chaptersWithContent);
      
      // Mặc định tất cả các chương đều mở (thả xuống ▼), giữ trạng thái cuộn lên (▶) từ URL hoặc localStorage khi F5 / out ra vào lại
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

        // Lấy tất cả bài quiz của lớp
        const chapterList = classData?.chapters || classData?.Chapters || [];
        const quizzes = classData?.quizzes || classData?.Quizzes || [];
        const quizList = [];
        chapterList.forEach(chapter => {
          quizzes.filter(q => Number(q.chapter_id) === Number(chapter.chapter_id)).forEach(q => quizList.push(q));
        });

        // Lấy entry của tất cả quiz
        const quizDetailsMap = {}; // map student_id -> array of { title, max_score, achieved_score, entry_start_time }
        let totalQuizMaxScore = 0;

        await Promise.all(quizList.map(async (q) => {
          try {
            const entryRes = await getAllQuizEntriesAPI(q.quiz_id);
            const entries = entryRes.data || [];
            totalQuizMaxScore += Number(q.total_score || 0);

            entries.forEach(entry => {
              const sid = entry.student_id;
              if (!quizDetailsMap[sid]) quizDetailsMap[sid] = [];
              quizDetailsMap[sid].push({
                quiz_id: q.quiz_id,
                title: q.title,
                max_score: Number(q.total_score || 0),
                achieved_score: Number(entry.entry_score || 0),
                entry_start_time: entry.entry_start_time
              });
            });
          } catch (e) {
            console.warn(`Lỗi tải entries cho quiz ${q.quiz_id}`);
          }
        }));

        setStudentQuizDetails(quizDetailsMap);

        // Tính điểm quiz tự động cho từng sinh viên
        grades = grades.map(g => {
          const sid = g.student_id;
          const details = quizDetailsMap[sid] || [];
          let achievedSum = 0;
          details.forEach(d => achievedSum += d.achieved_score);
          
          let autoQuizGrade = 0;
          if (totalQuizMaxScore > 0) {
             autoQuizGrade = (achievedSum / totalQuizMaxScore) * 10;
          }
          return {
            ...g,
            quiz_grade: g.quiz_grade != null && g.quiz_grade !== '' ? g.quiz_grade : Number(autoQuizGrade.toFixed(2))
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

  // Hàm đảo ngược trạng thái đóng/mở khi click vào Header của Accordion
  const toggleSection = (index) => {
    const isCurrentlyOpen = openSections[index] !== false;
    const newOpenState = !isCurrentlyOpen;

    const updatedSections = [...openSections];
    updatedSections[index] = newOpenState;
    setOpenSections(updatedSections);

    // Lưu danh sách index các chương bị cuộn lên (đóng) vào URL & localStorage để giữ khi F5 hoặc khi Out ra vào lại
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
        chapter_order: chapters.length + 1
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
        deadline_time: newQuizDeadline ? new Date(newQuizDeadline).toISOString() : undefined
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
        description: newForumDescription.trim()
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

    const targetChapter = chapters.find(c => Number(c.chapter_id) === Number(targetChapterId));
    const chapterOrder = targetChapter ? targetChapter.chapter_order : 1;

    try {
      await createMaterialAPI({
        chapter_id: Number(targetChapterId),
        class_id: Number(courseId),
        title: newMaterialTitle.trim(),
        material_type: newMaterialType,
        content_link: newMaterialLink.trim() || undefined,
        chapter_order: chapterOrder
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
      content_link: mat.content_link || ''
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
        chapter_id: editingMaterial.chapter_id
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
        content: newAnnouncementContent.trim()
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
    setClassGrades(prev => prev.map(item => {
      if (item.student_id === studentId) {
        const updated = { ...item, [field]: numVal };
        // Tự động tính điểm tổng kết (10% quiz + 20% assign + 30% mid + 40% final)
        const q = updated.quiz_grade ?? 0;
        const a = updated.assignment_grade ?? 0;
        const m = updated.midterm_grade ?? 0;
        const f = updated.final_grade ?? 0;
        if (updated.quiz_grade != null || updated.assignment_grade != null || updated.midterm_grade != null || updated.final_grade != null) {
          updated.total_grade = Number((q * 0.10 + a * 0.20 + m * 0.30 + f * 0.40).toFixed(2));
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSaveBatchGrades = async () => {
    // 1. Kiểm tra không có trọng số nào < 0
    if (quizWeight < 0 || assignmentWeight < 0 || midtermWeight < 0 || finalWeight < 0) {
      showToast('Trọng số tỷ lệ phần trăm các cột không được nhỏ hơn 0%!', 'error');
      return;
    }

    // 2. Kiểm tra tổng phần trăm các cột phải đúng 100%
    const totalWeight = quizWeight + assignmentWeight + midtermWeight + finalWeight;
    if (totalWeight !== 100) {
      showToast(`Tổng phần trăm trọng số các cột phải đúng bằng 100%! (Hiện tại tổng là ${totalWeight}%)`, 'error');
      return;
    }

    // 3. Kiểm tra điểm nhập vào từ 0 đến 10
    for (const g of classGrades) {
      const gradesToCheck = [
        { name: 'Quiz', val: g.quiz_grade },
        { name: 'Bài tập', val: g.assignment_grade },
        { name: 'Giữa kỳ', val: g.midterm_grade },
        { name: 'Cuối kỳ', val: g.final_grade }
      ];
      for (const item of gradesToCheck) {
        if (item.val !== '' && item.val !== null && item.val !== undefined) {
          const num = Number(item.val);
          if (isNaN(num) || num < 0 || num > 10) {
            showToast(`Điểm ${item.name} của sinh viên ${g.user_name || g.student_id} phải nằm trong khoảng từ 0 đến 10!`, 'error');
            return;
          }
        }
      }
    }

    setIsSavingGrades(true);
    try {
      const gradesToSave = classGrades.map(g => {
        const computedTotal = (
          (Number(g.quiz_grade || 0) * quizWeight) +
          (Number(g.assignment_grade || 0) * assignmentWeight) +
          (Number(g.midterm_grade || 0) * midtermWeight) +
          (Number(g.final_grade || 0) * finalWeight)
        ) / 100;
        return {
          ...g,
          total_grade: Number(computedTotal.toFixed(2)),
          percentage_1: quizWeight,
          percentage_2: assignmentWeight,
          percentage_3: midtermWeight,
          percentage_4: finalWeight
        };
      });

      await saveBatchGradesAPI({
        class_id: Number(courseId),
        grades: gradesToSave
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

  // Lấy tên class để hiển thị
  const className = classData?.class?.course_name || classData?.class_name || classData?.course_name || `Lớp học ${courseId}`;

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
    if (e.target.tagName.toLowerCase() === 'input') return; // Không mở modal khi đang gõ điểm
    openQuizModal(g.student_id, g.user_name);
  };

  return (
    <div className="course-detail-container">
      
      {/* TẬN DỤNG LẠI THANH NAVBAR NGANG TRÊN CÙNG ĐỂ ĐỒ ÁN ĐỒNG BỘ */}
      <Header view="courses" />

      {/* NỘI DUNG CHI TIẾT LỚP HỌC */}
      <div className="course-detail-body">
        
        {/* Nút quay lại danh sách nhanh */}
        <button 
          onClick={() => navigate('/lms/course')} 
          style={{ marginBottom: '15px', cursor: 'pointer', padding: '5px 10px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          ← Trở về danh sách môn
        </button>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            ⏳ Đang tải chi tiết lớp học...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#c00', background: '#fee', borderRadius: '8px', margin: '10px 0' }}>
            {error}
            <br />
            <button onClick={fetchClassDetail} style={{ marginTop: '10px', padding: '6px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Nội dung chính khi đã load xong */}
        {!loading && !error && (
          <>
            {/* Tên môn học đầy đủ */}
            <h1 className="course-detail-title" style={{ marginBottom: '5px' }}>
              {className}
            </h1>
            {classData?.class?.falcuty_name && (
              <div style={{ fontSize: '14px', color: '#666666', marginBottom: '20px', fontStyle: 'italic' }}>
                Khoa: {classData.class.falcuty_name}
              </div>
            )}

            {/* BLOCK THÔNG BÁO LỚP HỌC (ANNOUNCEMENTS BANNER) */}
            <div style={{ background: '#e6fffa', border: '1px solid #b2f5ea', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#234e52', fontSize: '16px' }}>📢 THÔNG BÁO LỚP HỌC</h3>
                {hasEditingPrivileges && (
                  <button 
                    onClick={() => setShowAddAnnouncementModal(true)}
                    style={{ background: '#234e52', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                  >
                    + Tạo thông báo mới
                  </button>
                )}
              </div>
              {announcements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {announcements.map((anc) => (
                    <div key={anc.announcement_id} style={{ background: '#fff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#2d3748', fontSize: '15px' }}>{anc.title}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#718096' }}>
                            {anc.author_name || 'Giảng viên'} - {anc.created_at ? new Date(anc.created_at).toLocaleDateString('vi-VN') : ''}
                          </span>
                          {hasEditingPrivileges && (
                            <button 
                              onClick={() => handleDeleteAnnouncement(anc.announcement_id)}
                              style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              ✕ Xóa
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: '6px 0 0 0', color: '#4a5568', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{anc.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#4a5568', fontStyle: 'italic' }}>Chưa có thông báo mới cho lớp học này.</div>
              )}
            </div>

            {/* THANH CHỨA TÁC VỤ TAB (Khóa học / Điểm) */}
            <div className="tabs-bar">
              <button 
                className={`tab-button ${activeTab === 'khoahoc' ? 'active' : 'inactive'}`}
                onClick={() => handleTabChange('khoahoc')}
              >
                Khóa học
              </button>
              <button 
                className={`tab-button ${activeTab === 'diem' ? 'active' : 'inactive'}`}
                onClick={() => handleTabChange('diem')}
              >
                Điểm
              </button>
            </div>

            {/* NỘI DUNG HIỂN THỊ DƯỚI TAB */}
            {activeTab === 'khoahoc' ? (
              
              // --- DIỆN MẠO TAB KHÓA HỌC (CHỨA CÁC ACCORDION DYNAMIC) ---
              <div className="accordion-wrapper">
                
                {hasEditingPrivileges && (
                  <div className="teacher-chapter-actions">
                    <button className="add-chapter-btn" onClick={() => setShowAddChapterModal(true)}>
                      + Thêm chương học mới
                    </button>
                  </div>
                )}

                {chapters.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    📭 Chưa có chương học nào cho lớp này.
                  </div>
                )}

                {chapters.map((chapter, index) => (
                  <div key={chapter.chapter_id || chapter.id || index} className="accordion-item">
                    <div className="accordion-header" onClick={() => toggleSection(index)}>
                      <div className="accordion-header-left">
                        <span className={`accordion-arrow ${openSections[index] !== false ? 'open' : 'closed'}`}>
                          {openSections[index] !== false ? '▼' : '▶'}
                        </span>
                        <span className="accordion-title">
                          {chapter.chapter_name || chapter.title || `Chương ${index + 1}`}
                        </span>
                      </div>
                      {hasEditingPrivileges && (
                        <button 
                          className="delete-chapter-btn" 
                          onClick={(e) => confirmDelete(e, 'chapter', chapter.chapter_id)}
                          title="Xóa chương này"
                        >
                          🗑️ Xóa chương
                        </button>
                      )}
                    </div>
                    
                    {/* Nội dung xổ xuống nếu mở */}
                    {openSections[index] !== false && (
                      <div className="accordion-content">
                        {hasEditingPrivileges && (
                          <div className="teacher-item-actions">
                            <button 
                              className="add-item-btn" 
                              onClick={() => navigate(`/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-material?order=${chapter.chapter_order || 1}`)}
                            >
                              + Thêm Tài liệu/Video
                            </button>
                            <button 
                              className="add-item-btn" 
                              onClick={() => navigate(`/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-quiz`)}
                            >
                              + Thêm bài Quiz
                            </button>
                            <button 
                              className="add-item-btn" 
                              onClick={() => navigate(`/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-forum`)}
                            >
                              + Thêm Diễn đàn thảo luận
                            </button>
                          </div>
                        )}

                        {/* Materials */}
                        {(chapter.materials || []).map((mat, mi) => (
                          <div key={mi} className="content-row flex-row-justify" onClick={() => {
                            if (mat.content_link) {
                              window.open(mat.content_link, '_blank');
                            } else {
                              showToast(`Đang mở tài liệu: ${mat.material_name || mat.title}`, 'info');
                            }
                          }}>
                            <div className="content-row-left">
                              <span className="content-icon">{mat.material_type === 'VIDEO' ? '🎥' : '📄'}</span>
                              <span>{mat.material_name || mat.title || 'Tài liệu'}</span>
                            </div>
                            {hasEditingPrivileges && (
                              <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <button 
                                  className="delete-item-btn-small" 
                                  style={{ background: '#3182ce', borderColor: '#3182ce' }}
                                  onClick={(e) => handleOpenEditMaterial(e, mat)}
                                  title="Sửa học liệu"
                                >
                                  ✏️ Sửa
                                </button>
                                <button 
                                  className="delete-item-btn-small" 
                                  onClick={(e) => confirmDelete(e, 'material', mat.material_id || mat.id)}
                                  title="Xóa tài liệu"
                                >
                                  🗑️ Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
 
                        {/* Quizzes */}
                        {(chapter.quizzes || []).map((quiz, qi) => (
                          <div key={qi} className="content-row flex-row-justify" onClick={() => navigate(`/lms/quiz/${quiz.quiz_id || quiz.id}`)}>
                            <div className="content-row-left">
                              <span className="content-icon">📝</span>
                              <span>{quiz.quiz_name || quiz.title || 'Quiz'}</span>
                            </div>
                            {hasEditingPrivileges && (
                              <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                <button 
                                  className="delete-item-btn-small" 
                                  style={{ background: '#3182ce', borderColor: '#3182ce' }}
                                  onClick={(e) => navigate(`/lms/course/${courseId}/quiz/${quiz.quiz_id || quiz.id}/edit`)}
                                  title="Sửa Quiz"
                                >
                                  ✏️ Sửa
                                </button>
                                <button 
                                  className="delete-item-btn-small" 
                                  onClick={(e) => confirmDelete(e, 'quiz', quiz.quiz_id || quiz.id)}
                                  title="Xóa Quiz"
                                >
                                  🗑️ Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
 
                        {/* Forums */}
                        {(chapter.forums || []).map((forum, fi) => (
                          <div key={fi} className="content-row flex-row-justify" onClick={() => navigate(`/lms/course/${courseId}/forum/${forum.forum_id || forum.id}`)}>
                            <div className="content-row-left">
                              <span className="content-icon">💬</span>
                              <span>{forum.forum_name || forum.title || 'Forum'}</span>
                            </div>
                            {hasEditingPrivileges && (
                              <button 
                                className="delete-item-btn-small" 
                                onClick={(e) => confirmDelete(e, 'forum', forum.forum_id || forum.id)}
                                title="Xóa diễn đàn"
                              >
                                🗑️ Xóa
                              </button>
                            )}
                          </div>
                        ))}
 
                        {/* Assignments */}
                        {(chapter.assignments || []).map((assign, ai) => (
                          <div key={ai} className="content-row" onClick={() => navigate(`/lms/assignment/${assign.assignment_id || assign.id}`)}>
                            <span className="content-icon">📤</span>
                            <span>{assign.assignment_name || assign.title || 'Bài tập'}</span>
                          </div>
                        ))}
 
                        {/* Nếu chương trống */}
                        {!(chapter.materials?.length || chapter.quizzes?.length || chapter.forums?.length || chapter.assignments?.length) && (
                          <div className="empty-content-text">Chưa có tài liệu hoặc hoạt động nào cho chương này.</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              </div>

            ) : (
              // --- DIỆN MẠO TAB ĐIỂM SỐ ---
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
                {hasEditingPrivileges ? (
                  /* GIAO DIỆN CHẤM ĐIỂM DÀNH CHO GIẢNG VIÊN */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0 }}>📊 Bảng điểm sinh viên lớp {courseId}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                          <input 
                            type="checkbox" 
                            checked={isGradesPublished} 
                            onChange={handleTogglePublishGrades}
                            style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                          />
                          Công bố điểm
                        </label>
                        <button 
                          onClick={handleSaveBatchGrades}
                          disabled={isSavingGrades}
                          style={{ background: '#008b44', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          {isSavingGrades ? 'Đang lưu...' : '💾 Lưu bảng điểm'}
                        </button>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="student-data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>MSSV</th>
                            <th>Tên Sinh viên</th>
                            <th>Quiz (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={quizWeight} onChange={e => setQuizWeight(Number(e.target.value))}/>%)</th>
                            <th>Bài tập (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={assignmentWeight} onChange={e => setAssignmentWeight(Number(e.target.value))}/>%)</th>
                            <th>Giữa kỳ (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={midtermWeight} onChange={e => setMidtermWeight(Number(e.target.value))}/>%)</th>
                            <th>Cuối kỳ (<input type="number" style={{width: '35px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'}} value={finalWeight} onChange={e => setFinalWeight(Number(e.target.value))}/>%)</th>
                            <th>Tổng kết</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classGrades.length > 0 ? (
                            classGrades.map((g, idx) => {
                              const computedTotal = (
                                (Number(g.quiz_grade || 0) * quizWeight) +
                                (Number(g.assignment_grade || 0) * assignmentWeight) +
                                (Number(g.midterm_grade || 0) * midtermWeight) +
                                (Number(g.final_grade || 0) * finalWeight)
                              ) / 100;
                              return (
                                <tr 
                                  key={g.student_id} 
                                  onClick={(e) => handleRowClick(e, g)}
                                  style={{ cursor: 'pointer' }}
                                  title="Nhấn vào để xem chi tiết Quiz"
                                >
                                  <td>{idx + 1}</td>
                                  <td><strong>{g.student_id}</strong></td>
                                  <td>{g.user_name || 'N/A'}</td>
                                  <td>
                                    <input 
                                      type="number" 
                                      step="0.1" min="0" max="10" 
                                      style={{ width: '70px', padding: '4px', textAlign: 'center' }}
                                      value={g.quiz_grade ?? ''} 
                                      onChange={(e) => handleGradeChange(g.student_id, 'quiz_grade', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      type="number" 
                                      step="0.1" min="0" max="10" 
                                      style={{ width: '70px', padding: '4px', textAlign: 'center' }}
                                      value={g.assignment_grade ?? ''} 
                                      onChange={(e) => handleGradeChange(g.student_id, 'assignment_grade', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      type="number" 
                                      step="0.1" min="0" max="10" 
                                      style={{ width: '70px', padding: '4px', textAlign: 'center' }}
                                      value={g.midterm_grade ?? ''} 
                                      onChange={(e) => handleGradeChange(g.student_id, 'midterm_grade', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input 
                                      type="number" 
                                      step="0.1" min="0" max="10" 
                                      style={{ width: '70px', padding: '4px', textAlign: 'center' }}
                                      value={g.final_grade ?? ''} 
                                      onChange={(e) => handleGradeChange(g.student_id, 'final_grade', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <strong style={{ color: computedTotal >= 5.0 ? '#008b44' : '#e53e3e' }}>
                                      {computedTotal.toFixed(2)}
                                    </strong>
                                  </td>
                                  <td>
                                    <input 
                                      type="text" 
                                      style={{ width: '120px', padding: '4px' }}
                                      value={g.note ?? ''} 
                                      onChange={(e) => handleGradeChange(g.student_id, 'note', e.target.value)}
                                      placeholder="..."
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>Chưa có sinh viên nào đăng ký lớp học này.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* GIAO DIỆN XEM ĐIỂM DÀNH CHO SINH VIÊN */
                  <div>
                    <h3>Bảng điểm cá nhân môn học</h3>
                    {studentOwnGrade ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginTop: '15px' }}>
                          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#718096' }}>Quiz ({studentOwnGrade.percentage_1 ? (Number(studentOwnGrade.percentage_1) <= 1 ? Math.round(Number(studentOwnGrade.percentage_1) * 100) : Number(studentOwnGrade.percentage_1)) : 10}%)</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{studentOwnGrade.quiz_grade ?? '--'}</div>
                          </div>
                          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#718096' }}>Bài tập ({studentOwnGrade.percentage_2 ? (Number(studentOwnGrade.percentage_2) <= 1 ? Math.round(Number(studentOwnGrade.percentage_2) * 100) : Number(studentOwnGrade.percentage_2)) : 20}%)</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{studentOwnGrade.assignment_grade ?? '--'}</div>
                          </div>
                          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#718096' }}>Giữa kỳ ({studentOwnGrade.percentage_3 ? (Number(studentOwnGrade.percentage_3) <= 1 ? Math.round(Number(studentOwnGrade.percentage_3) * 100) : Number(studentOwnGrade.percentage_3)) : 30}%)</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{studentOwnGrade.midterm_grade ?? '--'}</div>
                          </div>
                          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#718096' }}>Cuối kỳ ({studentOwnGrade.percentage_4 ? (Number(studentOwnGrade.percentage_4) <= 1 ? Math.round(Number(studentOwnGrade.percentage_4) * 100) : Number(studentOwnGrade.percentage_4)) : 40}%)</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{studentOwnGrade.final_grade ?? '--'}</div>
                          </div>
                          <div style={{ background: '#e6fffa', padding: '12px', borderRadius: '6px', border: '1px solid #b2f5ea', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#234e52', fontWeight: 'bold' }}>Điểm Tổng Kết</span>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#008b44' }}>{studentOwnGrade.total_grade ?? '--'}</div>
                          </div>
                        </div>
                        {studentOwnGrade.note && (
                          <div style={{ marginTop: '15px', background: '#fffaf0', padding: '12px', borderRadius: '6px', border: '1px solid #feebc8', color: '#744210' }}>
                            <strong>Ghi chú từ giảng viên:</strong> {studentOwnGrade.note}
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ marginTop: '10px', color: '#666' }}>Chưa có dữ liệu điểm số công bố cho học kỳ này.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* Modal Tạo Thông Báo Lớp Mới */}
      {showAddAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAddAnnouncementModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddAnnouncement}>
            <div className="modal-header">
              <h3>Tạo thông báo lớp học mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddAnnouncementModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tiêu đề thông báo:</label>
                <input 
                  type="text" 
                  value={newAnnouncementTitle} 
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề thông báo..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nội dung thông báo:</label>
                <textarea 
                  value={newAnnouncementContent} 
                  onChange={(e) => setNewAnnouncementContent(e.target.value)} 
                  placeholder="Nhập nội dung chi tiết thông báo..." 
                  rows="4" 
                  required 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Đăng thông báo</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddAnnouncementModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Chương mới */}
      {showAddChapterModal && (
        <div className="modal-overlay" onClick={() => setShowAddChapterModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddChapter}>
            <div className="modal-header">
              <h3>Thêm chương học mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddChapterModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên chương học:</label>
                <input 
                  type="text" 
                  value={newChapterName} 
                  onChange={(e) => setNewChapterName(e.target.value)} 
                  placeholder="Nhập tên chương..." 
                  required 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Thêm chương</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddChapterModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Quiz mới */}
      {showAddQuizModal && (
        <div className="modal-overlay" onClick={() => setShowAddQuizModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddQuiz}>
            <div className="modal-header">
              <h3>Thêm bài Quiz mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddQuizModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tiêu đề bài kiểm tra (Quiz):</label>
                <input 
                  type="text" 
                  value={newQuizTitle} 
                  onChange={(e) => setNewQuizTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề quiz..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Thời gian mở đề (Tùy chọn):</label>
                <input 
                  type="datetime-local" 
                  value={newQuizOpenTime} 
                  onChange={(e) => setNewQuizOpenTime(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Hạn chót nộp bài (Tùy chọn):</label>
                <input 
                  type="datetime-local" 
                  value={newQuizDeadline} 
                  onChange={(e) => setNewQuizDeadline(e.target.value)} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Tạo Quiz</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddQuizModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Diễn đàn mới */}
      {showAddForumModal && (
        <div className="modal-overlay" onClick={() => setShowAddForumModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddForum}>
            <div className="modal-header">
              <h3>Thêm diễn đàn thảo luận mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddForumModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tiêu đề Diễn đàn:</label>
                <input 
                  type="text" 
                  value={newForumTitle} 
                  onChange={(e) => setNewForumTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề diễn đàn..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn (Mục đích thảo luận):</label>
                <textarea 
                  value={newForumDescription} 
                  onChange={(e) => setNewForumDescription(e.target.value)} 
                  placeholder="Nhập mô tả diễn đàn..." 
                  rows="3" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Tạo Diễn đàn</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddForumModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Tài liệu/Video mới */}
      {showAddMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowAddMaterialModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddMaterial}>
            <div className="modal-header">
              <h3>Thêm tài liệu hoặc video mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddMaterialModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Loại học liệu:</label>
                <select 
                  value={newMaterialType} 
                  onChange={(e) => setNewMaterialType(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', outline: 'none' }}
                >
                  <option value="DOCUMENT">📄 Tài liệu (PDF/Word/PowerPoint)</option>
                  <option value="VIDEO">🎥 Video bài giảng (Youtube link/Video link)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề học liệu:</label>
                <input 
                  type="text" 
                  value={newMaterialTitle} 
                  onChange={(e) => setNewMaterialTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề học liệu..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Đường dẫn liên kết (Link tải/Link xem):</label>
                <input 
                  type="url" 
                  value={newMaterialLink} 
                  onChange={(e) => setNewMaterialLink(e.target.value)} 
                  placeholder="https://example.com/..." 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Thêm học liệu</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddMaterialModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Chỉnh Sửa Học Liệu */}
      {showEditMaterialModal && editingMaterial && (
        <div className="modal-overlay" onClick={() => setShowEditMaterialModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdateMaterial}>
            <div className="modal-header">
              <h3>Chỉnh sửa học liệu</h3>
              <button type="button" className="close-btn" onClick={() => setShowEditMaterialModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Loại học liệu:</label>
                <select 
                  value={editingMaterial.material_type} 
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, material_type: e.target.value })}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', outline: 'none' }}
                >
                  <option value="DOCUMENT">📄 Tài liệu (PDF/Word/PowerPoint)</option>
                  <option value="VIDEO">🎥 Video bài giảng (Youtube link/Video link)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề học liệu:</label>
                <input 
                  type="text" 
                  value={editingMaterial.title} 
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })} 
                  placeholder="Nhập tiêu đề học liệu..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Đường dẫn liên kết (Link tải/Link xem):</label>
                <input 
                  type="url" 
                  value={editingMaterial.content_link} 
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, content_link: e.target.value })} 
                  placeholder="https://example.com/..." 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Lưu thay đổi</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowEditMaterialModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {showDeleteConfirm && itemToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-header">
              <h3>Xác nhận xóa</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa {itemToDelete.type === 'chapter' ? 'chương học' : itemToDelete.type === 'quiz' ? 'bài Quiz' : itemToDelete.type === 'forum' ? 'diễn đàn thảo luận' : 'tài liệu/video'} này không?
                Hành động này sẽ xóa vĩnh viễn mục đã chọn và không thể hoàn tác.
              </p>
            </div>
            <div className="modal-footer">
              <button className="confirm-delete-btn" onClick={executeDelete}>Xóa vĩnh viễn</button>
              <button className="dismiss-btn" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL XEM CHI TIẾT QUIZ (Popup) */}
      {selectedQuizStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <h2>Chi tiết điểm Quiz của sinh viên: {selectedQuizStudent.name} ({selectedQuizStudent.id})</h2>
            
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              {studentQuizDetails[selectedQuizStudent.id] && studentQuizDetails[selectedQuizStudent.id].length > 0 ? (
                <table className="student-data-table">
                  <thead>
                    <tr>
                      <th>Tên Quiz</th>
                      <th>Điểm đạt được</th>
                      <th>Tổng điểm (Quiz)</th>
                      <th>Thời gian nộp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentQuizDetails[selectedQuizStudent.id].map((detail, idx) => (
                      <tr key={idx}>
                        <td>{detail.title}</td>
                        <td style={{ fontWeight: 'bold' }}>{detail.achieved_score}</td>
                        <td>{detail.max_score}</td>
                        <td>{detail.entry_start_time ? new Date(detail.entry_start_time).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ fontStyle: 'italic', color: '#718096', textAlign: 'center' }}>Sinh viên này chưa làm bài quiz nào.</div>
              )}
            </div>
            
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeQuizModal} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CourseDetail;