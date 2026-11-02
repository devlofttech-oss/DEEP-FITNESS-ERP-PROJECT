import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { RequestFeatureModal, ContactModal } from '../support/SupportModals';

const ADMIN_NAV_ALL = [
  { to: '/',              icon: 'monitoring',             label: 'Dashboard',      fill: true,  end: true  },
  { to: '/members',       icon: 'group',                  label: 'Members',        fill: true               },
  { to: '/plans',         icon: 'loyalty',                label: 'Plans',          fill: true               },
  { to: '/payments',      icon: 'account_balance_wallet', label: 'Payments',       fill: false              },
  { to: '/checkin',       icon: 'how_to_reg',             label: 'Check-in',       fill: true               },
  { to: '/attendance',    icon: 'event_available',        label: 'Attendance',     fill: true               },
  { to: '/classes',       icon: 'sports_gymnastics',      label: 'Classes',        fill: true               },
  { to: '/staff',         icon: 'badge',                  label: 'Staff',          fill: true               },
  { to: '/equipment',     icon: 'fitness_center',         label: 'Equipment',      fill: false              },
  { to: '/supplements',   icon: 'medication',             label: 'Supplements',    fill: true               },
  { to: '/leads',         icon: 'person_search',          label: 'Leads & CRM',    fill: true               },
  { to: '/workouts',      icon: 'exercise',               label: 'Workouts',       fill: true               },
  { to: '/pt',            icon: 'sports_martial_arts',    label: 'Personal Trng',  fill: true               },
  { to: '/expenses',      icon: 'receipt',                label: 'Expenses',       fill: true               },
  { to: '/reports/monthly',icon: 'insert_chart',          label: 'Reports',        fill: true               },
  { to: '/settings',      icon: 'settings',               label: 'Settings',       fill: true               },
];

// 4 items pinned in the mobile bottom bar (admin)
const ADMIN_PINNED = ['/', '/members', '/checkin', '/payments'];

// Categorised groups shown in the "More" drawer
const DRAWER_GROUPS = [
  {
    label: 'Members',
    items: ['/leads', '/attendance', '/plans'],
  },
  {
    label: 'Training',
    items: ['/classes', '/workouts', '/pt'],
  },
  {
    label: 'Finance',
    items: ['/expenses', '/reports/monthly'],
  },
  {
    label: 'Inventory',
    items: ['/equipment', '/supplements'],
  },
  {
    label: 'Manage',
    items: ['/staff', '/settings'],
  },
];

const STAFF_NAV = [
  { to: '/checkin',      icon: 'how_to_reg',     label: 'Check-in',     fill: true, end: false },
  { to: '/attendance',   icon: 'event_available', label: 'Attendance',   fill: true, end: false },
  { to: '/measurements', icon: 'monitor_weight',  label: 'Measure',      fill: true, end: false },
];

export default function DashboardLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [supportModal, setSupportModal] = useState(null); // 'feature' | 'contact'
  const { gymData, gymId, role } = useAuth();
  const location = useLocation();

  // Close More drawer on route change
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const isAdmin = role !== 'staff';

  const pinnedItems = isAdmin
    ? ADMIN_NAV_ALL.filter(n => ADMIN_PINNED.includes(n.to))
    : STAFF_NAV;

  const drawerItems = isAdmin
    ? ADMIN_NAV_ALL.filter(n => !ADMIN_PINNED.includes(n.to))
    : [];

  const isMoreActive = drawerItems.some(n =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  );

  return (
    <div className="bg-background text-on-background antialiased flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative md:ml-24">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-gutter lg:p-container-margin space-y-section-gap custom-scrollbar pb-24 md:pb-10">
            <Outlet />
          </main>
        </div>

        {/* ── Mobile Bottom Navigation Bar (below md) ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 px-3 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {pinnedItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-primary-container' : ''}`}>
                    <span
                      className="material-symbols-outlined text-[22px] transition-transform duration-200"
                      style={{ fontVariationSettings: isActive && item.fill ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* "More" button — admin only */}
          {isAdmin && (
            <button
              onClick={() => setMoreOpen(true)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-200 ${
                isMoreActive || moreOpen ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isMoreActive || moreOpen ? 'bg-primary-container' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">
                  grid_view
                </span>
              </div>
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
          )}
        </nav>

        {/* ── Full-screen App Drawer ── */}
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-9999 flex flex-col"
            style={{ background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(16px)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-14 pb-5 shrink-0">
              <div>
                <h2 className="text-white text-xl font-bold tracking-tight">Modules</h2>
                <p className="text-white/40 text-xs mt-0.5">{gymData?.name || 'Deep Fitness'}</p>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Module grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-24">
              <div className="flex flex-col gap-6">
                {DRAWER_GROUPS.map(group => {
                  const groupItems = group.items
                    .map(path => ADMIN_NAV_ALL.find(n => n.to === path))
                    .filter(Boolean);
                  return (
                    <div key={group.label}>
                      <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {groupItems.map(item => {
                          const isActive = item.end
                            ? location.pathname === item.to
                            : location.pathname.startsWith(item.to);
                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={`flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all active:scale-95 ${
                                isActive
                                  ? 'bg-primary/30 border border-primary/40'
                                  : 'bg-white/8 border border-white/5 active:bg-white/15'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isActive ? 'bg-primary' : 'bg-white/10'
                              }`}>
                                <span className="material-symbols-outlined text-[20px] text-white"
                                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                                  {item.icon}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-white/70 text-center leading-tight">
                                {item.label}
                              </span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Support modals (mobile footer) */}
      {supportModal === 'feature' && (
        <RequestFeatureModal gymId={gymId} gymName={gymData?.name} onClose={() => setSupportModal(null)} />
      )}
      {supportModal === 'contact' && (
        <ContactModal onClose={() => setSupportModal(null)} />
      )}
    </div>
  );
}
