/**
 * Sidebar de navegação
 * Navegação acadêmica limpa — sem menção a IA.
 */
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  Target,
  FlipHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VARK_STYLE_LABELS, VARK_STYLE_EMOJIS } from '../../data/varkQuestions';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Disciplinas', icon: BookOpen },
  { to: '/materiais', label: 'Materiais de Estudo', icon: FileText },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-white/15 text-white'
      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profile = user?.learningProfile;

  function handleLogout() {
    logout();
    navigate('/login');
    toast.success('Até logo! 👋');
  }

  // Esportes do perfil para exibir no card do usuário
  const sports = profile?.sportsProfile?.practiced?.slice(0, 2) || [];
  const careerGoal = profile?.careerGoal;

  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-900 to-indigo-950 flex flex-col flex-shrink-0 h-full">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Integrativa</p>
            <p className="text-indigo-300 text-xs">Educação Física</p>
          </div>
        </div>
      </div>

      {/* Perfil do usuário */}
      {user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-9 h-9 rounded-full border-2 border-indigo-400/50"
              />
            ) : (
              <div className="w-9 h-9 bg-indigo-400/30 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              {profile ? (
                <p className="text-indigo-300 text-xs">
                  {VARK_STYLE_EMOJIS[profile.primaryStyle]} {VARK_STYLE_LABELS[profile.primaryStyle]}
                  {sports.length > 0 && ` · ${sports[0]}`}
                </p>
              ) : (
                <p className="text-indigo-400 text-xs truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Objetivo de carreira */}
          {careerGoal && (
            <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
              <Target className="w-3 h-3 text-indigo-300 flex-shrink-0" />
              <p className="text-indigo-300 text-xs truncate">{careerGoal}</p>
            </div>
          )}
        </div>
      )}

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Acadêmico</p>

        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-4 border-t border-white/10 mt-4 space-y-1">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Conta</p>

          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="w-4 h-4" />
            Configurações
          </NavLink>

          <NavLink to="/onboarding" className={navLinkClass}>
            <FlipHorizontal className="w-4 h-4" />
            Refazer Perfil
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </nav>

      {/* Footer — sem menção a IA ou OpenAI */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-indigo-400 text-xs text-center">
          🎓 Plataforma Adaptativa · Educação Física
        </p>
      </div>
    </aside>
  );
}
