import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHC61n4UhHxvs4fZe3BBmZdznERLZyRqQ",
  authDomain: "hazel-inventory.firebaseapp.com",
  projectId: "hazel-inventory",
  storageBucket: "hazel-inventory.firebasestorage.app",
  messagingSenderId: "388507146656",
  appId: "1:388507146656:web:7427517e4564b46a46ecc5",
  measurementId: "G-LVVR3ZSD65"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);