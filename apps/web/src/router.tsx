import { createBrowserRouter, Outlet } from 'react-router-dom';
import HomePage from '@/features/favorites/pages/HomePage';
import PlayRecordsPage from '@/features/play-records/pages/PlayRecordsPage';
import DetailPage from '@/features/video-detail/pages/DetailPage';
import PlayerPage from '@/features/video-player/pages/PlayerPage';
import SearchPage from '@/features/video-search/pages/SearchPage';
import Layout from '@/layout';

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
      { path: 'detail/:sourceId/:sourceVideoId', element: <DetailPage /> },
      { path: 'play-records', element: <PlayRecordsPage /> },
    ],
  },
  { path: 'play', element: <PlayerPage /> },
]);
