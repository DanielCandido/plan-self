export const resolveRealtimeUrl = () => {
  if (process.env.NEXT_PUBLIC_API_WS_URL) {
    return process.env.NEXT_PUBLIC_API_WS_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3001';
};
