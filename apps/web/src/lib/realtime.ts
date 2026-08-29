export const resolveRealtimeUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};
