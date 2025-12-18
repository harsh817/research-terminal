import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Research Terminal',
  description: 'Create your Research Terminal account to access real-time market intelligence.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
