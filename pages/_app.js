import { GeistProvider, CssBaseline } from '@geist-ui/core'

function MyApp({ Component, pageProps }) {
  return (
    <GeistProvider>
      <CssBaseline /> {/* Optional: Reset CSS */}
      <Component {...pageProps} />
    </GeistProvider>
  )
}

export default MyApp 