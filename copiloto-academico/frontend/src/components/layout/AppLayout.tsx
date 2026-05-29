/**
 * Layout principal da aplicação
 */
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { TutorialProvider } from '../../context/TutorialContext';
import WelcomeModal from '../ui/WelcomeModal';

export default function AppLayout() {
  return (
    <TutorialProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Modal de boas-vindas — exibido uma vez por usuário */}
      <WelcomeModal />
    </TutorialProvider>
  );
}
