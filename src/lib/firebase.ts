import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with settings for offline persistence
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  localCache: undefined, // Use default for now, or configure specifically if needed
}, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.warn("Firestore persistence failed: Multiple tabs open");
  } else if (err.code === 'unimplemented-state') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("Firestore persistence failed: Browser not supported");
  }
});

export const googleProvider = new GoogleAuthProvider();

// Connection test
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc just to test connectivity
    await getDocFromServer(doc(db, "_system_", "connection_test"));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Firebase connection failed: Client is offline or configuration is incorrect.");
    }
  }
}

testConnection();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
