import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js';

const CONFIG = window.SPEEDINCAR_FIREBASE_CONFIG || {};
const ADMIN_EMAILS = (window.SPEEDINCAR_ADMIN_EMAILS || []).map(email => String(email).trim().toLowerCase()).filter(Boolean);

let app;
let auth;
let db;
let storage;

function toUserFirebaseError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/operation-not-allowed': 'Activa Email/Password en Firebase Console > Authentication > Sign-in method.',
    'auth/invalid-credential': 'Correo o contrasena incorrectos.',
    'auth/user-not-found': 'No existe un usuario admin con ese correo.',
    'auth/wrong-password': 'Correo o contrasena incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'permission-denied': 'Tu usuario no tiene permisos para modificar este recurso.',
    'storage/bucket-not-found': 'Cloud Storage todavia no tiene bucket. En Firebase Console > Storage pulsa Get Started.',
    'storage/unauthorized': 'Tu usuario no tiene permisos para subir imagenes.',
    'storage/quota-exceeded': 'Storage alcanzo el limite disponible del proyecto.',
  };

  return new Error(messages[code] || error?.message || 'Firebase no pudo completar la operacion.');
}

export function isFirebaseConfigured() {
  return Boolean(
    CONFIG.apiKey &&
    CONFIG.authDomain &&
    CONFIG.projectId &&
    CONFIG.appId &&
    !String(CONFIG.apiKey).includes('TU_')
  );
}

export function isAllowedAdmin(user) {
  if (!user) return false;
  if (!ADMIN_EMAILS.length) return true;
  return ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
}

export function getFirebaseServices() {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }

  return { app, auth, db, storage };
}

export function watchAuth(callback) {
  const services = getFirebaseServices();
  if (!services) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(services.auth, callback);
}

export async function signInAdmin(email, password) {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase no esta configurado.');

  try {
    const credential = await signInWithEmailAndPassword(services.auth, email, password);
    if (!isAllowedAdmin(credential.user)) {
      await signOut(services.auth);
      throw new Error('Este correo no esta autorizado como administrador.');
    }

    return credential.user;
  } catch (error) {
    throw toUserFirebaseError(error);
  }
}

export async function signOutAdmin() {
  const services = getFirebaseServices();
  if (!services) return;
  await signOut(services.auth);
}

export function subscribeVehicles(onCars, onError = console.error) {
  const services = getFirebaseServices();
  if (!services) return () => {};

  return onSnapshot(collection(services.db, 'vehicles'), snapshot => {
    const cars = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data(),
    }));
    onCars(cars);
  }, error => onError(toUserFirebaseError(error)));
}

export async function saveVehicle(vehicle) {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase no esta configurado.');

  const clean = { ...vehicle };
  delete clean.createdAt;
  try {
    await setDoc(doc(services.db, 'vehicles', clean.id), {
      ...clean,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    throw toUserFirebaseError(error);
  }
}

export async function deleteVehicle(id) {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase no esta configurado.');
  try {
    await deleteDoc(doc(services.db, 'vehicles', id));
  } catch (error) {
    throw toUserFirebaseError(error);
  }
}

export async function uploadVehicleImage(vehicleId, file) {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase no esta configurado.');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const fileRef = ref(services.storage, `vehicles/${vehicleId}/${Date.now()}-${safeName}`);
  try {
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  } catch (error) {
    throw toUserFirebaseError(error);
  }
}
