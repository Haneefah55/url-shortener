import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { nanoid } from 'nanoid'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import mongoose from 'mongoose'
import { MongoClient } from 'mongodb';
import { publisher } from './rabbitmq'
import 'dotenv/config'

const uri = process.env.EDGE_MONGODB_URI! 

if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}
const client = new MongoClient(uri);

if (!client) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}
const db = client.db(); // Returns t


export const auth = betterAuth({
  
    database: mongodbAdapter(db),
    baseURL: 'http://localhost:3000',
  basePath: '/api/auth',
    emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    minPasswordLength: 8,
    
  },
    
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60, // 20 mins
      sendVerificationEmail: async ({ user, url }) => {
        const payload = {
          eventType: "User Verification Request",
          eventId: `evt_${nanoid(7)}`,
          data: {
            name: user.name,
            email: user.email,
            url,
            userId: user.id
          },
        };

        const result = await publisher("user.verification.request", payload);
        console.log("better auth email verification request result", result);
      },
      afterEmailVerification: async(user, request) => {
        const payload = {
          eventType: "User Verified",
          eventId: `evt_${nanoid(7)}`,
          data: {
            name: user.name,
            email: user.email,
            userId: user.id
          },
        };

        const result = await publisher("user.verified", payload);
        console.log("better auth after verification event result", result);
        
        
      }
    },

    socialProviders: {
    google: {
      clientId: `${process.env.GOOGLE_CLIENT_ID}`,
      clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
    }
    },
    plugins: [
      bearer()
    ]
  });
