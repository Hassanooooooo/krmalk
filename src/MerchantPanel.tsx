import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

interface MerchantPanelProps {
  onBack: () => void;
  onOpenRequestPage?: () => void;
  onShopUpdated?: (shop: Shop) => void;
}

export interface Product {
  id: number;
  shop_id: string | number;
  name: string;
  image_url: string;
  price: number;
  description: string | null;
  is_available?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  description: string;
  cham_cash_code?: string;
  cham_cash_link?: string;
  cham_cash_number?: string;
  cham_cash_name?: string;
  is_active?: boolean;
  is_open?: boolean;
  user_id?: string;
  status?: "pending" | "approved" | "rejected";
}

export default function MerchantPanel({ onBack, onOpenRequestPage, onShopUpdated }: MerchantPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentMerchantShop, setCurrentMerchantShop] = useState<Shop | null>(null);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Merchant Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab in Merchant Dashboard
  const [activeTab, setActiveTab] = useState<'cham_cash' | 'products' | 'shop_info' | 'orders'>('cham_cash');

  // Shop Edit Form State
  const [shopForm, setShopForm] = useState({
    name: '',
    category: 'سوبر ماركت',
    phone: '',
    address: '',
    description: '',
    cham_cash_code: '',
    cham_cash_link: '',
    cham_cash_number: '',
    cham_cash_name: '',
    is_open: true,
  });

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    image_url: '',
    description: '',
    is_available: true,
  });

  useEffect(() => {
    initMerchantSession();
  }, []);

  async function initMerchantSession() {
    setLoading(true);
    try {
      // 1. Load all shops from storage
      const savedShopsStr = localStorage.getItem('karamalak-shops');
      let shopsList: Shop[] = savedShopsStr ? JSON.parse(savedShopsStr) : [];

      if (isSupabaseConfigured()) {
        const { data: supaShops } = await supabase.from('shops').select('*');
        if (supaShops && supaShops.length > 0) {
          shopsList = supaShops.map((s) => ({
            id: String(s.id),
            name: s.name || '',
            category: s.category || 'أخرى',
            phone: s.phone || '',
            address: s.address || '',
            description: s.description || '',
            cham_cash_code: s.cham_cash_code || '',
            cham_cash_link: s.cham_cash_link || '',
            cham_cash_number: (s.cham_cash_number && s.cham_cash_number !== s.phone) ? s.cham_cash_number : '',
            cham_cash_name: s.cham_cash_name || '',
            is_active: s.is_active ?? true,
            is_open: s.is_open ?? true,
            user_id: s.user_id,
            status: s.status,
          }));
        }
      }
      setAllShops(shopsList);

      // 2. Check if a merchant is already logged in
      const activeMerchantShopId = localStorage.getItem('karmalak-active-merchant-shop-id');

      if (isSupabaseConfigured()) {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (user) {
          // Look for shop owned by this user
          const myShop = shopsList.find((s) => s.user_id === user.id) ||
            (activeMerchantShopId ? shopsList.find((s) => s.id === activeMerchantShopId) : null);

          if (myShop) {
            selectShopAndLogin(myShop);
            setLoading(false);
            return;
          }
        }
      }

      // Check local saved merchant session
      if (activeMerchantShopId) {
        const savedShop = shopsList.find((s) => s.id === activeMerchantShopId);
        if (savedShop) {
          selectShopAndLogin(savedShop);
          setLoading(false);
          return;
        }
      }

      // Otherwise not logged in yet
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Error initializing merchant session:', err);
    } finally {
      setLoading(false);
    }
  }

  function selectShopAndLogin(shop: Shop) {
    setCurrentMerchantShop(shop);
    setShopForm({
      name: shop.name || '',
      category: shop.category || 'سوبر ماركت',
      phone: shop.phone || '',
      address: shop.address || '',
      description: shop.description || '',
      cham_cash_code: shop.cham_cash_code || '',
      cham_cash_link: shop.cham_cash_link || '',
      cham_cash_number: (shop.cham_cash_number && shop.cham_cash_number !== shop.phone) ? shop.cham_cash_number : '',
      cham_cash_name: shop.cham_cash_name || shop.name || '',
      is_open: shop.is_open ?? true,
    });
    localStorage.setItem('karmalak-active-merchant-shop-id', shop.id);
    setIsLoggedIn(true);
    loadProductsForShop(shop.id);
  }

  async function loadProductsForShop(shopId: string | number) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopId);

        if (!error && data) {
          setProducts(data);
          return;
        }
      } catch (err) {
        console.warn('Could not load products from Supabase:', err);
      }
    }

    // Fallback: local storage
    const allProductsStr = localStorage.getItem('karamalak-products');
    if (allProductsStr) {
      const all: Product[] = JSON.parse(allProductsStr);
      const filtered = all.filter((p) => String(p.shop_id) === String(shopId));
      if (filtered.length > 0) {
        setProducts(filtered);
        return;
      }
    }

    const localProductsStr = localStorage.getItem(`karamalak-products-${shopId}`);
    if (localProductsStr) {
      setProducts(JSON.parse(localProductsStr));
    } else {
      // Default sample products for this shop
      const defaultProducts: Product[] = [
        {
          id: Date.now() + 1,
          shop_id: shopId,
          name: 'منتج مميز للمتجر',
          price: 15000,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
          description: 'منتج عالي الجودة مع خدمة التوصيل السريع داخل مخيم الوافدين.',
          is_available: true,
        },
      ];
      setProducts(defaultProducts);
      localStorage.setItem(`karamalak-products-${shopId}`, JSON.stringify(defaultProducts));
    }
  }

  // Handle Merchant Login
  async function handleMerchantLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setMessage(null);

    const email = loginEmail.trim().toLowerCase();

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: loginPassword,
        });

        if (error) throw error;

        if (data.user) {
          // Find matching shop
          const matchedShop = allShops.find((s) => s.user_id === data.user?.id);
          if (matchedShop) {
            selectShopAndLogin(matchedShop);
            return;
          }
        }
      }

      // Check local shop match by phone or name or fallback
      const found = allShops.find(
        (s) =>
          s.phone.replace(/[^0-9]/g, '') === email.replace(/[^0-9]/g, '') ||
          s.name.toLowerCase().includes(email.toLowerCase())
      );

      if (found) {
        selectShopAndLogin(found);
      } else if (allShops.length > 0) {
        selectShopAndLogin(allShops[0]);
      } else {
        throw new Error('لم يتم العثور على متجر مرتبط بهذه البيانات. يمكنك تقديم طلب انضمام جديد.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذّر تسجيل دخول التاجر';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoginLoading(false);
    }
  }

  // Handle Merchant Logout
  function handleMerchantLogout() {
    localStorage.removeItem('karmalak-active-merchant-shop-id');
    setIsLoggedIn(false);
    setCurrentMerchantShop(null);
    setMessage({ text: 'تم تسجيل الخروج من حساب التاجر.', type: 'success' });
  }

  // Save Cham Cash & Shop Info
  async function handleSaveShopData(e: React.FormEvent) {
    e.preventDefault();
    if (!currentMerchantShop) return;

    const dataToSave = {
      name: shopForm.name,
      category: shopForm.category,
      phone: shopForm.phone,
      address: shopForm.address,
      description: shopForm.description,
      cham_cash_code: shopForm.cham_cash_code.trim(),
      cham_cash_link: shopForm.cham_cash_link.trim(),
      cham_cash_number: shopForm.cham_cash_number.trim(),
      cham_cash_name: shopForm.cham_cash_name.trim(),
      is_open: shopForm.is_open,
    };

    try {
      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('shops')
            .update(dataToSave)
            .eq('id', currentMerchantShop.id);
        } catch (supaErr) {
          console.warn('Supabase update warning:', supaErr);
        }
      }

      // Update in localStorage
      let updatedShopObj: Shop = { ...currentMerchantShop, ...dataToSave };
      const savedShopsStr = localStorage.getItem('karamalak-shops');
      if (savedShopsStr) {
        const shopsList: Shop[] = JSON.parse(savedShopsStr);
        const updated = shopsList.map((s) =>
          s.id === currentMerchantShop.id ? { ...s, ...dataToSave } : s
        );
        localStorage.setItem('karamalak-shops', JSON.stringify(updated));
        setAllShops(updated);
        const found = updated.find((s) => s.id === currentMerchantShop.id);
        if (found) updatedShopObj = found;
      }

      setCurrentMerchantShop(updatedShopObj);
      onShopUpdated?.(updatedShopObj);

      setMessage({
        text: 'تم حفظ وتحديث كود ورابط شام كاش وبيانات متجرك بنجاح! سيظهر الكود والرابط مباشرة للزبائن عند الشراء.',
        type: 'success',
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذّر حفظ البيانات';
      setMessage({ text: msg, type: 'error' });
    }
  }

  // Save Product (Add / Edit)
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!currentMerchantShop) return;

    const priceNum = Number(productForm.price) || 0;

    try {
      if (editingProduct) {
        // Edit Product
        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('products')
            .update({
              name: productForm.name,
              price: priceNum,
              image_url: productForm.image_url,
              description: productForm.description,
              is_available: productForm.is_available,
            })
            .eq('id', editingProduct.id);

          if (error) throw error;
        }

        const updatedProducts = products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name,
                price: priceNum,
                image_url: productForm.image_url,
                description: productForm.description,
                is_available: productForm.is_available,
              }
            : p
        );
        setProducts(updatedProducts);

        // Update overall products cache in localStorage
        updateProductInGlobalCache(updatedProducts);
        setMessage({ text: `تم تعديل منتج "${productForm.name}" بنجاح!`, type: 'success' });
      } else {
        // New Product
        const newProd: Product = {
          id: Date.now(),
          shop_id: currentMerchantShop.id,
          name: productForm.name,
          price: priceNum,
          image_url:
            productForm.image_url ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
          description: productForm.description,
          is_available: productForm.is_available,
        };

        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('products')
            .insert({
              shop_id: currentMerchantShop.id,
              name: productForm.name,
              price: priceNum,
              image_url: newProd.image_url,
              description: productForm.description,
            })
            .select()
            .single();

          if (!error && data) {
            newProd.id = data.id;
          }
        }

        const updatedProducts = [newProd, ...products];
        setProducts(updatedProducts);
        updateProductInGlobalCache(updatedProducts);
        setMessage({ text: `تمت إضافة منتج "${productForm.name}" بنجاح!`, type: 'success' });
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: '', image_url: '', description: '', is_available: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذّر حفظ المنتج';
      setMessage({ text: msg, type: 'error' });
    }
  }

  function updateProductInGlobalCache(shopProducts: Product[]) {
    if (!currentMerchantShop) return;
    localStorage.setItem(`karamalak-products-${currentMerchantShop.id}`, JSON.stringify(shopProducts));

    const allStr = localStorage.getItem('karamalak-products');
    const all: Product[] = allStr ? JSON.parse(allStr) : [];
    const withoutCurrent = all.filter((p) => String(p.shop_id) !== String(currentMerchantShop.id));
    localStorage.setItem('karamalak-products', JSON.stringify([...shopProducts, ...withoutCurrent]));
  }

  async function handleDeleteProduct(productId: number) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج من متجرك؟')) return;
    if (!currentMerchantShop) return;

    try {
      if (isSupabaseConfigured()) {
        await supabase.from('products').delete().eq('id', productId);
      }

      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      updateProductInGlobalCache(updated);
      setMessage({ text: 'تم حذف المنتج من المتجر.', type: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذّر الحذف';
      setMessage({ text: msg, type: 'error' });
    }
  }

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', image_url: '', description: '', is_available: true });
    setShowProductModal(true);
  }

  function openEditProduct(prod: Product) {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: String(prod.price),
      image_url: prod.image_url,
      description: prod.description || '',
      is_available: prod.is_available ?? true,
    });
    setShowProductModal(true);
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        جارٍ تحميل بوابة التاجر...
      </div>
    );
  }

  // ==========================================
  // VIEW 1: MERCHANT LOGIN & STORE SELECTOR
  // ==========================================
  if (!isLoggedIn || !currentMerchantShop) {
    return (
      <div className="max-w-md mx-auto my-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-right">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-700 text-white text-3xl mb-3 shadow-md shadow-emerald-200">
            🏪
          </div>
          <h1 className="text-2xl font-black text-slate-800">بوابة التاجر - كرمالك</h1>
          <p className="text-xs text-slate-500 mt-1">
            سجّل الدخول إلى صفحة متجرك الخاصة لتعديل بياناتك، منتجاتك، ومحفظة شام كاش
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleMerchantLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني للتاجر أو رقم هاتف المحل *
            </label>
            <input
              type="text"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="merchant@example.com أو 09xxxxxxxx"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition shadow-sm disabled:opacity-50"
          >
            {loginLoading ? 'جارٍ التحقق...' : 'دخول إلى لوحة إدارة متجري'}
          </button>
        </form>

        {/* Quick Demo Store Selector for Testing */}
        {allShops.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-600 mb-2.5 text-center">
              ⚡ الدخول المباشر كتاجر لأحد محلات مخيم الوافدين (للمعاينة الفورية):
            </p>
            <div className="space-y-2">
              {allShops.slice(0, 4).map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => selectShopAndLogin(shop)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl flex items-center justify-between text-right transition"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-800">{shop.name}</span>
                    <span className="block text-[10px] text-slate-400">
                      {shop.category} · {shop.phone}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold">دخول المتجر ←</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            ← العودة للسوق
          </button>

          {onOpenRequestPage && (
            <button
              type="button"
              onClick={onOpenRequestPage}
              className="text-emerald-700 hover:underline font-bold"
            >
              ➕ تقديم طلب انضمام محل جديد
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MERCHANT PRIVATE DASHBOARD
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto my-4 text-right">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-emerald-200">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                  {currentMerchantShop.name}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  {currentMerchantShop.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    shopForm.is_open
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {shopForm.is_open ? '🟢 مفتوح للطلبات' : '🟡 مغلق مؤقتاً'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                📍 {currentMerchantShop.address} · ☎ {currentMerchantShop.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              عرض كزبون في السوق
            </button>
            <button
              type="button"
              onClick={handleMerchantLogout}
              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
            >
              🚪 تسجيل خروج التاجر
            </button>
          </div>
        </div>

        {/* Merchant Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('cham_cash')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'cham_cash'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <img
              src="/src/assets/images/cham_cash_badge_1792756521052.jpg"
              alt="شام كاش"
              className="w-4 h-4 rounded-sm object-contain"
              referrerPolicy="no-referrer"
            />
            <span>💳 محفظة شام كاش للدفع</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📦</span>
            <span>المنتجات والأسعار ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop_info')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'shop_info'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>✏️</span>
            <span>بيانات المحل والعنوان</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>💬</span>
            <span>استقبال الطلبات والمحادثات</span>
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {message && (
        <div
          className={`mb-5 p-3.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs px-2 py-0.5 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: CHAM CASH DEDICATED SETUP (خانة محفظة شام كاش) */}
      {/* ==================================================== */}
      {activeTab === 'cham_cash' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src="/src/assets/images/cham_cash_badge_1792756521052.jpg"
                alt="شام كاش"
                className="w-12 h-12 rounded-xl shadow-sm object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  إعداد واستقبال المدفوعات عبر شام كاش (Cham Cash)
                </h2>
                <p className="text-xs text-slate-500">
                  ضع كود الدفع أو رابط التحويل المباشر الخاص بمتجرك ليظهر للزبائن عند الشراء بدل رقم الهاتف
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold px-3 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-full">
              {shopForm.cham_cash_code || shopForm.cham_cash_link ? '✓ كود الدفع مفعّل ومضبوط' : '⚠️ بانتظار إدخال كود أو رابط الدفع'}
            </span>
          </div>

          {/* Cham Cash Status & Preview Card */}
          <div className="p-4 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-200 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-cyan-900 font-bold mb-1">
                  المعلومات التي ستظهر للمشتري في سلة الشراء:
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">كود الدفع:</span>
                  <span className="text-lg font-black font-mono text-cyan-950 tracking-wider">
                    {shopForm.cham_cash_code || (shopForm.cham_cash_number ? shopForm.cham_cash_number : 'لم يتم تحديد كود بعد')}
                  </span>
                </div>
                {shopForm.cham_cash_link && (
                  <div className="text-xs text-teal-700 mt-1 font-semibold flex items-center gap-1">
                    <span>🔗 رابط الدفع:</span>
                    <a
                      href={shopForm.cham_cash_link}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] underline truncate max-w-xs"
                      dir="ltr"
                    >
                      {shopForm.cham_cash_link}
                    </a>
                  </div>
                )}
                <div className="text-xs text-cyan-800 mt-1 font-medium">
                  اسم صاحب الحساب: {shopForm.cham_cash_name || currentMerchantShop.name}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-cyan-200 shadow-xs text-center space-y-1.5">
                <div className="text-[11px] text-slate-500 font-bold">معاينة الزبون في السلة</div>
                <span className="inline-block text-xs font-black px-2.5 py-1 bg-cyan-600 text-white rounded-md shadow-xs">
                  كود شام كاش: {shopForm.cham_cash_code || '---'} 📋
                </span>
                {shopForm.cham_cash_link && (
                  <div className="text-[10px] text-emerald-700 font-bold">
                    ✓ زر الدفع المباشر مفعّل
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form to update Cham Cash Account */}
          <form onSubmit={handleSaveShopData} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: Cham Cash Payment Code */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  كود الدفع في شام كاش (Cham Cash Code) *
                </label>
                <input
                  type="text"
                  required
                  value={shopForm.cham_cash_code}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, cham_cash_code: e.target.value })
                  }
                  placeholder="مثال: CHAM-7721 أو كود متجرك"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  dir="ltr"
                />
                <span className="block text-[11px] text-slate-500 mt-1">
                  الكود المعتمد لمتجرك في تطبيق شام كاش، ينسخه الزبون للتحويل فوراً (يظهر بدلاً من رقم الهاتف).
                </span>
              </div>

              {/* Field 2: Direct Payment Link */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  رابط الدفع المباشر لشام كاش (Direct Payment Link)
                </label>
                <input
                  type="url"
                  value={shopForm.cham_cash_link}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, cham_cash_link: e.target.value })
                  }
                  placeholder="https://chamcash.sy/pay/... أو رابط محفظتك"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  dir="ltr"
                />
                <span className="block text-[11px] text-slate-500 mt-1">
                  رابط مباشر ينقر عليه الزبون في سلة الشراء لفتح صفحة الدفع الخاصة بك مباشرة (اختياري).
                </span>
              </div>

              {/* Field 3: Cham Cash Registered Name */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  اسم صاحب الحساب المسجل في شام كاش *
                </label>
                <input
                  type="text"
                  required
                  value={shopForm.cham_cash_name}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, cham_cash_name: e.target.value })
                  }
                  placeholder="الاسم التجاري أو الشخصي في شام كاش"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="block text-[11px] text-slate-500 mt-1">
                  يظهر للزبون للتأكد من هوية المتجر قبل إتمام التحويل.
                </span>
              </div>

              {/* Field 4: Optional Cham Cash Wallet Number */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  رقم محفظة أو حساب شام كاش (Wallet ID) - اختياري
                </label>
                <input
                  type="text"
                  value={shopForm.cham_cash_number}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, cham_cash_number: e.target.value })
                  }
                  placeholder="رقم المحفظة الرقمي إن وجد (مثال: 984210)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  dir="ltr"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  رقم إضافي للمحفظة في حال لم يتوفر كود نقطة بيع.
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 mb-2">
                📋 كيف تضمن استلام أموالك من الزبائن؟
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>يرى الزبون كود شام كاش الخاص بك أو يضغط على رابط الدفع المباشر لدفع قيمة السلة.</li>
                <li>يصلك إشعار بالطلب عبر واتساب يتضمن كود شام كاش ورقم عملية التحويل (Transaction ID).</li>
                <li>تفتح تطبيق شام كاش للتأكد من وصول الحوالة بحسب رقم العملية قبل تسليم الطلب للزبون.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
              >
                💾 حفظ وتثبيت محفظة شام كاش
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: PRODUCTS MANAGEMENT (إدارة المنتجات والأسعار) */}
      {/* ==================================================== */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                منتجات وقائمة أسعار متجرك
              </h2>
              <p className="text-xs text-slate-500">
                لديك {products.length} منتج معروض لزبائن مخيم الوافدين
              </p>
            </div>

            <button
              type="button"
              onClick={openAddProduct}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <span>➕</span> إضافة منتج جديد
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm font-bold text-slate-700 mb-1">
                لا توجد منتجات مضافة لمتجرك حتى الآن
              </p>
              <p className="text-xs text-slate-500 mb-4">
                أضف السلع والمنتجات وأسعارها بالليرة السورية لتظهر لأهالي المخيم في صفحة المتجر
              </p>
              <button
                type="button"
                onClick={openAddProduct}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg"
              >
                إضافة أول منتج
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div>
                    {prod.image_url && (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-full h-36 object-cover rounded-xl mb-2.5"
                      />
                    )}
                    <h3 className="font-bold text-slate-800 text-sm">{prod.name}</h3>
                    <p className="text-emerald-700 font-black text-sm my-1">
                      {Number(prod.price).toLocaleString('ar')} ل.س
                    </p>
                    {prod.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => openEditProduct(prod)}
                      className="flex-1 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg transition"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="py-1.5 px-3 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: SHOP INFORMATION & ADDRESS (تعديل بيانات المحل) */}
      {/* ==================================================== */}
      {activeTab === 'shop_info' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800">بيانات ومعلومات المحل</h2>
            <p className="text-xs text-slate-500">
              تعديل اسم المحل، القسم، رقم الهاتف، والعنوان الدقيق في مخيم الوافدين
            </p>
          </div>

          <form onSubmit={handleSaveShopData} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المحل *</label>
                <input
                  type="text"
                  required
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القسم والتصنيف *</label>
                <select
                  value={shopForm.category}
                  onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="مطاعم">مطاعم</option>
                  <option value="سوبر ماركت">سوبر ماركت</option>
                  <option value="أفران">أفران</option>
                  <option value="ألبسة">ألبسة</option>
                  <option value="صيانة">صيانة</option>
                  <option value="خدمات طبية">خدمات طبية</option>
                  <option value="تعليم">تعليم</option>
                  <option value="مواصلات">مواصلات</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف والتواصل (واتساب) *
                </label>
                <input
                  type="tel"
                  required
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العنوان داخل مخيم الوافدين *
                </label>
                <input
                  type="text"
                  required
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  placeholder="الحارة / الشارع / أقرب معلم"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                وصف الخدمات والسلع التي يقدمها المحل *
              </label>
              <textarea
                rows={3}
                required
                value={shopForm.description}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Cham Cash Quick Config within Shop Info */}
            <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-900 flex items-center gap-1.5">
                  <span>⚡</span> كود ورابط شام كاش (Cham Cash) لمتجرك:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('cham_cash')}
                  className="text-[11px] font-bold text-cyan-700 hover:underline"
                >
                  إعدادات شام كاش المتقدمة ←
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    كود شام كاش للدفع *
                  </label>
                  <input
                    type="text"
                    value={shopForm.cham_cash_code}
                    onChange={(e) => setShopForm({ ...shopForm, cham_cash_code: e.target.value })}
                    placeholder="مثال: CHAM-7721"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400">يظهر للزبون عند الدفع في السلة.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رابط الدفع المباشر لشام كاش (إن وجد)
                  </label>
                  <input
                    type="url"
                    value={shopForm.cham_cash_link}
                    onChange={(e) => setShopForm({ ...shopForm, cham_cash_link: e.target.value })}
                    placeholder="https://chamcash.sy/pay/..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400">زر مباشر للدفع الفوري في السلة.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="is_open_toggle"
                checked={shopForm.is_open}
                onChange={(e) => setShopForm({ ...shopForm, is_open: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="is_open_toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                المحل مفتوح حالياً ويستقبل الطلبات من الزبائن
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                حفظ بيانات المحل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: ORDERS & INQUIRIES (استقبال الطلبات) */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800">استقبال ومتابعة طلبات الزبائن</h2>
            <p className="text-xs text-slate-500">
              تصل طلبات الشراء تلقائياً إلى رقم واتساب الخاص بمحلك، مع طريقة الدفع وعنوان التوصيل
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="text-xs font-black text-emerald-950">
                  رقم واتساب المحل المعتمد لتلقي الطلبات:
                </h4>
                <p className="text-xs font-mono font-bold text-emerald-800">
                  {currentMerchantShop.phone}
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/${currentMerchantShop.phone?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              فتح واتساب المحل
            </a>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800">💡 آلية تأكيد طلبات شام كاش الواردة:</div>
            <p>1. يتضمن كل طلب مدفوع بشام كاش رقم إشعار الحوالة (Transaction ID).</p>
            <p>2. يرجى مطابقة رقم الإشعار مع إشعارات تطبيق شام كاش لديك.</p>
            <p>3. بعد التأكيد، قم بالرد على الزبون عبر واتساب ببدء التجهيز أو وقت التوصيل.</p>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-1">
              {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد لمتجرك'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              أدخل اسم المنتج وسعره بالليرة السورية ليظهر لزبائن مخيم الوافدين
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="مثال: وجبة شاورما / كيلو تفاح / علبة شاي..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السعر (بالليرة السورية) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="مثال: 18000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط صورة المنتج (اختياري)
                </label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وصف المنتج وملاحظاته (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="المكونات، الوزن، الحجم..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                >
                  {editingProduct ? 'حفظ التعديل' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
