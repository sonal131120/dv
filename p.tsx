import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Globe,
  Instagram,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Youtube,
  Camera,
  MessageCircle,
  MapPin,
  Star,
  ExternalLink,
  Play,
  FileText,
  Eye,
  Share2,
  Download,
  QrCode,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";
import {
  getPlatformLogo,
  getSocialIcon,
  SOCIAL_PLATFORM_COLORS,
} from "../utils/socialUtils";

import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

interface MediaItem {
  id: string;
  type: "image" | "video" | "document";
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
  is_featured: boolean;
  is_active: boolean;
  images: any[];
  inquiries: Array<{
    id: string;
    inquiry_type: "link" | "phone" | "whatsapp" | "email";
    contact_value: string;
    button_text: string;
    is_active: boolean;
  }>;
}

interface ReviewLink {
  id: string;
  title: string;
  review_url: string;
  created_at: string;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<any>> = {
  Instagram,
  LinkedIn: Linkedin,
  GitHub: Github,
  Twitter,
  Facebook,
  "You Tube": Youtube,
  YouTube: Youtube,
  Website: Globe,
  WhatsApp: MessageCircle,
  Telegram: MessageCircle,
  "Custom Link": ExternalLink,
};

export const PublicCard: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState<{ [key: string]: boolean }>(
    {}
  );
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardId) {
      loadCard();
    }
  }, [cardId]);

    // Keyboard navigation for gallery modal
  useEffect(() => {
    if (!galleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.key === 'ArrowLeft') {
        setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === 'Escape') {
        setGalleryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryOpen, galleryImages.length]);

  const loadCard = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      setError(null);

      // Load card by slug (not by user ID)
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .select("*")
        .eq("slug", cardId) // Use slug for lookup
        .eq("is_published", true) // Only show published cards
        .single();

      if (cardError) {
        console.error("Card error:", cardError);
        setError("Card not found or not published");
        return;
      }

      if (!cardData) {
        setError("Card not found");
        return;
      }

      setCard(cardData);

      // Load profile information
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", cardData.user_id); // Removed .single()

      if (profileError) {
        console.error("Profile error:", profileError);
      } else {
        if (profileData && profileData.length > 0) {
          setProfile(profileData[0]);
        } else {
          console.warn("No profile found for user_id:", cardData.user_id);
          setProfile(null);
        }
      }

      // Load social links
      const { data: socialData, error: socialError } = await supabase
        .from("social_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (socialError) {
        console.error("Social links error:", socialError);
      } else {
        setSocialLinks(socialData || []);
      }

      // Load media items
      const { data: mediaData, error: mediaError } = await supabase
        .from("media_items")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (mediaError) {
        console.error("Media error:", mediaError);
      } else {
        const formattedMedia: MediaItem[] = (mediaData || []).map((item) => ({
          id: item.id,
          type: item.type as "image" | "video" | "document",
          url: item.url,
          title: item.title,
          description: item.description || undefined,
          thumbnail_url: item.thumbnail_url || undefined,
        }));
        setMediaItems(formattedMedia);
      }

      // Load review links
      const { data: reviewData, error: reviewError } = await supabase
        .from("review_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (reviewError) {
        console.error("Review links error:", reviewError);
      } else {
        const formattedReviews: ReviewLink[] = (reviewData || []).map(
          (item) => ({
            id: item.id,
            title: item.title,
            review_url: item.review_url,
            created_at: item.created_at,
          })
        );
        setReviewLinks(formattedReviews);
      }

      // Load products/services
      const { data: productsData, error: productsError } = await supabase
        .from("products_services")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (productsError) {
        console.error("Products error:", productsError);
      } else {
        // Load image links and inquiries for each product
        const productsWithDetails = await Promise.all(
          (productsData || []).map(async (product) => {
            // Load image links
            const { data: imagesData } = await supabase
              .from("product_image_links")
              .select("*")
              .eq("product_id", product.id)
              .order("display_order", { ascending: true });

            // Load inquiries
            const { data: inquiriesData } = await supabase
              .from("product_inquiries")
              .select("*")
              .eq("product_id", product.id)
              .eq("is_active", true);

            return {
              ...product,
              images: imagesData || [],
              inquiries: inquiriesData || [],
            };
          })
        );
        setProducts(productsWithDetails);
      }

      // Track view (increment view count)
      await trackCardView(cardData.id);
    } catch (error) {
      console.error("Error loading card:", error);
      setError("Failed to load card");
    } finally {
      setLoading(false);
    }
  };

  const trackCardView = async (cardId: string) => {
    try {
      // Increment view count
      const { error: updateError } = await supabase
        .from("business_cards")
        .update({
          view_count: card ? (card.view_count || 0) + 1 : 1,
        })
        .eq("id", cardId);

      if (updateError) {
        console.error("Error updating view count:", updateError);
      }

      // Add analytics record
      const { error: analyticsError } = await supabase
        .from("card_analytics")
        .insert({
          card_id: cardId,
          visitor_ip: null, // Would need server-side implementation for real IP
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
        });

      if (analyticsError) {
        console.error("Error tracking analytics:", analyticsError);
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleDownload = async () => {
    const cardElement = document.getElementById("public-card-content");
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${card?.slug || "business-card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading card:", error);
      alert("Failed to download card. Please try again.");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card?.title || "Business Card"} - ${
            card?.company || "Professional"
          }`,
          text: `Check out ${card?.title || "this"}'s digital business card`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy link");
      });
  };

  const getVideoThumbnail = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const renderFormattedText = (text: string) => {
    return text;
  };

  const renderProductDescription = (
    text: string,
    alignment: string = "left"
  ) => {
    const alignmentClass =
      alignment === "center"
        ? "text-center"
        : alignment === "right"
        ? "text-right"
        : "text-left";

    return (
      <div
        className={`${alignmentClass} whitespace-pre-wrap leading-relaxed text-sm`}
      >
        {text.split("\n").map((line, index) => {
          // Handle bullet points
          if (line.trim().startsWith("• ")) {
            return (
              <div key={index} className="flex items-start gap-2 mb-2">
                <span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">
                  •
                </span>
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace("• ", "")
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="font-semibold text-gray-900">$1</strong>'
                      )
                      .replace(
                        /\*(.*?)\*/g,
                        '<em class="italic text-gray-700">$1</em>'
                      ),
                  }}
                />
              </div>
            );
          }

          // Handle regular lines
          return (
            <div key={index} className={line.trim() === "" ? "mb-3" : "mb-1"}>
              {line.trim() !== "" && (
                <span
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="font-semibold text-gray-900">$1</strong>'
                      )
                      .replace(
                        /\*(.*?)\*/g,
                        '<em class="italic text-gray-700">$1</em>'
                      ),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Card Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The business card you're looking for doesn't exist or has been unpublished."}
          </p>
          <p className="text-sm text-gray-500">
            If you're the owner of this card, make sure it's published in your
            admin panel.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const theme = (card.theme as any) || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
    name: "Default",
  };

  const layout = (card.layout as any) || {
    style: "modern",
    alignment: "center",
    font: "Inter",
  };

  const getCardShapeClasses = () => {
    switch (card.shape) {
      case "rounded":
        return "rounded-3xl";
      case "circle":
        return "rounded-full aspect-square";
      case "hexagon":
        return "rounded-3xl";
      default:
        return "rounded-2xl";
    }
  };

  const getLayoutClasses = () => {
    const baseClasses = "flex flex-col";
    switch (layout.alignment) {
      case "left":
        return `${baseClasses} items-start text-left`;
      case "right":
        return `${baseClasses} items-end text-right`;
      default:
        return `${baseClasses} items-center text-center`;
    }
  };

  const getStyleClasses = () => {
    switch (layout.style) {
      case "classic":
        return "border-2 shadow-xl";
      case "minimal":
        return "border border-gray-200 shadow-lg";
      case "creative":
        return "shadow-2xl transform hover:scale-105 transition-transform duration-300";
      default:
        return "shadow-2xl border border-gray-100";
    }
  };

  const cardUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Actions */}
      {/* <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-semibold text-gray-900">
                {card.title || "Business Card"}
              </h1>
              <p className="text-sm text-gray-500">
                {card.company || "Professional"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share Card"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download Card"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div> */}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scan to View Card
              </h3>
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={cardUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to quickly access this business card
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-8 px-4" id="public-card-content">
        <div className="max-w-6xl mx-auto">
          {/* Main Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div
                ref={cardRef}
                className={`w-full p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                {/* Avatar */}
                {card.avatar_url ? (
                  <img
                    src={card.avatar_url}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover mx-auto mb-6 border-4"
                    style={{ borderColor: theme.primary }}
                  />
                ) : (
                  <div
                    className="w-36 h-36 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-bold text-3xl border-4"
                    style={{
                      backgroundColor: theme.primary,
                      borderColor: theme.secondary,
                    }}
                  >
                    {card.title ? (
                      card.title.charAt(0).toUpperCase()
                    ) : (
                      <Camera className="w-12 h-12" />
                    )}
                  </div>
                )}

                {/* Name and Bio */}
                <div className="mb-6">
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: theme.text }}
                  >
                    {card.title || "Professional"}
                  </h2>
                  {card.position && card.company && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position} at {card.company}
                    </p>
                  )}
                  {card.position && !card.company && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position}
                    </p>
                  )}
                  {!card.position && card.company && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.company}
                    </p>
                  )}
                  {/* {card.position && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position}
                    </p>
                  )}
                  
                  {card.company && (
                    <p
                      className="text-base opacity-80 mb-2"
                      style={{ color: theme.text }}
                    >
                      {card.company}
                    </p>
                  )} */}
                  {card.bio && (
                    <p
                      className="text-sm opacity-70"
                      style={{ color: theme.text }}
                    >
                      {card.bio}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  {/* Gmail */}
                  {card.email && (
                    <a
                      href={`mailto:${card.email}`}
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/16509/16509529.png"
                        alt="Gmail"
                        className="w-8 h-8 rounded"
                        style={{ background: '#fff' }}
                      />
                      <div>
                        <p className="text-sm text-gray-500">{card.email}</p>
                      </div>
                    </a>
                  )}

                  {/* Google Maps */}
                  {card.address && card.map_link && typeof card.map_link === "string" && card.map_link.trim() !== "" ? (
                    <a
                      href={card.map_link as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <img
                        src="https://cdn-icons-png.freepik.com/512/16509/16509523.png"
                        alt="Google Maps"
                        className="w-8 h-8 rounded"
                        style={{ background: '#fff' }}
                      />
                      <div>
                        <p className="text-sm text-gray-500">{card.address}</p>
                      </div>
                    </a>
                  ) : card.address ? (
                    <p className="text-sm mb-2">{card.address}</p>
                  ) : null}

                  {/* Phone */}
                  {card.phone && (
                    <a
                      href={`tel:${card.phone}`}
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/9073/9073336.png"
                        alt="Phone"
                        className="w-8 h-8 rounded"
                        // style={{ background: '#fff' }}
                      />
                      <div>
                        <p className="text-sm text-gray-500">{card.phone}</p>
                      </div>
                    </a>
                  )}

                  {/* WhatsApp */}
                  {card.whatsapp && (
                    <a
                      href={`https://wa.me/${card.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/15713/15713434.png"
                        alt="WhatsApp"
                        className="w-8 h-8 rounded"
                        // style={{ background: '#fff' }}
                      />
                      <div>
                        <p className="text-sm text-gray-500">Send message</p>
                      </div>
                    </a>
                  )}

                  {/* Website */}
                  {card.website && (
                    <a
                      href={card.website.startsWith("http") ? card.website : `https://${card.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/10453/10453141.png"
                        alt="Website"
                        className="w-8 h-8 rounded"
                        style={{ background: '#fff' }}
                      />
                      <div>
                        <p className="text-sm text-gray-500">{card.website}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Actions */}
              <div
                ref={cardRef}
                className={`w-full p-4 lg:p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: theme.text }}
                >
                  Get In Touch
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-1 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-5 ">
                        <img
                          src={getPlatformLogo(link.platform, link.url)}
                          alt={`${link.platform} logo`}
                          className="w-8 h-8"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {link.platform}
                        </div>
                        {link.username && (
                          <div className="text-xs opacity-75 truncate">
                            @{link.username}
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Media Gallery */}
              {mediaItems.length > 0 && (
                <div
                  ref={cardRef}
                  className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: `'${layout.font}', sans-serif`,
                    borderColor: theme.primary + "50",
                  }}
                >
                  <h3
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                    style={{ color: theme.text }}
                  >
                    <Play className="w-5 h-5 text-blue-600" />
                    Media Gallery
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative group flex-shrink-0 aspect-video"
                      >
                        {item.type === "video" ? (
                          <div className="relative aspect-video">
                            {getVideoThumbnail(item.url) ? (
                              <img
                                src={getVideoThumbnail(item.url)!}
                                alt={item.title}
                                className="w-full h-40 md:h-40 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <Play className="w-10 h-10 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center">
                              <Play className="w-10 h-10 text-white" />
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 rounded-lg"
                            />
                          </div>
                        ) : item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center ">
                            <FileText className="w-12 h-12 text-gray-600 mb-2" />
                            <span className="text-sm text-gray-600">
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Links */}
              {reviewLinks.length > 0 && (
                <div
                  ref={cardRef}
                  className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: `'${layout.font}', sans-serif`,
                    borderColor: theme.primary + "50",
                  }}
                >
                  <h3
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                    style={{ color: theme.text }}
                  >
                    <Star className="w-5 h-5 text-yellow-600" />
                    Reviews
                  </h3>
                  <div className="">
                    {reviewLinks.map((review) => (
                      <a
                        key={review.id}
                        href={review.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                              {review.title}
                            </h4>
                            <p
                              className="text-sm"
                              style={{ color: theme.text }}
                            >
                              View our customer reviews
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Products/Services */}
          {products.length > 0 && (
            <div
              ref={cardRef}
              className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()} overflow-visible`}
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                fontFamily: `'${layout.font}', sans-serif`,
                borderColor: theme.primary + "50",
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <h3
                className="text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: theme.text }}
              >
                <Star className="w-5 h-5 text-yellow-600" />
                Products & Services
              </h3>
              <div className="w-full rounded-2xl bg-white/80 backdrop-blur-sm p-2 overflow-x-auto" style={{boxSizing:'border-box'}}>
                <div className="flex gap-6 pb-2" style={{minWidth:'fit-content'}}>
                  {products.map((product) => {
                    const isMobile =
                      typeof window !== "undefined" && window.innerWidth < 768;
                    const showMoreCount = product.images.length - 2;
                    const showMoreText =
                      showMoreCount > 0
                        ? isMobile
                          ? `+${showMoreCount} more images`
                          : "+"
                        : "";
                    const descLines = product.description.split("\n");
                    const descIsLong = descLines.length > 5;
                    const expanded = descExpanded[product.id] || false;
                    return (
                      <div
                        key={product.id}
                        className="min-w-[320px] max-w-[400px] border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm flex-shrink-0"
                      >
                        {/* Image Gallery Upper Side */}
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="grid grid-cols-2 gap-2">
                            {product.images.slice(0, 2).map((image, idx) => (
                              <div
                                key={idx}
                                className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                                onClick={() => {
                                  setGalleryImages(
                                    product.images.map((img) => img.image_url)
                                  );
                                  setGalleryIndex(idx);
                                  setGalleryOpen(true);
                                }}
                              >
                                <img
                                  src={image.image_url}
                                  alt={
                                    image.alt_text || `Product image ${idx + 1}`
                                  }
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
                                  }}
                                />
                                {/* Overlay for +N images */}
                                {idx === 1 && showMoreCount > 0 && (
                                  <div
                                    onClick={() => {
                                      setGalleryImages(
                                        product.images.map(
                                          (img) => img.image_url
                                        )
                                      );
                                      setGalleryIndex(1);
                                      setGalleryOpen(true);
                                    }}
                                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold text-lg cursor-pointer"
                                  >
                                    {showMoreText}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {showMoreCount > 0 && isMobile && (
                            <div
                              className="text-xs text-gray-500 mt-2 text-center cursor-pointer"
                              onClick={() => {
                                setGalleryImages(
                                  product.images.map((img) => img.image_url)
                                );
                                setGalleryIndex(1);
                                setGalleryOpen(true);
                              }}
                            >
                              {showMoreText}
                            </div>
                          )}
                        </div>
                        {/* Details/Description Below Gallery */}
                        <div className="flex flex-col justify-between">
                          <div className="flex items-start justify-between w-full mb-2">
                            <h4 className="font-bold text-lg text-gray-900 flex">
                              {product.title}
                            </h4>
                            <div className="flex flex-col items-end min-w-[90px]">
                              <div className="flex items-center gap-1">
                                {product.is_featured && (
                                  <Star className="w-5 h-5 text-yellow-500 fill-current ml-2" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Title, Price, Featured Star Row */}
                            <div className="flex items-start justify-between w-full mb-0">
                              {/* Category below title row, left side */}
                              {product.category && (
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-1">
                                  {product.category}
                                </span>
                              )}
                              <div className="flex flex-col items-end min-w-[90px]">
                                <div className="flex items-center gap-1">
                                  {product.price && (
                                    <p className="text-green-600 font-bold text-base mb-0">
                                      {product.price}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Description Display */}
                            <div
                              className="mb-0 mt-1 items-start justify-between w-full"
                              style={{ color: theme.text }}
                            >
                              <div className="text-xs sm:text-xs flex-1">
                                {renderProductDescription(
                                  expanded || !descIsLong
                                    ? product.description
                                    : descLines.slice(0, 4).join("\n"),
                                  product.text_alignment
                                )}
                              </div>
                              {descIsLong && (
                                <button
                                  className="text-blue-600 text-xs mt-1 underline focus:outline-none ml-2 whitespace-nowrap"
                                  onClick={() =>
                                    setDescExpanded((prev) => ({
                                      ...prev,
                                      [product.id]: !expanded,
                                    }))
                                  }
                                >
                                  {expanded ? "Show less" : "Show more"}
                                </button>
                              )}
                            </div>
                          </div>
                          {product.inquiries.length > 0 && (
                            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                              {product.inquiries.map((inquiry) => (
                                <a
                                  key={inquiry.id}
                                  href={
                                    inquiry.inquiry_type === "phone"
                                      ? `tel:${inquiry.contact_value}`
                                      : inquiry.inquiry_type === "whatsapp"
                                      ? `https://wa.me/${inquiry.contact_value.replace(
                                          /[^0-9]/g,
                                          ""
                                        )}`
                                      : inquiry.inquiry_type === "email"
                                      ? `mailto:${inquiry.contact_value}`
                                      : inquiry.contact_value
                                  }
                                  target={
                                    inquiry.inquiry_type === "link"
                                      ? "_blank"
                                      : undefined
                                  }
                                  rel={
                                    inquiry.inquiry_type === "link"
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md"
                                  style={{ backgroundColor: theme.primary }}
                                >
                                  {inquiry.inquiry_type === "link" && (
                                    <ExternalLink className="w-4 h-4" />
                                  )}
                                  {inquiry.inquiry_type === "phone" && (
                                    <Phone className="w-4 h-4" />
                                  )}
                                  {inquiry.inquiry_type === "whatsapp" && (
                                    <MessageCircle className="w-4 h-4" />
                                  )}
                                  {inquiry.inquiry_type === "email" && (
                                    <Mail className="w-4 h-4" />
                                  )}
                                  {inquiry.button_text}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Image Gallery Modal */}
              {galleryOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
                  onClick={() => setGalleryOpen(false)}
                >
                  <div
                    className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full p-4 flex flex-col items-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-2 right-6 text-gray-600 hover:text-red-600 text-2xl font-bold"
                      onClick={() => setGalleryOpen(false)}
                    >
                      &times;
                    </button>
                    <img
                      src={galleryImages[galleryIndex]}
                      alt="Gallery"
                      className="max-h-[60vh] w-auto rounded mb-4"
                    />
                    <div className="flex gap-2 justify-center">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setGalleryIndex(idx)}
                          className={`w-16 h-12 rounded border-2 ${
                            galleryIndex === idx ? "border-blue-600" : "border-gray-300"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Gallery thumb ${idx + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-5">
            <p className="text-gray-500 text-sm">
              Powered by Digital Business Cards
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="fixed bottom-8 right-8 flex-col gap-3 hidden lg:flex">
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Show QR Code"
        >
          <QrCode className="w-7 h-7  " />
        </button>
        <button
          onClick={handleShare}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Share Card"
        >
          <Share2 className="w-6 h-6" />
        </button>
        <button
          onClick={handleDownload}
          className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Download PNG"
        >
          <Download className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Action Buttons */}
      <div className="grid grid-cols-3 gap-2 p-4 mt-5 flex lg:hidden">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg"
        >
          <Download className="w-8 h-8" />
          {/* <span className="text-sm font-medium">Download</span> */}
        </button>
        <button
          onClick={() => setShowQR(true)}
          className="flex flex-col items-center gap-2 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
        >
          <QrCode className="w-8 h-8" />
          {/* <span className="text-sm font-medium">QR Code</span> */}
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Share2 className="w-8 h-8" />
          {/* <span className="text-sm font-medium">Share</span> */}
        </button>
      </div>
    </div>
  );
};
