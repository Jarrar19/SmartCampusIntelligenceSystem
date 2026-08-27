import React, { useState, useEffect } from 'react';
import { 
  Award, AlertTriangle, BookOpen, Download, Calendar, 
  CheckCircle2, TrendingUp, BarChart3, Clock, ArrowRight, 
  RefreshCw, FileText, Youtube, ExternalLink, Play, Layers,
  Compass, Lightbulb, GraduationCap
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ListRowSkeleton } from '../../components/common/Skeleton';

interface CuratedResourceSet {
  youtubeVideos: Array<{ title: string; channel: string; duration: string; url: string; topic: string }>;
  webResources: Array<{ title: string; source: string; description: string; url: string; type: string }>;
  improvementPlan: Array<{ step: string; action: string; duration: string }>;
}

interface PerformanceData {
  studentName: string;
  department: string;
  semester: number;
  cgpaHistory: Array<{ sem: string; cgpa: number }>;
  coursePerformance: Array<{
    courseId: number;
    courseCode: string;
    title: string;
    mseMarks: number[];
    eseMarks: number[];
    assignmentMarks: number[];
    percentage: number;
  }>;
  weakCourses: Array<{
    courseId: number;
    courseCode: string;
    title: string;
    percentage: number;
  }>;
  strongCourses: Array<{
    courseId: number;
    courseCode: string;
    title: string;
    percentage: number;
  }>;
  recommendedResources: Array<{
    id: number;
    title: string;
    category: string;
    fileName: string;
    downloadsCount: number;
    subjectCode?: string;
  }>;
  curatedResources?: Record<string, CuratedResourceSet>;
  insights?: {
    overallStanding: string;
    weaknessSummary: string;
    actionPlan: string[];
  };
  aiInsights?: {
    overallStanding: string;
    weaknessSummary: string;
    actionPlan: string[];
  };
}

const DEFAULT_CURATED_MAP: Record<string, CuratedResourceSet> = {
  'Data Structures & Algorithms': {
    youtubeVideos: [
      { title: 'Data Structures Full Course - Abdul Bari', channel: 'Abdul Bari', duration: '12 Hours', url: 'https://www.youtube.com/results?search_query=abdul+bari+data+structures', topic: 'Trees, Graphs & Dynamic Programming' },
      { title: 'DSA One Shot Revision for University Exams', channel: 'Gate Smashers', duration: '4.5 Hours', url: 'https://www.youtube.com/results?search_query=gate+smashers+data+structures', topic: 'BST, AVL Rotations & Sorting' },
      { title: 'Data Structures in C/C++ Tutorial', channel: 'mycodeschool', duration: '8 Hours', url: 'https://www.youtube.com/results?search_query=mycodeschool+data+structures', topic: 'Pointers, Linked Lists & Stacks' },
    ],
    webResources: [
      { title: 'GeeksforGeeks Data Structures Portal', source: 'GeeksforGeeks', description: 'Interactive tutorials, visualizers, and solved university exam problems.', url: 'https://www.geeksforgeeks.org/data-structures/', type: 'Web Portal' },
      { title: 'LeetCode Top 100 Exam & Interview Questions', source: 'LeetCode', description: 'Curated list of array, string, tree, and dynamic programming questions.', url: 'https://leetcode.com/problemset/all/', type: 'Practice Platform' },
      { title: 'VisuAlgo - Data Structure Animations', source: 'VisuAlgo', description: 'Step-by-step animation of tree rotations, sorting, and graph traversals.', url: 'https://visualgo.net/', type: 'Interactive Tool' },
    ],
    improvementPlan: [
      { step: 'Phase 1: Conceptual Core', action: 'Watch Gate Smashers / Abdul Bari videos on Tree Rotations & Recursion.', duration: 'Days 1-2' },
      { step: 'Phase 2: Code Practice', action: 'Implement 5 BST and AVL operations in C++/Python from scratch.', duration: 'Days 3-4' },
      { step: 'Phase 3: PYQ Solving', action: 'Solve 3 previous year End-Semester exam question papers under 2-hour timer.', duration: 'Days 5-6' },
      { step: 'Phase 4: Revision', action: 'Summarize time complexities (Big-O) cheatsheet and review step marks strategy.', duration: 'Day 7' },
    ],
  },
  'Database Management Systems': {
    youtubeVideos: [
      { title: 'DBMS Complete Playlist for University Exams', channel: 'Gate Smashers', duration: '9 Hours', url: 'https://www.youtube.com/results?search_query=gate+smashers+dbms', topic: 'Normalization, SQL & Transactions' },
      { title: 'Database Design & SQL Course', channel: 'freeCodeCamp', duration: '5 Hours', url: 'https://www.youtube.com/results?search_query=freecodecamp+sql+database+course', topic: 'SQL Queries, Joins & Indexing' },
      { title: 'NPTEL Database Management Systems', channel: 'IIT Kharagpur / NPTEL', duration: '20 Hours', url: 'https://www.youtube.com/results?search_query=nptel+database+management+systems', topic: 'B+ Trees & ACID Properties' },
    ],
    webResources: [
      { title: 'SQLZoo Interactive SQL Tutorial', source: 'SQLZoo', description: 'Hands-on live SQL query builder with real-time feedback.', url: 'https://sqlzoo.net/', type: 'Interactive Practice' },
      { title: 'GeeksforGeeks DBMS Normalization Guide', source: 'GeeksforGeeks', description: 'Step-by-step 1NF, 2NF, 3NF, BCNF decomposition examples.', url: 'https://www.geeksforgeeks.org/dbms/', type: 'Study Guide' },
      { title: 'PostgreSQL & MySQL Documentation', source: 'DevDocs', description: 'Standard relational syntax, indexing, and transaction handling.', url: 'https://devdocs.io/sqlite/', type: 'Documentation' },
    ],
    improvementPlan: [
      { step: 'Phase 1: Normalization Rules', action: 'Master 1NF, 2NF, 3NF & BCNF functional dependency decomposition rules.', duration: 'Days 1-2' },
      { step: 'Phase 2: SQL Mastery', action: 'Practice complex SQL queries involving GROUP BY, HAVING, and INNER/LEFT JOINs.', duration: 'Days 3-4' },
      { step: 'Phase 3: Transaction Theory', action: 'Revise ACID properties, Conflict Serializability & Two-Phase Locking (2PL).', duration: 'Days 5-6' },
      { step: 'Phase 4: Speed Drills', action: 'Solve past 3 years university exam DBMS numericals.', duration: 'Day 7' },
    ],
  },
  'Artificial Intelligence & Machine Learning': {
    youtubeVideos: [
      { title: 'Machine Learning Course - StatQuest', channel: 'StatQuest with Josh Starmer', duration: '6 Hours', url: 'https://www.youtube.com/results?search_query=statquest+machine+learning', topic: 'Linear Regression, Decision Trees & SVM' },
      { title: 'Deep Learning Specialization Overview', channel: 'DeepLearning.AI / Andrew Ng', duration: '10 Hours', url: 'https://www.youtube.com/results?search_query=andrew+ng+machine+learning', topic: 'Neural Networks & Backpropagation' },
      { title: 'AI & ML Complete University Playlist', channel: 'Gate Smashers', duration: '8 Hours', url: 'https://www.youtube.com/results?search_query=gate+smashers+machine+learning', topic: 'Supervised vs Unsupervised ML' },
    ],
    webResources: [
      { title: 'Scikit-Learn Official User Guide', source: 'Scikit-Learn', description: 'Machine learning algorithms implementation and API references.', url: 'https://scikit-learn.org/stable/', type: 'Official Docs' },
      { title: 'Kaggle Datasets & Notebooks', source: 'Kaggle', description: 'Real-world datasets, ML pipelines, and model evaluation examples.', url: 'https://www.kaggle.com/learn', type: 'Learning Platform' },
      { title: '3Blue1Brown Neural Networks Series', source: '3Blue1Brown', description: 'Visual calculus and linear algebra behind backpropagation.', url: 'https://www.3blue1brown.com/topics/neural-networks', type: 'Visual Guide' },
    ],
    improvementPlan: [
      { step: 'Phase 1: Math Foundations', action: 'Revise Linear Algebra (Matrices, Vectors) and Gradient Descent formulas.', duration: 'Days 1-2' },
      { step: 'Phase 2: Algorithm Breakdown', action: 'Study Decision Trees, SVM, KNN, Naive Bayes, and Confusion Matrix metrics.', duration: 'Days 3-4' },
      { step: 'Phase 3: PyTorch/Scikit Code', action: 'Implement linear regression and binary classification model in Python.', duration: 'Days 5-6' },
      { step: 'Phase 4: Formula Recap', action: 'Review Precision, Recall, F1-Score, and Loss Function equations.', duration: 'Day 7' },
    ],
  },
  'Engineering Mathematics': {
    youtubeVideos: [
      { title: 'Engineering Mathematics 1 & 2', channel: 'Gajendra Purohit', duration: '15 Hours', url: 'https://www.youtube.com/results?search_query=gajendra+purohit+engineering+mathematics', topic: 'Eigenvalues, Matrices & Calculus' },
      { title: 'Linear Algebra Essence', channel: '3Blue1Brown', duration: '4 Hours', url: 'https://www.youtube.com/results?search_query=3blue1brown+linear+algebra', topic: 'Matrix Transformations & Vectors' },
      { title: 'NPTEL Mathematics for Engineers', channel: 'NPTEL', duration: '18 Hours', url: 'https://www.youtube.com/results?search_query=nptel+engineering+mathematics', topic: 'Differential Equations & Fourier Series' },
    ],
    webResources: [
      { title: 'Paul Online Math Notes', source: 'Lamar University', description: 'Comprehensive calculus, differential equations, and linear algebra notes.', url: 'https://tutorial.math.lamar.edu/', type: 'Study Notes' },
      { title: 'Khan Academy Linear Algebra', source: 'Khan Academy', description: 'Step-by-step videos and practice exercises for matrices and determinants.', url: 'https://www.khanacademy.org/math/linear-algebra', type: 'Practice Platform' },
    ],
    improvementPlan: [
      { step: 'Phase 1: Matrix Properties', action: 'Practice characteristic equation $|A - \\lambda I| = 0$ and Cayley-Hamilton Theorem.', duration: 'Days 1-2' },
      { step: 'Phase 2: Differential Calculus', action: 'Solve 10 problems on Partial Differentiation and Taylor Series expansion.', duration: 'Days 3-4' },
      { step: 'Phase 3: Fourier & Laplace', action: 'Derive Fourier series coefficients $a_0, a_n, b_n$ for periodic functions.', duration: 'Days 5-6' },
      { step: 'Phase 4: Speed Practice', action: 'Solve 5 university end-sem mathematics papers with clean step writing.', duration: 'Day 7' },
    ],
  },
};

const DEFAULT_PERFORMANCE_DATA: PerformanceData = {
  studentName: 'Campus Student',
  department: 'Artificial Intelligence & Machine Learning',
  semester: 6,
  cgpaHistory: [
    { sem: 'Sem 1', cgpa: 7.8 },
    { sem: 'Sem 2', cgpa: 8.1 },
    { sem: 'Sem 3', cgpa: 7.4 },
    { sem: 'Sem 4', cgpa: 8.3 },
    { sem: 'Sem 5', cgpa: 7.9 },
    { sem: 'Sem 6', cgpa: 8.2 },
  ],
  coursePerformance: [
    { courseId: 1, courseCode: 'CS301', title: 'Data Structures & Algorithms', mseMarks: [54], eseMarks: [58], assignmentMarks: [68], percentage: 56 },
    { courseId: 2, courseCode: 'CS302', title: 'Database Management Systems', mseMarks: [62], eseMarks: [60], assignmentMarks: [72], percentage: 61 },
    { courseId: 3, courseCode: 'AI601', title: 'Artificial Intelligence & Machine Learning', mseMarks: [78], eseMarks: [82], assignmentMarks: [88], percentage: 82 },
    { courseId: 4, courseCode: 'MA201', title: 'Engineering Mathematics', mseMarks: [58], eseMarks: [64], assignmentMarks: [70], percentage: 62 },
  ],
  weakCourses: [
    { courseId: 1, courseCode: 'CS301', title: 'Data Structures & Algorithms', percentage: 56 },
    { courseId: 2, courseCode: 'CS302', title: 'Database Management Systems', percentage: 61 },
  ],
  strongCourses: [
    { courseId: 3, courseCode: 'AI601', title: 'Artificial Intelligence & Machine Learning', percentage: 82 },
  ],
  recommendedResources: [
    { id: 1, title: 'DSA Module 1-5 Lecture Notes.pdf', category: 'NOTES', fileName: 'dsa_notes_sample.pdf', downloadsCount: 142, subjectCode: 'CS301' },
    { id: 2, title: 'CS301 End Semester Question Paper 2024.pdf', category: 'PYQ', fileName: 'cs301_pyq_2024.pdf', downloadsCount: 98, subjectCode: 'CS301' },
    { id: 3, title: 'DBMS Quick Revision & Normalization Guide.pdf', category: 'STUDENT_GUIDE', fileName: 'dbms_study_guide.pdf', downloadsCount: 115, subjectCode: 'CS302' },
  ],
  curatedResources: DEFAULT_CURATED_MAP,
  insights: {
    overallStanding: 'Moderate Academic Standing (Focused Revision Needed in 2 Subjects)',
    weaknessSummary: 'Analysis of past MSE and ESE exams indicates performance drops in Data Structures & Algorithms (56%) and Database Management Systems (61%). Focus on fundamental problem solving and recommended video tutorials below.',
    actionPlan: [
      'Review lecture notes and YouTube video series for Data Structures & Algorithms.',
      'Schedule dedicated 45-minute revision blocks for weak module topics twice a week.',
      'Solve at least 2 Previous Year Question Papers (PYQs) under timed exam conditions.',
      'Consult your designated Teacher Guardian (TG) Mentor during Tuesday/Thursday office hours.',
    ],
  },
};

export const SmartAiPage: React.FC = () => {
  const { success, error } = useToast();

  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Weak Subject for Improvement Planner & Video Hub
  const [selectedSubject, setSelectedSubject] = useState<string>('Data Structures & Algorithms');

  // Study Plan State
  const [activePlanTimeframe, setActivePlanTimeframe] = useState<'7_DAYS' | '30_DAYS'>('7_DAYS');
  const [studyPlan, setStudyPlan] = useState<Array<{ day: string; subject: string; task: string; focus: string; duration: string }> | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const fetchPerformance = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/ai/performance-analysis');
      if (res.data.success && res.data.data) {
        const perfData: PerformanceData = res.data.data;
        setData(perfData);
        if (perfData.weakCourses && perfData.weakCourses.length > 0) {
          setSelectedSubject(perfData.weakCourses[0].title);
        } else if (perfData.coursePerformance && perfData.coursePerformance.length > 0) {
          setSelectedSubject(perfData.coursePerformance[0].title);
        }
      } else {
        setData(DEFAULT_PERFORMANCE_DATA);
      }
    } catch (err: any) {
      setData(DEFAULT_PERFORMANCE_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleGeneratePlan = async (timeframe: '7_DAYS' | '30_DAYS') => {
    setActivePlanTimeframe(timeframe);
    setIsGeneratingPlan(true);
    try {
      const res = await api.post('/ai/generate-study-plan', { timeframe });
      if (res.data.success) {
        setStudyPlan(res.data.data.plan);
        success(`${timeframe === '7_DAYS' ? '7-Day' : '30-Day'} Revision Schedule generated!`);
      }
    } catch (err: any) {
      error('Failed to generate study plan');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleDownloadResource = async (resourceId: number, fileName: string) => {
    try {
      const response = await api.get(`/resources/${resourceId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'study_notes.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success(`Downloading ${fileName}`);
    } catch (err) {
      error('Download failed');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </div>
    );
  }

  // Active dataset with complete default fallbacks
  const displayData = data || DEFAULT_PERFORMANCE_DATA;

  // Get resources for currently selected subject or fallback
  const currentCuratedSet: CuratedResourceSet = 
    displayData.curatedResources?.[selectedSubject] ||
    DEFAULT_CURATED_MAP[selectedSubject] ||
    DEFAULT_CURATED_MAP['Data Structures & Algorithms'];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card-hero border border-white/16 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-2xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Academic Performance & Learning Advisor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#ECFDF5] tracking-tight leading-tight">
            Weak Subject Improvement Planner & Video Resource Hub
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3A8] leading-relaxed font-medium">
            Diagnoses academic scores across past Mid-Semester Exams (MSE), End-Semester Exams (ESE), and Assignment grades. Recommends targeted 4-phase improvement roadmaps, top YouTube video tutorials, and web resources.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B2921]/80 border border-white/10 text-right space-y-1 backdrop-blur-md flex-shrink-0">
          <span className="text-[10px] font-black uppercase text-[#94A3A8] tracking-wider block">Academic Standing</span>
          <p className="text-sm font-black text-emerald-400">
            {displayData.insights?.overallStanding || displayData.aiInsights?.overallStanding || 'Good Academic Standing'}
          </p>
          <p className="text-[10px] text-[#94A3A8]">
            Department: {displayData.department || 'CSE'} • Semester {displayData.semester || 6}
          </p>
        </div>
      </div>

      {/* Grid: Weakness Diagnostics & Score Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Subject Mastery & Weakness Meters */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-white/12 space-y-5 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#ECFDF5] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span>Exam Score Diagnostics & Subject Mastery</span>
              </h3>
              <Button variant="ghost" size="xs" onClick={fetchPerformance} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              {displayData.coursePerformance.map((course) => {
                const isWeak = course.percentage < 65;
                const isSelected = selectedSubject === course.title;

                return (
                  <div
                    key={course.courseId}
                    onClick={() => setSelectedSubject(course.title)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B2921] border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/40'
                        : 'bg-[#0B2921]/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                          {course.courseCode}
                        </span>
                        <h4 className="text-sm font-black text-[#ECFDF5]">
                          {course.title}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                        isWeak
                          ? 'bg-rose-950/80 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {course.percentage}% Avg ({isWeak ? 'Weak Domain' : 'Strong Mastery'})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-white/10 mt-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWeak
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${Math.max(10, course.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#94A3A8] mt-2">
                      <span>MSE Mid-Term: {course.mseMarks && course.mseMarks.length > 0 ? `${course.mseMarks[0]}%` : 'N/A'}</span>
                      <span>ESE End-Term: {course.eseMarks && course.eseMarks.length > 0 ? `${course.eseMarks[0]}%` : 'N/A'}</span>
                      <span>Assignments: {course.assignmentMarks && course.assignmentMarks.length > 0 ? `${course.assignmentMarks[0]}%` : 'Evaluated'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Institutional Uploaded Notes & PYQs */}
          <div className="p-6 rounded-3xl glass-panel border border-white/12 space-y-4 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#ECFDF5] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Uploaded Faculty Notes & PYQs</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayData.recommendedResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl bg-[#0B2921]/80 border border-white/10 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs font-black text-[#ECFDF5] truncate">
                        {res.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94A3A8] truncate">
                      {res.subjectCode ? `${res.subjectCode} • ` : ''}{res.category} • {res.downloadsCount} downloads
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleDownloadResource(res.id, res.fileName)}
                    leftIcon={<Download className="w-3 h-3" />}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black flex-shrink-0"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Selected Subject Improvement Planner & Video Resource Hub */}
        <div className="lg:col-span-5 space-y-6">
          {/* Subject Selector Header */}
          <div className="p-6 rounded-3xl glass-panel border border-emerald-500/30 space-y-4 shadow-xl bg-gradient-to-br from-emerald-950/40 via-transparent to-emerald-950/20 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <h3 className="text-base font-black text-[#ECFDF5]">
                  Subject Improvement Strategy
                </h3>
              </div>
              <Badge variant="emerald" size="xs font-bold">
                {selectedSubject}
              </Badge>
            </div>

            <p className="text-xs text-[#94A3A8] font-medium">
              Click any subject on the left panel to load tailored YouTube video lectures, web documentation, and 4-phase revision milestones.
            </p>

            {/* 4-Phase Improvement Plan */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-black text-[#ECFDF5] block flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <span>4-Phase Revision & Improvement Milestones:</span>
              </span>

              <div className="space-y-2">
                {currentCuratedSet.improvementPlan.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#0B2921]/90 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">{item.step}</span>
                      <span className="text-[10px] text-[#94A3A8] bg-white/10 px-2 py-0.5 rounded-md font-bold">{item.duration}</span>
                    </div>
                    <p className="text-xs text-[#ECFDF5] font-medium">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Curated YouTube Video Tutorials */}
          <div className="p-6 rounded-3xl glass-panel border border-white/12 space-y-4 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#ECFDF5] flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-500" />
                <span>Curated YouTube Video Lectures</span>
              </h3>
            </div>

            <div className="space-y-3">
              {currentCuratedSet.youtubeVideos.map((video, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#0B2921]/80 border border-white/10 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Play className="w-3.5 h-3.5 text-rose-400 fill-current flex-shrink-0" />
                      <h4 className="text-xs font-black text-[#ECFDF5] truncate">
                        {video.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-[#94A3A8] truncate">
                      Channel: <span className="text-emerald-400 font-bold">{video.channel}</span> • {video.duration} • {video.topic}
                    </p>
                  </div>

                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-black transition flex items-center gap-1 flex-shrink-0"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Web Resources & Portals */}
          <div className="p-6 rounded-3xl glass-panel border border-white/12 space-y-4 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#ECFDF5] flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Web Learning Resources & Documentation</span>
              </h3>
            </div>

            <div className="space-y-3">
              {currentCuratedSet.webResources.map((web, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#0B2921]/80 border border-white/10 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        {web.type}
                      </span>
                      <h4 className="text-xs font-black text-[#ECFDF5] truncate">
                        {web.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-[#94A3A8] line-clamp-2">
                      {web.description}
                    </p>
                  </div>

                  <a
                    href={web.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition flex-shrink-0"
                    title="Open Web Resource"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day / 30-Day Revision Roadmap Builder */}
          <div className="p-6 rounded-3xl glass-panel border border-white/12 space-y-4 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#ECFDF5] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Generate Revision Schedule</span>
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={activePlanTimeframe === '7_DAYS' ? 'primary' : 'glass'}
                size="xs"
                onClick={() => handleGeneratePlan('7_DAYS')}
                isLoading={isGeneratingPlan && activePlanTimeframe === '7_DAYS'}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black"
              >
                7-Day Intensive Plan
              </Button>
              <Button
                variant={activePlanTimeframe === '30_DAYS' ? 'primary' : 'glass'}
                size="xs"
                onClick={() => handleGeneratePlan('30_DAYS')}
                isLoading={isGeneratingPlan && activePlanTimeframe === '30_DAYS'}
                className="flex-1 bg-white/10 text-[#ECFDF5] border border-white/15"
              >
                30-Day Semester Plan
              </Button>
            </div>

            {studyPlan && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-xs font-black text-emerald-400 block">
                  Generated Daily Timetable:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {studyPlan.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#0B2921]/70 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400">{item.day}: {item.subject}</span>
                        <span className="text-[10px] text-[#94A3A8] bg-white/10 px-2 py-0.5 rounded-md">{item.duration}</span>
                      </div>
                      <p className="text-xs text-[#ECFDF5] font-medium">{item.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
