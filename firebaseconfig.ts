import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZSxBb8GUyEqmQgpPoat6O4zlb7w5jMnA",
  authDomain: "ubuzimaconnect.firebaseapp.com",
  projectId: "ubuzimaconnect",
  storageBucket: "ubuzimaconnect.firebasestorage.app",
  messagingSenderId: "836151297092",
  appId: "1:836151297092:web:8be504b9e1ba417ba2e811",
  measurementId: "G-JFQY939XZS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserSessionPersistence)
  .catch((error) => console.error("Persistence error:", error));

const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, db };
