require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function count() {
  const q = collection(db, "prompts");
  const snap = await getDocs(q);
  console.log("Total prompts:", snap.size);
  const categories = {};
  snap.forEach(doc => {
    const cat = doc.data().category;
    categories[cat] = (categories[cat] || 0) + 1;
  });
  console.log("Categories:", JSON.stringify(categories, null, 2));
  process.exit(0);
}

count().catch(err => {
  console.error(err);
  process.exit(1);
});
