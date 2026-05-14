const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDAtvqaprh18Eb6QSGr2nxRtriP-v8LRco",
  authDomain: "promptapp-12345.firebaseapp.com",
  projectId: "promptapp-12345",
  storageBucket: "promptapp-12345.firebasestorage.app",
  messagingSenderId: "375289943916",
  appId: "1:375289943916:web:db9b1ee77edbfd5c5f4549"
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
