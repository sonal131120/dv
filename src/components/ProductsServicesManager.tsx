import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Upload,
  Bold,
  Italic,
  List,
  Link,
  Phone,
  MessageCircle,
  Mail,
  Save,
  Trash2,
  Image as ImageIcon,
  Star,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  Loader2,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductService {
  id: string;
  title: string;
  description: string;
  price?: string;
  category?: string;
  text_alignment: 'left' | 'center' | 'right';
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  images: ProductImageLink[];
  inquiries: ProductInquiry[];
}

interface ProductImageLink {
  id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_active: boolean;
}

interface ProductInquiry {
  id: string;
  inquiry_type: 'link' | 'phone' | 'whatsapp' | 'email';
  contact_value: string;
  button_text: string;
  is_active: boolean;
}

interface ProductsServicesManagerProps {
  cardId: string;
  products: ProductService[];
  onProductsChange: (products: ProductService[]) => void;
  userId: string;
}

export const ProductsServicesManager: React.FC<ProductsServicesManagerProps> = ({
  cardId,
  products,
  onProductsChange,
  userId
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<ProductService>>({
    title: '',
    description: '',
    price: '',
    category: '',
    text_alignment: 'left',
    is_featured: false,
    is_active: true,
    images: [],
    inquiries: []
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (cardId) {
      loadProducts();
    }
  }, [cardId]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products_services')
        .select('*')
        .eq('card_id', cardId)
        .order('display_order', { ascending: true });

      if (productsError) throw productsError;

      // Load image links and inquiries for each product
      const productsWithDetails = await Promise.all(
        (productsData || []).map(async (product) => {
          // Load image links
          const { data: imagesData } = await supabase
            .from('product_image_links')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          // Load inquiries
          const { data: inquiriesData } = await supabase
            .from('product_inquiries')
            .select('*')
            .eq('product_id', product.id);

          return {
            ...product,
            images: imagesData || [],
            inquiries: inquiriesData || []
          };
        })
      );

      onProductsChange(productsWithDetails);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (productData: Partial<ProductService>) => {
    try {
      setSaving(true);

      let productId: string;

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products_services')
          .update({
            title: productData.title,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            text_alignment: productData.text_alignment,
            is_featured: productData.is_featured,
            is_active: productData.is_active
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        productId = editingProduct.id;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products_services')
          .insert({
            card_id: cardId,
            title: productData.title,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            text_alignment: productData.text_alignment || 'left',
            display_order: products.length,
            is_featured: productData.is_featured || false,
            is_active: productData.is_active !== false
          })
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Save image links
      if (productData.images && productData.images.length > 0) {
        // Delete existing image links
        await supabase
          .from('product_image_links')
          .delete()
          .eq('product_id', productId);

        // Insert new image links
        const { error: imagesError } = await supabase
          .from('product_image_links')
          .insert(
            productData.images.map((image, index) => ({
              product_id: productId,
              image_url: image.image_url,
              alt_text: image.alt_text,
              display_order: index,
              is_active: true
            }))
          );

        if (imagesError) throw imagesError;
      }

      // Save inquiries
      if (productData.inquiries && productData.inquiries.length > 0) {
        // Delete existing inquiries
        await supabase
          .from('product_inquiries')
          .delete()
          .eq('product_id', productId);

        // Insert new inquiries
        const { error: inquiriesError } = await supabase
          .from('product_inquiries')
          .insert(
            productData.inquiries.map(inquiry => ({
              product_id: productId,
              inquiry_type: inquiry.inquiry_type,
              contact_value: inquiry.contact_value,
              button_text: inquiry.button_text,
              is_active: inquiry.is_active
            }))
          );

        if (inquiriesError) throw inquiriesError;
      }

      await loadProducts();
      setShowAddForm(false);
      setEditingProduct(null);
      setNewProduct({
        title: '',
        description: '',
        price: '',
        category: '',
        text_alignment: 'left',
        is_featured: false,
        is_active: true,
        images: [],
        inquiries: []
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product/service? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products_services')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleEditProduct = (product: ProductService) => {
    setEditingProduct(product);
    setNewProduct(product);
    setShowAddForm(true);
  };

  const handleAddImageLink = () => {
    if (!newImageUrl.trim()) return;

    const newImage: ProductImageLink = {
      id: Date.now().toString(), // Temporary ID for new images
      image_url: newImageUrl,
      alt_text: '',
      display_order: (newProduct.images?.length || 0),
      is_active: true
    };

    setNewProduct({
      ...newProduct,
      images: [...(newProduct.images || []), newImage]
    });
    setNewImageUrl('');
  };

  const handleRemoveImageLink = (index: number) => {
    const updatedImages = (newProduct.images || []).filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, images: updatedImages });
  };

  const formatText = (text: string, format: 'bold' | 'italic' | 'bullet') => {
    const textarea = document.getElementById('description-input') as HTMLTextAreaElement;
    if (!textarea) return text;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    if (!selectedText) return text;

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'bullet':
        formattedText = `• ${selectedText}`;
        break;
    }

    return text.substring(0, start) + formattedText + text.substring(end);
  };

  const renderFormattedText = (text: string, alignment: string = 'left') => {
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    
    return (
      <div className={`${alignmentClass} whitespace-pre-wrap leading-relaxed`}>
        {text.split('\n').map((line, index) => {
          // Handle bullet points
          if (line.trim().startsWith('• ')) {
            return (
              <div key={index} className="flex items-start gap-2 mb-1">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span dangerouslySetInnerHTML={{ 
                  __html: line.replace('• ', '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
                }} />
              </div>
            );
          }
          
          // Handle regular lines
          return (
            <div key={index} className={line.trim() === '' ? 'mb-2' : 'mb-1'}>
              <span dangerouslySetInnerHTML={{ 
                __html: line
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
              }} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderProductForm = (product: Partial<ProductService>) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingProduct ? 'Edit Product/Service' : 'Add New Product/Service'}
        </h3>
        <button
          onClick={() => {
            setShowAddForm(false);
            setEditingProduct(null);
            setNewProduct({
              title: '',
              description: '',
              price: '',
              category: '',
              text_alignment: 'left',
              is_featured: false,
              is_active: true,
              images: [],
              inquiries: []
            });
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={product.title || ''}
              onChange={(e) => setNewProduct({ ...product, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product or service name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (Optional)
            </label>
            <input
              type="text"
              value={product.price || ''}
              onChange={(e) => setNewProduct({ ...product, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="$99 or Contact for pricing"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category (Optional)
          </label>
          <input
            type="text"
            value={product.category || ''}
            onChange={(e) => setNewProduct({ ...product, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Web Design, Consulting, Products"
          />
        </div>

        {/* Rich Text Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Formatting Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setNewProduct({ 
                  ...product, 
                  description: formatText(product.description || '', 'bold') 
                })}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setNewProduct({ 
                  ...product, 
                  description: formatText(product.description || '', 'italic') 
                })}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setNewProduct({ 
                  ...product, 
                  description: formatText(product.description || '', 'bullet') 
                })}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Bullet Point"
              >
                <List className="w-4 h-4" />
              </button>
              
              {/* Text Alignment */}
              <div className="border-l border-gray-300 pl-2 ml-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setNewProduct({ ...product, text_alignment: 'left' })}
                  className={`p-2 rounded transition-colors ${
                    product.text_alignment === 'left' ? 'bg-blue-200 text-blue-700' : 'hover:bg-gray-200'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setNewProduct({ ...product, text_alignment: 'center' })}
                  className={`p-2 rounded transition-colors ${
                    product.text_alignment === 'center' ? 'bg-blue-200 text-blue-700' : 'hover:bg-gray-200'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setNewProduct({ ...product, text_alignment: 'right' })}
                  className={`p-2 rounded transition-colors ${
                    product.text_alignment === 'right' ? 'bg-blue-200 text-blue-700' : 'hover:bg-gray-200'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              id="description-input"
              value={product.description || ''}
              onChange={(e) => setNewProduct({ ...product, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none resize-none"
              placeholder="Describe your product or service. Use **bold**, *italic*, and • bullet points for formatting."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use **text** for bold, *text* for italic, and • for bullet points
          </p>
        </div>

        {/* Image Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images (URLs)
          </label>
          <div className="space-y-3">
            {/* Add Image URL Form */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                onClick={handleAddImageLink}
                disabled={!newImageUrl.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Image Links List */}
            {(product.images || []).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(product.images || []).map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || `Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImageLink(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      value={image.alt_text || ''}
                      onChange={(e) => {
                        const updatedImages = [...(product.images || [])];
                        updatedImages[index] = { ...image, alt_text: e.target.value };
                        setNewProduct({ ...product, images: updatedImages });
                      }}
                      className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-white bg-opacity-90 text-xs rounded border border-gray-300 focus:ring-1 focus:ring-blue-500"
                      placeholder="Alt text (optional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inquiry Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inquiry Buttons
          </label>
          <div className="space-y-3">
            {(product.inquiries || []).map((inquiry, index) => (
              <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <select
                  value={inquiry.inquiry_type}
                  onChange={(e) => {
                    const updatedInquiries = [...(product.inquiries || [])];
                    updatedInquiries[index] = {
                      ...inquiry,
                      inquiry_type: e.target.value as any
                    };
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="link">Website Link</option>
                  <option value="phone">Phone Number</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
                <input
                  type="text"
                  value={inquiry.contact_value}
                  onChange={(e) => {
                    const updatedInquiries = [...(product.inquiries || [])];
                    updatedInquiries[index] = {
                      ...inquiry,
                      contact_value: e.target.value
                    };
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact value (URL, phone, etc.)"
                />
                <input
                  type="text"
                  value={inquiry.button_text}
                  onChange={(e) => {
                    const updatedInquiries = [...(product.inquiries || [])];
                    updatedInquiries[index] = {
                      ...inquiry,
                      button_text: e.target.value
                    };
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Button text"
                />
                <button
                  onClick={() => {
                    const updatedInquiries = (product.inquiries || []).filter((_, i) => i !== index);
                    setNewProduct({ ...product, inquiries: updatedInquiries });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newInquiry: ProductInquiry = {
                  id: '',
                  inquiry_type: 'link',
                  contact_value: '',
                  button_text: 'Inquire Now',
                  is_active: true
                };
                setNewProduct({ 
                  ...product, 
                  inquiries: [...(product.inquiries || []), newInquiry] 
                });
              }}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Inquiry Button
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.is_featured || false}
              onChange={(e) => setNewProduct({ ...product, is_featured: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Featured Product</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.is_active !== false}
              onChange={(e) => setNewProduct({ ...product, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleSaveProduct(product)}
            disabled={!product.title || !product.description || saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingProduct(null);
              setNewProduct({
                title: '',
                description: '',
                price: '',
                category: '',
                text_alignment: 'left',
                is_featured: false,
                is_active: true,
                images: [],
                inquiries: []
              });
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
          <p className="text-sm text-gray-600">
            Showcase your products and services with rich descriptions and inquiry options
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product/Service
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingProduct) && renderProductForm(editingProduct || newProduct)}

      {/* Products List */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              {/* Product Images */}
              {product.images.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    {product.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.image_url}
                          alt={image.alt_text || `${product.title} image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {product.images.length > 4 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      +{product.images.length - 4} more images
                    </p>
                  )}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{product.title}</h4>
                      {product.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      {!product.is_active && (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {product.price && (
                      <p className="text-sm text-green-600 font-medium mb-1">{product.price}</p>
                    )}
                    {product.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        <Tag className="w-3 h-3" />
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Formatted Description Preview */}
                <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {renderFormattedText(product.description, product.text_alignment)}
                </div>

                {product.inquiries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.inquiries.map((inquiry, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {inquiry.inquiry_type === 'link' && <Link className="w-3 h-3" />}
                        {inquiry.inquiry_type === 'phone' && <Phone className="w-3 h-3" />}
                        {inquiry.inquiry_type === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                        {inquiry.inquiry_type === 'email' && <Mail className="w-3 h-3" />}
                        {inquiry.button_text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products or Services</h3>
          <p className="text-gray-600 mb-4">
            Add your products and services to showcase what you offer to potential customers.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Product/Service
          </button>
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {products.length} product{products.length !== 1 ? 's' : ''} • {products.filter(p => p.is_featured).length} featured
              </span>
            </div>
            <span className="text-sm text-blue-700">
              {products.filter(p => p.is_active).length} active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};