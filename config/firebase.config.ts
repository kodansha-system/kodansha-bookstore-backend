import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

try {
  dotenv.config();

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} catch (error) {
  console.error('Lỗi firebase', error);
}

export const firebaseAdmin = admin;
