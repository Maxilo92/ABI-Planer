const admin = require("firebase-admin");
const serviceAccount = require("./functions/serviceAccountKey.json");

if (!serviceAccount) {
    console.error("No service account key found");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  try {
    const docRef = db.collection('settings').doc('features');
    await docRef.set({ combat_status: 'enabled' }, { merge: true });
    console.log("Successfully enabled combat!");
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
