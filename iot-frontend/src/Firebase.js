import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Replace with your actual Firebase config (same as backend)
const firebaseConfig = {
    apiKey: "AIzaSyB0KMcSL9gGLk1KNfrfgCx6N8Zt8nZoPWw",
    authDomain: "vehicalblackbox.firebaseapp.com",
    databaseURL: "https://vehicalblackbox-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "vehicalblackbox",
    storageBucket: "vehicalblackbox.firebasestorage.app",
    messagingSenderId: "630760404042",
    appId: "1:630760404042:web:2013ec36660a611e5662b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };