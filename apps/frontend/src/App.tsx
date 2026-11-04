import { Navigate, Route, Routes } from 'react-router-dom';
import { Login, Register, AuthCallback } from './pages/Auth';
import Account from './pages/Account';
import Admin from './pages/Admin';
import { AdminOnly, Protected } from './pages/AppLayout';
import { ComponentBuilder, ComponentList } from './pages/Components';
import { ContentIndex, ContentList } from './pages/Content';
import Integration from './pages/Integration';
import Landing from './pages/Landing';
import MediaLibrary from './pages/MediaLibrary';
import Overview from './pages/Overview';
import ProjectLayout from './pages/ProjectLayout';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Team from './pages/Team';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/team" element={<Team />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/app" element={<Protected />}>
        <Route index element={<Projects />} />
        <Route path="account" element={<Account />} />
        <Route path="admin" element={<AdminOnly><Admin /></AdminOnly>} />
        <Route path="p/:pid" element={<ProjectLayout />}>
          <Route index element={<Overview />} />
          <Route path="components" element={<ComponentList />} />
          <Route path="components/new" element={<ComponentBuilder />} />
          <Route path="components/:cid" element={<ComponentBuilder />} />
          <Route path="content" element={<ContentIndex />} />
          <Route path="content/:cid" element={<ContentList />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="integration" element={<Integration />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
