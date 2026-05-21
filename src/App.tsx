import React, { useState, useEffect, useRef } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  arrayUnion,
  addDoc
} from "firebase/firestore";
import { 
  Search, 
  Compass, 
  BookOpen, 
  MessageSquare, 
  FolderClosed, 
  Users, 
  Award, 
  Settings, 
  Flame, 
  Play, 
  CheckCircle2, 
  Plus, 
  Send, 
  Sparkles, 
  Bell, 
  Sun, 
  LogOut, 
  ChevronRight, 
  Lock, 
  X, 
  ChevronDown, 
  ChevronUp,
  LineChart, 
  BookOpenCheck,
  Menu,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

import { db, auth } from "./firebase";
import { DEFAULT_COURSES } from "./data";
import { 
  UserProfile, 
  Course, 
  UserCourseProgress, 
  ChatMessage, 
  StudyLesson, 
  CourseModule, 
  Lesson 
} from "./types";

// Helper categories matching bottom horizontal list
const APP_CATEGORIES = [
  { name: "Marketing", icon: "Megaphone", bg: "bg-pink-500/10 text-pink-500" },
  { name: "Fotografía", icon: "Camera", bg: "bg-purple-500/10 text-purple-500" },
  { name: "Programación", icon: "Code", bg: "bg-emerald-500/10 text-emerald-500" },
  { name: "Diseño", icon: "Palette", bg: "bg-violet-500/10 text-violet-500" },
  { name: "Negocios", icon: "Briefcase", bg: "bg-sky-500/10 text-sky-500" },
  { name: "Finanzas", icon: "Coins", bg: "bg-cyan-500/10 text-cyan-400" },
  { name: "Idiomas", icon: "Languages", bg: "bg-indigo-500/10 text-indigo-400" },
  { name: "Música", icon: "Music", bg: "bg-yellow-500/10 text-yellow-500" },
  { name: "Escritura", icon: "PenTool", bg: "bg-orange-500/10 text-orange-400" },
  { name: "Video", icon: "Video", bg: "bg-teal-500/10 text-teal-400" },
  { name: "Salud", icon: "Heart", bg: "bg-emerald-500/10 text-emerald-400" },
  { name: "Desarrollo Personal", icon: "User", bg: "bg-rose-500/10 text-rose-400" },
  { name: "Ciencia", icon: "Atom", bg: "bg-blue-500/10 text-blue-400" },
  { name: "Tecnología", icon: "Cpu", bg: "bg-purple-500/10 text-purple-400" },
  { name: "Inversión", icon: "TrendingUp", bg: "bg-yellow-500/10 text-yellow-400" },
  { name: "Historia", icon: "BookMarked", bg: "bg-red-500/10 text-red-400" },
  { name: "Artes", icon: "Sparkles", bg: "bg-fuchsia-500/10 text-fuchsia-400" },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Inicio");
  
  // Real-time Database state
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [progresses, setProgresses] = useState<UserCourseProgress[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyLesson[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // UI Interactive States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [learningPrompt, setLearningPrompt] = useState<string>("");
  const [isGeneratingCourse, setIsGeneratingCourse] = useState<boolean>(false);
  const [courseGenError, setCourseGenError] = useState<string | null>(null);
  const [newlyCreatedCourseId, setNewlyCreatedCourseId] = useState<string | null>(null);
  
  // Active selected course for modal overview or learning progression
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ moduleIndex: number; lessonIndex: number } | null>(null);
  
  // Tutor chat states
  const [tutorInput, setTutorInput] = useState<string>("");
  const [isSendingTutorMessage, setIsSendingTutorMessage] = useState<boolean>(false);
  const [tutorContext, setTutorContext] = useState<string>("conceptos fundamentales");
  const [groundedSources, setGroundedSources] = useState<{ title: string; uri: string }[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Mobile UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // 1. Google Authentication State Watcher & Auto-Bootstrapping
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await bootstrapUserData(user);
        
        // Listen to User Profile changes
        const userDocRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        });
        
        // Listen to Progress updates
        const progressColRef = collection(db, "users", user.uid, "progress");
        const unsubProgress = onSnapshot(progressColRef, (snap) => {
          const loadedProgress: UserCourseProgress[] = [];
          snap.forEach((doc) => {
            loadedProgress.push(doc.data() as UserCourseProgress);
          });
          setProgresses(loadedProgress);
        });

        // Listen to Study Plan
        const planColRef = collection(db, "users", user.uid, "studyplan");
        const unsubPlan = onSnapshot(planColRef, (snap) => {
          const loadedPlan: StudyLesson[] = [];
          snap.forEach((doc) => {
            loadedPlan.push(doc.data() as StudyLesson);
          });
          setStudyPlan(loadedPlan);
        });

        // Listen to Chat history
        const chatColRef = collection(db, "users", user.uid, "chat");
        const unsubChat = onSnapshot(query(chatColRef, orderBy("createdAt", "asc")), (snap) => {
          const loadedChat: ChatMessage[] = [];
          snap.forEach((doc) => {
            loadedChat.push(doc.data() as ChatMessage);
          });
          setChatMessages(loadedChat);
        });

        // Listen to user customized AI courses in the global courses collection or cache
        const coursesColRef = collection(db, "courses");
        const unsubCourses = onSnapshot(coursesColRef, (snap) => {
          const allCoursesMap = new Map<string, Course>();
          // Add default static ones first
          DEFAULT_COURSES.forEach(c => allCoursesMap.set(c.id, c));
          // Overwrite/merge with DB generated ones
          snap.forEach((doc) => {
            const courseData = doc.data() as Course;
            allCoursesMap.set(courseData.id, courseData);
          });
          setCourses(Array.from(allCoursesMap.values()));
        });

        return () => {
          unsubProfile();
          unsubProgress();
          unsubPlan();
          unsubChat();
          unsubCourses();
        };
      } else {
        setCurrentUser(null);
        setProfile(null);
        setProgresses([]);
        setStudyPlan([]);
        setChatMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scroll active tutor chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Handle Google Login Trigger
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Popup Auth failed:", err);
    }
  };

  // Sign out user
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSelectedCourse(null);
      setActiveLesson(null);
    } catch (err) {
      console.error("Signout failed:", err);
    }
  };

  // Safe bootstrapping of new registered or logged-in standard user data (Firestore)
  const bootstrapUserData = async (user: FirebaseUser) => {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    const todayString = new Date().toISOString().split("T")[0];

    if (!docSnap.exists()) {
      // 1. Create Profile
      const initialProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Estudiante LearnAI",
        photoURL: user.photoURL || "https://picsum.photos/seed/useravatar/200/200",
        xp: 1500, // Starts with some XP to match mock
        streak: 12, // Preset 12 days study streak matching graphic perfectly
        lastActive: todayString,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, initialProfile);

      // 2. Create Initial Progress to match Mock state:
      // - Marketing: 75%
      // - Fotografía: 40%
      // - Programación: 60%
      const initialTracks = [
        { courseId: "mkt_digital_101", title: "Marketing Digital y Estrategia de Contenidos", pct: 75, cat: "Marketing" },
        { courseId: "foto_prof_101", title: "Fotografía Profesional y Dirección de Luz", pct: 40, cat: "Fotografía" },
        { courseId: "python_intro_202", title: "Introducción a Python y Automatización", pct: 60, cat: "Programación" },
      ];

      for (const track of initialTracks) {
        const progId = `${user.uid}_${track.courseId}`;
        const progressDocRef = doc(db, "users", user.uid, "progress", progId);
        const initialProg: UserCourseProgress = {
          id: progId,
          userId: user.uid,
          courseId: track.courseId,
          courseTitle: track.title,
          category: track.cat,
          progressPercent: track.pct,
          enrolledAt: new Date().toISOString(),
          lastStudiedAt: new Date().toISOString(),
        };
        await setDoc(progressDocRef, initialProg);
      }

      // 3. Create Study planner tasks matching mock checklist exactly
      const initialLessons = [
        { id: "sl_1", title: "Marketing Digital", subtitle: "Estrategias de contenido", cat: "Marketing" },
        { id: "sl_2", title: "Fotografía Profesional", subtitle: "Composición y encuadre", cat: "Fotografía" },
        { id: "sl_3", title: "Introducción a Python", subtitle: "Variables y tipos de datos", cat: "Programación" },
        { id: "sl_4", title: "Mindset para el Éxito", subtitle: "Mentalidad de crecimiento", cat: "Desarrollo Personal" },
      ];

      for (const lesson of initialLessons) {
        const lessonRef = doc(db, "users", user.uid, "studyplan", lesson.id);
        const studyItem: StudyLesson = {
          id: lesson.id,
          userId: user.uid,
          title: lesson.title,
          subtitle: lesson.subtitle,
          category: lesson.cat,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(lessonRef, studyItem);
      }

      // 4. Boostrap introductory Tutor chat message
      const initialChatId = "init_chat_msg";
      const chatRef = doc(db, "users", user.uid, "chat", initialChatId);
      const startMsg: ChatMessage = {
        id: initialChatId,
        userId: user.uid,
        role: "model",
        content: `¡Hola! Soy tu tutor personal inteligente de **LearnAI**. 👋 Estás registrado oficialmente. 
        
Estoy emocionado por ayudarte a dominar cualquier disciplina: hoy podemos programar en Python, aprender los secretos de la luz en la Fotografía, o estructurar una campaña de Marketing Digital.
        
¿Sobre qué te gustaría aprender hoy? Escríbelo arriba para estructurar un nuevo curso, o selecciona cualquiera de los temas rápidos abajo.`,
        createdAt: new Date().toISOString(),
      };
      await setDoc(chatRef, startMsg);
    }
  };

  // Enrollment action on selecting generic lists
  const handleEnrollOrOpenCourse = async (course: Course) => {
    setSelectedCourse(course);
    if (!currentUser) return;

    // Check if progress already exists
    const progId = `${currentUser.uid}_${course.id}`;
    const progressRef = doc(db, "users", currentUser.uid, "progress", progId);
    const snap = await getDoc(progressRef);

    if (!snap.exists()) {
      const enrollment: UserCourseProgress = {
        id: progId,
        userId: currentUser.uid,
        courseId: course.id,
        courseTitle: course.title,
        category: course.category,
        progressPercent: 0,
        enrolledAt: new Date().toISOString(),
        lastStudiedAt: new Date().toISOString(),
      };
      await setDoc(progressRef, enrollment);
    }
  };

  // Toggle a Study Plan Checklist Lesson
  const toggleStudyLesson = async (lesson: StudyLesson) => {
    if (!currentUser) return;
    const lessonRef = doc(db, "users", currentUser.uid, "studyplan", lesson.id);
    await updateDoc(lessonRef, {
      completed: !lesson.completed,
    });

    // Award bonus XP on completion
    if (!lesson.completed && profile) {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        xp: profile.xp + 100,
      });
    }
  };

  // Completar una lección de curso para aumentar el porcentaje de progreso real y ganar puntos de experiencia XP!
  const markLessonCompleted = async (courseId: string, totalCount: number, completedIndex: number) => {
    if (!currentUser || !profile) return;
    
    const progId = `${currentUser.uid}_${courseId}`;
    const progressRef = doc(db, "users", currentUser.uid, "progress", progId);
    
    const progressSnap = await getDoc(progressRef);
    if (progressSnap.exists()) {
      const currentProg = progressSnap.data() as UserCourseProgress;
      // Increment progress percent smoothly
      const currentPct = currentProg.progressPercent;
      const step = Math.ceil(100 / (totalCount || 3));
      const nextPct = Math.min(100, currentPct + step);
      
      await updateDoc(progressRef, {
        progressPercent: nextPct,
        lastStudiedAt: new Date().toISOString(),
      });

      // Update XP
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        xp: profile.xp + 150,
      });
    }
  };

  // Course Builder AI integration via Node server.ts Proxy
  const handleAIGenerateCourse = async () => {
    if (!learningPrompt.trim()) return;
    setIsGeneratingCourse(true);
    setCourseGenError(null);
    setNewlyCreatedCourseId(null);

    try {
      const response = await fetch("/api/gemini/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: learningPrompt,
          level: "Intermedio",
        }),
      });

      if (!response.ok) {
        throw new Error("La solicitud para generar el curso falló. Verifica tus secretos de API.");
      }

      const generatedData = await response.json();
      
      // Inject UUID and Creator stamp
      const generatedCourseId = `ai_course_${Date.now()}`;
      const newCourse: Course = {
        ...generatedData,
        id: generatedCourseId,
        isAIGenerated: true,
        createdBy: currentUser ? currentUser.uid : "anonymous",
        createdAt: new Date().toISOString(),
      };

      // Save to global Firestore courses list
      await setDoc(doc(db, "courses", generatedCourseId), newCourse);

      // Enroll the user immediately if logged in
      if (currentUser) {
        const progId = `${currentUser.uid}_${generatedCourseId}`;
        const initialProg: UserCourseProgress = {
          id: progId,
          userId: currentUser.uid,
          courseId: generatedCourseId,
          courseTitle: newCourse.title,
          category: newCourse.category,
          progressPercent: 5,
          enrolledAt: new Date().toISOString(),
          lastStudiedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", currentUser.uid, "progress", progId), initialProg);

        // Schedule study plan item
        const lessonId = `ai_lesson_${Date.now()}`;
        const firstLessonTitle = newCourse.modules?.[0]?.lessons?.[0]?.title || "Introducción";
        const studyItem: StudyLesson = {
          id: lessonId,
          userId: currentUser.uid,
          title: newCourse.title,
          subtitle: firstLessonTitle,
          category: newCourse.category,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", currentUser.uid, "studyplan", lessonId), studyItem);
      }

      setNewlyCreatedCourseId(generatedCourseId);
      setSelectedCourse(newCourse);
      setActiveLesson({ moduleIndex: 0, lessonIndex: 0 });
      setLearningPrompt("");
    } catch (err: any) {
      console.error(err);
      setCourseGenError(err.message || "Problema conectando al servidor para IA. Comprueba que GEMINI_API_KEY esté instalada.");
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  // AI Tutor Interactive Chat integration via Express Proxy
  const handleSendTutorMessage = async () => {
    if (!tutorInput.trim() || !currentUser) return;
    const userMsgText = tutorInput;
    setTutorInput("");
    setIsSendingTutorMessage(true);

    // Save User message immediately to local / DB for fast visual update
    const userMsgId = `usr_msg_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      userId: currentUser.uid,
      role: "user",
      content: userMsgText,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", currentUser.uid, "chat", userMsgId), userMsg);

    try {
      // Gather context
      const chatCopy = [...chatMessages, userMsg];
      
      const response = await fetch("/api/gemini/chat-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatCopy,
          topicContext: selectedCourse ? selectedCourse.title : "Educación digital",
        }),
      });

      if (!response.ok) {
        throw new Error("Chat tutor error");
      }

      const botReply = await response.json();
      
      // Save Bot message with grounded sources if any
      const botMsgId = `bot_msg_${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        userId: currentUser.uid,
        role: "model",
        content: botReply.content,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", currentUser.uid, "chat", botMsgId), botMsg);
      if (botReply.sources) {
        setGroundedSources(botReply.sources);
      }
    } catch (error) {
      console.error(error);
      const errorMsgId = `err_msg_${Date.now()}`;
      const errMsg: ChatMessage = {
        id: errorMsgId,
        userId: currentUser.uid,
        role: "model",
        content: "Lo siento, hubo un fallo al procesar la respuesta con el tutor. Asegúrate de que las contraseñas de API estén correctamente integradas.",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", currentUser.uid, "chat", errorMsgId), errMsg);
    } finally {
      setIsSendingTutorMessage(false);
    }
  };

  // Direct suggestion selection to instant-fill learning prompt
  const injectCategoryInPrompt = (topic: string) => {
    setLearningPrompt(`Aprender sobre ${topic}`);
  };

  // Quick tutor prompt triggers
  const executeQuickTutorQuery = (text: string) => {
    setTutorInput(text);
    setActiveTab("Chat con IA");
  };

  // Get mapped Icon based on Category name
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Marketing": return "📢";
      case "Fotografía": return "📷";
      case "Programación": return "💻";
      case "Diseño Gráfico": 
      case "Diseño": return "🎨";
      case "Negocios": return "💼";
      case "Finanzas": return "🪙";
      case "Idiomas": return "🌐";
      case "Música": return "🎵";
      default: return "📚";
    }
  };

  // Filter courses by search query
  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  // Calculate circular stats dynamically
  const completedCount = progresses.filter(p => p.progressPercent === 100).length;
  const inProgressCount = progresses.filter(p => p.progressPercent > 0 && p.progressPercent < 100).length;
  const totalXP = profile?.xp || 1500;
  const streakDays = profile?.streak || 12;

  // Render authentic mock screens if no user is signed in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080a13] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
        {/* Futuristic glowing spheres */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/20 blur-[150px]" />

        <div className="w-full max-w-xl bg-[#111726]/80 border border-indigo-950/70 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10 text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-400 bg-clip-text text-transparent font-sans">
              LearnAI
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Aprende cualquier tema usando la Inteligencia Artificial
          </h1>

          <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
            Plataforma interactiva de estudio del futuro. Genera cursos personalizados con planes de estudio automáticos, tutoría en tiempo real y estadísticas de progreso diarias de forma 100% segura.
          </p>

          <button 
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 shadow-xl cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.56-1.551 4.585-6.887 4.585-4.604 0-8.358-3.803-8.358-8.5s3.754-8.5 8.358-8.5c2.62 0 4.375 1.114 5.378 2.079l3.251-3.13C18.847 1.341 15.82 0 12.24 0 5.58 0 0 5.378 0 12s5.58 12 12.24 12c6.958 0 11.583-4.89 11.583-11.785 0-.79-.086-1.385-.189-1.93H12.24z"/>
            </svg>
            <span>Iniciar Sesión de forma segura con Google</span>
          </button>

          <p className="text-slate-600 text-xs mt-6">
            Inicia sesión con tu cuenta de Google. Tu racha actual, XP y progresos se respaldarán en tu base de datos segura y privada de Firestore en la nube de Google.
          </p>
        </div>

        {/* Dynamic visual preview of the actual app dashboard under the card */}
        <div className="mt-8 text-slate-500 flex items-center space-x-2 text-xs opacity-60">
          <Lock className="w-3.5 h-3.5" />
          <span>Cumple con el estándar de Firebase Auth & Firestore rulesets de Google</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a13] font-sans flex flex-col antialiased text-slate-200">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0d1a]/90 backdrop-blur-md border-b border-indigo-950/60 pixel-antialiasing">
        <div className="mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              LearnAI
            </span>
          </div>

          {/* Search bar inside header */}
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-8 relative">
            <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar cualquier tema para aprender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111726]/70 border border-indigo-950/70 py-2 pl-10 pr-4 text-xs rounded-xl focus:outline-none focus:border-indigo-700/80 transition-all text-slate-300 placeholder-slate-500"
            />
            <span className="absolute right-3 text-[10px] bg-indigo-950/70 border border-indigo-900/40 text-slate-500 px-1.5 py-0.5 rounded">Ctrl K</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-white transition hover:bg-indigo-950/20 rounded-lg">
              <Sun className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition relative hover:bg-indigo-950/20 rounded-lg">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            {/* Profile trigger */}
            <div className="flex items-center space-x-3 pl-2 border-l border-indigo-950/50">
              <img 
                src={profile?.photoURL || "https://picsum.photos/seed/useravatar/200/200"} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-purple-500"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white flex items-center space-x-1">
                  <span>{profile?.displayName || "Juan Pérez"}</span>
                </p>
                <span className="text-[10px] text-yellow-400 font-extrabold tracking-wider bg-yellow-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5 mt-0.5">
                  🏆 Pro {totalXP} XP
                </span>
              </div>
              <button 
                onClick={handleSignOut}
                title="Cerrar sesión segura"
                className="p-1 px-2 text-slate-500 hover:text-rose-400 rounded transition duration-150 cursor-pointer text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile menu indicator */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main content container */}
      <div className="flex flex-1 max-w-[1700px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-6 gap-6 relative">
        
        {/* Sidebar Left Navigation Panel */}
        <aside className={`w-[260px] shrink-0 flex flex-col gap-6 md:sticky top-20 h-fit md:flex ${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 bg-[#080a13] p-4 border-r border-indigo-950/80 shadow-2xl w-[280px]' : 'hidden'}`}>
          
          {/* Sidebar Nav Buttons */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: "Inicio", icon: Compass, label: "Inicio" },
              { id: "Mis Aprendizajes", icon: BookOpen, label: "Mis Aprendizajes" },
              { id: "Plan de estudio", icon: BookOpenCheck, label: "Plan de estudio" },
              { id: "Chat con IA", icon: MessageSquare, label: "Chat con IA" },
              { id: "Recursos", icon: FolderClosed, label: "Recursos" },
              { id: "Comunidad", icon: Users, label: "Comunidad" },
              { id: "Certificados", icon: Award, label: "Certificados" },
              { id: "Ajustes", icon: Settings, label: "Ajustes" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                    isActive 
                      ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 text-purple-300 border-l-4 border-purple-500 font-bold" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-indigo-950/20"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === "Plan de estudio" && studyPlan.filter(l => !l.completed).length > 0 && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                      {studyPlan.filter(l => !l.completed).length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Banner PRO Upgrade */}
          <div className="bg-gradient-to-br from-[#10132b] to-[#141b2d] border border-indigo-950/60 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-purple-600/10 rounded-full blur-xl" />
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Aprende sin límites 
              <span className="text-[10px] bg-amber-500/20 text-yellow-500 px-1.5 py-0.1 ml-1 rounded font-bold uppercase">Pro</span>
            </h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Desbloquea cursos ilimitados generados por la IA de nivel 3 y descarga certificaciones homologadas con validación QR de forma directa.
            </p>
            <button className="w-full py-2.5 mt-4 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer">
              Mejorar a Pro
            </button>
            <button className="text-[10px] block text-center w-full mt-2.5 text-slate-500 underline hover:text-slate-300">
              Ver planes del Spark
            </button>
          </div>

          {/* Racha streak block widget */}
          <div className="bg-[#111726]/50 border border-indigo-950/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-bold">Racha de estudio</span>
              <div className="flex items-center space-x-1 text-orange-500">
                <Flame className="w-4 h-4 fill-orange-500" />
                <span className="text-xs font-black">{streakDays} días</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-tight">
              ¡Sigue así! Cada día que estudias ganas +15% de multiplicador de XP.
            </p>
            {/* Week list check */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold">
              {[
                { label: "L", active: true },
                { label: "M", active: true },
                { label: "X", active: true },
                { label: "J", active: true },
                { label: "V", active: true },
                { label: "S", active: true },
                { label: "D", active: false },
              ].map((day, dIdx) => (
                <div key={dIdx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{day.label}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    day.active 
                      ? "bg-purple-600/30 border-purple-500 text-purple-400" 
                      : "border-slate-800 text-slate-600"
                  }`}>
                    {day.active && "✓"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 3. Central Working Board Area */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              
              {/* VIEW: Inicio / Home Dashboard */}
              {activeTab === "Inicio" && (
                <>
                  {/* Greeting Block */}
                  <div className="text-left">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      ¡Bienvenido de vuelta, {profile?.displayName?.split(" ")[0]}! 👋
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      ¿Qué te apasiona aprender hoy? Ingresa cualquier tema y dejemos que la Inteligencia Artificial te estructure tu plan.
                    </p>
                  </div>

                  {/* AI Course Building Box */}
                  <div className="bg-gradient-to-r from-[#111726]/90 to-[#141d33]/90 border border-indigo-950/60 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl">
                    <div className="absolute right-[-5px] top-[-5px] w-28 h-28 bg-purple-600/10 rounded-full blur-2xl" />
                    
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex items-center space-x-2 text-purple-400">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest font-mono">Prueba LearnAI Inteligente</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text"
                          placeholder="Pregúntale a la IA cualquier cosa sobre lo que quieras aprender... ej. Aprender Marketing, Fotografía Profesional, Quantum Physics..."
                          value={learningPrompt}
                          onChange={(e) => setLearningPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAIGenerateCourse()}
                          className="flex-grow bg-[#090b14] border border-indigo-950/70 p-4 rounded-xl text-sm focus:outline-none focus:border-purple-500/80 transition text-slate-200 placeholder-slate-500"
                        />
                        <button 
                          onClick={handleAIGenerateCourse}
                          disabled={isGeneratingCourse}
                          className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-purple-500/15 transition cursor-pointer"
                        >
                          {isGeneratingCourse ? (
                            <span className="flex items-center space-x-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Generando Curso...</span>
                            </span>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Preguntar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Course generator error feedback */}
                      {courseGenError && (
                        <div className="text-rose-400 text-xs mt-1 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center space-x-2">
                          <X className="w-4 h-4 shrink-0" />
                          <span>{courseGenError}</span>
                        </div>
                      )}

                      {/* Quick start tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-slate-500 font-bold mr-1">Rápido:</span>
                        {[
                          { name: "Marketing", label: "📢 Marketing" },
                          { name: "Fotografía", label: "📷 Fotografía" },
                          { name: "Programación", label: "💻 Programación" },
                          { name: "Diseño Gráfico", label: "🎨 Diseño" },
                          { name: "Negocios y Startups", label: "💼 Negocios" },
                          { name: "Finanzas", label: "🪙 Finanzas" },
                        ].map((p, i) => (
                          <button
                            key={i}
                            onClick={() => injectCategoryInPrompt(p.name)}
                            className="text-xs bg-[#111726]/60 text-indigo-300 hover:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-950/40 transition"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Course Categories Overview - Explora por categoria */}
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Explora por categoría 
                        <span className="text-slate-500 text-xs font-normal">({filteredCourses.length} cursos listos)</span>
                      </h3>
                      <button 
                        onClick={() => setActiveTab("Mis Aprendizajes")}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center font-bold"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCourses.slice(0, 6).map((course) => {
                        // Find dynamic progress if user is enrolled
                        const progress = progresses.find((p) => p.courseId === course.id);
                        const progressPercent = progress ? progress.progressPercent : 0;
                        const isEnrolled = !!progress;

                        return (
                          <div 
                            key={course.id}
                            className="bg-[#111726]/60 border border-indigo-950/40 rounded-2xl p-5 hover:border-purple-900/40 transition-all flex flex-col justify-between group relative overflow-hidden"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-3xl bg-[#090b14] w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-950/40 shadow">
                                  {getCategoryIcon(course.imageType)}
                                </span>
                                <div>
                                  <h4 className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors leading-tight line-clamp-1">
                                    {course.title}
                                  </h4>
                                  <span className="text-[11px] text-slate-500 font-mono mt-1 block uppercase">
                                    {course.isAIGenerated ? "🤖 IA GENERATOR" : "📚 SISTEMA"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
                              {course.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-t border-indigo-950/30 pt-3 mt-1">
                              <span>{course.level}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{course.modules?.length || course.modulesCount} Módulos</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4 flex flex-col gap-1.5">
                              <div className="flex justify-between text-[11px] font-mono">
                                <span className="text-slate-500 font-bold">{isEnrolled ? "Progreso" : "No matriculado"}</span>
                                <span className="text-slate-300 font-bold">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-[#080a13] h-1.5 rounded-full overflow-hidden border border-indigo-950/30">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercent || 3}%` }}
                                />
                              </div>
                            </div>

                            <button 
                              onClick={() => handleEnrollOrOpenCourse(course)}
                              className="w-full text-center py-2 bg-indigo-950/20 hover:bg-purple-600 hover:text-white transition rounded-xl text-xs font-semibold text-purple-400 border border-indigo-950/50 hover:border-transparent mt-4 cursor-pointer"
                            >
                              {isEnrolled ? "Continuar Curso" : "Iniciar Aprendizaje"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Learning Path Pathways visual roadmap */}
                  <div className="bg-[#111726]/40 border border-indigo-950/30 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl" />
                    <h3 className="font-bold text-white text-base">Rutas de aprendizaje</h3>
                    <p className="text-xs text-slate-400 mt-1">Sigue un camino estructurado para certificar y dominar cualquier especialidad paso a paso.</p>
                    
                    {/* Visual map route map with dots */}
                    <div className="flex items-center justify-between gap-2 py-8 px-4 overflow-x-auto">
                      {[
                        { step: "1", title: "Fundamentos Básicos", active: true, icon: "🔍" },
                        { step: "2", title: "Prácticas de Campo", active: true, icon: "⭐" },
                        { step: "3", title: "Automatización Avanzada", active: true, icon: "🎓" },
                        { step: "4", title: "Proyecto e Implicaciones", active: false, icon: "🏆" },
                      ].map((item, i, arr) => (
                        <React.Fragment key={i}>
                          <div className="flex flex-col items-center gap-2 text-center shrink-0 min-w-[120px]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                              item.active 
                                ? "bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg" 
                                : "bg-slate-900 border-slate-700 text-slate-500"
                            }`}>
                              {item.icon}
                            </div>
                            <span className="text-[11px] font-bold text-slate-300">{item.title}</span>
                            <span className="text-[9px] text-slate-500">Etapa {item.step}</span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`flex-1 h-1 min-w-[40px] rounded ${item.active ? 'bg-indigo-600' : 'bg-slate-800'}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <button 
                      onClick={() => injectCategoryInPrompt("Ruta completa de desarrollo de Inteligencia Artificial")}
                      className="text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Explorar rutas AI
                    </button>
                  </div>

                  {/* Two column bottom view */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    
                    {/* Column 1: TU TUTOR DE IA chat preview */}
                    <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 text-purple-400 mb-3">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                          <h4 className="font-bold text-white text-base">Tu tutor de IA activo</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          Estoy aquí para ayudarte a asimilar conceptos difíciles. Selecciona un disparador rápido para evaluar mi conocimiento de inmediato:
                        </p>

                        <div className="flex flex-col gap-2">
                          {[
                            "¿Cómo puedo mejorar mis habilidades de marketing digital?",
                            "Explícame los conceptos básicos de la fotografía",
                            "Recomiéndame un plan para aprender Python desde cero",
                            "¿Cuáles son las mejores estrategias para emprender?",
                          ].map((trigger, idx) => (
                            <button
                              key={idx}
                              onClick={() => executeQuickTutorQuery(trigger)}
                              className="text-left w-full bg-[#080a13]/70 hover:bg-indigo-950/20 text-indigo-300 hover:text-purple-300 text-xs p-3 rounded-xl border border-indigo-950/40 transition-all cursor-pointer"
                            >
                              {trigger}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-5 bg-[#090b14] p-1.5 rounded-xl border border-indigo-950/70">
                        <input 
                          type="text"
                          placeholder="Escribe tu pregunta para el tutor..."
                          value={tutorInput}
                          onChange={(e) => setTutorInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendTutorMessage()}
                          className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none text-slate-200 placeholder-slate-500"
                        />
                        <button 
                          onClick={handleSendTutorMessage}
                          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Column 2: SUGERENCIAS PARA TI recommended courses */}
                    <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6">
                      <h4 className="font-bold text-white text-base mb-3">Sugerencias para ti</h4>
                      <p className="text-xs text-slate-400 mb-4">Analizando tus progresos, te recomendamos estudiar este contenido semanal:</p>
                      
                      <div className="flex flex-col gap-3">
                        {courses.slice(0, 3).map((course, idx) => (
                          <div 
                            key={idx}
                            className="bg-[#080a13]/55 border border-indigo-950/30 p-4 rounded-2xl flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl bg-[#111726]/80 w-10 h-10 rounded-lg flex items-center justify-center">
                                {getCategoryIcon(course.imageType)}
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-xs text-left leading-tight">{course.title}</h5>
                                <span className="text-[10px] text-slate-500">Basado en tus preferencias de {course.category}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleEnrollOrOpenCourse(course)}
                              className="text-xs font-bold text-purple-400 bg-purple-600/10 hover:bg-purple-600/20 px-3 py-1.5 rounded-lg border border-purple-500/20 transition cursor-pointer"
                            >
                              Ver curso
                            </button>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => setActiveTab("Chat con IA")}
                        className="text-xs font-bold text-indigo-400 hover:text-purple-300 mt-4 block text-center w-full"
                      >
                        Ver más recomendaciones sugerentes →
                      </button>
                    </div>

                  </div>
                </>
              )}

              {/* VIEW: Mis Aprendizajes - Enrolled Courses Index */}
              {activeTab === "Mis Aprendizajes" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Mis Aprendizajes Clave</h3>
                    <p className="text-slate-400 text-xs mt-1">Visualiza y retoma la lección actual de tus materias de estudio enlazadas.</p>
                  </div>

                  {progresses.length === 0 ? (
                    <div className="bg-[#111726]/40 border border-indigo-950/40 text-center p-12 rounded-2xl">
                      <p className="text-slate-400 text-sm">No te has matriculado en ningún curso todavía.</p>
                      <button 
                        onClick={() => setActiveTab("Inicio")}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 transition"
                      >
                        Buscar Cursos en Inicio
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {progresses.map((prog) => {
                        const targetCor = courses.find(c => c.id === prog.courseId);
                        if (!targetCor) return null;
                        return (
                          <div key={prog.id} className="bg-[#111726]/60 border border-indigo-950/40 rounded-2xl p-6 relative flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-900/35">
                                  {targetCor.category}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">Última clase: {new Date(prog.lastStudiedAt).toLocaleDateString()}</span>
                              </div>

                              <h4 className="font-extrabold text-white text-base leading-tight mb-2">
                                {targetCor.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                                {targetCor.description}
                              </p>

                              {/* Visual progression bar */}
                              <div className="bg-[#080a13] h-2 rounded-full overflow-hidden border border-indigo-950/40 mb-2">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                  style={{ width: `${prog.progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-slate-400 font-mono mb-4">
                                <span>Porcentaje completado</span>
                                <span className="font-bold text-white">{prog.progressPercent}%</span>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                setSelectedCourse(targetCor);
                                setActiveLesson({ moduleIndex: 0, lessonIndex: 0 });
                              }}
                              className="w-full text-center py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                            >
                              Retomar Lección Activa
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: Plan de estudio - Interactive Lectures Planner */}
              {activeTab === "Plan de estudio" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Mi Plan de Estudio Hoy</h3>
                    <p className="text-slate-400 text-xs mt-1">Cumple estas 4 metas diarias recomendadas por tu tutor para optimizar la retención cerebral.</p>
                  </div>

                  <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm text-slate-300 font-bold">Tareas y Lecciones Pendientes</span>
                      <span className="text-xs font-mono text-purple-400 font-bold">
                        {studyPlan.filter(l => l.completed).length} / {studyPlan.length} Completadas
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {studyPlan.map((lesson) => (
                        <div 
                          key={lesson.id}
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                            lesson.completed 
                              ? "bg-purple-950/10 border-purple-950/60 opacity-60 text-slate-400" 
                              : "bg-[#080a13]/60 border-indigo-950/40 hover:border-indigo-900/60"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => toggleStudyLesson(lesson)}
                              className="w-5 h-5 rounded-md border-2 border-indigo-500/80 flex items-center justify-center text-xs text-white bg-transparent hover:bg-indigo-500/20"
                            >
                              {lesson.completed ? "✓" : ""}
                            </button>
                            <div>
                              <p className={`text-xs font-extrabold ${lesson.completed ? "line-through text-slate-500" : "text-white"}`}>
                                {lesson.title}
                              </p>
                              <span className="text-[11px] text-slate-500 mt-0.5 block">{lesson.subtitle} • {lesson.category}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] text-emerald-400 font-bold font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                              +100 XP
                            </span>
                            <button 
                              onClick={() => {
                                // Match to mock courses if possible
                                const linked = courses.find(c => c.title.toLowerCase().includes(lesson.title.toLowerCase()) || c.category === lesson.category);
                                if (linked) {
                                  setSelectedCourse(linked);
                                  setActiveLesson({ moduleIndex: 0, lessonIndex: 0 });
                                }
                              }}
                              className="p-1 px-3 text-[11px] font-mono hover:text-white border border-indigo-500/10 hover:bg-indigo-505/20 rounded cursor-pointer text-indigo-400"
                            >
                              Estudiar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: Chat con IA - Interactive Tutor */}
              {activeTab === "Chat con IA" && (
                <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6 h-[650px] flex flex-col justify-between">
                  {/* Chat header */}
                  <div className="border-b border-indigo-950/50 pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-white text-base">Tutor de IA grounded</h3>
                      <span className="text-xs text-slate-400">Canales informativos enlazados en tiempo real con Google Search</span>
                    </div>
                    {selectedCourse && (
                      <span className="text-xs text-purple-300 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                        Contexto: {selectedCourse.title}
                      </span>
                    )}
                  </div>

                  {/* Messages container list */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scroll-smooth">
                    {chatMessages.map((msg) => {
                      const isBo = msg.role === "model";
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex ${isBo ? "justify-start" : "justify-end"} items-start gap-3`}
                        >
                          {isBo && (
                            <span className="w-8 h-8 rounded-full bg-purple-950/40 border border-purple-700/60 flex items-center justify-center text-xs shadow shrink-0">
                              🤖
                            </span>
                          )}
                          <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                            isBo 
                              ? "bg-[#080a13]/80 text-slate-300 border border-indigo-950/40 rounded-tl-none" 
                              : "bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-500/5 font-medium"
                          }`}>
                            <div className="prose prose-invert max-w-none text-slate-200">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                            <span className="text-[9px] text-slate-500 block text-right mt-2 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Grounded Web Sources Display */}
                    {groundedSources.length > 0 && (
                      <div className="bg-indigo-950/10 border border-indigo-900/30 p-3.5 rounded-2xl flex flex-col gap-1.5 max-w-lg mt-3">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Enlaces de consulta de Google:</span>
                        <div className="flex flex-wrap gap-2">
                          {groundedSources.map((s, sIdx) => (
                            <a 
                              key={sIdx} 
                              href={s.uri} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/20 px-2.5 py-1 rounded border border-cyan-900/30 hover:bg-cyan-950/40 transition underline"
                            >
                              🌐 {s.title || "Fuente informática"}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSendingTutorMessage && (
                      <div className="flex justify-start items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-purple-900/10 flex items-center justify-center animate-bounce text-xs">
                          💡
                        </span>
                        <div className="bg-[#080a13]/80 border border-indigo-950/40 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                          <span>El tutor está analizando tu respuesta con Google Search...</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input bar */}
                  <div className="flex gap-2 bg-[#090b14] p-2 rounded-2xl border border-indigo-950/70">
                    <input 
                      type="text"
                      placeholder="Pregúntale al tutor sobre cualquier tema..."
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendTutorMessage()}
                      className="flex-1 bg-transparent px-3 py-2 text-xs focus:outline-none text-slate-200 placeholder-slate-500"
                    />
                    <button 
                      onClick={handleSendTutorMessage}
                      disabled={isSendingTutorMessage}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition text-xs font-bold"
                    >
                      Preguntar
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: Recursos - Documentation & PDFs */}
              {activeTab === "Recursos" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white font-sans">Cheat Sheets y Material Teórico</h3>
                    <p className="text-slate-400 text-xs mt-1">Guías de referencia rápida para imprimir y afianzar tus competencias diarias.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Tabla Periódica del Marketing SEO", desc: "Esquema sintáctico con todos los factores de rastreo orgánico de Google para este año.", format: "PDF", size: "2.4 MB" },
                      { title: "Sintaxis Express de Python", desc: "Recordatorio de loops, listas, diccionarios y formateadores de datos.", format: "Cheat Sheet", size: "1.1 MB" },
                      { title: "Anatomía de la Cámara y Exposición", desc: "Infografía de correspondencia f-stop para simular velocidad en retratos.", format: "JPEG", size: "8.5 MB" },
                      { title: "Manual de Wireframes e Ideación UI", desc: "Estrategias de bocetado rápido en papel antes del diseño digital.", format: "Guía Interactiva", size: "4.9 MB" },
                    ].map((rec, i) => (
                      <div key={i} className="bg-[#111726]/60 border border-indigo-950/40 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-900 transition-all">
                        <div>
                          <span className="text-[10px] font-mono text-purple-400 font-extrabold tracking-wider bg-purple-500/10 px-2 py-0.5 rounded">
                            {rec.format} • {rec.size}
                          </span>
                          <h4 className="font-bold text-white text-sm mt-3 leading-tight">{rec.title}</h4>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{rec.desc}</p>
                        </div>
                        <button className="py-2 mt-4 text-xs font-bold text-center bg-[#080a13] hover:bg-indigo-950/40 text-purple-300 rounded-xl transition border border-indigo-950/50">
                          Acceder al Recurso
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW: Comunidad - Global leaderboard */}
              {activeTab === "Comunidad" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Comunidad LearnAI</h3>
                    <p className="text-slate-400 text-xs mt-1">Compara tu rendimiento semanal con estudiantes del planeta enlazados a la nube.</p>
                  </div>

                  <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-indigo-950/20 border-b border-indigo-950/40 font-bold text-xs text-slate-300">
                      Rendimiento de XP Semanal
                    </div>
                    <div className="divide-y divide-indigo-950/30">
                      {[
                        { pos: "1", name: "Sofía Alarcón", xp: "4,680", streak: "240", active: false },
                        { pos: "2", name: "David K.", xp: "3,820", streak: "92", active: false },
                        { pos: "3", name: "Juan Pérez (Tú)", xp: totalXP.toLocaleString(), streak: streakDays, active: true },
                        { pos: "4", name: "Katarina Petrova", xp: "1,200", streak: "15", active: false },
                        { pos: "5", name: "Eduardo Blanco", xp: "850", streak: "4", active: false },
                      ].map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-4 flex items-center justify-between transition-all ${
                            item.active ? "bg-purple-600/15" : "hover:bg-indigo-950/10"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="font-mono text-sm font-bold text-slate-500 w-4">{item.pos}</span>
                            <div>
                              <p className={`text-xs font-bold ${item.active ? "text-purple-300" : "text-white"}`}>
                                {item.name}
                              </p>
                              <span className="text-[10px] text-slate-500">Racha de {item.streak} días</span>
                            </div>
                          </div>

                          <span className="text-xs font-bold font-mono text-emerald-400">
                            {item.xp} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: Certificados */}
              {activeTab === "Certificados" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Certificados Oficiales</h3>
                    <p className="text-slate-400 text-xs mt-1">Completa cualquier curso al 100% para emitir una credencial digital enlazada.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Marketing Digital y Contenidos", status: "PENDIENTE (75% Completado)", key: "mkt" },
                      { title: "Fotografía Profesional", status: "PENDIENTE (40% Completado)", key: "photo" },
                      { title: "Estructuras de Python Automatizadas", status: "PENDIENTE (60% Completado)", key: "py" },
                    ].map((cert, k) => (
                      <div key={k} className="bg-[#111726]/60 border border-indigo-950/40 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <Award className="w-8 h-8 text-indigo-500/80 mb-3" />
                          <h4 className="font-extrabold text-white text-sm leading-tight">{cert.title}</h4>
                          <span className="text-[11px] font-mono text-amber-500 mt-2 block font-extrabold">{cert.status}</span>
                        </div>
                        <button className="py-2.5 mt-5 text-xs font-bold text-center bg-[#090c15] text-slate-500 rounded-xl cursor-not-allowed border border-slate-900">
                          Descargar Credenciales
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW: Ajustes */}
              {activeTab === "Ajustes" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Configuración del Perfil</h3>
                    <p className="text-slate-400 text-xs mt-1">Configura tus preferencias de aprendizaje y sincronizaciones en la nube.</p>
                  </div>

                  <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center py-2.5 border-b border-indigo-950/40">
                      <div>
                        <h4 className="font-bold text-xs text-white">Nombre de Estudiante</h4>
                        <p className="text-[11px] text-slate-500">Cómo te visualizas en clasificaciones.</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{profile?.displayName}</span>
                    </div>

                    <div className="flex justify-between items-center py-2.5 border-b border-indigo-950/40">
                      <div>
                        <h4 className="font-bold text-xs text-white">Correo Electrónico</h4>
                        <p className="text-[11px] text-slate-500">Cuenta respaldada para tu base de datos de Google.</p>
                      </div>
                      <span className="text-xs text-slate-400">{profile?.email}</span>
                    </div>

                    <div className="flex justify-between items-center py-2.5 border-b border-indigo-950/40">
                      <div>
                        <h4 className="font-bold text-xs text-white">Sincronización Firestore</h4>
                        <p className="text-[11px] text-slate-500">Resguardado de seguridad y transacciones automáticas.</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        ● ACTIVO Y SEGURO
                      </span>
                    </div>

                    <div className="py-2.5">
                      <h4 className="font-bold text-xs text-white mb-2">Proyecto de Firebase Asociado:</h4>
                      <code className="text-[10px] block font-mono bg-[#080a13] p-3 rounded-lg border border-indigo-950/40 text-slate-400 leading-tight">
                        Inspiring Philosophy {profile?.uid ? `(id: ${profile.uid})` : ""}
                      </code>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Bottom Grid Navigation Tag Bar "Todo lo que puedes aprender" */}
          <section className="bg-[#111726]/40 border border-indigo-950/40 p-5 rounded-3xl mt-2">
            <h4 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-4 font-mono text-left">Todo lo que puedes aprender</h4>
            
            <div className="flex items-center gap-3 overflow-x-auto py-1 scroll-smooth">
              {APP_CATEGORIES.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => injectCategoryInPrompt(cat.name)}
                  className="flex items-center space-x-2 bg-[#111726]/80 border border-indigo-950/50 hover:border-purple-600 px-4 py-2.5 rounded-xl shrink-0 transition-colors text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                >
                  <span className={`${cat.bg} p-1 rounded-md text-xs`}>{cat.name[0]}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

        </main>

        {/* 4. Right side column: statistics panel (Tu progreso general) */}
        <section className="w-[340px] shrink-0 hidden xl:flex flex-col gap-6 sticky top-20 h-fit">
          
          {/* Circular donut chart widget */}
          <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6 flex flex-col justify-between">
            <h3 className="font-bold text-white text-base text-left">Tu progreso general</h3>
            
            {/* Visual Donut representation */}
            <div className="flex flex-col items-center py-6 relative">
              <div className="w-32 h-32 rounded-full border-[10px] border-indigo-950/60 flex items-center justify-center relative bg-[#0a0d1a]">
                <div className="absolute inset-0 rounded-full border-[10px] border-gradient-to-r from-purple-500 to-indigo-500 border-t-purple-500 border-r-purple-500 animate-pulse" />
                <div className="text-center">
                  <span className="text-2xl font-black text-white font-mono">65%</span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Completado</p>
                </div>
              </div>
            </div>

            {/* Simple stats logs list */}
            <div className="flex flex-col gap-2.5 border-t border-indigo-950/30 pt-4 mt-2">
              {[
                { label: "Cursos completados", val: "12", color: "text-purple-400" },
                { label: "En progreso", val: "5", color: "text-indigo-400" },
                { label: "Horas estudiadas", val: "68h", color: "text-cyan-400" },
                { label: "Días de racha", val: "12 🔥", color: "text-orange-500" },
              ].map((st, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{st.label}</span>
                  <span className={`font-mono font-bold ${st.color}`}>{st.val}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setActiveTab("Ajustes")}
              className="w-full text-center mt-5 py-2.5 bg-[#080a13] hover:bg-indigo-950/40 text-purple-300 font-bold text-xs rounded-xl transition border border-indigo-950/50 cursor-pointer"
            >
              Ver estadísticas detalladas
            </button>
          </div>

          {/* Estudio Plan item daily check preview matches the mock layout exactly */}
          <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Plan de estudio</h3>
              <button 
                onClick={() => setActiveTab("Plan de estudio")}
                className="text-[11px] text-purple-400 hover:text-white font-bold"
              >
                Ver plan completo
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-tight text-left">Hoy, lecciones pendientes de asimilar:</p>

            <div className="flex flex-col gap-2">
              {studyPlan.slice(0, 4).map((planItem) => (
                <div 
                  key={planItem.id}
                  className="bg-[#080a13]/50 p-3 rounded-xl border border-indigo-950/30 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <button 
                      onClick={() => toggleStudyLesson(planItem)}
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] text-white ${
                        planItem.completed ? "bg-purple-600 border-transparent" : "border-slate-800"
                      }`}
                    >
                      {planItem.completed && "✓"}
                    </button>
                    <div className="text-left">
                      <p className={`text-xs font-bold leading-tight ${planItem.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {planItem.title}
                      </p>
                      <span className="text-[10px] text-slate-500 leading-tight">{planItem.subtitle}</span>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-indigo-400 cursor-pointer hover:text-white" />
                </div>
              ))}
            </div>
          </div>

          {/* Logros recientes achievements list list */}
          <div className="bg-[#111726]/60 border border-indigo-950/40 rounded-3xl p-6">
            <h3 className="font-bold text-white text-base text-left mb-3">Logros recientes</h3>
            
            <div className="flex flex-col gap-3">
              {[
                { title: "Aprendiz constante", desc: "Has estudiado 10 días seguidos", xp: "+100 XP" },
                { title: "Primera certificación", desc: "Completaste tu primer curso", xp: "+200 XP" },
                { title: "Explorador", desc: "Probaste 5 categorías diferentes", xp: "+150 XP" },
              ].map((ach, i) => (
                <div key={i} className="flex items-start justify-between">
                  <div className="flex space-x-2.5 items-start">
                    <span className="text-lg mt-0.5">🏅</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white leading-tight">{ach.title}</p>
                      <span className="text-[10px] text-slate-500">{ach.desc}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                    {ach.xp}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </section>

      </div>

      {/* 5. Course Learning Overlay Modal Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-[#080a13]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#111726] border border-indigo-950 rounded-3xl p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            
            {/* Close */}
            <button 
              onClick={() => {
                setSelectedCourse(null);
                setActiveLesson(null);
              }}
              className="absolute top-5 right-5 p-2 bg-[#080a13] hover:bg-indigo-950 border border-indigo-950/80 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal outline */}
            <div className="flex items-center space-x-3 text-purple-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest font-mono uppercase">{selectedCourse.category} • {selectedCourse.level}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {selectedCourse.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              {selectedCourse.description}
            </p>

            {/* Split Course contents view */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6 pt-6 border-t border-indigo-950/40">
              
              {/* Left Column: Module list items and lessons select map */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">MÓDULOS DE APRENDIZAJE:</span>
                
                <div className="flex flex-col gap-3">
                  {(selectedCourse.modules || []).map((m, mIdx) => (
                    <div key={mIdx} className="bg-[#080a13]/40 border border-indigo-950/30 p-3 rounded-xl">
                      <p className="text-xs font-extrabold text-white leading-tight">{m.title}</p>
                      <span className="text-[10px] text-slate-500 leading-none">{m.description}</span>
                      
                      <div className="flex flex-col gap-1.5 mt-2.5 border-t border-indigo-950/20 pt-2.5">
                        {m.lessons.map((lesson, lIdx) => {
                          const isReading = activeLesson?.moduleIndex === mIdx && activeLesson?.lessonIndex === lIdx;
                          return (
                            <button
                              key={lIdx}
                              onClick={() => setActiveLesson({ moduleIndex: mIdx, lessonIndex: lIdx })}
                              className={`w-full text-left p-2 rounded-lg text-xs flex items-center space-x-2 transition cursor-pointer ${
                                isReading 
                                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold" 
                                  : "bg-transparent text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <Play className="w-3 h-3 text-purple-400" />
                              <span className="truncate">{lesson.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Active lesson educational body content area */}
              <div className="md:col-span-3 bg-[#080a13]/60 border border-indigo-950/50 p-5 rounded-2xl flex flex-col justify-between overflow-y-auto max-h-[45vh]">
                {activeLesson ? (() => {
                  const currLesson = selectedCourse.modules?.[activeLesson.moduleIndex]?.lessons?.[activeLesson.lessonIndex] as Lesson;
                  const totalLessonsInCourse = (selectedCourse.modules || []).reduce((acc, current) => acc + current.lessons.length, 0);

                  return (
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between border-b border-indigo-950/30 pb-3 mb-4">
                          <div>
                            <h4 className="font-extrabold text-white text-sm">{currLesson.title}</h4>
                            <span className="text-[11px] text-slate-500">{currLesson.subtitle}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-bold uppercase">
                            M{activeLesson.moduleIndex + 1} • L{activeLesson.lessonIndex + 1}
                          </span>
                        </div>

                        {/* Complete lesson tutorial content written with custom style Markdown */}
                        <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-3 font-sans">
                          {currLesson.content ? (
                            <Markdown>{currLesson.content}</Markdown>
                          ) : (
                            <p>Contenido educativo no cargado para esta lección.</p>
                          )}
                        </div>
                      </div>

                      {/* Lesson Checkoff */}
                      <button 
                        onClick={() => {
                          markLessonCompleted(selectedCourse.id, totalLessonsInCourse, activeLesson.lessonIndex);
                          // Advanced to next lesson if any
                          const nextIdx = activeLesson.lessonIndex + 1;
                          const currentMod = selectedCourse.modules?.[activeLesson.moduleIndex];
                          if (currentMod && nextIdx < currentMod.lessons.length) {
                            setActiveLesson({ ...activeLesson, lessonIndex: nextIdx });
                          } else {
                            // Completed current module
                            alert("¡Felicidades! Has asimilado la lección correctamente. Su progreso fue cargado de forma encriptada en la base de datos.");
                          }
                        }}
                        className="py-3 px-4 mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entendido, Completar Lección (+150 XP)</span>
                      </button>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <Compass className="w-8 h-8 text-slate-600 animate-spin mb-3" />
                    <p className="text-xs text-slate-500">Selecciona cualquier lección a la izquierda para interactuar y comenzar a estudiar.</p>
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-indigo-950/40">
              <button 
                onClick={() => {
                  setTutorContext(selectedCourse.title);
                  setActiveTab("Chat con IA");
                  setSelectedCourse(null);
                }}
                className="px-5 py-2.5 bg-indigo-950/20 hover:bg-purple-950/30 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-950/50 cursor-pointer flex items-center space-x-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Preguntar al Tutor IA</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedCourse(null);
                  setActiveLesson(null);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Temario
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="text-center text-[11px] text-slate-600 py-6 border-t border-indigo-950/30 mt-auto">
        &copy; {new Date().getFullYear()} LearnAI. Todos los derechos reservados. Base de datos respaldada en Firestore de Google GCP.
      </footer>

    </div>
  );
}
