import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyB6tNuHodhXz7jJ09BcZXYTag4Z7CAH0pM",

    authDomain:
    "tcss-2228a.firebaseapp.com",

    projectId:
    "tcss-2228a",

    storageBucket:
    "tcss-2228a.firebasestorage.app",

    messagingSenderId:
    "197876015697",

    appId:
    "1:197876015697:web:1c1c159bcca72ad8c88e70",

    measurementId:
    "G-BB7444BFQE"

};

const app =
initializeApp(firebaseConfig);

export const db =
getFirestore(app);

export const auth =
getAuth(app);