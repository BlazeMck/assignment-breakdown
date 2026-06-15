import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_KEY,
    authDomain: "assignment-breakdown.firebaseapp.com",
    projectId: "assignment-breakdown",
    storageBucket: "assignment-breakdown.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const firebaseApp = initializeApp(firebaseConfig)

const auth = getAuth(firebaseApp);

export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        return userCredential.user
    } catch (error) {
        console.error("Firebase Auth Error: ", error.code, " ", error.message);
        throw error
    }
}

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase Login Error:", error.code);

        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            throw new Error("Invalid email or password.");
        }
        throw new Error("Something went wrong. Please try again.");
    }
}