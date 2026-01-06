import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider, ToastProvider, AuthProvider } from '@/providers';
import { Layout } from '@/components/layout';
import { HomePage } from '@/hooks/contracts/pages/HomePage';
import { PassportsPage } from '@/hooks/contracts/pages/PassportsPage';
import { PassportDetailsPage } from '@/hooks/contracts/pages/PassportDetailsPage';
import { MintPage } from '@/hooks/contracts/pages/MintPage';
import { NotFoundPage } from '@/hooks/contracts/pages/NotFoundPage';

function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/passports" element={<PassportsPage />} />
                <Route path="/passports/:tokenId" element={<PassportDetailsPage />} />
                <Route path="/mint" element={<MintPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </Web3Provider>
  );
}

export default App;
