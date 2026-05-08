import { createBrowserRouter, Outlet } from 'react-router-dom';
import Layout from '@/layout';
import HomePage from '@/features/favorites/pages/HomePage';
import DetailPage from '@/features/video-detail/pages/DetailPage';
import SearchPage from '@/features/video-search/pages/SearchPage';
import PlayRecordsPage from '@/features/play-records/pages/PlayRecordsPage';

function Root() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'detail/:source/:id', element: <DetailPage /> },
      { path: 'play-records', element: <PlayRecordsPage /> },
    ],
  },
]);