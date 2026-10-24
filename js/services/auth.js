import {createUserWithEmailAndPassword,sendPasswordResetEmail,signInWithEmailAndPassword,signOut,updateProfile} from "firebase/auth";
import {auth} from "../config/firebase.js";
export async function registerUser({name,email,password}){const credential=await createUserWithEmailAndPassword(auth,email.trim(),password);await updateProfile(credential.user,{displayName:name.trim()});const token=await credential.user.getIdToken();const response=await fetch("/api/user/profile",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({displayName:name.trim()})});if(!response.ok)throw new Error("Account created, but profile setup did not finish. Please log in again or contact support.");return credential.user;}
export async function loginUser({email,password}){const credential=await signInWithEmailAndPassword(auth,email.trim(),password);await credential.user.getIdToken(true);return credential.user;}
export async function resetPassword(email){return sendPasswordResetEmail(auth,email.trim());}
export async function logoutUser(){return signOut(auth);}
