import { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import dbConnect from './mongodb';
import User from '@/models/User';

// Helper function for password comparison
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const [saltHex, keyHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');
    
    console.log('Password comparison debug:', {
      password,
      saltHex: saltHex.substring(0, 10) + '...',
      keyHex: keyHex.substring(0, 10) + '...',
      saltLength: salt.length,
      keyLength: key.length
    });
    
    crypto.scrypt(password, salt, 64, { N: 1024 }, (err, derivedKey) => {
      if (err) {
        console.error('Scrypt error:', err);
        reject(err);
        return;
      }
      
      console.log('Derived key length:', derivedKey.length);
      console.log('Original key length:', key.length);
      
      const isEqual = crypto.timingSafeEqual(key, derivedKey);
      console.log('Password comparison result:', isEqual);
      
      resolve(isEqual);
    });
  });
};

declare module 'next-auth' {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          const isPasswordValid = await comparePassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};