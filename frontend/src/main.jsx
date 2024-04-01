import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/joy';
import { CssVarsProvider } from '@mui/joy/styles';
import _ from 'lodash';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3000';

const nestedData = (data) => {
  const buildTree = (items, parentId = null) => {
    const result = [];
    const children = _.filter(items, { parent: parentId });

    for (const child of children) {
      const { ...rest } = child; // Omit the "_id" and "parent" properties

      const subRows = buildTree(items, rest._id);
      if (subRows.length > 0) {
        rest.subRows = subRows.reverse();
      }

      result.push(rest);
    }

    return result;
  };

  // const rootItems = _.filter(data, { parent: null });

  return buildTree(data, null);
};
// import font
import '@fontsource/public-sans';

// import pages
import Layout from './routes/layout';
import Home from './routes/home';
import Bus from './routes/bus';
import BusModal from './routes/bus-modal';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'bus',
        element: <Bus />,
        loader: async () => {
          const { data } = await axios.get('/bus');
          return nestedData(data);
        },
        children: [
          {
            path: ':id?/create',
            element: <BusModal />,
            action: async ({ request, params }) => {
              const formData = await request.formData();
              params.id && formData.append('parent', params.id);
              await axios.post('/bus', formData);
              return redirect('/bus');
            },
          },
          {
            path: ':id/edit',
            element: <BusModal />,
            loader: async ({ params }) => {
              const { data } = await axios.get(`/bus/${params.id}`);
              return data;
            },
            action: async ({ request, params }) => {
              const formData = await request.formData();
              formData.append('parent', params.id);
              await axios.put(`/bus/${params.id}`, formData);
              return redirect('/bus');
            },
          },
          {
            path: ':id/delete',
            element: <BusModal />,
            action: async ({ params }) => {
              await axios.delete(`/bus/${params.id}`);
              return redirect('/bus');
            },
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <CssVarsProvider defaultMode="dark">
    <CssBaseline />
    <GlobalStyles
      styles={{
        '::-webkit-file-upload-button': {
          display: 'none',
        },
      }}
    />
    <RouterProvider router={router} />
  </CssVarsProvider>
);
