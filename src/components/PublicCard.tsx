// Clean merged PublicCard component (design from p.tsx + original meta & analytics logic)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Globe,
  Camera,
  MessageCircle,
  Star,
  ExternalLink,
  Play,
  Eye,
  Share2,
  Download,
  QrCode,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { getPlatformLogo } from "../utils/socialUtils";

// ---- Types ----
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
interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  display_order?: number | null;
}
interface ProductInquiry {
  id: string;
  inquiry_type: "link" | "phone" | "whatsapp" | "email";
  contact_value: string;
  button_text: string;
  is_active: boolean;
}
interface ProductService {
  id: string;
  title: string;
  description: string;
  price?: string;
  category?: string;
  text_alignment?: "left" | "center" | "right";
  is_featured: boolean;
  is_active: boolean;
  images: ProductImage[];
  inquiries: ProductInquiry[];
}
interface ReviewLink {
  id: string;
  title: string;
  review_url: string;
  created_at: string;
}

export const PublicCard: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState<Record<string, boolean>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  // ---- Callbacks & Effects ----

  // ---- Meta & Analytics ----
  const updateMetaTags = useCallback((): void => {
    if (!card) return;
    const meta = {
      name: card.title || "Digital Business Card",
      company: card.company || "",
      profession: card.position || "",
      bio: card.bio || "",
      avatar:
        card.avatar_url ||
        "https://github.com/yash131120/DBC_____logo/blob/main/logo.png?raw=true",
    };
    if (
      typeof window !== "undefined" &&
      (window as unknown as { updateCardMetaTags?: (m: typeof meta) => void })
        .updateCardMetaTags
    ) {
      (
        window as unknown as { updateCardMetaTags?: (m: typeof meta) => void }
      ).updateCardMetaTags?.(meta);
    }
  }, [card]);
  const trackView = useCallback(
    async (id: string): Promise<void> => {
      try {
        await supabase
          .from("business_cards")
          .update({ view_count: card ? (card.view_count || 0) + 1 : 1 })
          .eq("id", id);
        await supabase.from("card_analytics").insert({
          card_id: id,
          visitor_ip: null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
        });
      } catch (e) {
        console.error("Track view error", e);
      }
    },
    [card]
  );

  // ---- Data Load ----
  const loadCard = useCallback(async (): Promise<void> => {
    if (!cardId) return;
    try {
      setLoading(true);
      setError(null);
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .select("*")
        .eq("slug", cardId)
        .eq("is_published", true)
        .single();
      if (cardError || !cardData) {
        setError("Card not found or not published");
        return;
      }
      setCard(cardData);
      const { data: socialData } = await supabase
        .from("social_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setSocialLinks(socialData || []);
      const { data: mediaData } = await supabase
        .from("media_items")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setMediaItems(
        (mediaData || []).map((m) => ({
          id: m.id,
          type: m.type as MediaItem["type"],
          url: m.url,
          title: m.title,
          description: m.description || undefined,
          thumbnail_url: m.thumbnail_url || undefined,
        }))
      );
      const { data: reviewData } = await supabase
        .from("review_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setReviewLinks(
        (reviewData || []).map((r) => ({
          id: r.id,
          title: r.title,
          review_url: r.review_url,
          created_at: r.created_at,
        }))
      );
      const { data: productsData } = await supabase
        .from("products_services")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (productsData) {
        const detailed: ProductService[] = await Promise.all(
          productsData.map(async (p: Record<string, any>) => {
            const { data: images } = await supabase
              .from("product_image_links")
              .select("*")
              .eq("product_id", p.id)
              .order("display_order", { ascending: true });
            const { data: inquiries } = await supabase
              .from("product_inquiries")
              .select("*")
              .eq("product_id", p.id)
              .eq("is_active", true);
            return {
              id: p.id,
              title: p.title,
              description: p.description,
              price: p.price || undefined,
              category: p.category || undefined,
              text_alignment: p.text_alignment || undefined,
              is_featured: p.is_featured,
              is_active: p.is_active,
              images: (images || []).map((img) => ({
                id: img.id,
                image_url: img.image_url,
                alt_text: img.alt_text,
                display_order: img.display_order,
              })) as ProductImage[],
              inquiries: (inquiries || []).map((q) => ({
                id: q.id,
                inquiry_type: q.inquiry_type,
                contact_value: q.contact_value,
                button_text: q.button_text,
                is_active: q.is_active,
              })) as ProductInquiry[],
            };
          })
        );
        setProducts(detailed);
      }
    } catch (e) {
      console.error("Load card error", e);
      setError("Failed to load card");
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  // Effects after callbacks defined
  useEffect(() => {
    if (cardId) loadCard();
  }, [cardId, loadCard]);
  useEffect(() => {
    if (card) {
      updateMetaTags();
      trackView(card.id);
    }
  }, [card, updateMetaTags, trackView]);
  useEffect(() => {
    if (!galleryOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        setGalleryIndex((p) => (p + 1) % galleryImages.length);
      else if (e.key === "ArrowLeft")
        setGalleryIndex(
          (p) => (p - 1 + galleryImages.length) % galleryImages.length
        );
      else if (e.key === "Escape") setGalleryOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [galleryOpen, galleryImages.length]);

  // ---- Helpers ----
  const handleDownload = async () => {
    const el = document.getElementById("public-card-content");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${card?.slug || "business-card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Failed to download card");
    }
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
  const copy = (t: string) =>
    navigator.clipboard
      .writeText(t)
      .then(() => alert("Link copied!"))
      .catch(() => alert("Copy failed"));
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card?.title || "Business Card"} - ${
            card?.company || "Professional"
          }`,
          text: `Check out ${card?.title || "this"}'s digital business card`,
          url,
        });
      } catch {
        copy(url);
      }
    } else copy(url);
  };
  const renderProductDescription = (text: string, align: string = "left") => {
    const cls =
      align === "center"
        ? "text-center"
        : align === "right"
        ? "text-right"
        : "text-left";
    return (
      <div className={`${cls} whitespace-pre-wrap leading-relaxed text-sm`}>
        {text.split("\n").map((line, i) => {
          const toHtml = (content: string) =>
            content
              .replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="font-semibold text-gray-900">$1</strong>'
              )
              .replace(
                /\*(.*?)\*/g,
                '<em class="italic text-gray-700">$1</em>'
              );
          if (line.trim().startsWith("• ")) {
            return (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">
                  •
                </span>
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{
                    __html: toHtml(line.replace("• ", "")),
                  }}
                />
              </div>
            );
          }
          return (
            <div key={i} className={line.trim() === "" ? "mb-3" : "mb-1"}>
              {line.trim() !== "" && (
                <span dangerouslySetInnerHTML={{ __html: toHtml(line) }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const getCardShapeClasses = () => {
    switch (card?.shape) {
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
  interface LayoutCfg {
    style?: string;
    alignment?: "left" | "center" | "right";
    font?: string;
  }
  const layout: LayoutCfg = (card?.layout as unknown as LayoutCfg) || {
    style: "modern",
    alignment: "center",
    font: "Inter",
  };
  const getLayoutClasses = () => {
    const base = "flex flex-col";
    switch (layout.alignment) {
      case "left":
        return base + " items-start text-left";
      case "right":
        return base + " items-end text-right";
      default:
        return base + " items-center text-center";
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
  interface ThemeCfg {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  }
  const theme: ThemeCfg = (card?.theme as unknown as ThemeCfg) || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
  };
  const cardUrl = typeof window !== "undefined" ? window.location.href : "";

  // ---- Loading / Error States ----
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading business card...</p>
        </div>
      </div>
    );
  if (error || !card)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Card Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The business card you're looking for does not exist or is unpublished."}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    );

  // ---- Main Render ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-4">Scan to View Card</h3>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={cardUrl} size={200} level="M" includeMargin />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code to open this business card
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="py-8 px-4" id="public-card-content">
        <div className="max-w-6xl mx-auto">
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
                {card.avatar_url ? (
                  <img
                    src={card.avatar_url}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover mx-auto mb-4 border-4"
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
                <div className="mb-4">
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
                  {card.bio && (
                    <p
                      className="text-sm opacity-70"
                      style={{ color: theme.text }}
                    >
                      {card.bio}
                    </p>
                  )}
                </div>
                <div className="space-y-3 mb-0">
                  {card.email && (
                    <a
                      href={`mailto:${card.email}`}
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/16509/16509529.png"
                        alt="Gmail"
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-500 break-all">
                          {card.email}
                        </p>
                      </div>
                    </a>
                  )}
                  {card.address &&
                  card.map_link &&
                  typeof card.map_link === "string" &&
                  card.map_link.trim() !== "" ? (
                    <a
                      href={card.map_link as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md"
                    >
                      <img
                        src="https://cdn-icons-png.freepik.com/512/16509/16509523.png"
                        alt="Map"
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-500">{card.address}</p>
                      </div>
                    </a>
                  ) : card.address ? (
                    <p className="text-sm mb-2">{card.address}</p>
                  ) : null}
                  {card.phone && (
                    <a
                      href={`tel:${card.phone}`}
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/9073/9073336.png"
                        alt="Phone"
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-500">{card.phone}</p>
                      </div>
                    </a>
                  )}
                  {card.whatsapp && (
                    <a
                      href={`https://wa.me/${card.whatsapp.replace(
                        /[^0-9]/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/15713/15713434.png"
                        alt="WhatsApp"
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-500">Send message</p>
                      </div>
                    </a>
                  )}
                  {card.website && (
                    <a
                      href={
                        card.website.startsWith("http")
                          ? card.website
                          : `https://${card.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md"
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/10453/10453141.png"
                        alt="Website"
                        className="w-8 h-8 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-500 break-all">
                          {card.website}
                        </p>
                      </div>
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t justify-center" style={{ borderColor: theme.primary }}>
                    <Eye className="w-4 h-4" />
                    <span>{card.view_count || 0} views</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Social / Contact */}
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
                <h3 className="text-xl font-semibold mb-4">Get In Touch</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-black/10 transition-all hover:scale-105"
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img
                          src={getPlatformLogo(link.platform, link.url)}
                          alt={link.platform}
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

             {/* Reviews */}
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
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" /> Reviews
                  </h3>
                  <div
                    className="flex flex-row gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4 md:overflow-x-visible"
                    style={{scrollbarWidth: 'thin'}}
                  >
                    {reviewLinks.map((r) => (
                      <a
                        key={r.id}
                        href={r.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-[260px] max-w-xs w-full block p-4 border border-gray-200 rounded-xl hover:shadow-md bg-white/80"
                        style={{ flex: '0 0 auto' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-700 truncate">
                              {r.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              View our customer reviews
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products & Services */}
          {products.length > 0 && (
            <div
              ref={cardRef}
              className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()} overflow-visible`}
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                fontFamily: `'${layout.font}', sans-serif`,
                borderColor: theme.primary + "50",
              }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" /> Products & Services
              </h3>
              <div className="w-full rounded-2xl bg-white/80 backdrop-blur-sm p-2 overflow-x-auto">
                <div
                  className="flex gap-6 pb-2"
                  style={{ minWidth: "fit-content" }}
                >
                  {products.map((prod) => {
                    const isMobile =
                      typeof window !== "undefined" && window.innerWidth < 768;
                    const showMoreCount = prod.images.length - 2;
                    const showMoreText =
                      showMoreCount > 0
                        ? isMobile
                          ? `+${showMoreCount} more images`
                          : "+"
                        : "";
                    const descLines = prod.description.split("\n");
                    const long = descLines.length > 5;
                    const expanded = descExpanded[prod.id];
                    return (
                      <div
                        key={prod.id}
                        className="min-w-[320px] max-w-[400px] border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all"
                      >
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {prod.images.slice(0, 2).map((img, i: number) => (
                            <div
                              key={i}
                              className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                              onClick={() => {
                                setGalleryImages(
                                  prod.images.map((m) => m.image_url)
                                );
                                setGalleryIndex(i);
                                setGalleryOpen(true);
                              }}
                            >
                              <img
                                src={img.image_url}
                                alt={img.alt_text || `Image ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {i === 1 && showMoreCount > 0 && (
                                <div
                                  className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg"
                                  onClick={() => {
                                    setGalleryImages(
                                      prod.images.map((m) => m.image_url)
                                    );
                                    setGalleryIndex(1);
                                    setGalleryOpen(true);
                                  }}
                                >
                                  {showMoreText}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {showMoreCount > 0 && isMobile && (
                          <div
                            className="text-xs text-gray-500 mb-2 text-center cursor-pointer"
                            onClick={() => {
                              setGalleryImages(
                                prod.images.map((m) => m.image_url)
                              );
                              setGalleryIndex(1);
                              setGalleryOpen(true);
                            }}
                          >
                            {showMoreText}
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-lg text-gray-900">
                            {prod.title}
                          </h4>
                          {prod.is_featured && (
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {prod.category && (
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-2">
                            {prod.category}
                          </span>
                        )}
                        {prod.price && (
                          <p className="text-green-600 font-bold text-base mb-2">
                            {prod.price}
                          </p>
                        )}
                        <div className="text-xs" style={{ color: theme.text }}>
                          {renderProductDescription(
                            expanded || !long
                              ? prod.description
                              : descLines.slice(0, 4).join("\n"),
                            prod.text_alignment
                          )}
                        </div>
                        {long && (
                          <button
                            className="text-blue-600 text-xs mt-1 underline"
                            onClick={() =>
                              setDescExpanded((p) => ({
                                ...p,
                                [prod.id]: !expanded,
                              }))
                            }
                          >
                            {expanded ? "Show less" : "Show more"}
                          </button>
                        )}
                        {prod.inquiries.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 mt-2">
                            {prod.inquiries.map((q) => (
                              <a
                                key={q.id}
                                href={
                                  q.inquiry_type === "phone"
                                    ? `tel:${q.contact_value}`
                                    : q.inquiry_type === "whatsapp"
                                    ? `https://wa.me/${q.contact_value.replace(
                                        /[^0-9]/g,
                                        ""
                                      )}`
                                    : q.inquiry_type === "email"
                                    ? `mailto:${q.contact_value}`
                                    : q.contact_value
                                }
                                target={
                                  q.inquiry_type === "link"
                                    ? "_blank"
                                    : undefined
                                }
                                rel={
                                  q.inquiry_type === "link"
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-md hover:opacity-90"
                                style={{ backgroundColor: theme.primary }}
                              >
                                {q.inquiry_type === "link" && (
                                  <ExternalLink className="w-4 h-4" />
                                )}
                                {q.inquiry_type === "phone" && (
                                  <Phone className="w-4 h-4" />
                                )}
                                {q.inquiry_type === "whatsapp" && (
                                  <MessageCircle className="w-4 h-4" />
                                )}
                                {q.inquiry_type === "email" && (
                                  <Mail className="w-4 h-4" />
                                )}
                                {q.button_text}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {galleryOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                  onClick={() => setGalleryOpen(false)}
                >
                  <div
                    className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-2 right-4 text-gray-600 hover:text-red-600 text-2xl font-bold"
                      onClick={() => setGalleryOpen(false)}
                    >
                      &times;
                    </button>
                    <img
                      src={galleryImages[galleryIndex]}
                      alt="Gallery"
                      className="max-h-[60vh] w-auto mx-auto rounded mb-4"
                    />
                    <div className="flex gap-2 justify-center flex-wrap">
                      {galleryImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setGalleryIndex(i)}
                          className={`w-16 h-12 rounded border-2 ${
                            galleryIndex === i
                              ? "border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumb ${i + 1}`}
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

          <div className="text-center py-5">
            <p className="text-gray-500 text-sm">
              Powered by Digital Business Cards
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Floating Buttons */}
      <div className="fixed bottom-8 right-8 flex-col gap-3 hidden lg:flex">
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 flex items-center justify-center"
          title="Show QR Code"
        >
          <QrCode className="w-7 h-7" />
        </button>
        <button
          onClick={handleShare}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 flex items-center justify-center"
          title="Share Card"
        >
          <Share2 className="w-6 h-6" />
        </button>
        <button
          onClick={handleDownload}
          className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-110 flex items-center justify-center"
          title="Download PNG"
        >
          <Download className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Actions */}
      <div className="grid grid-cols-3 gap-2 p-4 mt-5 flex lg:hidden">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg"
        >
          <Download className="w-8 h-8" />
        </button>
        <button
          onClick={() => setShowQR(true)}
          className="flex flex-col items-center gap-2 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg"
        >
          <QrCode className="w-8 h-8" />
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"
        >
          <Share2 className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
