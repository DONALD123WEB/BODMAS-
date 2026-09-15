import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyCRqZSo7q_SxWX6ca-WgQ5lvPbYJLHG3sA",
    authDomain: "bodmas-calculator-9cd57.firebaseapp.com",
    projectId: "bodmas-calculator-9cd57",
    storageBucket: "bodmas-calculator-9cd57.firebasestorage.app",
    messagingSenderId: "220414398392",
    appId: "1:220414398392:web:adebba8d19f498c942494d"
};


const app = initializeApp(firebaseConfig);


// Firebase Authentication
export const auth = getAuth(app);


// Firestore Database
export const db = getFirestore(app);