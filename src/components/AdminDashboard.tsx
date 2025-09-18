import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Activity,
  UserCheck,
  Menu,
  X,
  Eye,
  Calendar,
  Shield,
} from "lucide-react";
import { useAdminData } from "../hooks/useAdminData";
import { AdminUserTable } from "./AdminUserTable";
import { AdminCardTable } from "./AdminCardTable";
import { AdminAnalytics } from "./AdminAnalytics";
import { AdminSettings } from "./AdminSettings";

type ActiveTab = "dashboard" | "users" | "cards" | "analytics" | "settings";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const {
    users,
    cards,
    analytics,
    loading,
    deleteUser,
    toggleCardStatus,
    deleteCard,
    exportToCSV,
  } = useAdminData();

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      navigate("/admin-scc/login");
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    navigate("/admin-scc/login");
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return { success: false };
    }
    return await deleteUser(userId);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this card? This action cannot be undone."
      )
    ) {
      return { success: false };
    }
    return await deleteCard(cardId);
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "cards", label: "Business Cards", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-semibold tracking-wide">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-100 font-sans">
      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          fixed inset-y-0 left-0 z-50
          ${sidebarCollapsed ? "w-16" : "w-64 sm:w-72"}
          bg-white/90 backdrop-blur-xl shadow-2xl border-r border-blue-100
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className={`flex items-center justify-between h-16 sm:h-20 px-2 sm:px-4 border-b border-blue-100 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center w-full" : "gap-2 sm:gap-3"}`}>
            <img src="/scc.png" alt="Logo" className={`rounded-full shadow ${sidebarCollapsed ? "w-10 h-10" : "w-10 h-10 sm:w-14 sm:h-14"}`} />
            {/* {!sidebarCollapsed && (
              <span className="text-lg sm:text-2xl font-bold text-blue-700 tracking-tight ml-2">Admin</span>
            )} */}
          </div>
          <div className="flex items-center gap-1">
            {/* Collapse/Expand button for desktop */}
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hidden lg:inline-flex p-1 rounded-lg hover:bg-blue-50 transition border border-blue-100"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              ) : (
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              )}
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-blue-50"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
            </button>
          </div>
        </div>

        <nav className={`mt-4 sm:mt-8 ${sidebarCollapsed ? "px-1" : "px-2 sm:px-4"} space-y-1`}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <div className="relative group" key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3 sm:gap-4"}
                    px-2 sm:px-4 py-2 sm:py-3 rounded-xl
                    text-base sm:text-lg font-medium transition-all duration-150 mb-1 shadow-sm
                    ${activeTab === item.id
                      ? "bg-gradient-to-r from-blue-100 to-purple-50 text-blue-800 border-l-4 border-blue-600 shadow-lg"
                      : "text-gray-600 hover:bg-blue-200/80 hover:text-blue-900 hover:shadow-md"}
                    ${sidebarCollapsed ? "justify-center px-0" : ""}
                  `}
                  onMouseEnter={e => {
                    if (sidebarCollapsed) {
                      const tooltip = e.currentTarget.nextSibling as HTMLElement | null;
                      if (tooltip && tooltip.classList) tooltip.classList.remove('hidden');
                    }
                  }}
                  onMouseLeave={e => {
                    if (sidebarCollapsed) {
                      const tooltip = e.currentTarget.nextSibling as HTMLElement | null;
                      if (tooltip && tooltip.classList) tooltip.classList.add('hidden');
                    }
                  }}
                  tabIndex={0}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
                  {!sidebarCollapsed && item.label}
                </button>
                {/* Tooltip for collapsed sidebar */}
                {sidebarCollapsed && (
                  <span
                    className="hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1 rounded bg-blue-900 text-white text-xs font-semibold shadow-lg whitespace-nowrap z-50 pointer-events-none group-hover:block"
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white/80 backdrop-blur border-b border-blue-100 shadow-sm">
          <div className="flex items-center justify-between h-14 sm:h-20 px-4 sm:px-10">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-blue-50"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
              </button>
              <h1 className="text-xl sm:text-3xl font-bold text-blue-900 capitalize tracking-tight drop-shadow-sm">
                {activeTab === "dashboard" ? "Admin Dashboard" : activeTab}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-purple-50 rounded-xl shadow">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                <span className="text-xs sm:text-base font-semibold text-blue-800">
                  Administrator
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold shadow text-xs sm:text-base"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10">
          {/* Dashboard Overview */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 sm:space-y-10">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                {/* Users Card */}
                <div className="bg-gradient-to-br from-blue-100 to-white rounded-xl sm:rounded-2xl shadow-lg border border-blue-200 p-4 sm:p-8 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-base font-semibold text-blue-700 mb-0.5 sm:mb-1">Total Users</p>
                      <p className="text-2xl sm:text-4xl font-extrabold text-blue-900 drop-shadow">{analytics.totalUsers}</p>
                    </div>
                    <div className="w-9 h-9 sm:w-14 sm:h-14 bg-blue-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow">
                      <Users className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-5 flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-base text-green-600 font-medium">
                      +{analytics.newUsersThisMonth} this month
                    </span>
                  </div>
                </div>

                {/* Cards Card */}
                <div className="bg-gradient-to-br from-green-100 to-white rounded-xl sm:rounded-2xl shadow-lg border border-green-200 p-4 sm:p-8 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-base font-semibold text-green-700 mb-0.5 sm:mb-1">Total Cards</p>
                      <p className="text-2xl sm:text-4xl font-extrabold text-green-900 drop-shadow">{analytics.totalCards}</p>
                    </div>
                    <div className="w-9 h-9 sm:w-14 sm:h-14 bg-green-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow">
                      <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-green-700" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-5 flex items-center gap-1 sm:gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span className="text-xs sm:text-base text-blue-600 font-medium">
                      {analytics.publishedCards} published
                    </span>
                  </div>
                </div>

                {/* Views Card */}
                <div className="bg-gradient-to-br from-purple-100 to-white rounded-xl sm:rounded-2xl shadow-lg border border-purple-200 p-4 sm:p-8 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-base font-semibold text-purple-700 mb-0.5 sm:mb-1">Total Views</p>
                      <p className="text-2xl sm:text-4xl font-extrabold text-purple-900 drop-shadow">{analytics.totalViews}</p>
                    </div>
                    <div className="w-9 h-9 sm:w-14 sm:h-14 bg-purple-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow">
                      <Eye className="w-5 h-5 sm:w-7 sm:h-7 text-purple-700" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-5 flex items-center gap-1 sm:gap-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    <span className="text-xs sm:text-base text-purple-600 font-medium">
                      Engagement metrics
                    </span>
                  </div>
                </div>

                {/* Active Users Card */}
                <div className="bg-gradient-to-br from-orange-100 to-white rounded-xl sm:rounded-2xl shadow-lg border border-orange-200 p-4 sm:p-8 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-base font-semibold text-orange-700 mb-0.5 sm:mb-1">Active Users</p>
                      <p className="text-2xl sm:text-4xl font-extrabold text-orange-900 drop-shadow">{analytics.activeUsers}</p>
                    </div>
                    <div className="w-9 h-9 sm:w-14 sm:h-14 bg-orange-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow">
                      <UserCheck className="w-5 h-5 sm:w-7 sm:h-7 text-orange-700" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-5 flex items-center gap-1 sm:gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    <span className="text-xs sm:text-base text-orange-600 font-medium">
                      Last 30 days
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                {/* Recent Users */}
                <div className="bg-white/90 rounded-xl sm:rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8">
                  <h3 className="text-base sm:text-xl font-bold text-blue-900 mb-3 sm:mb-6 tracking-tight">Recent Users</h3>
                  <div className="space-y-2 sm:space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-blue-50/60 rounded-lg sm:rounded-xl shadow-sm hover:bg-blue-100/80 transition"
                      >
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-200 rounded-full flex items-center justify-center shadow">
                          <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 text-sm sm:text-lg">
                            {user.name || "Unnamed User"}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-600">{user.email}</p>
                        </div>
                        <span className="text-xs text-blue-400 font-medium">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Cards */}
                <div className="bg-white/90 rounded-xl sm:rounded-2xl shadow-lg border border-green-100 p-4 sm:p-8">
                  <h3 className="text-base sm:text-xl font-bold text-green-900 mb-3 sm:mb-6 tracking-tight">Recent Cards</h3>
                  <div className="space-y-2 sm:space-y-4">
                    {cards.slice(0, 5).map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-green-50/60 rounded-lg sm:rounded-xl shadow-sm hover:bg-green-100/80 transition"
                      >
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-200 rounded-full flex items-center justify-center shadow">
                          <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-green-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 text-sm sm:text-lg">
                            {card.title || "Untitled Card"}
                          </p>
                          <p className="text-xs sm:text-sm text-green-600">
                            {card.profiles?.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow ${
                              card.is_published
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {card.is_published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Management */}
          {activeTab === "users" && (
            <AdminUserTable
              users={users}
              onDeleteUser={handleDeleteUser}
              onExportCSV={exportToCSV}
            />
          )}

          {/* Cards Management */}
          {activeTab === "cards" && (
            <AdminCardTable
              cards={cards}
              onToggleCardStatus={toggleCardStatus}
              onDeleteCard={handleDeleteCard}
              onExportCSV={exportToCSV}
            />
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <AdminAnalytics analytics={analytics} />
          )}

          {/* Settings */}
          {activeTab === "settings" && <AdminSettings />}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
