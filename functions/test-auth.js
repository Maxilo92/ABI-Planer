const admin = require('firebase-admin');

try {
  admin.initializeApp({
    projectId: 'abi-planer-75319'
  });
  console.log('App initialized with default credentials and projectId.');
  const bucket = admin.storage().bucket('abi-planer-75319.appspot.com');
  bucket.getFiles({ maxResults: 1 })
    .then(() => console.log('Successfully accessed bucket.'))
    .catch(err => console.error('Error accessing bucket:', err));
} catch (error) {
  console.error('Initialization error:', error.message);
}
