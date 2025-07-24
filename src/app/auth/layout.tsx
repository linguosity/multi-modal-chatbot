export const metadata = {
  title: 'Sign In - Linguosity',
  description: 'Sign in to your Linguosity account to access speech-language evaluation tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('Rendering AuthLayout');
  return (
    <>{children}</>
  )
}
