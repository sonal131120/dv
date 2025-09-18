import React, { useState, useEffect } from "react";
import {
  Save,
  Eye,
  ArrowLeft,
  Palette,
  Type,
  Layout,
  Share2,
  Globe,
  Lock,
  AlertCircle,
  Upload,
  Download,
  Copy,
  Trash2,
  Plus,
  Settings,
  Zap,
  Sparkles,
  RefreshCw,
  FolderSync as Sync,
  Check,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { ImageUpload } from "./ImageUpload";
import { CardPreview } from "./CardPreview";
import { MediaUpload } from "./MediaUpload";
import { ReviewsManager } from "./ReviewsManager";
import { ProductsServicesManager } from './ProductsServicesManager';
import {
  generateSocialLink,
  SOCIAL_PLATFORMS,
  generateAutoSyncedLinks,
  getPlatformLogo,
} from "../utils/socialUtils";
import { SuccessAnimation } from "./SuccessAnimation";
// import { ConfettiSideCannons } from "./ConfettiSideCannons";
import type { Database } from "../lib/supabase";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

interface CardEditorProps {
  existingCard?: BusinessCard | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  // Basic Information
  title: string;
  username: string;
  globalUsername: string;
  company: string;
  tagline: string;
  profession: string;
  avatar_url: string;

  // Contact Information
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  map_link: string;

  // Theme and Layout
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    name: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

const THEMES = [
  {
    name: "Ocean Blue",
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Forest Green",
    primary: "#10B981",
    secondary: "#047857",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Sunset Orange",
    primary: "#F59E0B",
    secondary: "#D97706",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Royal Purple",
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Rose Pink",
    primary: "#EC4899",
    secondary: "#DB2777",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Dark Mode",
    primary: "#60A5FA",
    secondary: "#3B82F6",
    background: "#1F2937",
    text: "#F9FAFB",
  },
  {
    name: "Emerald",
    primary: "#059669",
    secondary: "#047857",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Indigo",
    primary: "#4F46E5",
    secondary: "#3730A3",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Teal",
    primary: "#0D9488",
    secondary: "#0F766E",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Amber",
    primary: "#D97706",
    secondary: "#B45309",
    background: "#FFFFFF",
    text: "#1F2937",
  },
];

const SHAPES = [
  { id: "rectangle", name: "Rectangle", preview: "rounded-lg" },
  { id: "rounded", name: "Rounded", preview: "rounded-2xl" },
  // { id: "circle", name: "Circle", preview: "rounded-full aspect-square" },
  // { id: "hexagon", name: "Hexagon", preview: "rounded-3xl" },
];

const LAYOUTS: Array<{
  style: string;
  alignment: string;
  font: string;
  name: string;
}> = [
  {
    style: "modern",
    alignment: "center",
    font: "Inter",
    name: "Modern Center",
  },
  { style: "modern", alignment: "left", font: "Inter", name: "Modern Left" },
  {
    style: "classic",
    alignment: "center",
    font: "Georgia",
    name: "Classic Center",
  },
  {
    style: "minimal",
    alignment: "left",
    font: "Helvetica",
    name: "Minimal Left",
  },
  {
    style: "creative",
    alignment: "center",
    font: "Poppins",
    name: "Creative Center",
  },
  {
    style: "elegant",
    alignment: "right",
    font: "Playfair Display",
    name: "Elegant Right",
  },
];


import { useNavigate, useParams } from "react-router-dom";

export const CardEditor: React.FC<CardEditorProps> = ({
  existingCard,
  onSave,
  onCancel,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<
    "basic" | "contact" | "social" | "media" | "products" | "reviews" | "design" | "advanced"
  >("basic");
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cardId, setCardId] = useState<string | null>(existingCard?.id || null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [showConfettiCannons, setShowConfettiCannons] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: existingCard?.title || "",
    username: existingCard?.slug || (params.username || ""),
    globalUsername: "",
    company: existingCard?.company || "",
    tagline: existingCard?.bio || "",
    profession: existingCard?.position || "",
    avatar_url: existingCard?.avatar_url || "",
    phone: existingCard?.phone || "",
    whatsapp: existingCard?.whatsapp || "",
    email: existingCard?.email || user?.email || "",
    website: existingCard?.website || "",
    address: existingCard?.address || "",
    map_link: existingCard?.map_link || "",
    theme: (existingCard?.theme as any) || THEMES[0],
    shape: existingCard?.shape || "rectangle",
    layout: (existingCard?.layout as any) || LAYOUTS[0],
    is_published: existingCard?.is_published || false,
  });

  useEffect(() => {
    if (existingCard) {
      loadCardData();
    }
  }, [existingCard]);

  // Auto-save functionality
  useEffect(() => {
    if (!cardId || !user) return;

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [formData, cardId, user]);

  // Watch for publish toggle
  useEffect(() => {
    if (formData.is_published) {
      setShowConfettiCannons(true);
      setTimeout(() => setShowConfettiCannons(false), 100);
    }
  }, [formData.is_published]);

  const loadCardData = async () => {
    if (!existingCard) return;

    try {
      // Load social links
      const { data: socialData } = await supabase
        .from("social_links")
        .select("*")
        .eq("card_id", existingCard.id)
        .order("display_order");

      if (socialData) {
        setSocialLinks(socialData);
      }
    } catch (error) {
      console.error("Error loading card data:", error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      // If username changes, update the route
      if (field === "username" && value && value !== prev.username) {
        navigate(`/user-admin/${value}`);
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleAutoSave = async () => {
    if (!user || !cardId || saving) return;

    setAutoSaving(true);
    try {
      const cardData = {
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        position: formData.profession,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        bio: formData.tagline,
        whatsapp: formData.whatsapp,
        address: formData.address,
        map_link: formData.map_link,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published,
        slug: formData.username || null,
      };

      await supabase.from("business_cards").update(cardData).eq("id", cardId);
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const cardData = {
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        position: formData.profession,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        bio: formData.tagline,
        whatsapp: formData.whatsapp,
        address: formData.address,
        map_link: formData.map_link,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published,
        slug: formData.username || null,
      };

      let result;
      if (existingCard) {
        // Update existing card
        result = await supabase
          .from("business_cards")
          .update(cardData)
          .eq("id", existingCard.id)
          .select()
          .single();
      } else {
        // Create new card
        result = await supabase
          .from("business_cards")
          .insert(cardData)
          .select()
          .single();
      }

      if (result.error) {
        console.error("Error saving card:", result.error);
        alert("Failed to save card. Please try again.");
        return;
      }
      // Show success animation
      setShowSuccessAnimation(true);
      // Hide animation after 3 seconds and call onSave
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onSave();
      }, 3000);
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to save card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateCard = async () => {
    if (!user || !existingCard) return;

    setSaving(true);
    try {
      const { id, created_at, updated_at, slug, ...cardData } = existingCard;

      const newCardData = {
        ...cardData,
        title: `${formData.title} (Copy)`,
        is_published: false,
        view_count: 0,
        slug: null, // Let the system generate a new slug
      };

      const { data, error } = await supabase
        .from("business_cards")
        .insert(newCardData)
        .select()
        .single();

      if (error) {
        console.error("Error duplicating card:", error);
        alert("Failed to duplicate card. Please try again.");
        return;
      }

      // Redirect to edit the new card
      window.location.href = `/user-admin?edit=${data.id}`;
    } catch (error) {
      console.error("Error duplicating card:", error);
      alert("Failed to duplicate card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCard = () => {
    const cardData = {
      ...formData,
      socialLinks,
      mediaItems,
      reviews,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(cardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formData.username || "business-card"}-export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        // Update form data with imported data
        setFormData({
          ...formData,
          ...importedData,
          username: importedData.username + "-imported", // Avoid slug conflicts
        });

        if (importedData.socialLinks) {
          setSocialLinks(importedData.socialLinks);
        }

        alert("Card data imported successfully!");
      } catch (error) {
        alert("Invalid card data file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const generateRandomTheme = () => {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    handleInputChange("theme", randomTheme);
  };

  const resetToDefaults = () => {
    if (
      confirm(
        "Are you sure you want to reset all design settings to defaults? This cannot be undone."
      )
    ) {
      handleInputChange("theme", THEMES[0]);
      handleInputChange("shape", "rectangle");
      handleInputChange("layout", LAYOUTS[0]);
    }
  };

  const handleAutoSyncSocialLinks = async () => {
    if (!cardId || !formData.username) return;

    try {
      // Generate auto-synced links
      const autoSyncedLinks = generateAutoSyncedLinks(formData.username);

      // Remove existing auto-synced links
      await supabase
        .from("social_links")
        .delete()
        .eq("card_id", cardId)
        .eq("is_auto_synced", true);

      // Insert new auto-synced links
      const { data, error } = await supabase
        .from("social_links")
        .insert(
          autoSyncedLinks.map((link, index) => ({
            card_id: cardId,
            platform: link.platform,
            username: link.username,
            url: link.url,
            display_order: socialLinks.length + index,
            is_active: true,
            is_auto_synced: true,
          }))
        )
        .select();

      if (error) {
        console.error("Error auto-syncing social links:", error);
        alert("Failed to auto-sync social links. Please try again.");
        return;
      }

      // Update local state
      const newLinks = [...socialLinks, ...(data || [])];
      setSocialLinks(newLinks);
      setAutoSyncEnabled(true);

      alert("Social links auto-synced successfully!");
    } catch (error) {
      console.error("Error auto-syncing social links:", error);
      alert("Failed to auto-sync social links. Please try again.");
    }
  };

  const handleUpdateSocialLink = async (
    linkId: string,
    newUsername: string
  ) => {
    try {
      const link = socialLinks.find((l) => l.id === linkId);
      if (!link) return;

      const newUrl = generateSocialLink(link.platform, newUsername);

      const { error } = await supabase
        .from("social_links")
        .update({
          username: newUsername,
          url: newUrl,
          is_auto_synced: false, // Mark as custom when manually edited
        })
        .eq("id", linkId);x

      if (error) {
        console.error("Error updating social link:", error);
        return;
      }

      // Update local state
      const updatedLinks = socialLinks.map((l) =>
        l.id === linkId
          ? { ...l, username: newUsername, url: newUrl, is_auto_synced: false }
          : l
      );
      setSocialLinks(updatedLinks);
    } catch (error) {
      console.error("Error updating social link:", error);
    }
  };

  const addSocialLink = async (platform: string, username: string) => {
    if (!cardId) return;

    try {
      const url = generateSocialLink(platform, username);
      const { data, error } = await supabase
        .from("social_links")
        .insert({
          card_id: cardId,
          platform,
          username,
          url,
          display_order: socialLinks.length,
          is_active: true,
          is_auto_synced: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding social link:", error);
        return;
      }

      setSocialLinks([...socialLinks, data]);
    } catch (error) {
      console.error("Error adding social link:", error);
    }
  };

  const removeSocialLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .eq("id", linkId);

      if (error) {
        console.error("Error removing social link:", error);
        return;
      }

      setSocialLinks(socialLinks.filter((link) => link.id !== linkId));
    } catch (error) {
      console.error("Error removing social link:", error);
    }
  };

  const tabs: Array<{
    id: "basic" | "contact" | "social" | "media" | "products" | "reviews" | "design" | "advanced";
    label: string;
    icon: React.ElementType;
  }> = [
    { id: "basic", label: "Basic Info", icon: Type },
    { id: "contact", label: "Contact", icon: Globe },
    { id: "social", label: "Social Links", icon: Share2 },
    { id: "media", label: "Media", icon: Layout },
    { id: "products", label: "Products/Services", icon: Settings },
    { id: "reviews", label: "Reviews", icon: Eye },
    { id: "design", label: "Design", icon: Palette },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  const renderBasicInfo = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      {/* <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateRandomTheme}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Random Theme
          </button>
          {existingCard && (
            <button
              onClick={handleDuplicateCard}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              Duplicate Card
            </button>
          )}
          <button
            onClick={handleExportCard}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <ImageUpload
            currentImageUrl={formData.avatar_url}
            onImageChange={(url) => handleInputChange("avatar_url", url || "")}
            userId={user?.id || ""}
          />
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Username *
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /c/
              </span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  handleInputChange(
                    "username",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-username"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will be your card's URL: /c/
              {formData.username || "your-username"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title/Profession
            </label>
            <input
              type="text"
              value={formData.profession}
              onChange={(e) => handleInputChange("profession", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your job title or profession"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio/Tagline
          </label>
          <textarea
            value={formData.tagline}
            onChange={(e) => handleInputChange("tagline", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description about yourself or your business"
          />
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Number
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => handleInputChange("whatsapp", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            rows={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your business or home address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Maps Link (Optional)
          </label>
          <input
            type="url"
            value={formData.map_link}
            onChange={(e) => handleInputChange("map_link", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://maps.google.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Link to your location on{" "}
            <a
              href="https://maps.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Google Maps
            </a>{" "}
            for easy navigation
          </p>
        </div>
      </div>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Social Media Links
        </h3>

        {/* Auto-Sync Section */}
        {formData.username && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-blue-900">
                  Auto-Sync Social Links
                </h4>
                <p className="text-sm text-blue-700">
                  Automatically create social links using your card username:{" "}
                  <strong>@{formData.username}</strong>
                </p>
              </div>
              <button
                onClick={handleAutoSyncSocialLinks}
                disabled={!cardId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sync className="w-4 h-4" />
                Auto-Sync Links
              </button>
            </div>
            <div className="text-xs text-blue-600">
              This will create links for: Instagram, LinkedIn, GitHub, Twitter,
              YouTube, Facebook, and more
            </div>
          </div>
        )}

        {/* Add Social Link Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <SocialLinkForm onAdd={addSocialLink} />
        </div>

        {/* Existing Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
          {socialLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-2 lg:p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                  <img
                    src={getPlatformLogo(link.platform, link.url)}
                    alt={`${link.platform} logo`}
                    className="w-7 h-7"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{link.platform}</p>
                    {/* {link.is_auto_synced && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        <Sync className="w-3 h-3" />
                        Auto-synced
                      </span>
                    )} */}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">@</span>
                    <input
                      type="text"
                      value={link.username || ""}
                      onChange={(e) =>
                        handleUpdateSocialLink(link.id, e.target.value)
                      }
                      className="lg:w-full w-[80%] text-sm text-gray-600 bg-transparent p-0 border-b border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                  title="Open link"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <button
                  onClick={() => removeSocialLink(link.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  title="Remove link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {socialLinks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="mb-2">No social links added yet</p>
            {formData.username && (
              <p className="text-sm text-blue-600">
                Try the Auto-Sync feature above to quickly add links for @
                {formData.username}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDesign = () => (
    <div className="space-y-8">
      {/* Theme Selection with Color Shades */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => handleInputChange("theme", theme)}
              className={`p-3 rounded-xl border-2 shadow-sm flex flex-col items-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                formData.theme.name === theme.name
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              style={{ minWidth: 0 }}
            >
              <div className="flex gap-1 mb-2">
                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.primary }} title="Primary" />
                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.secondary }} title="Secondary" />
                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.background }} title="Background" />
                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.text }} title="Text" />
              </div>
              <p className="text-xs font-semibold text-gray-900 text-center whitespace-nowrap">{theme.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Shape Selection - Mobile Friendly */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Shape</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleInputChange("shape", shape.id)}
              className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                formData.shape === shape.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className={`w-14 h-8 bg-gray-200 mb-2 ${shape.preview}`} />
              <span className="text-xs font-medium text-gray-900 text-center">{shape.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Selection - Mobile Friendly */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LAYOUTS.map((layout) => (
            <button
              key={layout.name}
              onClick={() => handleInputChange("layout", layout)}
              className={`p-3 rounded-xl border-2 text-left flex flex-col transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                formData.layout.name === layout.name
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <span className="font-medium text-gray-900">{layout.name}</span>
              <span className="text-xs text-gray-500">{layout.style} • {layout.alignment} • {layout.font}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdvanced = () => (
    <div className="space-y-8">
      {/* Import/Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Import/Export
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Export Card Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download your card data as a JSON file for backup or transfer.
            </p>
            <button
              onClick={handleExportCard}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Card Data
            </button>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Import Card Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload a previously exported card data file.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportCard}
              className="hidden"
              id="import-card"
            />
            <label
              htmlFor="import-card"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Import Card Data
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Advanced Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Auto-save</h4>
              <p className="text-sm text-gray-600">
                Automatically save changes as you type
              </p>
            </div>
            <div className="flex items-center gap-2">
              {autoSaving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              <span className="text-sm text-green-600">Enabled</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Card Analytics</h4>
              <p className="text-sm text-gray-600">
                Track views and interactions on your card
              </p>
            </div>
            <span className="text-sm text-green-600">Enabled</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {existingCard && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            Danger Zone
          </h3>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-600">Delete Card</h4>
                  <p className="text-sm text-red-500">
                    Permanently delete this card and all its data
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this card? This action cannot be undone."
                      )
                    ) {
                      // Handle delete logic here
                      onCancel();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && <SuccessAnimation />}
      {/* Confetti Side Cannons Animation */}
      {/* <ConfettiSideCannons trigger={showConfettiCannons} /> */}

      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden">
              {/* Header */}
              <div className="border-b-2 border-blue-100 p-6 bg-gradient-to-r from-blue-50 via-white to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-blue-900 tracking-tight drop-shadow-sm" style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}>
                      {existingCard ? "Edit Business Card" : "Create New Business Card"}
                    </h2>
                    <p className="text-base text-gray-600">
                      {existingCard ? "Update your card information" : "Fill in your details to create your digital business card"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !formData.title || !formData.username}
                      className="flex items-center gap-2 px-3 lg:px-6 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-xs lg:text-base text-white rounded-xl shadow-md hover:from-blue-600 hover:to-pink-600 hover:scale-105 transition-all font-semibold border-2 border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {saving ? "Saving..." : "Save Card"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 via-white to-purple-50">
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 lg:px-4 py-3 text-sm lg:text-base font-semibold whitespace-nowrap border-b-4 transition-all ${
                          activeTab === tab.id
                            ? "border-blue-500 text-blue-700 bg-blue-100 shadow"
                            : "border-transparent text-gray-500 hover:text-blue-700 hover:bg-blue-50"
                        }`}
                        type="button"
                        aria-current={activeTab === tab.id ? "page" : undefined}
                        style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}
                      >
                        <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[400px]">
                {activeTab === "basic" && renderBasicInfo()}
                {activeTab === "contact" && renderContactInfo()}
                {activeTab === "social" && renderSocialLinks()}
                {activeTab === "media" && cardId && (
                  <MediaUpload
                    cardId={cardId}
                    mediaItems={mediaItems}
                    onMediaChange={setMediaItems}
                    userId={user?.id || ""}
                  />
                )}
                {activeTab === "products" && cardId && (
                  <ProductsServicesManager
                    cardId={cardId}
                    products={products}
                    onProductsChange={setProducts}
                    userId={user?.id || ""}
                  />
                )}
                {activeTab === "reviews" && cardId && (
                  <ReviewsManager
                    cardId={cardId}
                    reviews={reviews}
                    onReviewsChange={setReviews}
                  />
                )}
                {activeTab === "design" && renderDesign()}
                {activeTab === "advanced" && renderAdvanced()}
              </div>

              {/* Actions */}
              <div className="border-t-2 border-blue-100 p-4 flex justify-between bg-gradient-to-r from-blue-50 via-white to-purple-50">
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(
                      (tab) => tab.id === activeTab
                    );
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1].id);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold border border-gray-200"
                  disabled={activeTab === tabs[0].id}
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => {
                    const currentIndex = tabs.findIndex(
                      (tab) => tab.id === activeTab
                    );
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1].id);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:to-pink-600 transition-all font-semibold border-2 border-blue-400"
                  disabled={activeTab === tabs[tabs.length - 1].id}
                  type="button"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b-2 border-blue-100 mb-4">
              <div>
                <div className="flex items-center gap-2 pb-0 lg:pl-0 pl-[50%] mb-4">
                  {autoSaving && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Auto-saving...</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {formData.is_published ? (
                      <Lock className="w-5 h-5 text-green-600" />
                    ) : (
                      <Globe className="w-5 h-5 text-gray-400" />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() =>
                          handleInputChange(
                            "is_published",
                            !formData.is_published
                          )
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          formData.is_published ? "bg-green-500" : "bg-gray-300"
                        }`}
                        aria-pressed={formData.is_published ? "true" : "false"}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            formData.is_published
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-base lg:text-xl font-medium text-gray-700">
                        {formData.is_published ? "Published" : "Draft"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky top-6">
              <CardPreview
                formData={formData}
                socialLinks={socialLinks}
                mediaItems={mediaItems}
                products={products}
                reviews={reviews}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Social Link Form Component
const SocialLinkForm: React.FC<{
  onAdd: (platform: string, username: string) => void;
}> = ({ onAdd }) => {
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (platform && username) {
      onAdd(platform, username);
      setPlatform("");
      setUsername("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Platform"
          >
            <option value="">Select platform</option>
            {Object.keys(SOCIAL_PLATFORMS).map((platformName) => (
              <option key={platformName} value={platformName}>
                {platformName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username/URL
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              platform
                ? SOCIAL_PLATFORMS[platform]?.placeholder
                : "Enter username or URL"
            }
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={!platform || !username}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Add Social Link
      </button>
    </form>
  );
};
