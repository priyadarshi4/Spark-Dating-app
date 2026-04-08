import '../styles/globals.css';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import Head from 'next/head';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps, router }) {
  // Request geolocation on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const token = localStorage.getItem('spark_token');
          if (token) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ lat, lng }),
            }).catch(() => {});
          }
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <title>Spark — Where Hearts Collide</title>
        <meta name="description" content="Find your spark. Meet real people, real connections." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0F0F1A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <AnimatePresence mode="wait" initial={false}>
                  {getLayout(<Component {...pageProps} key={router.pathname} />)}
                </AnimatePresence>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#16162A',
                      color: '#fff',
                      border: '1px solid rgba(255,45,85,0.3)',
                      borderRadius: '14px',
                      backdropFilter: 'blur(20px)',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                    },
                    success: {
                      iconTheme: { primary: '#FF2D55', secondary: '#fff' },
                    },
                    error: {
                      iconTheme: { primary: '#FF3B30', secondary: '#fff' },
                    },
                  }}
                />
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
}
