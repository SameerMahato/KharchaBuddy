"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AICFOChat from '@/components/AICFOChat';

export default function AICFOPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI CFO Assistant</h1>
        <p className="text-gray-400 mt-1">
          Get personalized financial advice and insights powered by AI
        </p>
      </div>

      <AICFOChat />
    </div>
  );
}
