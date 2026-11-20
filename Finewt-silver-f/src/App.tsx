// App.tsx
import {RouterProvider, createRouter} from '@tanstack/react-router';
import {Toaster} from 'react-hot-toast';
import AuthContextProvider from './context/AuthContextProvider';
import QueryProvider from './lib/react-query/QueryProvider';
import {routeTree} from './routeTree.gen';
import NotFound404 from './layouts/NotFound404';

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound404, // Use real 404 page
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  return (
    <AuthContextProvider>
      <div>
        <Toaster />
      </div>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </AuthContextProvider>
  );
};

export default App;
