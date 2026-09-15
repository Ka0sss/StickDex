import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </AuthProvider>
  )
}
