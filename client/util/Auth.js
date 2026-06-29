import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBqBTXzzWsRtDESvC9J6luCfu9gb4j5DYI",
    authDomain: "assignment-breakdown.firebaseapp.com",
    projectId: "assignment-breakdown",
    storageBucket: "assignment-breakdown.firebasestorage.app",
    messagingSenderId: "876218752695",
    appId: "1:876218752695:web:e1e97dd591a5b81d0af732"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

export { auth };

export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase Auth Error: ", error.code, " ", error.message);
        throw error;
    }
};

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
};