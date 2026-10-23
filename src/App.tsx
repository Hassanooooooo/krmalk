import React, { useEffect, useState } from "react";
import "./styles.css";
import { supabase, isSupabaseConfigured } from "./supabaseClient.ts";
import AdminLogin from "./AdminLogin.tsx";
import CustomerAuth from "./CustomerAuth.tsx";
import MerchantPanel from "./MerchantPanel.tsx";
import CustomerProfile from "./CustomerProfile.tsx";
import SupabaseSettingsModal from "./SupabaseSettingsModal.tsx";
import MobileTestModal from "./MobileTestModal.tsx";

export type Shop = {
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
  status: "pending" | "approved" | "rejected";
};

export type Product = {
  id: number;
  shop_id: string | number;
  name: string;
  image_url: string;
  price: number;
  description: string | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
  shop: Shop;
};

const categories = [
  "مطاعم",
  "سوبر ماركت",
  "أفران",
  "ألبسة",
  "صيانة",
  "خدمات طبية",
  "تعليم",
  "مواصلات",
  "أخرى",
];

const initialShops: Shop[] = [
  {
    id: "1",
    name: "مطعم ومشاوي البركة",
    category: "مطاعم",
    phone: "0944123456",
    address: "مخيم الوافدين - شارع السوق الرئيسي مقابل الصيدلية",
    description: "أشهى المأكولات الشعبية والشاورما والمشاوي على الفحم مع خدمة التوصيل داخل المخيم.",
    cham_cash_code: "CHAM-7721",
    cham_cash_link: "https://chamcash.sy/pay/baraka-7721",
    cham_cash_number: "984210",
    cham_cash_name: "مطعم البركة - مخيم الوافدين",
    status: "approved",
  },
  {
    id: "2",
    name: "سوبرماركت الخير",
    category: "سوبر ماركت",
    phone: "0933789012",
    address: "مخيم الوافدين - دخلة جامع التوبة",
    description: "كافة المواد الغذائية والتموينية والمنظفات والخضار بأسعار الجملة والمفرق.",
    cham_cash_code: "CHAM-5534",
    cham_cash_link: "https://chamcash.sy/pay/alkhair-5534",
    cham_cash_number: "882319",
    cham_cash_name: "سوبرماركت الخير",
    status: "approved",
  },
  {
    id: "3",
    name: "مخبز وفرن الأمل الآلي",
    category: "أفران",
    phone: "0955321654",
    address: "مخيم الوافدين - قرب ساحة الموقف",
    description: "خبز سياحي وصمون ومعجنات وكعك طازج يومياً على مدار الساعة.",
    cham_cash_code: "CHAM-9912",
    cham_cash_link: "https://chamcash.sy/pay/alamal-9912",
    cham_cash_number: "774102",
    cham_cash_name: "مخبز الأمل الآلي",
    status: "approved",
  },
  {
    id: "4",
    name: "ألبسة النور للأطفال والعائلة",
    category: "ألبسة",
    phone: "0988654321",
    address: "مخيم الوافدين - سوق الألبسة المركزي",
    description: "أحدث التشكيلات للألبسة الرجالية والنسائية والولادية بأسعار مناسبة لجميع العائلات.",
    cham_cash_code: "CHAM-3345",
    cham_cash_link: "https://chamcash.sy/pay/alnoor-3345",
    cham_cash_number: "665201",
    cham_cash_name: "ألبسة النور",
    status: "approved",
  },
  {
    id: "5",
    name: "مركز الوفاء للصيانة والكهرباء",
    category: "صيانة",
    phone: "0999112233",
    address: "مخيم الوافدين - الحارة الغربية",
    description: "صيانة منزلية، تمديدات كهربائية وطاقة شمسية وصيانة أدوات كهربائية.",
    cham_cash_code: "CHAM-1188",
    cham_cash_link: "https://chamcash.sy/pay/alwafa-1188",
    cham_cash_number: "551930",
    cham_cash_name: "مركز الوفاء للصيانة",
    status: "approved",
  },
  {
    id: "6",
    name: "صيدلية ومستودع الشفاء",
    category: "خدمات طبية",
    phone: "0966445566",
    address: "مخيم الوافدين - الشارع العام بجانب العيادة",
    description: "كافة الأدوية والمستلزمات الطبية وحليب الأطفال وقياس الضغط والسكري مجاناً.",
    cham_cash_code: "CHAM-4467",
    cham_cash_link: "https://chamcash.sy/pay/alshifa-4467",
    cham_cash_number: "440182",
    cham_cash_name: "صيدلية ومستودع الشفاء",
    status: "approved",
  },
];

const initialProducts: Product[] = [
  {
    id: 1,
    shop_id: "1",
    name: "وجبة شاورما دجاج عربي سوبر",
    price: 18000,
    image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&auto=format&fit=crop&q=60",
    description: "شاورما دجاج مع بطاطا ومخلل وصوص ثومية وخبز صاج مقرمش",
  },
  {
    id: 2,
    shop_id: "1",
    name: "سندويش كباب بلدي مشوي",
    price: 22000,
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60",
    description: "لحم بلدي متبل على الفحم مع خضار وبصل وبيواز",
  },
  {
    id: 3,
    shop_id: "2",
    name: "سلة التموين والعائلة",
    price: 52000,
    image_url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60",
    description: "زيت نباتي نقي، أرز، سكر، شاي فاخر ومعكرونة",
  },
  {
    id: 4,
    shop_id: "3",
    name: "ربطة خبز سياحي طازج",
    price: 5500,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60",
    description: "ربطة خبز ساخن طازج من الفرن مباشرة",
  },
  {
    id: 5,
    shop_id: "4",
    name: "بيجاما أطفال قطنية شتوية",
    price: 35000,
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60",
    description: "قطن 100% مريحة ودافئة متوفرة بعدة قياسات",
  },
];

const emptyForm = {
  name: "",
  category: "سوبر ماركت",
  phone: "",
  address: "",
  description: "",
  cham_cash_code: "",
  cham_cash_link: "",
  cham_cash_number: "",
  cham_cash_name: "",
};

function loadData<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [shops, setShops] = useState<Shop[]>(() => {
    const loaded = loadData<Shop[]>("karamalak-shops", initialShops);
    // Upgrade cached shops to include distinct cham_cash_code & cham_cash_link
    return loaded.map((s) => {
      const initial = initialShops.find((init) => init.id === s.id);
      const chamCode = s.cham_cash_code || initial?.cham_cash_code || "";
      const chamLink = s.cham_cash_link || initial?.cham_cash_link || "";
      const chamNum =
        s.cham_cash_number && s.cham_cash_number !== s.phone
          ? s.cham_cash_number
          : initial?.cham_cash_number || "";
      return {
        ...s,
        cham_cash_code: chamCode,
        cham_cash_link: chamLink,
        cham_cash_number: chamNum,
        cham_cash_name: s.cham_cash_name || initial?.cham_cash_name || s.name,
      };
    });
  });
  const [products, setProducts] = useState<Product[]>(() =>
    loadData("karamalak-products", initialProducts)
  );
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [requests, setRequests] = useState<Shop[]>(() =>
    loadData("karamalak-requests", [])
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    loadData("karamalak-cart", [])
  );
  const [showCartModal, setShowCartModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  // Cham Cash & Checkout State
  const [paymentMethod, setPaymentMethod] = useState<"cham_cash" | "cash">("cham_cash");
  const [chamCashTxId, setChamCashTxId] = useState("");
  const [chamCashSenderName, setChamCashSenderName] = useState("");
  const [copiedChamCash, setCopiedChamCash] = useState(false);
  const [orderDeliveryAddress, setOrderDeliveryAddress] = useState("");
  const [orderCustomerPhone, setOrderCustomerPhone] = useState("");

  const [page, setPage] = useState("home");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [form, setForm] = useState(emptyForm);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestPassword, setRequestPassword] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Check customer session
  useEffect(() => {
    let active = true;

    async function checkCustomerSession() {
      if (!isSupabaseConfigured()) {
        const localUser = localStorage.getItem("karmalak-customer-user");
        if (!localUser && page === "customer-auth") {
          // keep
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error || !data.session) {
          // If no session, allow home page or auth page
        } else {
          // User is logged in
        }
      } catch (err) {
        console.warn("Supabase session check skipped:", err);
      }
    }

    checkCustomerSession();

    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        if (session) {
          setPage((current) => (current === "customer-auth" ? "home" : current));
        }
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  // Check admin session
  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!isSupabaseConfigured()) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          if (active) setIsAdminLoggedIn(false);
          return;
        }

        const { data, error } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (active) {
          setIsAdminLoggedIn(!error && !!data);
        }
      } catch (err) {
        console.warn("Admin check skipped:", err);
      }
    }

    checkAdmin();
  }, []);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem("karamalak-shops", JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem("karamalak-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("karamalak-requests", JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem("karamalak-cart", JSON.stringify(cart));
  }, [cart]);

  // Load shops from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    async function loadShopsFromSupabase() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .eq("is_active", true);

        if (error) {
          console.error("خطأ في تحميل المحلات من Supabase:", error.message);
          return;
        }

        if (data && data.length > 0) {
          const formattedShops: Shop[] = data.map((shop) => ({
            id: String(shop.id),
            name: shop.name ?? "",
            category: shop.category ?? "أخرى",
            phone: shop.phone ?? "",
            address: shop.address ?? "",
            description: shop.description ?? "",
            cham_cash_number: shop.cham_cash_number ?? shop.phone ?? "",
            cham_cash_name: shop.cham_cash_name ?? shop.name ?? "",
            status: "approved",
          }));

          setShops(formattedShops);
        }
      } catch (err) {
        console.warn("Could not load shops from Supabase:", err);
      }
    }

    loadShopsFromSupabase();
  }, []);

  // Load products from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, shop_id, name, image_url, price, description");

        if (error) {
          console.error("خطأ في تحميل المنتجات:", error.message);
          return;
        }

        if (data && data.length > 0) {
          setProducts(data as Product[]);
        }
      } catch (err) {
        console.warn("Could not load products from Supabase:", err);
      }
    }

    loadProducts();
  }, []);

  // Load requests if admin
  useEffect(() => {
    if (!isAdminLoggedIn || !isSupabaseConfigured()) return;

    async function loadRequestsFromSupabase() {
      try {
        const { data, error } = await supabase
          .from("shop_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("خطأ في تحميل طلبات الانضمام:", error.message);
          return;
        }

        if (data) {
          const formattedRequests: Shop[] = data.map((request) => ({
            id: String(request.id),
            name: request.name ?? "",
            category: request.category ?? "أخرى",
            phone: request.phone ?? "",
            address: request.address ?? "",
            description: request.description ?? "",
            status: request.status as Shop["status"],
          }));

          setRequests(formattedRequests);
        }
      } catch (err) {
        console.warn("Could not load requests from Supabase:", err);
      }
    }

    loadRequestsFromSupabase();
  }, [isAdminLoggedIn]);

  const approvedShops = shops.filter((shop) => shop.status === "approved");

  const visibleShops = approvedShops.filter((shop) => {
    const term = search.trim().toLowerCase();

    return (
      (category === "الكل" || shop.category === category) &&
      (!term ||
        shop.name.toLowerCase().includes(term) ||
        shop.category.toLowerCase().includes(term) ||
        shop.address.toLowerCase().includes(term) ||
        shop.description.toLowerCase().includes(term))
    );
  });

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editShop(shop: Shop) {
    setEditing(shop.id);
    setForm({
      name: shop.name,
      category: shop.category,
      phone: shop.phone,
      address: shop.address,
      description: shop.description,
      cham_cash_code: shop.cham_cash_code || "",
      cham_cash_link: shop.cham_cash_link || "",
      cham_cash_number:
        shop.cham_cash_number && shop.cham_cash_number !== shop.phone
          ? shop.cham_cash_number
          : "",
      cham_cash_name: shop.cham_cash_name || "",
    });
  }

  // Cart operations
  function addToCart(product: Product, shop: Shop) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, shop }];
    });
    setMessage(`تمت إضافة "${product.name}" إلى سلة التسوق!`);
  }

  function updateCartQuantity(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function clearCart() {
    setCart([]);
  }

  function copyChamCashNumber(num: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedChamCash(true);
      setTimeout(() => setCopiedChamCash(false), 2500);
    }
  }

  // Send Order via WhatsApp with Cham Cash or Cash details
  function handleConfirmOrder() {
    if (cart.length === 0) return;
    const liveShop =
      shops.find(
        (s) =>
          String(s.id) ===
          String(cart[0]?.product?.shop_id || cart[0]?.shop?.id)
      ) || cart[0].shop;
    const cleanPhone = liveShop.phone.replace(/[^0-9]/g, "");

    const itemsSummary = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.product.name} (عدد: ${item.quantity}) - ${Number(
            item.product.price * item.quantity
          ).toLocaleString("ar")} ل.س`
      )
      .join("\n");

    const total = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const userProfileStr = localStorage.getItem("karmalak-customer-user");
    const userMeta = userProfileStr ? JSON.parse(userProfileStr).user_metadata : {};
    const customerName = userMeta?.full_name || "زبون كرمالك";
    const address = orderDeliveryAddress.trim() || userMeta?.address || "مخيم الوافدين";
    const phone = orderCustomerPhone.trim() || userMeta?.phone || "";

    if (paymentMethod === "cham_cash" && !chamCashTxId.trim()) {
      alert("يرجى إدخال رقم إشعار عملية التحويل في شام كاش (Transaction ID) لتأكيد الدفع.");
      return;
    }

    let paymentInfoText = "";
    if (paymentMethod === "cham_cash") {
      paymentInfoText =
        `💳 *طريقة الدفع: محفظة شام كاش (Cham Cash)*\n` +
        (liveShop.cham_cash_code
          ? `🏷️ *كود متجر شام كاش:* ${liveShop.cham_cash_code}\n`
          : "") +
        `🔢 *رقم إشعار عملية التحويل (Transaction ID):* ${chamCashTxId.trim()}\n` +
        (chamCashSenderName.trim()
          ? `👤 *الحساب المحوّل منه:* ${chamCashSenderName.trim()}\n`
          : "") +
        `✅ تم تحويل المبلغ (${Number(total).toLocaleString("ar")} ل.س) لحسابكم في شام كاش.`;
    } else {
      paymentInfoText = `💵 *طريقة الدفع:* نقداً عند الاستلام (كاش عند التوصيل)`;
    }

    const msgText = encodeURIComponent(
      `مرحباً ${liveShop.name}، طلب شراء جديد من تطبيق كرمالك (مخيم الوافدين):\n\n` +
        `📦 *المنتجات المطلوبة:*\n${itemsSummary}\n\n` +
        `💰 *المجموع:* ${Number(total).toLocaleString("ar")} ل.س\n\n` +
        `${paymentInfoText}\n\n` +
        `📍 *عنوان التوصيل:* ${address}\n` +
        `👤 *اسم المشتري:* ${customerName}\n` +
        (phone ? `📞 *رقم الهاتف:* ${phone}\n` : "") +
        `\nيرجى تأكيد استلام الطلب والبدء بالتجهيز، شكراً!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${msgText}`, "_blank");
    setMessage(
      paymentMethod === "cham_cash"
        ? "تم تأكيد الدفع عبر شام كاش وإرسال الطلب بنجاح إلى التاجر!"
        : "تم إرسال طلبك بنجاح إلى صاحب المتجر!"
    );
    clearCart();
    setChamCashTxId("");
    setChamCashSenderName("");
    setShowCartModal(false);
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    const email = requestEmail.trim().toLowerCase();

    if (!email || !requestPassword) {
      setMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: requestPassword,
          options: {
            data: { shop_name: form.name },
          },
        });

        if (authError) {
          setMessage(`تعذّر إنشاء الحساب: ${authError.message}`);
          return;
        }

        const userId = authData.user ? authData.user.id : "user-" + Date.now();

        const { error: requestError } = await supabase.from("shop_requests").insert({
          name: form.name,
          category: form.category,
          phone: form.phone,
          address: form.address,
          description: form.description,
          cham_cash_code: form.cham_cash_code,
          cham_cash_link: form.cham_cash_link,
          cham_cash_number: form.cham_cash_number,
          cham_cash_name: form.cham_cash_name,
          email,
          user_id: userId,
          status: "pending",
        });

        if (requestError) {
          setMessage(`تم إنشاء الحساب، لكن تعذّر حفظ الطلب: ${requestError.message}`);
          return;
        }
      } catch (err: unknown) {
        console.error("Supabase request error:", err);
      }
    }

    // Local state fallback
    const newReq: Shop = {
      id: "req-" + Date.now(),
      name: form.name,
      category: form.category,
      phone: form.phone,
      address: form.address,
      description: form.description,
      cham_cash_code: form.cham_cash_code.trim(),
      cham_cash_link: form.cham_cash_link.trim(),
      cham_cash_number: form.cham_cash_number.trim(),
      cham_cash_name: form.cham_cash_name.trim(),
      status: "pending",
    };

    setRequests((prev) => [newReq, ...prev]);
    setForm(emptyForm);
    setRequestEmail("");
    setRequestPassword("");
    setShowRequestForm(false);
    setMessage("تم إرسال الطلب بنجاح، وهو بانتظار مراجعة واعتماد الإدارة.");
    setPage("home");
  }

  async function approveRequest(id: string) {
    setMessage("جارٍ التحقق من الطلب واعتماده...");
    const request = requests.find((item) => item.id === id);

    if (!request) {
      setMessage("تعذّر العثور على الطلب في قائمة الإدارة.");
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const requestId = Number(id);
        if (Number.isSafeInteger(requestId) && requestId > 0) {
          await supabase.rpc("approve_shop_request", { p_request_id: requestId });
        } else {
          // Direct update in shops and shop_requests tables
          await supabase.from("shops").insert({
            name: request.name,
            category: request.category,
            phone: request.phone,
            address: request.address,
            description: request.description,
            cham_cash_code: request.cham_cash_code,
            cham_cash_link: request.cham_cash_link,
            cham_cash_number: request.cham_cash_number,
            cham_cash_name: request.cham_cash_name,
            is_active: true,
          });
          await supabase
            .from("shop_requests")
            .update({ status: "approved" })
            .eq("id", id);
        }
      } catch (err) {
        console.warn("Supabase approve fallback:", err);
      }
    }

    const formattedShop: Shop = {
      id: "shop-" + Date.now(),
      name: request.name,
      category: request.category,
      phone: request.phone,
      address: request.address,
      description: request.description,
      cham_cash_code: request.cham_cash_code,
      cham_cash_link: request.cham_cash_link,
      cham_cash_number: request.cham_cash_number,
      cham_cash_name: request.cham_cash_name,
      status: "approved",
    };

    setShops((current) => [
      formattedShop,
      ...current.filter((shop) => shop.id !== formattedShop.id),
    ]);

    setRequests((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );

    setMessage(`تمت الموافقة ونشر محل "${request.name}" بنجاح ضمن المحلات المعتمدة.`);
  }

  async function rejectRequest(id: string) {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("shop_requests")
          .update({ status: "rejected" })
          .eq("id", id);
      } catch (err) {
        console.warn("Reject in Supabase failed:", err);
      }
    }

    setRequests((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "rejected" } : item))
    );

    setMessage("تم رفض طلب الانضمام.");
  }

  async function saveShop(e: React.FormEvent) {
    e.preventDefault();

    if (editing) {
      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from("shops")
            .update({
              name: form.name,
              category: form.category,
              phone: form.phone,
              address: form.address,
              description: form.description,
              cham_cash_code: form.cham_cash_code.trim(),
              cham_cash_link: form.cham_cash_link.trim(),
              cham_cash_number: form.cham_cash_number.trim(),
              cham_cash_name: form.cham_cash_name.trim(),
            })
            .eq("id", editing);
        } catch (err) {
          console.warn("Save shop error in Supabase:", err);
        }
      }

      setShops((current) =>
        current.map((shop) =>
          shop.id === editing
            ? {
                ...shop,
                name: form.name,
                category: form.category,
                phone: form.phone,
                address: form.address,
                description: form.description,
                cham_cash_code: form.cham_cash_code.trim(),
                cham_cash_link: form.cham_cash_link.trim(),
                cham_cash_number: form.cham_cash_number.trim(),
                cham_cash_name: form.cham_cash_name.trim() || form.name,
              }
            : shop
        )
      );
      setMessage("تم حفظ تعديلات المحل بنجاح.");
    } else {
      const newShop: Shop = {
        id: "shop-" + Date.now(),
        name: form.name,
        category: form.category,
        phone: form.phone,
        address: form.address,
        description: form.description,
        cham_cash_code: form.cham_cash_code.trim(),
        cham_cash_link: form.cham_cash_link.trim(),
        cham_cash_number: form.cham_cash_number.trim(),
        cham_cash_name: form.cham_cash_name.trim() || form.name,
        status: "approved",
      };

      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from("shops")
            .insert({
              name: form.name,
              category: form.category,
              phone: form.phone,
              address: form.address,
              description: form.description,
              cham_cash_code: form.cham_cash_code.trim(),
              cham_cash_link: form.cham_cash_link.trim(),
              cham_cash_number: form.cham_cash_number.trim(),
              cham_cash_name: form.cham_cash_name.trim() || form.name,
              is_active: true,
            })
            .select()
            .single();

          if (data) {
            newShop.id = String(data.id);
          }
        } catch (err) {
          console.warn("Insert shop error in Supabase:", err);
        }
      }

      setShops((current) => [newShop, ...current]);
      setMessage("تمت إضافة المحل الجديد ونشره بنجاح.");
    }

    setForm(emptyForm);
    setEditing(null);
  }

  async function deleteShop(id: string) {
    if (!window.confirm("هل تريد حذف هذا المحل نهائياً؟")) return;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("shops").delete().eq("id", id);
      } catch (err) {
        console.warn("Delete in Supabase failed:", err);
      }
    }

    setShops((current) => current.filter((shop) => shop.id !== id));
    setMessage("تم حذف المحل بنجاح.");
  }

  async function handleCustomerLogout() {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("SignOut failed:", err);
      }
    }
    localStorage.removeItem("karmalak-customer-user");
    setPage("customer-auth");
    setMessage("تم تسجيل الخروج.");
    setSelectedShop(null);
  }

  function openAdmin() {
    setPage("admin");
    if (!isAdminLoggedIn) {
      setMessage("يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.");
    } else {
      setMessage("");
    }
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app" dir="rtl">
      {/* Top Bar */}
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setPage("home");
            setSelectedShop(null);
          }}
        >
          <img
            src="/src/assets/images/karmalak_app_logo_1792756141616.jpg"
            alt="شعار كرمالك"
            className="brand-logo"
            referrerPolicy="no-referrer"
          />
          <h1>
            <span className="karmalak-title">كرمالك</span>
          </h1>
        </button>

        <div className="flex items-center gap-2">
          {/* Mobile Test Live Button */}
          <button
            type="button"
            onClick={() => setShowMobileModal(true)}
            title="تجربة التطبيق على الموبايل عبر QR Code أو الرابط"
            className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition shadow-2xs"
          >
            <span>📱</span>
            <span>تجربة الموبايل</span>
          </button>

          {/* Supabase status/config button */}
          <button
            type="button"
            onClick={() => setShowSupabaseModal(true)}
            title="إعدادات وحالة اتصال Supabase"
            className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
          >
            <span>{isSupabaseConfigured() ? "🟢" : "⚡"}</span>
            <span className="hidden sm:inline">
              {isSupabaseConfigured() ? "Supabase متصل" : "ربط Supabase"}
            </span>
          </button>

          {/* Cart Floating Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCartModal(true)}
              className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
            >
              <span>🛒</span>
              <span>{totalCartCount}</span>
            </button>
          )}

          <div className="location-tag">📍 مخيم الوافدين</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {page === "customer-auth" && (
          <CustomerAuth onSuccess={() => setPage("home")} />
        )}

        {page === "profile" && <CustomerProfile />}

        {page !== "customer-auth" && message && (
          <div className="notice-bar">
            <span>{message}</span>
            <button onClick={() => setMessage("")}>✕</button>
          </div>
        )}

        {/* HOME PAGE */}
        {page === "home" && (
          <>
            <section className="hero">
              <span className="hero-badge">دليلك وسوقك المحلي في مخيم الوافدين</span>
              <h1>كل خدمات ومنتجات منطقتك، بمكان واحد</h1>
              <p>
                اكتشف المحلات والخدمات المعتمدة، تصفح المنتجات والأسعار، وتواصل مع
                التجار مباشرة.
              </p>
              <div className="search-box">
                <span>🔎</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن محل، خدمة، أو عنوان داخل المخيم..."
                />
              </div>
            </section>

            {/* Category Filter */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>تصفّح الأقسام</h2>
                  <p>اختر الخدمة أو المنتجات التي تبحث عنها</p>
                </div>
              </div>

              <div className="category-list">
                {["الكل", ...categories].map((item) => (
                  <button
                    key={item}
                    className={
                      category === item ? "category-chip active" : "category-chip"
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* Approved Shops List */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>المحلات والخدمات المعتمدة</h2>
                  <p>{visibleShops.length} محل متاح في دليل مخيم الوافدين</p>
                </div>
              </div>

              {visibleShops.length ? (
                <div className="service-grid">
                  {visibleShops.map((shop) => {
                    const shopProds = products.filter(
                      (p) => String(p.shop_id) === String(shop.id)
                    );
                    const cleanPhone = shop.phone.replace(/[^0-9]/g, "");

                    return (
                      <article className="service-card" key={shop.id}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="shop-category">{shop.category}</span>
                          {shopProds.length > 0 && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {shopProds.length} منتجات
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="merchant-store-icon"
                          onClick={() => {
                            setSelectedShop(shop);
                            setPage("shop");
                            setMessage("");
                          }}
                          aria-label={`عرض منتجات ${shop.name}`}
                        >
                          <span className="store-symbol">🏪</span>
                          <span className="store-name">{shop.name}</span>
                        </button>

                        <p>{shop.description}</p>
                        <div className="shop-detail">📍 {shop.address}</div>

                        <div className="flex flex-wrap gap-2 mt-auto pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShop(shop);
                              setPage("shop");
                              setMessage("");
                            }}
                            className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            عرض المنتجات والطلب
                          </button>

                          {shop.phone && (
                            <>
                              <a
                                className="contact-button text-xs py-2 px-3"
                                href={`tel:${shop.phone}`}
                                title="اتصال هاتفي"
                              >
                                ☎
                              </a>
                              <a
                                className="bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold p-2 transition flex items-center justify-center"
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                title="مراسلة عبر واتساب"
                              >
                                💬
                              </a>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🏪</div>
                  <h3>لا توجد محلات معتمدة مطابقة لبحثك</h3>
                  <p>يمكنك اقتراح محل جديد ليتم مراجعته واعتماده ونشره في الدليل.</p>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setShowRequestForm(true);
                      setPage("request");
                    }}
                  >
                    طلب انضمام محل جديد
                  </button>
                </div>
              )}
            </section>

            {/* Join Banner */}
            <section className="join-banner">
              <div>
                <h2>عندك محل أو خدمة بمخيم الوافدين؟</h2>
                <p>
                  قدّم طلب انضمام مجاناً، وعرض منتجاتك وخدماتك لأهالي وسكان المخيم
                  بسهولة.
                </p>
              </div>
              <button
                className="join-button"
                onClick={() => {
                  setForm(emptyForm);
                  setPage("request");
                }}
              >
                قدّم طلبك الآن ←
              </button>
            </section>
          </>
        )}

        {/* SINGLE SHOP VIEW */}
        {page === "shop" && selectedShop && (
          <section className="section">
            <button
              type="button"
              className="back-button"
              onClick={() => {
                setPage("home");
                setSelectedShop(null);
              }}
            >
              ← العودة إلى قائمة المحلات
            </button>

            {/* Shop Header Details */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 text-right">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">
                  {selectedShop.category}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  📍 {selectedShop.address}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 mb-2">
                {selectedShop.name}
              </h1>
              <p className="text-sm text-slate-600 mb-4">{selectedShop.description}</p>

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                {selectedShop.phone && (
                  <>
                    <a
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                      href={`tel:${selectedShop.phone}`}
                    >
                      ☎ اتصال: {selectedShop.phone}
                    </a>
                    <a
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                      href={`https://wa.me/${selectedShop.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      💬 محادثة واتساب المحل
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-800">
                منتجات وقائمة {selectedShop.name}
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCartModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>🛒</span> فتح سلة الشراء ({totalCartCount})
                </button>
              )}
            </div>

            {products.filter(
              (product) => String(product.shop_id) === String(selectedShop.id)
            ).length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>لا توجد منتجات معروضة حالياً لهذا المحل</h3>
                <p>يمكنك التواصل مباشرة مع المحل هاتفياً أو عبر واتساب للطلب والاستفسار.</p>
                {selectedShop.phone && (
                  <a
                    className="primary-button inline-block mt-2"
                    href={`https://wa.me/${selectedShop.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💬 التواصل مع صاحب المحل
                  </a>
                )}
              </div>
            ) : (
              <div className="service-grid">
                {products
                  .filter(
                    (product) => String(product.shop_id) === String(selectedShop.id)
                  )
                  .map((product) => {
                    const cartItem = cart.find(
                      (item) => item.product.id === product.id
                    );

                    return (
                      <article className="service-card" key={product.id}>
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-44 object-cover rounded-xl mb-3 border border-slate-100"
                          />
                        )}

                        <h3 className="font-black text-slate-800 text-base mb-1">
                          {product.name}
                        </h3>

                        <p className="text-emerald-700 font-black text-base my-1">
                          السعر: {Number(product.price).toLocaleString("ar")} ل.س
                        </p>

                        {product.description && (
                          <p className="text-xs text-slate-500 mb-3">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
                          {cartItem ? (
                            <div className="flex items-center justify-between w-full bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                              <button
                                type="button"
                                onClick={() => addToCart(product, selectedShop)}
                                className="w-8 h-8 rounded-md bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700"
                              >
                                +
                              </button>
                              <span className="font-black text-emerald-900 text-sm">
                                {cartItem.quantity} في السلة
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(product.id, -1)}
                                className="w-8 h-8 rounded-md bg-white text-slate-700 border border-slate-300 font-black text-sm hover:bg-slate-100"
                              >
                                -
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(product, selectedShop)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span>🛒</span> إضافة إلى السلة
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* MERCHANT DASHBOARD */}
        {page === "merchant" && (
          <MerchantPanel
            onBack={() => setPage("home")}
            onOpenRequestPage={() => setPage("request")}
            onShopUpdated={(updatedShop) => {
              setShops((prev) =>
                prev.map((s) => (s.id === updatedShop.id ? { ...s, ...updatedShop } : s))
              );
              setCart((prev) =>
                prev.map((item) =>
                  String(item.shop.id) === String(updatedShop.id)
                    ? { ...item, shop: { ...item.shop, ...updatedShop } }
                    : item
                )
              );
            }}
          />
        )}

        {/* REQUEST SHOP JOIN FORM */}
        {page === "request" && (
          <section className="form-panel">
            <button className="back-button" onClick={() => setPage("home")}>
              ← العودة إلى الرئيسية
            </button>
            <h1>طلب انضمام محل جديد</h1>
            <p className="muted">
              املأ المعلومات التالية لمحلك في مخيم الوافدين. بعد مراجعة الإدارة سيتم
              نشر المحل ومنحك صلاحية إدارة منتجاته.
            </p>
            <ShopForm
              form={form}
              updateForm={updateForm}
              onSubmit={submitRequest}
              submitLabel="إرسال طلب الانضمام للتدقيق"
              showAccountFields={true}
              requestEmail={requestEmail}
              requestPassword={requestPassword}
              onRequestEmailChange={setRequestEmail}
              onRequestPasswordChange={setRequestPassword}
            />
          </section>
        )}

        {/* ADMIN LOGIN */}
        {page === "admin" && !isAdminLoggedIn && (
          <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
        )}

        {/* ADMIN DASHBOARD */}
        {page === "admin" && isAdminLoggedIn && (
          <section className="admin-panel">
            <div className="admin-heading">
              <div>
                <span className="admin-label">لوحة الإدارة المركزية</span>
                <h1>إدارة كرمالك - مخيم الوافدين</h1>
                <p className="muted">إدارة المحلات، طلبات الانضمام، والبيانات.</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="secondary-button"
                  onClick={() => setShowSupabaseModal(true)}
                >
                  ⚡ قاعدة البيانات Supabase
                </button>
                <button className="secondary-button" onClick={() => setPage("home")}>
                  عرض الموقع للزبائن
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid">
              <div className="stat-card">
                <span>المحلات المعتمدة</span>
                <strong>{approvedShops.length}</strong>
              </div>
              <div className="stat-card">
                <span>طلبات قيد المراجعة</span>
                <strong className="text-amber-600">
                  {requests.filter((r) => r.status === "pending").length}
                </strong>
              </div>
              <div className="stat-card">
                <span>الطلبات المرفوضة</span>
                <strong className="text-red-600">
                  {requests.filter((r) => r.status === "rejected").length}
                </strong>
              </div>
              <div className="stat-card">
                <span>إجمالي المنتجات</span>
                <strong>{products.length}</strong>
              </div>
            </div>

            {/* Direct Add / Edit Shop Form */}
            <div className="admin-section">
              <h2>{editing ? "تعديل بيانات محل" : "إضافة محل مباشرة"}</h2>
              <p className="muted">
                الإضافة المباشرة مخصصة للمشرفين لنشر المحلات بدون انتظار موافقة.
              </p>
              <ShopForm
                form={form}
                updateForm={updateForm}
                onSubmit={saveShop}
                submitLabel={editing ? "حفظ التعديلات" : "إضافة المحل فوراً"}
              />
              {editing && (
                <button
                  className="secondary-button cancel-edit mt-3"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {/* Pending Requests Review */}
            <div className="admin-section">
              <h2>طلبات الانضمام الجديدة</h2>
              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <p className="muted">لا توجد طلبات جديدة بانتظار المراجعة.</p>
              ) : (
                requests
                  .filter((r) => r.status === "pending")
                  .map((shop) => (
                    <div className="admin-shop" key={shop.id}>
                      <div>
                        <h3>{shop.name}</h3>
                        <p className="text-xs text-slate-600 my-1">
                          {shop.category} · {shop.address}
                        </p>
                        <p className="text-xs text-slate-500">☎ {shop.phone}</p>
                        <p className="text-xs text-slate-700 mt-1">{shop.description}</p>
                      </div>
                      <div className="admin-actions">
                        <button
                          className="approve-button"
                          onClick={() => approveRequest(shop.id)}
                        >
                          موافقة ونشر المحل
                        </button>
                        <button
                          className="reject-button"
                          onClick={() => rejectRequest(shop.id)}
                        >
                          رفض الطلب
                        </button>
                      </div>
                    </div>
                  ))
              )}

              {requests.some((r) => r.status === "rejected") && (
                <details className="rejected-list">
                  <summary className="text-xs font-bold text-slate-500 cursor-pointer">
                    عرض الطلبات المرفوضة ({requests.filter((r) => r.status === "rejected").length})
                  </summary>
                  <div className="space-y-2 mt-2">
                    {requests
                      .filter((r) => r.status === "rejected")
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-1"
                        >
                          <span>
                            {r.name} — {r.category}
                          </span>
                          <button
                            className="text-button"
                            onClick={() =>
                              setRequests((current) =>
                                current.filter((item) => item.id !== r.id)
                              )
                            }
                          >
                            حذف السجل
                          </button>
                        </div>
                      ))}
                  </div>
                </details>
              )}
            </div>

            {/* Published Shops Directory */}
            <div className="admin-section">
              <h2>المحلات المنشورة في الدليل</h2>
              {approvedShops.length === 0 ? (
                <p className="muted">لم تتم إضافة أي محلات معتمدة بعد.</p>
              ) : (
                <div className="space-y-3">
                  {approvedShops.map((shop) => (
                    <div className="admin-shop" key={shop.id}>
                      <div>
                        <h3>{shop.name}</h3>
                        <p className="text-xs text-slate-600 my-1">
                          {shop.category} · 📍 {shop.address}
                        </p>
                        <span className="approved-label">معتمد ومنشور</span>
                      </div>
                      <div className="admin-actions">
                        <button
                          className="secondary-button"
                          onClick={() => editShop(shop)}
                        >
                          تعديل
                        </button>
                        <button
                          className="reject-button"
                          onClick={() => deleteShop(shop.id)}
                        >
                          حذف نهائي
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* SHOPPING CART MODAL */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <span>🛒</span> سلة الطلبات ({totalCartCount})
              </h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-sm">
                  سلة التسوق فارغة حالياً
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.shop.name} ·{" "}
                        {Number(item.product.price).toLocaleString("ar")} ل.س
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, -1)}
                        className="w-7 h-7 rounded bg-white border border-slate-300 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item.product, item.shop)}
                        className="w-7 h-7 rounded bg-emerald-600 text-white font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-100 mt-3 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                {/* Total */}
                <div className="flex justify-between items-center text-sm font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span>المجموع الإجمالي:</span>
                  <span className="text-emerald-700 text-base font-extrabold">
                    {Number(
                      cart.reduce(
                        (sum, item) => sum + item.product.price * item.quantity,
                        0
                      )
                    ).toLocaleString("ar")}{" "}
                    ل.س
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اختر طريقة الدفع عند الشراء:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cham_cash")}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                        paymentMethod === "cham_cash"
                          ? "border-cyan-500 bg-cyan-50/80 text-cyan-950 font-black shadow-xs ring-2 ring-cyan-200"
                          : "border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-50"
                      }`}
                    >
                      <img
                        src="/src/assets/images/cham_cash_badge_1792756521052.jpg"
                        alt="شام كاش"
                        className="w-7 h-7 rounded-md object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="leading-tight">
                        <div className="text-xs font-bold">شام كاش (Cham Cash)</div>
                        <div className="text-[10px] text-cyan-700">تحويل إلكتروني فوري</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                        paymentMethod === "cash"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-200"
                          : "border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl">💵</span>
                      <div className="leading-tight">
                        <div className="text-xs font-bold">الدفع عند الاستلام</div>
                        <div className="text-[10px] text-emerald-700">كاش عند التوصيل</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Cham Cash Instructions & Account Box */}
                {paymentMethod === "cham_cash" && (
                  <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50/60 border border-cyan-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img
                          src="/src/assets/images/cham_cash_badge_1792756521052.jpg"
                          alt="شام كاش"
                          className="w-5 h-5 rounded-md"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-extrabold text-cyan-900">
                          بيانات محفظة التاجر (Cham Cash)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full">
                        متاح الآن
                      </span>
                    </div>

                    {/* Account Display with Copy Button */}
                    <div className="bg-white p-2.5 rounded-lg border border-cyan-300 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          رقم حساب / محفظة المحل ({cart[0]?.shop.cham_cash_name || cart[0]?.shop.name}):
                        </div>
                        <div className="text-sm font-black font-mono text-cyan-900 tracking-wider">
                          {cart[0]?.shop.cham_cash_number || cart[0]?.shop.phone}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyChamCashNumber(
                            cart[0]?.shop.cham_cash_number || cart[0]?.shop.phone
                          )
                        }
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-[11px] font-bold transition flex items-center gap-1"
                      >
                        {copiedChamCash ? "تم النسخ! ✓" : "نسخ الرقم 📋"}
                      </button>
                    </div>

                    <div className="text-[11px] text-cyan-950 font-medium leading-relaxed space-y-0.5">
                      <p>1. افتح تطبيق شام كاش أو اطلب رمز التحويل السريع.</p>
                      <p>
                        2. حوّل مبلغ{" "}
                        <strong className="text-cyan-800 underline">
                          {Number(
                            cart.reduce(
                              (sum, item) => sum + item.product.price * item.quantity,
                              0
                            )
                          ).toLocaleString("ar")}{" "}
                          ل.س
                        </strong>{" "}
                        للمحفظة أعلاه.
                      </p>
                      <p>3. الصق رقم إشعار العملية (Transaction ID) بالأسفل لتأكيد الدفع فوراً.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        رقم إشعار عملية التحويل في شام كاش * (Transaction Reference ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={chamCashTxId}
                        onChange={(e) => setChamCashTxId(e.target.value)}
                        placeholder="مثال: 98521034 أو كود العملية"
                        className="w-full px-3 py-2 bg-white border border-cyan-300 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        اسم صاحب الحساب المحوّل منه (اختياري)
                      </label>
                      <input
                        type="text"
                        value={chamCashSenderName}
                        onChange={(e) => setChamCashSenderName(e.target.value)}
                        placeholder="الاسم كما هو مسجل في حسابك بشام كاش"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Delivery Address Review */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      📍 عنوان التوصيل داخل مخيم الوافدين
                    </label>
                    <input
                      type="text"
                      value={orderDeliveryAddress}
                      onChange={(e) => setOrderDeliveryAddress(e.target.value)}
                      placeholder="الحارة / الشارع / أقرب دكان أو معلم"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      📞 رقم هاتف المستلم (للاتصال عند الوصول)
                    </label>
                    <input
                      type="tel"
                      value={orderCustomerPhone}
                      onChange={(e) => setOrderCustomerPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className={`w-full py-3 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition ${
                    paymentMethod === "cham_cash"
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {paymentMethod === "cham_cash" ? (
                    <>
                      <img
                        src="/src/assets/images/cham_cash_badge_1792756521052.jpg"
                        alt="شام كاش"
                        className="w-4 h-4 rounded-sm object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span>تأكيد الدفع عبر شام كاش وإرسال الطلب للمحل 🚀</span>
                    </>
                  ) : (
                    <>
                      <span>💬</span>
                      <span>إرسال الطلب (الدفع كاش عند الاستلام)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full text-center text-xs font-semibold text-slate-400 hover:text-red-600 pt-1"
                >
                  إفراغ السلة
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supabase Settings Modal */}
      <SupabaseSettingsModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />

      {/* Mobile Live Test & QR Code Modal */}
      <MobileTestModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />

      {/* Bottom Navigation */}
      {page !== "customer-auth" && (
        <footer className="bottom-nav">
          <button
            type="button"
            className={page === "home" ? "nav-item selected" : "nav-item"}
            onClick={() => {
              setPage("home");
              setSelectedShop(null);
            }}
          >
            <span>🏠</span> الرئيسية
          </button>

          <button
            type="button"
            className={page === "request" ? "nav-item selected" : "nav-item"}
            onClick={() => {
              setForm(emptyForm);
              setPage("request");
            }}
          >
            <span>➕</span> انضم إلينا
          </button>

          <button
            type="button"
            className={page === "merchant" ? "nav-item selected" : "nav-item"}
            onClick={() => {
              setMessage("");
              setPage("merchant");
            }}
          >
            <span>🛍️</span> حساب التاجر
          </button>

          <button
            type="button"
            className={page === "profile" ? "nav-item selected" : "nav-item"}
            onClick={() => {
              setMessage("");
              setPage("profile");
            }}
          >
            <span>👤</span> الملف الشخصي
          </button>

          <button
            type="button"
            className={page === "admin" ? "nav-item selected" : "nav-item"}
            onClick={openAdmin}
          >
            <span>⚙️</span> الإدارة
          </button>

          <button
            type="button"
            className="nav-item text-red-600 hover:text-red-700"
            onClick={handleCustomerLogout}
          >
            <span>🚪</span> خروج
          </button>
        </footer>
      )}
    </div>
  );
}

type ShopFormProps = {
  form: typeof emptyForm;
  updateForm: (field: keyof typeof emptyForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  showAccountFields?: boolean;
  requestEmail?: string;
  requestPassword?: string;
  onRequestEmailChange?: (value: string) => void;
  onRequestPasswordChange?: (value: string) => void;
};

function ShopForm({
  form,
  updateForm,
  onSubmit,
  submitLabel,
  showAccountFields = false,
  requestEmail = "",
  requestPassword = "",
  onRequestEmailChange,
  onRequestPasswordChange,
}: ShopFormProps) {
  return (
    <form className="shop-form" onSubmit={onSubmit}>
      <label>
        اسم المحل *
        <input
          required
          maxLength={100}
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
          placeholder="مثال: سوبر ماركت الهدى / مطعم البركة..."
        />
      </label>

      <label>
        القسم *
        <select
          value={form.category}
          onChange={(e) => updateForm("category", e.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        رقم الهاتف والتواصل (واتساب) *
        <input
          type="tel"
          required
          maxLength={30}
          value={form.phone}
          onChange={(e) => updateForm("phone", e.target.value)}
          placeholder="09xxxxxxxx"
        />
      </label>

      <label>
        العنوان داخل مخيم الوافدين *
        <input
          required
          maxLength={200}
          value={form.address}
          onChange={(e) => updateForm("address", e.target.value)}
          placeholder="الحارة / الشارع / أقرب معلم معروف"
        />
      </label>

      <label>
        وصف الخدمات والمنتجات *
        <textarea
          required
          maxLength={1000}
          rows={3}
          value={form.description}
          onChange={(e) => updateForm("description", e.target.value)}
          placeholder="ما الخدمات والسلع التي يقدمها محلك لأهالي المخيم؟"
        />
      </label>

      <label>
        رقم محفظة شام كاش (Cham Cash) للدفع الإلكتروني
        <input
          type="text"
          maxLength={40}
          value={form.cham_cash_number || ""}
          onChange={(e) => updateForm("cham_cash_number", e.target.value)}
          placeholder="09xxxxxxxx أو رقم المحفظة لاستقبال الدفعات (اختياري)"
        />
      </label>

      {showAccountFields && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <p className="text-xs font-bold text-emerald-800">
            بيانات حساب التاجر لتسجيل الدخول وإدارة المحل:
          </p>
          <label>
            البريد الإلكتروني للحساب *
            <input
              type="email"
              required
              autoComplete="email"
              value={requestEmail}
              onChange={(e) => onRequestEmailChange?.(e.target.value)}
              placeholder="merchant@example.com"
            />
          </label>

          <label>
            كلمة المرور للحساب *
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={requestPassword}
              onChange={(e) => onRequestPasswordChange?.(e.target.value)}
              placeholder="ستة أحرف على الأقل"
            />
          </label>
        </div>
      )}

      <button className="primary-button mt-2" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
