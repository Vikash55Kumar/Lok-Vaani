// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store/index.ts';
import { AuthProvider } from './context/AuthContext.tsx';
import { ChatbotProvider } from './context/ChatbotContext.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ChatbotProvider>
            <App />
          </ChatbotProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  // </StrictMode>
);
