import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

dotenv.config();

// Force project ID in environment to help some SDKs
process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: firebaseConfig.projectId,
});

console.log(`[INIT] Firebase Project ID: ${firebaseConfig.projectId}`);
console.log(`[INIT] Firestore Database ID: ${firebaseConfig.firestoreDatabaseId}`);

async function startServer() {
  // Delete all existing apps to ensure we start fresh with the correct project ID
  for (const app of admin.apps) {
    console.log(`[INIT] Deleting existing app: ${app.name} (${app.options.projectId})`);
    await app.delete();
  }

  let firebaseApp;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
      console.log(`[INIT] Initialized default app with Service Account Key for project: ${firebaseApp.options.projectId}`);
    } catch (e) {
      console.error("[INIT] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Falling back to default credentials.", e);
      firebaseApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } else {
    console.warn("[INIT] WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin actions like changing passwords will fail.");
    firebaseApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log(`[INIT] Initialized default app with project ID: ${firebaseApp.options.projectId}`);
  }

  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  const auth = admin.auth(firebaseApp);

  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

  const app = express();
  const PORT = 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // Middleware to check if user is admin
  // Middleware to check if user is admin
  const checkAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`[AUTH] Checking admin for ${req.method} ${req.url}`);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("[AUTH] No auth header or invalid format");
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken || idToken === 'undefined' || idToken === 'null') {
      console.log("[AUTH] Token is undefined or null");
      return res.status(401).json({ error: 'Unauthorized: Token is undefined' });
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      console.log("[AUTH] Verifying ID token...");
      console.log(`[AUTH] Current App Project ID: ${firebaseApp.options.projectId}`);
      console.log(`[AUTH] GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT}`);
      console.log(`[AUTH] GOOGLE_CLOUD_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT}`);
      console.log(`[AUTH] FIREBASE_CONFIG: ${process.env.FIREBASE_CONFIG}`);
      decodedToken = await auth.verifyIdToken(idToken);
      console.log(`[AUTH] Token verified for email: ${decodedToken.email}, uid: ${decodedToken.uid}`);
    } catch (error: any) {
      console.error("[AUTH] Token verification failed. Full error:", error);
      console.error("[AUTH] Error code:", error.code);
      console.error("[AUTH] Error message:", error.message);
      console.error("[AUTH] Error stack:", error.stack);
      return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }

    try {
      console.log(`[AUTH] Fetching user doc from Firestore database: ${firebaseConfig.firestoreDatabaseId}`);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();
      console.log(`[AUTH] User data from Firestore: exists=${userDoc.exists}, role=${userData?.role}`);

      if (userData?.role === 'admin' || decodedToken.email === 'edumatrad@gmail.com' || decodedToken.email === 'admin@mathmaster.pl') {
        console.log("[AUTH] Admin access granted");
        (req as any).user = decodedToken;
        next();
      } else {
        console.log(`[AUTH] Admin access denied for ${decodedToken.email}. Role: ${userData?.role}`);
        res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    } catch (error: any) {
      // If Firestore fetch fails, check email anyway
      if (decodedToken.email === 'edumatrad@gmail.com' || decodedToken.email === 'admin@mathmaster.pl') {
        console.log("[AUTH] Admin access granted via email (Firestore fetch failed)");
        (req as any).user = decodedToken;
        next();
      } else {
        console.error("[AUTH] Firestore fetch failed. Full error:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
      }
    }
  };

  // Middleware to check if user is parent
  const checkIsParent = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const parentDoc = await db.collection('users').doc(decodedToken.uid).get();
      const parentData = parentDoc.data();

      if (parentData?.role !== 'parent' && parentData?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Parent access required' });
      }

      (req as any).user = decodedToken;
      next();
    } catch (error: any) {
      res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
  };

  // Middleware to check if user is parent of the target child
  const checkParentOfChild = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const parentDoc = await db.collection('users').doc(decodedToken.uid).get();
      const parentData = parentDoc.data();

      if (parentData?.role !== 'parent' && parentData?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Parent access required' });
      }

      const { childUid } = req.body;
      if (!childUid) {
        return res.status(400).json({ error: 'Child UID is required' });
      }

      if (parentData?.role === 'admin') {
        (req as any).user = decodedToken;
        return next();
      }

      const childrenUids = parentData?.childrenUids || [];
      if (!childrenUids.includes(childUid)) {
        return res.status(403).json({ error: 'Forbidden: You are not the parent of this child' });
      }

      (req as any).user = decodedToken;
      next();
    } catch (error: any) {
      res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    console.log("Health check requested");
    res.json({ status: "ok" });
  });

  // Admin: Change User Password
  app.post("/api/admin/change-password", checkAdmin, async (req, res) => {
    const { uid, newPassword } = req.body;
    console.log(`[ADMIN] Change password requested for uid: ${uid}`);

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ error: "Brak klucza Service Account. Aby zmieniać hasła, musisz wygenerować klucz w konsoli Firebase i dodać go jako zmienną środowiskową FIREBASE_SERVICE_ACCOUNT_KEY w AI Studio." });
    }

    if (!uid || !newPassword) {
      return res.status(400).json({ error: "UID and new password are required" });
    }

    try {
      await auth.updateUser(uid, {
        password: newPassword
      });
      console.log(`[ADMIN] Password updated successfully for uid: ${uid}`);
      res.json({ success: true, message: "Hasło zostało zmienione pomyślnie." });
    } catch (error: any) {
      console.error("[ADMIN] Error changing password:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create User with Email/Password
  app.post("/api/admin/create-user", checkAdmin, async (req, res) => {
    const { email, password, displayName, role, schoolClass } = req.body;
    console.log(`[ADMIN] Create user requested for email: ${email}, role: ${role}`);

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ error: "Brak klucza Service Account. Aby tworzyć użytkowników, musisz wygenerować klucz w konsoli Firebase i dodać go jako zmienną środowiskową FIREBASE_SERVICE_ACCOUNT_KEY w AI Studio." });
    }

    if (!email || !password) {
      console.log("[ADMIN] Missing email or password in request body");
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      console.log("[ADMIN] Attempting to create user in Firebase Auth...");
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });
      console.log(`[ADMIN] User created in Firebase Auth with uid: ${userRecord.uid}`);

      // Create user document in Firestore
      console.log("[ADMIN] Attempting to create user document in Firestore...");
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: displayName || 'Użytkownik',
        role: role || 'user',
        schoolClass: schoolClass || '',
        isPremium: false,
        totalPoints: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[ADMIN] User document created in Firestore for uid: ${userRecord.uid}`);

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error("[ADMIN] Error creating user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete User
  app.post("/api/admin/delete-user", checkAdmin, async (req, res) => {
    const { uid } = req.body;
    console.log(`[ADMIN] Delete user requested for uid: ${uid}`);

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ error: "Brak klucza Service Account. Aby usuwać użytkowników, musisz wygenerować klucz w konsoli Firebase i dodać go jako zmienną środowiskową FIREBASE_SERVICE_ACCOUNT_KEY w AI Studio." });
    }

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    try {
      // Delete from Firebase Auth
      console.log(`[ADMIN] Attempting to delete user ${uid} from Firebase Auth...`);
      try {
        await auth.deleteUser(uid);
        console.log(`[ADMIN] User ${uid} deleted from Firebase Auth`);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.log(`[ADMIN] User ${uid} not found in Firebase Auth, proceeding to delete from Firestore`);
        } else {
          throw authError;
        }
      }

      // Delete from Firestore
      console.log(`[ADMIN] Attempting to delete user ${uid} document from Firestore...`);
      await db.collection('users').doc(uid).delete();
      console.log(`[ADMIN] User document ${uid} deleted from Firestore`);

      res.json({ success: true });
    } catch (error: any) {
      console.error("[ADMIN] Error deleting user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Parent: Add Child
  app.post("/api/parent/add-child", checkIsParent, async (req, res) => {
    const { email, password, displayName, username } = req.body;
    const parentUid = (req as any).user.uid;
    
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ error: "Brak klucza Service Account." });
    }

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane." });
    }

    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      // Create user document in Firestore
      const studentProfile = {
        uid: userRecord.uid,
        username: username ? username.toLowerCase() : '',
        email,
        displayName,
        photoURL: '',
        role: 'user', // 'user' is the student role
        parentUid: parentUid,
        isPremium: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        streak: 0,
        totalPoints: 0,
        totalTimeSpent: 0,
        weakTopics: [],
        completedStudyTopics: []
      };

      const batch = db.batch();
      
      batch.set(db.collection('users').doc(userRecord.uid), studentProfile);
      
      if (username) {
        batch.set(db.collection('usernames').doc(username.toLowerCase()), { uid: userRecord.uid });
      }
      
      batch.set(db.collection('public_profiles').doc(userRecord.uid), {
        uid: userRecord.uid,
        displayName,
        photoURL: '',
        totalPoints: 0,
        streak: 0
      });

      // Update parent's children list
      batch.set(db.collection('users').doc(parentUid), {
        childrenUids: admin.firestore.FieldValue.arrayUnion(userRecord.uid)
      }, { merge: true });

      await batch.commit();

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error("[PARENT] Error adding child:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Import Users
  app.post("/api/admin/import-users", checkAdmin, async (req, res) => {
    const { users } = req.body; // Array of { email, password, displayName, role, schoolClass }
    
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ error: "Brak klucza Service Account." });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Brak danych do importu." });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const user of users) {
      try {
        if (!user.email || !user.password) {
          throw new Error("Brak emaila lub hasła");
        }

        const userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName || 'Użytkownik',
        });

        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: user.email,
          displayName: user.displayName || 'Użytkownik',
          role: user.role || 'user',
          schoolClass: user.schoolClass || '',
          isPremium: false,
          totalPoints: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Błąd dla ${user.email || 'nieznanego'}: ${error.message}`);
      }
    }

    res.json(results);
  });

  // Parent: Change Child Password
  app.post("/api/parent/change-child-password", checkParentOfChild, async (req, res) => {
    const { childUid, newPassword } = req.body;
    
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(500).json({ error: "Brak klucza Service Account. Skontaktuj się z administratorem." });
    }

    if (!childUid || !newPassword) {
      return res.status(400).json({ error: "Child UID and new password are required" });
    }

    try {
      await auth.updateUser(childUid, {
        password: newPassword
      });
      res.json({ success: true, message: "Hasło dziecka zostało zmienione pomyślnie." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pln',
              product_data: {
                name: 'MathMaster Premium - Przygotowanie do egzaminu',
                description: 'Pełny dostęp do wszystkich lekcji i testów',
              },
              unit_amount: 4900, // 49.00 PLN
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.APP_URL}/dashboard?payment=cancel`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Email Notifications
  app.post("/api/notifications/send-report", async (req, res) => {
    const { parentEmail, childName, stats } = req.body;

    if (!parentEmail) {
      return res.status(400).json({ error: "Parent email is required" });
    }

    try {
      // Create a transporter (using a test account or real SMTP)
      // For this demo, we'll use a mock success response
      // In production, use: const transporter = nodemailer.createTransport({...});
      
      console.log(`Sending report to ${parentEmail} for ${childName}`);
      
      // Mock sending email
      res.json({ success: true, message: `Raport dla ${childName} został wysłany na adres ${parentEmail}.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications/alert-missing-login", async (req, res) => {
    const { parentEmail, childName } = req.body;

    try {
      console.log(`Sending missing login alert to ${parentEmail} for ${childName}`);
      res.json({ success: true, message: `Alert o braku logowania ${childName} wysłany.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for API routes to prevent falling through to Vite and returning HTML
  app.all("/api/*", (req, res) => {
    console.warn(`API route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
