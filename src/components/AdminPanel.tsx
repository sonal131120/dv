import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  User,
  Eye,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { CardEditor } from "./CardEditor";
// import { CardPreview } from "./CardPreview";
import { AnalyticsPage } from "./AnalyticsPage";
import type { Database } from "../lib/supabase";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

type ActiveTab = "cards" | "create" | "analytics" | "settings";

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("cards");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [editingCard, setEditingCard] = useState<BusinessCard | null>(null);

  useEffect(() => {
    if (user) {
      loadUserCards();
    }
  }, [user]);

  const loadUserCards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("business_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading cards:", error);
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreateCard = () => {
    setEditingCard(null);
    setActiveTab("create");
  };

  const handleEditCard = (card: BusinessCard) => {
    setEditingCard(card);
    setActiveTab("create");
  };

  const handleDeleteCard = async (cardId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this card? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("business_cards")
        .delete()
        .eq("id", cardId);

      if (error) {
        console.error("Error deleting card:", error);
        alert("Failed to delete card. Please try again.");
        return;
      }

      // Refresh cards list
      await loadUserCards();

      // If we were editing this card, go back to cards list
      if (editingCard?.id === cardId) {
        setEditingCard(null);
        setActiveTab("cards");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card. Please try again.");
    }
  };

  const handleDuplicateCard = async (card: BusinessCard) => {
    try {
      const { id, created_at, updated_at, slug, ...cardData } = card;

      const { error } = await supabase.from("business_cards").insert({
        ...cardData,
        title: `${card.title} (Copy)`,
        is_published: false,
        view_count: 0,
      });

      if (error) {
        console.error("Error duplicating card:", error);
        alert("Failed to duplicate card. Please try again.");
        return;
      }

      await loadUserCards();
    } catch (error) {
      console.error("Error duplicating card:", error);
      alert("Failed to duplicate card. Please try again.");
    }
  };

  const copyCardUrl = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Card URL copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy URL. Please try again.");
      });
  };

  const sidebarItems = [
    { id: "cards", label: "My Cards", icon: CreditCard },
    { id: "create", label: "Create New Card", icon: Plus },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderCardsGrid = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-4xl text-blue-900 font-extrabold tracking-tight drop-shadow-sm"
            style={{ fontFamily: "'Rancho', cursive", letterSpacing: "0.03em" }}
          >
            My Business Cards
          </h2>
        </div>
        <button
          onClick={handleCreateCard}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl shadow-md hover:from-blue-600 hover:to-pink-600 hover:scale-105 transition-all font-semibold border-2 border-blue-400"
        >
          <Plus className="w-4 h-4" />
          <span className="tracking-wide">New Card</span>
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading your cards...</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Cards Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first digital business card to get started.
          </p>
          <button
            onClick={handleCreateCard}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-lg border-2 border-blue-100 hover:border-blue-400 overflow-hidden hover:shadow-2xl transition-all duration-200 group"
              style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}
            >
              {/* Card Preview */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-blue-100">
                <div className="flex items-center gap-4">
                  {/* Avatar - left side */}
                  <div>
                    {card.avatar_url ? (
                      <img
                        src={card.avatar_url}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-blue-200 group-hover:border-blue-400 transition-all"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 via-blue-100 to-purple-100 flex items-center justify-center border-4 border-blue-100">
                        <User className="w-12 h-12 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Card Info - right side */}
                  <div className="flex-1 relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-blue-900 truncate group-hover:text-purple-700 transition-colors mt-3 lg:mt-2">
                          {card.title || "Untitled Card"}
                        </h3>
                        <p className="text-sm text-gray-500 italic truncate">
                          {card.company || "No company"}
                        </p>
                      </div>
                    </div>
                    {/* Status badge - top right */}
                    <span
                      className={`absolute -top-[15%] lg:-top-[20%] -right-5 lg:-right-4 mt-2 mr-2 inline-flex px-2 py-1 rounded-full text-xs font-bold shadow border ${
                        card.is_published
                          ? "bg-green-100 text-green-800 border-green-400"
                          : "bg-yellow-100 text-yellow-800 border-yellow-400"
                      }`}
                    >
                      {card.is_published ? "Published" : "Draft"}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-500 mt-4">
                        <div className="flex items-center gap-1 justify-start">
                          <Eye className="w-5 h-5 text-blue-400 min-w-[20px]" />
                          <span className="font-semibold text-blue-700">
                            {card.view_count || 0} views
                          </span>
                        </div>
                        <span className="italic text-purple-600 font-medium text-xs sm:text-sm text-left sm:text-right">
                          Updated {new Date(card.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <div className="p-4">
                {/* Actions */}
                <div className="flex items-center gap-2 mt-0">
                  <button
                    onClick={() => handleEditCard(card)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 hover:text-blue-900 font-semibold border border-blue-200 shadow-sm transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>

                  {card.is_published && card.slug && (
                    <button
                      onClick={() => window.open(`/c/${card.slug}`, "_blank")}
                      className="p-2 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 transition-all"
                      title="View Card"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  {card.slug && (
                    <button
                      onClick={() => copyCardUrl(card.slug!)}
                      className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDuplicateCard(card)}
                    className="p-2 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all"
                    title="Duplicate Card"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-all font-bold"
                    title="Delete Card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-extrabold text-blue-900 tracking-tight"
          style={{ fontFamily: "'Montserrat', cursive" }}
        >
          Settings
        </h2>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Settings Coming Soon
        </h3>
        <p className="text-gray-600">
          Account settings and preferences will be available here.
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex"
      style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}
    >
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${
          sidebarCollapsed ? "lg:w-[70px]" : "lg:w-64"
        } fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-blue-200 via-white to-purple-200 shadow-2xl border-r-2 border-blue-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-2 border-b-2 border-blue-200 bg-gradient-to-r from-blue-100 via-white to-purple-100">
          <div
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            }`}
          >
            {/* <CreditCard className="w-8 h-8 text-blue-600" /> */}
            {!sidebarCollapsed && (
              <span
                className="text-4xl px-5 text-blue-800 font-extrabold drop-shadow-sm tracking-wider"
                style={{ fontFamily: "'Montez', cursive" }}
              >
                welcome
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-blue-200 border border-blue-400 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-6 h-6" />
              ) : (
                <ChevronLeft className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg  hover:bg-blue-200 border border-blue-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="mt-6 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? "justify-center" : "gap-3"
                } px-3 py-3 rounded-lg text-left transition-all mb-1 font-semibold tracking-wide ${
                  activeTab === item.id
                    ? "bg-blue-200 text-blue-900 border-r-4 border-blue-600 shadow"
                    : "text-gray-700 hover:bg-blue-100 hover:text-blue-900 hover:border-blue-500"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 border-t-2 border-blue-200 bg-gradient-to-r from-blue-100 via-white to-purple-100 ${
            sidebarCollapsed ? "px-2" : ""
          }`}
        >
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } mb-3`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-200 via-blue-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-blue-200">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {cards.length} card{cards.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-2"
            } px-3 py-2 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 font-bold transition-all`}
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && "Sign Out"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-gradient-to-br from-blue-100 via-white to-purple-100 border-b-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                {/* Logo */}
                <img
                  src="https://github.com/yash131120/DBC_____logo/blob/main/DBC_light.png?raw=true"
                  alt="Digital Business Card Logo"
                  className="h-14 w-auto"
                />
              </div>

              {/* <h1 className="text-2xl font-bold text-gray-900 capitalize">
                 {activeTab === 'cards' ? 'My Cards' : 
                 activeTab === 'create' ? (editingCard ? 'Edit Card' : 'Create New Card') :
                 activeTab} 
              </h1> */}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-blue-100 via-white to-purple-100">
          {activeTab === "cards" && renderCardsGrid()}
          {activeTab === "create" && (
            <CardEditor
              existingCard={editingCard}
              onSave={() => {
                loadUserCards();
                setActiveTab("cards");
                setEditingCard(null);
              }}
              onCancel={() => {
                setActiveTab("cards");
                setEditingCard(null);
              }}
            />
          )}
          {activeTab === "analytics" && <AnalyticsPage />}
          {activeTab === "settings" && renderSettings()}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
