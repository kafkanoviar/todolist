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

    if (difference <= 0) return '⛔ Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru 🖴',
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
      title: 'Edit tugas ✎',
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
    <div
      className="min-h-screen bg-[#d3d3c7] text-black font-mono p-4"
      style={{ fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="max-w-lg mx-auto mt-10 p-6 bg-[#f2f2f2] border-4 border-black shadow-[6px_6px_0px_#000]">
        <h1 className="text-sm text-center font-bold mb-4 uppercase tracking-widest text-black">
          💾 TO-DO LIST RETRO 90S 💾
        </h1>

        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-yellow-300 text-black border-2 border-black px-4 py-2 font-bold hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-transform"
          >
            ➕ Tambah Tugas
          </button>
        </div>

        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const isExpired = timeRemaining[task.id] === '⛔ Waktu habis!';
              const bg = isExpired
                ? 'bg-red-200'
                : task.completed
                ? 'bg-green-200'
                : 'bg-white';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className={`p-4 border-2 border-black shadow-[3px_3px_0px_#000] ${bg} text-black text-xs`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer ${task.completed ? 'line-through text-gray-600' : 'font-bold'}`}
                    >
                      {task.text}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => editTask(task)}
                        className="bg-blue-300 border border-black px-2 py-1 hover:bg-blue-400"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-red-300 border border-black px-2 py-1 hover:bg-red-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="mt-2">🕒 {new Date(task.deadline).toLocaleString()}</p>
                  <p className="text-gray-800">⏳ {timeRemaining[task.id] || '...'}</p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
