import { Routes, Route, Navigate } from 'react-router-dom'
import AlbumsList from '@/pages/AlbumsList'
import AlbumDetail from '@/pages/AlbumDetail'
import CollectionsList from '@/pages/CollectionsList'
import CollectionDetail from '@/pages/CollectionDetail'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Profile from '@/pages/Profile'
import UserProfile from '@/pages/UserProfile'
import { RequireAuth } from '@/routes/RequireAuth'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/albums" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/albums" element={<AlbumsList />} />
      <Route path="/albums/:id" element={<AlbumDetail />} />
      <Route path="/collections" element={<CollectionsList />} />
      <Route path="/collections/:id" element={<CollectionDetail />} />
      <Route path="/users/:id" element={<UserProfile />} />
      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/albums" replace />} />
    </Routes>
  )
}
