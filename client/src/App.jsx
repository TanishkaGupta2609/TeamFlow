import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import AppRoutes from './routes';
import { ToastProvider } from './components/ui/Toast';

export const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
