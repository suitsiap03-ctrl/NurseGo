/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { WelcomeScreen } from './components/common/WelcomeScreen';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { SupabaseConfigModal } from './components/common/SupabaseConfigModal';

// Auth Components
import { NurseLogin } from './components/auth/NurseLogin';
import { NurseRegister } from './components/auth/NurseRegister';
import { PatientLogin } from './components/auth/PatientLogin';
import { PatientActivation } from './components/auth/PatientActivation';

// Nurse Components
import { NurseDashboard } from './components/nurse/NurseDashboard';
import { PatientList } from './components/nurse/PatientList';
import { PatientDetail } from './components/nurse/PatientDetail';
import { NurseAlerts } from './components/nurse/NurseAlerts';
import { NurseDocumentation } from './components/nurse/NurseDocumentation';
import { NurseProfileView } from './components/nurse/NurseProfileView';
import { AddPatientModal } from './components/nurse/AddPatientModal';

// Patient Components
import { PatientDashboard } from './components/patient/PatientDashboard';
import { PatientCare } from './components/patient/PatientCare';
import { PatientMonitoringForm } from './components/patient/PatientMonitoringForm';
import { PatientHistory } from './components/patient/PatientHistory';
import { PatientProfileView } from './components/patient/PatientProfileView';

import { NotificationItem } from './types/database';
import { DEMO_NOTIFICATIONS_NURSE, DEMO_NOTIFICATIONS_PATIENT } from './data/mockData';
import { getSupabase } from './lib/supabaseClient';
import { HeartPulse } from 'lucide-react';

type AuthView = 'welcome' | 'nurse_login' | 'nurse_register' | 'patient_login' | 'patient_activation';

const MainAppContent: React.FC = () => {
  const { user, role, isLoading, isConfigured, recheckConfiguration, loginAsDemo } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('welcome');
  const [currentTab, setCurrentTab] = useState<string>('beranda');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load notifications based on active role
  useEffect(() => {
    if (!user || !role) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      const supabase = getSupabase();
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setNotifications(data as NotificationItem[]);
        } else {
          // Provide demo notifications if table empty or in demo mode
          if (role === 'nurse') {
            setNotifications(DEMO_NOTIFICATIONS_NURSE);
          } else {
            setNotifications(DEMO_NOTIFICATIONS_PATIENT);
          }
        }
      } catch (err) {
        // Fallback to demo notifications on network issue
        if (role === 'nurse') {
          setNotifications(DEMO_NOTIFICATIONS_NURSE);
        } else {
          setNotifications(DEMO_NOTIFICATIONS_PATIENT);
        }
      }
    };

    loadNotifications();
  }, [user, role]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSelectNotificationTarget = (targetId: string) => {
    setIsNotificationOpen(false);
    if (role === 'nurse') {
      setSelectedPatientId(targetId);
      setCurrentTab('pasien');
    } else {
      setCurrentTab('perawatan');
    }
  };

  // If loading session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white mb-4 animate-pulse">
          <HeartPulse className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-slate-800">Menghubungkan ke NurseGo...</p>
        <p className="text-xs text-slate-400 mt-1">Memeriksa sesi autentikasi Supabase</p>
      </div>
    );
  }

  // If unauthenticated: handle multi-step Welcome & Auth portal selection
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {authView === 'welcome' && (
          <WelcomeScreen
            onSelectRole={(selectedRole) => {
              if (selectedRole === 'nurse') {
                setAuthView('nurse_login');
              } else {
                setAuthView('patient_login');
              }
            }}
            onSelectDemo={(demoRole) => {
              loginAsDemo(demoRole);
            }}
            onOpenConfig={() => setIsConfigModalOpen(true)}
            isConfigured={isConfigured}
          />
        )}

        {authView === 'nurse_login' && (
          <NurseLogin
            onBackToPortalSelector={() => setAuthView('welcome')}
            onGoToRegister={() => setAuthView('nurse_register')}
            onSelectDemo={() => loginAsDemo('nurse')}
          />
        )}

        {authView === 'nurse_register' && (
          <NurseRegister
            onBackToLogin={() => setAuthView('nurse_login')}
          />
        )}

        {authView === 'patient_login' && (
          <PatientLogin
            onBackToPortalSelector={() => setAuthView('welcome')}
            onGoToActivation={() => setAuthView('patient_activation')}
            onSelectDemo={() => loginAsDemo('patient')}
          />
        )}

        {authView === 'patient_activation' && (
          <PatientActivation
            onBackToLogin={() => setAuthView('patient_login')}
            onActivationSuccess={() => setAuthView('patient_login')}
          />
        )}

        {/* Supabase Config Modal (accessible anytime via status badge) */}
        <SupabaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigUpdated={recheckConfiguration}
        />
      </div>
    );
  }

  // Handle nurse selecting a patient
  const handleSelectPatient = (pId: string) => {
    setSelectedPatientId(pId);
    setCurrentTab('pasien');
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab !== 'pasien') {
      setSelectedPatientId(null);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadCount={unreadNotifsCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* NURSE VIEWS */}
        {role === 'nurse' && (
          <>
            {currentTab === 'beranda' && (
              <NurseDashboard
                onSelectPatient={handleSelectPatient}
                onNavigateTab={handleTabChange}
                onOpenAddPatient={() => setIsAddPatientOpen(true)}
              />
            )}

            {currentTab === 'pasien' && (
              selectedPatientId ? (
                <PatientDetail
                  patientId={selectedPatientId}
                  onBack={() => setSelectedPatientId(null)}
                />
              ) : (
                <PatientList
                  onSelectPatient={handleSelectPatient}
                  onOpenAddPatient={() => setIsAddPatientOpen(true)}
                />
              )
            )}

            {currentTab === 'peringatan' && (
              <NurseAlerts onSelectPatient={handleSelectPatient} />
            )}

            {currentTab === 'dokumentasi' && (
              <NurseDocumentation onSelectPatient={handleSelectPatient} />
            )}

            {currentTab === 'profil' && (
              <NurseProfileView onOpenConfig={() => setIsConfigModalOpen(true)} />
            )}
          </>
        )}

        {/* PATIENT VIEWS */}
        {role === 'patient' && (
          <>
            {currentTab === 'beranda' && (
              <PatientDashboard onNavigateTab={handleTabChange} />
            )}

            {currentTab === 'perawatan' && (
              <PatientCare />
            )}

            {currentTab === 'pantau' && (
              <PatientMonitoringForm
                onSuccess={() => handleTabChange('beranda')}
              />
            )}

            {currentTab === 'riwayat' && (
              <PatientHistory />
            )}

            {currentTab === 'profil' && (
              <PatientProfileView onOpenConfig={() => setIsConfigModalOpen(true)} />
            )}
          </>
        )}
      </main>

      {/* Academic Disclaimer & Footer */}
      <footer className="mt-auto py-4 bg-white border-t border-slate-200 text-center text-[11px] text-slate-500 px-4">
        <p className="max-w-2xl mx-auto leading-relaxed">
          <strong>NurseGo</strong> – Prototipe Sistem Informasi Keperawatan Pascaoperasi. Bantuan pemantauan klinis berbasis web, bukan pengganti pemeriksaan langsung tenaga medis.
        </p>
      </footer>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        role={role || 'patient'}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onSelectTarget={handleSelectNotificationTarget}
      />

      {/* Database Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={recheckConfiguration}
      />

      {/* Add Patient Modal (Nurse only) */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={() => {
          // Patient added successfully
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
