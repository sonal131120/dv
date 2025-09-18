import React, { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  MessageCircle,
  Palette,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smartphone,
  Monitor,
  Tablet,
  Circle,
  Square,
  Hexagon,
  Plus,
  X,
  Upload,
  Loader2,
  Link,
  Star,
  Image as ImageIcon,
  Video,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { CardPreview } from './CardPreview';
import { ImageUpload } from './ImageUpload';
import { MediaUpload } from './MediaUpload';
import { ProductsServicesManager } from './ProductsServicesManager';
import { ReviewsManager } from './ReviewsManager';
import { SuccessAnimation } from './SuccessAnimation';
import { ConfettiSideCannons } from './ConfettiSideCannons';
import { generateSocialLink, SOCIAL_PLATFORMS } from '../utils/socialUtils';
import type { Database } from '../lib/supabase';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];

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

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

interface ProductService {
  id: string;
  title: string;
  description: string;
  price?: string;
  category?: string;
  text_alignment?: 'left' | 'center' | 'right';
  is_featured: boolean;
  is_active: boolean;
  images: any[];
  inquiries: any[];
}

interface Review {
  id: string;
  review_url: string;
  title: string;
  created_at: string;
}

interface CardEditorProps {
  existingCard?: BusinessCard | null;
  onSave: () => void;
  onCancel: () => void;
}

const PREDEFINED_THEMES = [
  {
    name: 'Ocean Blue',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#047857',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#D97706',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Rose Pink',
    primary: '#EC4899',
    secondary: '#DB2777',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Dark Mode',
    primary: '#60A5FA',
    secondary: '#3B82F6',
    background: '#1F2937',
    text: '#F9FAFB'
  }
];

const LAYOUT_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary' },
  { id: 'classic', name: 'Classic', description: 'Traditional and professional' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
  { id: 'creative', name: 'Creative', description: 'Bold and artistic' }
];

const FONT_OPTIONS = [
  { id: 'Inter', name: 'Inter', description: 'Modern sans-serif' },
  { id: 'Merriweather', name: 'Merriweather', description: 'Classic serif' },
  { id: 'Montserrat', name: 'Montserrat', description: 'Geometric sans-serif' },
  { id: 'Playfair Display', name: 'Playfair Display', description: 'Elegant serif' },
  { id: 'Roboto', name: 'Roboto', description: 'Google sans-serif' }
];

const SHAPE_OPTIONS = [
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'rounded', name: 'Rounded', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle }
];

export const CardEditor: React.FC<CardEditorProps> = ({
  existingCard,
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'design' | 'social' | 'media' | 'products' | 'reviews'>('basic');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customTheme, setCustomTheme] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    username: '',
    globalUsername: '',
    company: '',
    tagline: '',
    profession: '',
    avatar_url: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    address: '',
    map_link: '',
    theme: PREDEFINED_THEMES[0],
    shape: 'rectangle',
    layout: {
      style: 'modern',
      alignment: 'center',
      font: 'Inter'
    },
    is_published: false
  });

  useEffect(() => {
    if (existingCard) {
      loadExistingCard();
    } else {
      // Set user email as default
      if (user?.email) {
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    }
  }, [existingCard, user]);

  const loadExistingCard = async () => {
    if (!existingCard) return;

    try {
      // Load social links
      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('card_id', existingCard.id)
        .order('display_order', { ascending: true });

      setSocialLinks(socialData || []);

      // Parse theme and layout from JSON
      const theme = existingCard.theme as any || PREDEFINED_THEMES[0];
      const layout = existingCard.layout as any || {
        style: 'modern',
        alignment: 'center',
        font: 'Inter'
      };

      // Check if theme is custom (not in predefined themes)
      const isCustomTheme = !PREDEFINED_THEMES.some(t => 
        t.primary === theme.primary && 
        t.secondary === theme.secondary && 
        t.background === theme.background && 
        t.text === theme.text
      );

      setCustomTheme(isCustomTheme);

      setFormData({
        title: existingCard.title || '',
        username: existingCard.slug || '',
        globalUsername: '', // Will be loaded from profile
        company: existingCard.company || '',
        tagline: existingCard.bio || '',
        profession: existingCard.position || '',
        avatar_url: existingCard.avatar_url || '',
        phone: existingCard.phone || '',
        whatsapp: existingCard.whatsapp || '',
        email: existingCard.email || '',
        website: existingCard.website || '',
        address: existingCard.address || '',
        map_link: existingCard.map_link || '',
        theme,
        shape: existingCard.shape || 'rectangle',
        layout,
        is_published: existingCard.is_published
      });
    } catch (error) {
      console.error('Error loading existing card:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThemeChange = (theme: typeof PREDEFINED_THEMES[0]) => {
    setCustomTheme(false);
    handleInputChange('theme', theme);
  };

  const handleCustomThemeChange = (colorType: 'primary' | 'secondary' | 'background' | 'text', color: string) => {
    setCustomTheme(true);
    setFormData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [colorType]: color,
        name: 'Custom Theme'
      }
    }));
  };

  const handleLayoutChange = (layoutType: 'style' | 'alignment' | 'font', value: string) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [layoutType]: value
      }
    }));
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
        slug: formData.username || undefined
      };

      let cardId: string;

      if (existingCard) {
        // Update existing card
        const { error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', existingCard.id);

        if (error) throw error;
        cardId = existingCard.id;
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();

        if (error) throw error;
        cardId = data.id;
      }

      // Save social links
      if (socialLinks.length > 0) {
        // Delete existing social links
        await supabase
          .from('social_links')
          .delete()
          .eq('card_id', cardId);

        // Insert new social links
        const { error: socialError } = await supabase
          .from('social_links')
          .insert(
            socialLinks.map((link, index) => ({
              card_id: cardId,
              platform: link.platform,
              username: link.username,
              url: link.url,
              display_order: index,
              is_active: true
            }))
          );

        if (socialError) throw socialError;
      }

      // Show success animation
      setShowSuccess(true);
      setShowConfetti(true);

      // Hide success animation and call onSave after delay
      setTimeout(() => {
        setShowSuccess(false);
        setShowConfetti(false);
        onSave();
      }, 3000);

    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    const newLink: Partial<SocialLink> = {
      id: Date.now().toString(),
      platform: 'Instagram',
      username: '',
      url: '',
      display_order: socialLinks.length,
      is_active: true
    };
    setSocialLinks([...socialLinks, newLink as SocialLink]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };

    // Auto-generate URL when platform or username changes
    if (field === 'platform' || field === 'username') {
      const link = updatedLinks[index];
      if (link.platform && link.username) {
        link.url = generateSocialLink(link.platform, link.username);
      }
    }

    setSocialLinks(updatedLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'social', label: 'Social Links', icon: Link },
    { id: 'media', label: 'Media', icon: Video },
    { id: 'products', label: 'Products', icon: Star },
    { id: 'reviews', label: 'Reviews', icon: MessageCircle }
  ];

  if (showSuccess) {
    return (
      <>
        <SuccessAnimation />
        <ConfettiSideCannons trigger={showConfetti} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {existingCard ? 'Edit Business Card' : 'Create New Business Card'}
              </h1>
              <p className="text-gray-600">
                {existingCard ? 'Update your card information' : 'Build your professional digital presence'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => handleInputChange('is_published', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Published</span>
            </label>
            <button
              onClick={handleSave}
              disabled={saving || !formData.title}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your-username"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will be your card URL: /c/{formData.username || 'your-username'}
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
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your job title"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tagline
                    </label>
                    <textarea
                      value={formData.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="A brief description about yourself or your business"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    {user && (
                      <ImageUpload
                        currentImageUrl={formData.avatar_url}
                        onImageChange={(url) => handleInputChange('avatar_url', url || '')}
                        userId={user.id}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageCircle className="w-4 h-4 inline mr-2" />
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your business address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Maps Link
                    </label>
                    <input
                      type="url"
                      value={formData.map_link}
                      onChange={(e) => handleInputChange('map_link', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://maps.google.com/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Link to your location on Google Maps
                    </p>
                  </div>
                </div>
              )}

              {/* Design Tab */}
              {activeTab === 'design' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Design & Appearance</h2>
                  </div>

                  {/* Choose Theme Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Choose Theme
                    </h3>
                    
                    {/* Theme Toggle */}
                    <div className="flex items-center gap-4 mb-6">
                      <button
                        onClick={() => setCustomTheme(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          !customTheme 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Predefined Themes
                      </button>
                      <button
                        onClick={() => setCustomTheme(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          customTheme 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Custom Colors
                      </button>
                    </div>

                    {/* Predefined Themes */}
                    {!customTheme && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {PREDEFINED_THEMES.map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => handleThemeChange(theme)}
                            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                              formData.theme.name === theme.name
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: theme.secondary }}
                              />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">{theme.name}</p>
                              <div className="flex gap-1 mt-1">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: theme.background }}
                                />
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: theme.text }}
                                />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom Color Picker */}
                    {customTheme && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Color
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={formData.theme.primary}
                              onChange={(e) => handleCustomThemeChange('primary', e.target.value)}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.theme.primary}
                              onChange={(e) => handleCustomThemeChange('primary', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                              placeholder="#3B82F6"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secondary Color
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={formData.theme.secondary}
                              onChange={(e) => handleCustomThemeChange('secondary', e.target.value)}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.theme.secondary}
                              onChange={(e) => handleCustomThemeChange('secondary', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                              placeholder="#1E40AF"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={formData.theme.background}
                              onChange={(e) => handleCustomThemeChange('background', e.target.value)}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.theme.background}
                              onChange={(e) => handleCustomThemeChange('background', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Color
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={formData.theme.text}
                              onChange={(e) => handleCustomThemeChange('text', e.target.value)}
                              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.theme.text}
                              onChange={(e) => handleCustomThemeChange('text', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                              placeholder="#1F2937"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layout Style Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Layout Style
                    </h3>

                    {/* Style Options */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Card Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {LAYOUT_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => handleLayoutChange('style', style.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                              formData.layout.style === style.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium text-gray-900 mb-1">{style.name}</div>
                            <div className="text-xs text-gray-600">{style.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alignment Options */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Content Alignment
                      </label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleLayoutChange('alignment', 'left')}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.layout.alignment === 'left'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <AlignLeft className="w-5 h-5" />
                          <span className="font-medium">Left</span>
                        </button>
                        <button
                          onClick={() => handleLayoutChange('alignment', 'center')}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.layout.alignment === 'center'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <AlignCenter className="w-5 h-5" />
                          <span className="font-medium">Center</span>
                        </button>
                        <button
                          onClick={() => handleLayoutChange('alignment', 'right')}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.layout.alignment === 'right'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <AlignRight className="w-5 h-5" />
                          <span className="font-medium">Right</span>
                        </button>
                      </div>
                    </div>

                    {/* Font Options */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Type className="w-4 h-4 inline mr-2" />
                        Font Family
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {FONT_OPTIONS.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => handleLayoutChange('font', font.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                              formData.layout.font === font.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ fontFamily: font.id }}
                          >
                            <div className="font-medium text-gray-900 mb-1">{font.name}</div>
                            <div className="text-xs text-gray-600">{font.description}</div>
                            <div className="text-sm mt-2" style={{ fontFamily: font.id }}>
                              Sample Text 123
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Shape */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Card Shape
                      </label>
                      <div className="flex gap-4">
                        {SHAPE_OPTIONS.map((shape) => {
                          const Icon = shape.icon;
                          return (
                            <button
                              key={shape.id}
                              onClick={() => handleInputChange('shape', shape.id)}
                              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                                formData.shape === shape.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{shape.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Links Tab */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Social Media Links</h2>
                      <p className="text-gray-600">Add your social media profiles and links</p>
                    </div>
                    <button
                      onClick={addSocialLink}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
                  </div>

                  {socialLinks.length > 0 ? (
                    <div className="space-y-4">
                      {socialLinks.map((link, index) => (
                        <div key={link.id || index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Platform
                              </label>
                              <select
                                value={link.platform}
                                onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {Object.keys(SOCIAL_PLATFORMS).map((platform) => (
                                  <option key={platform} value={platform}>
                                    {platform}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username/Handle
                              </label>
                              <input
                                type="text"
                                value={link.username || ''}
                                onChange={(e) => updateSocialLink(index, 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={SOCIAL_PLATFORMS[link.platform]?.placeholder || 'username'}
                              />
                            </div>

                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  URL
                                </label>
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="https://..."
                                />
                              </div>
                              <button
                                onClick={() => removeSocialLink(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Social Links</h3>
                      <p className="text-gray-600 mb-4">
                        Add your social media profiles to help people connect with you.
                      </p>
                      <button
                        onClick={addSocialLink}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Add Your First Social Link
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && existingCard && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Media Gallery</h2>
                    <p className="text-gray-600">Add videos, images, and documents to showcase your work</p>
                  </div>
                  <MediaUpload
                    cardId={existingCard.id}
                    mediaItems={mediaItems}
                    onMediaChange={setMediaItems}
                    userId={user?.id || ''}
                  />
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && existingCard && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Products & Services</h2>
                    <p className="text-gray-600">Showcase your products and services with rich descriptions</p>
                  </div>
                  <ProductsServicesManager
                    cardId={existingCard.id}
                    products={products}
                    onProductsChange={setProducts}
                    userId={user?.id || ''}
                  />
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && existingCard && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Reviews</h2>
                    <p className="text-gray-600">Add links to your reviews and testimonials</p>
                  </div>
                  <ReviewsManager
                    cardId={existingCard.id}
                    reviews={reviews}
                    onReviewsChange={setReviews}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
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
    </div>
  );
};