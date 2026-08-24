// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAcJI4Hyv1fcY4NZMo1Iyb1_DFGJs8otPg",
  authDomain: "desperdicio-6e7c5.firebaseapp.com",
  projectId: "desperdicio-6e7c5",
  storageBucket: "desperdicio-6e7c5.firebasestorage.app",
  messagingSenderId: "848058696556",
  appId: "1:848058696556:web:56d9610e686a5fb0576949",
  measurementId: "G-084W7H6EM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
