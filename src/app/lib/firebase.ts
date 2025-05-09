import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: 'AIzaSyCb2u8ucWKwk8yHslIIk-zD0ZZdWvzWpaA',
  authDomain: 'praujikom-kafka-1cefa.firebaseapp.com',
  projectId: 'praujikom-kafka-1cefa',
  storageBucket: 'praujikom-kafka-1cefa.firebasestorage.app',
  messagingSenderId: '1087830798033',
  appId: '1:1087830798033:web:cbe5e75621f404ef081ff0',
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
