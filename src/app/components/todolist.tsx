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
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
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
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit tugas 🚀',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(task.deadline).toISOString().slice(0, 16)}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-blue-900 text-white p-4">
      <div className="max-w-md mx-auto mt-10 p-6 bg-black bg-opacity-40 shadow-2xl rounded-xl backdrop-blur-md border border-purple-700">
        <h1 className="text-3xl font-bold text-center mb-6 text-cyan-300 tracking-widest">
          🚀 To-Do List Angkasa
        </h1>
        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300"
          >
            + Tambah Tugas
          </button>
        </div>
        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = calculateTimeRemaining(task.deadline);
              const isExpired = timeLeft === 'Waktu habis!';
              const taskColor = task.completed
                ? 'bg-green-700 bg-opacity-30'
                : isExpired
                ? 'bg-red-700 bg-opacity-30'
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
                          ? 'line-through text-gray-400'
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
                        🚀
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
                  <p className="text-sm text-cyan-200">
                    ⏰ {new Date(task.deadline).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-300">
                    ⌛ {timeRemaining[task.id] || 'Menghitung...'}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
