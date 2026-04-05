
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
console.log('Project ID:', firebaseConfig.projectId);
console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
console.log('GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT);
console.log('GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT);
