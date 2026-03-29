import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from 'stripe';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

startServer();
