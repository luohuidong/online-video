import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from '@/shared/toast';
import { router } from './router';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
