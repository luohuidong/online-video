import { createBrowserRouter, Outlet } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import DetailPage from '@/pages/DetailPage';
import SearchPage from '@/pages/SearchPage';
import PlayRecordsPage from '@/pages/PlayRecordsPage';

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