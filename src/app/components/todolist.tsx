'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [sortByNameAsc, setSortByNameAsc] = useState(true);
  const [sortByTimeAsc, setSortByTimeAsc] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        if (!task.completed) {
          newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
        } else {
          newTimeRemaining[task.id] = '⏹️ Diberhentikan';
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;
    if (difference <= 0) return 'Waktu habis!';
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru 🚀',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">' +
        '<div id="swal-error" style="color: red; font-size: 0.8rem; margin-top: 4px;"></div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const taskInput = (document.getElementById('swal-input1') as HTMLInputElement)?.value.trim();
        const deadlineInput = (document.getElementById('swal-input2') as HTMLInputElement)?.value;
        const errorDiv = document.getElementById('swal-error');

        if (!taskInput || !deadlineInput) {
          if (errorDiv) errorDiv.innerText = 'Tugas dan deadline wajib diisi!';
          return false;
        }
        return [taskInput, deadlineInput];
      },
    });

    if (!formValues) return;

    const newTask: Omit<Task, 'id'> = {
      text: formValues[0],
      completed: false,
      deadline: formValues[1],
    };
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    setTasks([...tasks, { id: docRef.id, ...newTask }]);
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit tugas 🚀',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(task.deadline).toISOString().slice(0, 16)}">` +
        '<div id="swal-error" style="color: red; font-size: 0.8rem; margin-top: 4px;"></div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const taskInput = (document.getElementById('swal-input1') as HTMLInputElement)?.value.trim();
        const deadlineInput = (document.getElementById('swal-input2') as HTMLInputElement)?.value;
        const errorDiv = document.getElementById('swal-error');

        if (!taskInput || !deadlineInput) {
          if (errorDiv) errorDiv.innerText = 'Tugas dan deadline wajib diisi!';
          return false;
        }

        return [taskInput, deadlineInput];
      },
    });

    if (!formValues) return;

    const updatedTask = {
      ...task,
      text: formValues[0],
      deadline: formValues[1],
    };

    await updateDoc(doc(db, 'tasks', task.id), {
      text: updatedTask.text,
      deadline: updatedTask.deadline,
    });

    setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    await updateDoc(doc(db, 'tasks', id), {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const sortByName = () => {
    const sorted = [...tasks].sort((a, b) =>
      sortByNameAsc ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text)
    );
    setTasks(sorted);
    setSortByNameAsc(!sortByNameAsc);
  };

  const sortByDeadline = () => {
    const sorted = [...tasks].sort((a, b) =>
      sortByTimeAsc
        ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        : new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
    );
    setTasks(sorted);
    setSortByTimeAsc(!sortByTimeAsc);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-blue-900 text-white p-4">
      <div className="max-w-md mx-auto mt-10 p-6 bg-black bg-opacity-40 shadow-2xl rounded-xl backdrop-blur-md border border-purple-700">
        <h1 className="text-3xl font-bold text-center mb-6 text-cyan-300 tracking-widest">
          🚀 To-Do List Angkasa
        </h1>

        <div className="flex justify-center mb-4">
          <button
            onClick={addTask}
            className="bg-transparent border border-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300"
          >
            + Tambah Tugas
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={sortByName}
            className="text-sm px-4 py-1 rounded border border-cyan-400 bg-transparent hover:bg-purple-600 transition-all"
          >
            Urut Nama
          </button>
          <button
            onClick={sortByDeadline}
            className="text-sm px-4 py-1 rounded border border-cyan-400 bg-transparent hover:bg-purple-600 transition-all"
          >
            Urut Waktu
          </button>
        </div>

        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = timeRemaining[task.id] || '...';
              const taskColor = task.completed
                ? 'bg-green-800 bg-opacity-20'
                : timeLeft === 'Waktu habis!'
                ? 'bg-red-800 bg-opacity-20'
                : 'bg-purple-700 bg-opacity-20';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className={`p-4 rounded-lg border border-purple-600 shadow-md ${taskColor}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer transition-all duration-300 ${
                        task.completed
                          ? 'line-through text-red-500'
                          : 'text-white font-semibold'
                      }`}
                    >
                      {task.text}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editTask(task)}
                        className="text-sm bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-full transition"
                        title="Edit tugas"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-sm bg-red-600 hover:bg-red-800 text-white px-3 py-1 rounded-full transition"
                        title="Hapus tugas"
                      >
                        ✖
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-cyan-200">⏰ {new Date(task.deadline).toLocaleString()}</p>
                  <p className="text-xs text-indigo-300">⌛ {timeLeft}</p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
