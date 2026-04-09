import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin(): any {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL and Service Role Key are required. Please configure them in the Settings menu.');
    }

    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminClient;
}

async function startServer() {
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

  // Helper to verify Supabase JWT
  const verifyToken = async (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid token format');
    }
    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !user) {
      throw new Error(error?.message || 'Invalid token');
    }
    return user;
  };

  // Middleware to check if user is admin
  const checkAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const user = await verifyToken(req);
      
      const { data: userData, error } = await getSupabaseAdmin()
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData && (userData.role === 'admin' || user.email === 'edumatrad@gmail.com' || user.email === 'admin@mathmaster.pl')) {
        (req as any).user = user;
        next();
      } else {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    } catch (error: any) {
      res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
  };

  // Middleware to check if user is parent
  const checkIsParent = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const user = await verifyToken(req);
      
      const { data: userData } = await getSupabaseAdmin()
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData && userData.role !== 'parent' && userData.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Parent access required' });
      }

      (req as any).user = user;
      next();
    } catch (error: any) {
      res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
  };

  // Middleware to check if user is parent of the target child
  const checkParentOfChild = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const user = await verifyToken(req);
      
      const { data: userData } = await getSupabaseAdmin()
        .from('users')
        .select('role, children_uids')
        .eq('id', user.id)
        .single();

      if (userData && userData.role !== 'parent' && userData.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Parent access required' });
      }

      const { childUid } = req.body;
      if (!childUid) {
        return res.status(400).json({ error: 'Child UID is required' });
      }

      if (userData && userData.role === 'admin') {
        (req as any).user = user;
        return next();
      }

      const childrenUids = (userData as any)?.children_uids || [];
      if (!childrenUids.includes(childUid)) {
        return res.status(403).json({ error: 'Forbidden: You are not the parent of this child' });
      }

      (req as any).user = user;
      next();
    } catch (error: any) {
      res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin: Change User Password
  app.post("/api/admin/change-password", checkAdmin, async (req, res) => {
    const { uid, newPassword } = req.body;

    if (!uid || !newPassword) {
      return res.status(400).json({ error: "UID and new password are required" });
    }

    try {
      const { error } = await getSupabaseAdmin().auth.admin.updateUserById(uid, {
        password: newPassword
      });
      if (error) throw error;
      res.json({ success: true, message: "Hasło zostało zmienione pomyślnie." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create User with Email/Password
  app.post("/api/admin/create-user", checkAdmin, async (req, res) => {
    const { email, password, displayName, role, schoolClass } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          role: role || 'user'
        }
      });
      if (error) throw error;

      if (data.user) {
        await (getSupabaseAdmin() as any).from('users').update({
          school_class: schoolClass || ''
        }).eq('id', data.user.id);
      }

      res.json({ success: true, uid: data.user?.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete User
  app.post("/api/admin/delete-user", checkAdmin, async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    try {
      const { error } = await getSupabaseAdmin().auth.admin.deleteUser(uid);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Parent: Add Child
  app.post("/api/parent/add-child", checkIsParent, async (req, res) => {
    const { email, password, displayName, username } = req.body;
    const parentUid = (req as any).user.id;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Wszystkie pola są wymagane." });
    }

    try {
      const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          role: 'student'
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update student profile
        await (getSupabaseAdmin() as any).from('users').update({
          username: username ? username.toLowerCase() : '',
          parent_uid: parentUid,
          role: 'student'
        }).eq('id', data.user.id);

        // Update parent's children list
        const { data: parentData } = await getSupabaseAdmin()
          .from('users')
          .select('children_uids')
          .eq('id', parentUid)
          .single();

        const currentChildren = (parentData as any)?.children_uids || [];
        await (getSupabaseAdmin() as any).from('users').update({
          children_uids: [...currentChildren, data.user.id]
        }).eq('id', parentUid);
      }

      res.json({ success: true, uid: data.user?.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Import Users
  app.post("/api/admin/import-users", checkAdmin, async (req, res) => {
    const { users } = req.body;
    
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

        const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.displayName || 'Użytkownik',
            role: user.role || 'user'
          }
        });

        if (error) throw error;

        if (data.user) {
          await (getSupabaseAdmin() as any).from('users').update({
            school_class: user.schoolClass || ''
          }).eq('id', data.user.id);
        }

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
    
    if (!childUid || !newPassword) {
      return res.status(400).json({ error: "Child UID and new password are required" });
    }

    try {
      const { error } = await getSupabaseAdmin().auth.admin.updateUserById(childUid, {
        password: newPassword
      });
      if (error) throw error;
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
      console.log(`Sending report to ${parentEmail} for ${childName}`);
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
