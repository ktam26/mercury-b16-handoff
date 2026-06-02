'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <p className="text-6xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={reset}
              className="w-full bg-kelly-green hover:bg-kelly-green/90"
            >
              Try again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}