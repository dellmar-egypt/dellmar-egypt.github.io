/* ============================================================
   ديلمار ايجيبت — منطق المتجر (جافاسكربت خالص بدون مكتبات)
   التنقل عبر الهاش (#/) حتى يعمل المتجر على أي استضافة ثابتة
   ============================================================ */

(function () {
  "use strict";

  var PRODUCTS = window.DELLMAR.products;
  var CATEGORIES = window.DELLMAR.categories;
  var CONFIG = window.DELLMAR_CONFIG;
  var app = document.getElementById("app");

  /* ---------- تبديل الثيم من رابط ?theme= (للمعاينة فقط) ---------- */
  var themeParam = new URLSearchParams(location.search).get("theme");
  if (themeParam) {
    document.getElementById("theme-css").href = "css/theme-" + themeParam + ".css";
    document.documentElement.setAttribute("data-theme", themeParam);
  }

  /* ---------- أدوات مساعدة ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtPrice(n) { return n == null ? '<small>يُحدد عند التوفر</small>' : n.toLocaleString("en-EG") + ' <small>ج.م</small>'; }
  function bySku(sku) { return PRODUCTS.find(function (p) { return p.sku === sku; }); }

  /* ---------- السلة (تُحفظ على جهاز العميل) ---------- */
  var CART_KEY = "dellmar_cart";
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveCart(c) {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
    updateCartBadge();
  }
  function cartCount() {
    return Object.values(getCart()).reduce(function (a, b) { return a + b; }, 0);
  }
  function cartTotal() {
    var c = getCart(), t = 0;
    for (var sku in c) { var p = bySku(sku); if (p) t += p.price * c[sku]; }
    return t;
  }
  function addToCart(sku, qty) {
    var p = bySku(sku);
    if (!p || p.soon) return;
    var c = getCart();
    c[sku] = (c[sku] || 0) + (qty || 1);
    saveCart(c);
    flashToast("تمت الإضافة إلى السلة");
  }
  function setQty(sku, qty) {
    var c = getCart();
    if (qty <= 0) delete c[sku]; else c[sku] = qty;
    saveCart(c);
  }
  function updateCartBadge() {
    var n = cartCount(), b = document.getElementById("cart-count");
    b.hidden = n === 0;
    b.textContent = n;
  }
  function flashToast(msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 1400);
  }

  /* ---------- رسم مشهد الحقل (SVG) ---------- */
  function heroScene() {
    return '' +
    '<svg class="hero-scene" viewBox="0 0 800 460" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#F5D67B"/><stop offset="1" stop-color="#E8B23E"/>' +
        '</linearGradient>' +
        '<linearGradient id="hillA" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#5E9E5A"/><stop offset="1" stop-color="#3F7C43"/>' +
        '</linearGradient>' +
        '<linearGradient id="hillB" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#3F7C43"/><stop offset="1" stop-color="#2C5F34"/>' +
        '</linearGradient>' +
        '<g id="wheat">' +
          '<path d="M0 0 C0 -14 -2 -26 0 -40" stroke="#D9A93C" stroke-width="2.4" fill="none"/>' +
          '<ellipse cx="-4.5" cy="-14" rx="3.4" ry="7" fill="#E8C96A" transform="rotate(-28 -4.5 -14)"/>' +
          '<ellipse cx="4.5" cy="-14" rx="3.4" ry="7" fill="#E8C96A" transform="rotate(28 4.5 -14)"/>' +
          '<ellipse cx="-4.5" cy="-25" rx="3.2" ry="6.6" fill="#D9A93C" transform="rotate(-28 -4.5 -25)"/>' +
          '<ellipse cx="4.5" cy="-25" rx="3.2" ry="6.6" fill="#D9A93C" transform="rotate(28 4.5 -25)"/>' +
          '<ellipse cx="-3.6" cy="-35" rx="3" ry="6.2" fill="#E8C96A" transform="rotate(-24 -3.6 -35)"/>' +
          '<ellipse cx="3.6" cy="-35" rx="3" ry="6.2" fill="#E8C96A" transform="rotate(24 3.6 -35)"/>' +
          '<ellipse cx="0" cy="-44" rx="3" ry="6.6" fill="#E8C96A"/>' +
        '</g>' +
      '</defs>' +
      '<circle cx="616" cy="106" r="52" fill="url(#sun)" opacity=".75"/>' +
      '<path d="M0 300 Q 200 238 420 288 T 800 272 V 460 H 0 Z" fill="url(#hillA)" opacity=".92"/>' +
      '<path d="M0 348 Q 220 300 460 336 T 800 330 V 460 H 0 Z" fill="url(#hillB)"/>' +
      '<g stroke="#274B2E" stroke-width="2" opacity=".5">' +
        '<path d="M60 460 L 300 356" /><path d="M170 460 L 352 352"/>' +
        '<path d="M290 460 L 402 350"/><path d="M420 460 L 452 350"/>' +
        '<path d="M560 460 L 512 352"/><path d="M690 460 L 580 356"/>' +
      '</g>' +
      '<use href="#wheat" x="120" y="428"/><use href="#wheat" x="160" y="442" transform="scale(1.1)"/>' +
      '<use href="#wheat" x="640" y="430"/><use href="#wheat" x="690" y="446"/>' +
      '<use href="#wheat" x="710" y="424"/>' +
    '</svg>';
  }

  /* ---------- رابط طلب واتساب بالسلة ---------- */
  function waOrderLink() {
    var c = getCart();
    var lines = Object.keys(c).map(function (sku) {
      var p = bySku(sku);
      return "- " + p.name + " × " + c[sku] + " = " + (p.price * c[sku]) + " ج.م";
    });
    var msg = "السلام عليكم 🌾\nأريد طلب هذه المنتجات من متجر ديلمار ايجيبت:\n" +
      lines.join("\n") +
      "\n----------------\nالإجمالي: " + cartTotal() + " ج.م\nالدفع عند الاستلام";
    return "https://wa.me/201122208509?text=" + encodeURIComponent(msg);
  }

  /* ---------- شارة «قريباً» ---------- */
  function soonBadge(p) { return p.soon ? '<span class="badge-soon">قريباً</span>' : ''; }

  /* ---------- بطاقة منتج ---------- */
  function productCard(p) {
    return '' +
    '<a class="prod-card" href="#/product/' + p.sku + '">' +
      '<div class="prod-thumb"><img loading="lazy" src="images/' + p.img + '" alt="' + esc(p.name) + '">' + soonBadge(p) + '</div>' +
      '<div class="prod-body">' +
        '<div class="prod-name">' + esc(p.name) + '</div>' +
        '<div class="prod-ing">' + esc(p.ingredient) + '</div>' +
        '<div class="prod-foot">' +
          (p.soon ? '<span class="prod-price"><small>قريباً</small></span>' : '<span class="prod-price">' + fmtPrice(p.price) + '</span>') +
          (p.soon
            ? '<button class="add-btn" disabled>قريباً</button>'
            : '<button class="add-btn" data-add="' + p.sku + '">أضف للسلة</button>') +
        '</div>' +
      '</div>' +
    '</a>';
  }

  function viewCategories() {
    return '<section class="section"><div class="section-head"><h1 class="section-title">كل التصنيفات</h1><p class="section-sub">اختار الفئة عشان تشوف منتجاتها</p></div><div class="cat-grid">' + CATEGORIES.map(function (c) {
      return '<a class="cat-card" href="#/cat/' + c.id + '"><img class="cat-card-img" src="images/' + c.img + '" alt="' + esc(c.name) + '"><div class="cat-card-body"><strong>' + esc(c.name) + '</strong><span>' + c.count + ' منتجًا</span></div></a>';
    }).join('') + '</div></section>';
  }

  /* ---------- الرئيسية ---------- */
  function viewHome() {
    var featured = PRODUCTS.filter(function (p) { return !p.soon; }).slice(0, 10);
    var cats = CATEGORIES.map(function (c) {
      return '' +
      '<a class="cat-card" href="#/cat/' + c.id + '">' +
        '<img class="cat-card-img" src="images/' + c.img + '" alt="' + esc(c.name) + '">' +
        '<div class="cat-card-body"><strong>' + esc(c.name) + '</strong><span>' + c.count + ' منتجًا</span></div>' +
      '</a>';
    }).join("");

    return '' +
    '<section class="hero">' +
      heroScene() +
      '<div class="hero-content">' +
        '<span class="hero-kicker">🌾 شركة ديلمار ايجيبت للتنمية الزراعية</span>' +
        '<h1 class="hero-title">'+esc((window.DELLMAR_CONTENT||{}).hero||'من أرضنا الطيبة… محصول أوفى')+'</h1>' +
        '<p class="hero-sub">'+esc((window.DELLMAR_CONTENT||{}).intro||'أسمدة ومبيدات ومستلزمات زراعية موثوقة، توصل لحد باب مزرعتك — والدفع عند الاستلام.')+'</p>' +
        '<div class="hero-ctas">' +
          '<a class="btn" href="#cats">تصفح المنتجات</a>' +
          '<a class="btn btn-ghost" href="tel:' + CONFIG.phone + '" dir="ltr">☎ ' + CONFIG.phone + '</a>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<div class="trust-strip">' +
      '<div class="trust-item"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><strong>توصيل سريع</strong><span>لجميع المحافظات</span></div>' +
      '<div class="trust-item"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg><strong>الدفع عند الاستلام</strong><span>ادفع عند وصول طلبك</span></div>' +
      '<div class="trust-item"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg><strong>خبرة زراعية</strong><span>منتجات أصلية مضمونة</span></div>' +
    '</div>' +
    '<section class="section" style="padding-bottom:0">' +
      '<a class="doctor-banner" href="#/doctor">' +
        '<span class="doctor-banner-icon">🌿</span>' +
        '<span><strong>نباتك مريض؟ شخّصه مجاناً</strong><br><small>صوّر الورقة أو الثمرة — الذكاء الاصطناعي يحللها ويعرض التشخيص هنا</small></span>' +
        '<span class="doctor-banner-arrow">‹</span>' +
      '</a>' +
    '</section>' +
    '<section class="section">' +
      '<div class="about-strip">' +
        '<img src="images/logo.png" alt="ديلمار ايجيبت">' +
        '<div><strong>ديلمار ايجيبت — استيراد وتصدير وتنمية زراعية</strong>' +
        '<p>منتجات أصلية، أسعار عادلة، توصيل لكل المحافظات، والدفع عند الاستلام. <a href="#/about">اعرف أكتر عننا ‹</a></p></div>' +
      '</div>' +
    '</section>' +
    '<section class="section" id="cats">' +
      '<div class="section-head">' +
        '<h2 class="section-title">تصفح حسب الفئة</h2>' +
        '<div class="section-ornament"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c4-4 8-7.6 8-12a8 8 0 1 0-16 0c0 4.4 4 8 8 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg></div>' +
      '</div>' +
      '<div class="cat-grid">' + cats + '</div>' +
    '</section>' +
    '<section class="section">' +
      '<div class="section-head">' +
        '<h2 class="section-title">منتجات مميزة</h2>' +
        '<p class="section-sub">مختارات من مخزون ديلمار</p>' +
        '<div class="section-ornament"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8z"/></svg></div>' +
      '</div>' +
      '<div class="prod-grid">' + featured.map(productCard).join("") + '</div>' +
    '</section>';
  }

  /* ---------- صفحة تصنيف ---------- */
  function viewCategory(catId, sub) {
    var cat = CATEGORIES.find(function (c) { return c.id === catId; });
    if (!cat) return viewHome();
    var items = PRODUCTS.filter(function (p) { return p.cat_id === catId; });
    var subs = [];
    items.forEach(function (p) { if (p.sub && subs.indexOf(p.sub) === -1) subs.push(p.sub); });
    if (sub) items = items.filter(function (p) { return p.sub === sub; });

    var chipsHtml = "";
    if (subs.length) {
      chipsHtml = '<div class="chips">' +
        '<a class="chip' + (!sub ? " on" : "") + '" href="#/cat/' + catId + '">الكل</a>' +
        subs.map(function (s) {
          return '<a class="chip' + (sub === s ? " on" : "") + '" href="#/cat/' + catId + '?sub=' + encodeURIComponent(s) + '">' + esc(s) + '</a>';
        }).join("") +
      '</div>';
    }

    return '' +
    '<section class="section">' +
      '<div class="section-head">' +
        '<h2 class="section-title">' + esc(cat.name) + '</h2>' +
        '<p class="section-sub">' + items.length + ' منتجًا</p>' +
        '<div class="section-ornament"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>' +
      '</div>' +
      chipsHtml +
      '<div class="prod-grid">' + (items.map(productCard).join("") || '<p class="cart-empty">لا توجد منتجات هنا بعد</p>') + '</div>' +
    '</section>';
  }

  /* ---------- صفحة منتج ---------- */
  function viewProduct(sku) {
    var p = bySku(sku);
    if (!p) return viewHome();
    return '' +
    '<div class="pdp">' +
      '<div class="pdp-thumb"><img src="images/' + p.img + '" alt="' + esc(p.name) + '">' + soonBadge(p) + '</div>' +
      '<div class="pdp-head">' +
        '<a class="pdp-cat" href="#/cat/' + p.cat_id + '">' + esc(p.category) + (p.sub ? " › " + esc(p.sub) : "") + '</a>' +
        '<h1 class="pdp-name">' + esc(p.name) + '</h1>' +
        '<div class="pdp-price">' + fmtPrice(p.price) + '</div>' +
      '</div>' +
      '<div class="spec-table">' +
        '<div class="spec-row"><b>المادة الفعالة / التركيب</b><span>' + esc(p.ingredient) + '</span></div>' +
        '<div class="spec-row"><b>حجم العبوة</b><span>' + esc(p.unit) + '</span></div>' +
        '<div class="spec-row"><b>معدل الاستخدام</b><span>' + esc(p.rate) + '</span></div>' +
        '<div class="spec-row"><b>كود المنتج</b><span dir="ltr">' + esc(p.sku) + '</span></div>' +
      '</div>' +
      '<div class="pdp-actions">' +
        (p.soon
          ? '<button class="btn btn-block" disabled>متوفر قريباً</button>'
          : '<div class="qty-stepper"><button data-step="-1">−</button><output id="pdp-qty">1</output><button data-step="1">+</button></div>' +
            '<button class="btn" style="flex:1" data-add-qty="' + p.sku + '">أضف إلى السلة</button>') +
      '</div>' +
      '<p class="pdp-desc">' + esc(p.desc) + '</p>' +
    '</div>';
  }

  /* ---------- السلة ---------- */
  function viewCart() {
    var c = getCart(), skus = Object.keys(c);
    if (!skus.length) {
      return '' +
      '<div class="cart-wrap"><div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '<h2 class="section-title">سلتك فارغة</h2>' +
        '<p style="margin:8px 0 20px">تصفح منتجاتنا وأضف ما يناسب محصولك</p>' +
        '<a class="btn" href="#/">تصفح المنتجات</a>' +
      '</div></div>';
    }
    var lines = skus.map(function (sku) {
      var p = bySku(sku); if (!p) return "";
      return '' +
      '<div class="cart-line">' +
        '<img src="images/' + p.img + '" alt="' + esc(p.name) + '">' +
        '<div class="cart-line-info"><strong>' + esc(p.name) + '</strong><div class="line-price">' + fmtPrice(p.price) + '</div></div>' +
        '<div class="cart-line-side">' +
          '<div class="qty-stepper small"><button data-line="-1" data-sku="' + sku + '">−</button><output>' + c[sku] + '</output><button data-line="1" data-sku="' + sku + '">+</button></div>' +
          '<button class="line-remove" data-remove="' + sku + '">إزالة</button>' +
        '</div>' +
      '</div>';
    }).join("");

    return '' +
    '<div class="cart-wrap">' +
      '<div class="section-head"><h2 class="section-title">سلة المشتريات</h2></div>' +
      lines +
      '<div class="cart-total-card">' +
        '<div class="cart-total-row"><span>عدد الأصناف</span><span>' + cartCount() + '</span></div>' +
        '<div class="cart-total-row grand"><span>الإجمالي</span><span>' + fmtPrice(cartTotal()) + '</span></div>' +
      '</div>' +
      '<div class="cod-banner">🚚 الدفع عند الاستلام — تُحسب مصاريف الشحن عند تأكيد الطلب</div>' +
      '<a class="btn btn-block" style="margin-top:16px" href="#/checkout">إتمام الطلب</a>' +
      '<a class="btn btn-block btn-wa" style="margin-top:10px" href="' + waOrderLink() + '" target="_blank" rel="noopener">اطلب عبر واتساب 💬</a>' +
    '</div>';
  }

  /* ---------- شخّص نباتك ---------- */
  function viewDoctor() {
    return '' +
    '<div class="cart-wrap">' +
      '<div class="section-head"><h2 class="section-title">شخّص نباتك بالذكاء الاصطناعي 🌿</h2>' +
      '<p class="section-sub">صوّر الورقة أو الثمرة المصابة والتشخيص يظهر لك هنا فوراً — خدمة مجانية من ديلمار ايجيبت</p>' +
      '<div class="section-ornament"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div></div>' +
      '<div class="form-card">' +
        '<div class="diag-step">' +
          '<span class="step-num">1</span>' +
          '<div style="flex:1">' +
            '<b>صوّر النبات المصاب</b>' +
            '<p class="step-sub">ورقة أو ثمرة في ضوء النهار — الصورة تكون واضحة وقريبة</p>' +
            '<label class="photo-pick" id="d-pick" for="d-photo">📷 اختر أو صوّر صورة</label>' +
            '<input type="file" id="d-photo" accept="image/*" class="vh-input" aria-label="صورة النبات">' +
            '<div class="photo-preview" id="d-preview" hidden>' +
              '<img id="d-preview-img" alt="صورة النبات المصاب">' +
              '<button type="button" class="photo-clear" id="d-clear">✕ تغيير الصورة</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="diag-step">' +
          '<span class="step-num">2</span>' +
          '<div style="flex:1">' +
            '<b>حدّد المحصول (اختياري)</b>' +
            '<div class="field" style="margin:10px 0 0"><select id="d-crop">' +
              ['اختار المحصول…','طماطم','بطاطس','بصل','قمح','ذرة','أرز','قطن','قصب سكر','عنب','مانجو','موالح','خيار','فلفل','فراولة','أخرى'].map(function(c){return '<option>'+c+'</option>';}).join('') +
            '</select></div>' +
          '</div>' +
        '</div>' +
        '<div class="diag-step">' +
          '<span class="step-num">3</span>' +
          '<div style="flex:1">' +
            '<b>اضغط تشخيص</b>' +
            '<p class="step-sub">الذكاء الاصطناعي يحلل الصورة ويديك النتيجة والعلاج المقترح في ثوانٍ</p>' +
            '<button class="btn btn-block" id="d-diagnose" disabled>🔍 شخّص النبات</button>' +
          '</div>' +
        '</div>' +
        '<div id="d-result"></div>' +
        '<p class="form-note">التشخيص استرشادي. لاستشارة مهندس: <a href="tel:01122208509" dir="ltr"><b>01122208509</b></a></p>' +
      '</div>' +
    '</div>';
  }

  /* ---------- التشخيص بالذكاء الاصطناعي ---------- */
  function arNorm(s) {
    return (s || "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ً-ْ]/g, "").toLowerCase();
  }
  function matchProducts(names) {
    var want = (names || []).map(arNorm).filter(Boolean);
    if (!want.length) return [];
    return PRODUCTS.filter(function (p) { return !p.soon; }).map(function (p) {
      var hay = arNorm(p.name + " " + (p.ingredient || "") + " " + (p.desc || "") + " " + (p.category || ""));
      var score = 0;
      want.forEach(function (w) {
        w.split(/\s+/).forEach(function (tok) {
          if (tok.length > 2 && hay.indexOf(tok) !== -1) score += tok.length > 5 ? 2 : 1;
        });
      });
      return { p: p, score: score };
    }).filter(function (x) { return x.score >= 3; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4).map(function (x) { return x.p; });
  }
  function fileToDataURL(file, cb) {
    var tries=0, finished=false;
    function done(v){if(!finished){finished=true;cb(v);}}
    function read(){
      tries++;
      var rd=new FileReader();
      function retry(){if(tries<4)setTimeout(read,tries*400);else done(null);}
      rd.onerror=retry;
      rd.onload=function(){
        var raw=rd.result;
        if(typeof raw!=="string"||raw.length<100){retry();return;}
        var img=new Image();
        img.onerror=function(){done(raw);};
        img.onload=function(){
          try {
            var w=img.naturalWidth,h=img.naturalHeight,scale=Math.min(1,1024/Math.max(w,h));
            var cv=document.createElement("canvas");cv.width=Math.max(1,Math.round(w*scale));cv.height=Math.max(1,Math.round(h*scale));
            cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
            var du=cv.toDataURL("image/jpeg",0.82);done(du.length>100?du:raw);
          }catch(e){done(raw);}
        };
        img.src=raw;
      };
      try{rd.readAsDataURL(file);}catch(e){retry();}
    }
    read();
  }
  function runDiagnose() {
    var btn = document.getElementById("d-diagnose");
    var out = document.getElementById("d-result");
    if (!btn) return;
    if (window.__dPhotoURL) { sendPhoto(window.__dPhotoURL, btn, out); return; }
    if (!window.__dPhoto) return;
    btn.disabled = true;
    btn.textContent = "⏳ بنجهّز الصورة…";
    fileToDataURL(window.__dPhoto, function (dataURL) {
      btn.disabled = false; btn.textContent = "🔍 شخّص النبات";
      if (!dataURL) {
        out.innerHTML = '<div class="diag-error">مش قادرين نفتح الصورة دي — جرّب تختارها أو تصوّرها تاني.</div>';
        return;
      }
      window.__dPhotoURL = dataURL;
      sendPhoto(dataURL, btn, out);
    });
  }
  function sendPhoto(dataURL, btn, out) {
    btn.disabled = true;
    btn.textContent = "⏳ بيحلل الصورة…";
    out.innerHTML = '<div class="diag-loading">🌿 الذكاء الاصطناعي بيفحص الصورة — استنى ثواني…</div>';
    var cropSel = document.getElementById("d-crop");
    var cropVal = cropSel && cropSel.selectedIndex > 0 ? cropSel.value : "";
    fetch(CONFIG.diagnoseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": CONFIG.supabaseKey, "Authorization": "Bearer " + CONFIG.supabaseKey },
      body: JSON.stringify({ image: dataURL, crop: cropVal })
    }).then(function (r) {
      if (r.status === 503) throw new Error("busy");
      if (r.status === 400 || r.status === 413 || r.status === 422) throw new Error("badimg");
      if (!r.ok) throw new Error("http" + r.status);
      return r.json();
    }).then(function (d) {
      btn.disabled = false; btn.textContent = "🔍 شخّص النبات";
      if (!d || !d.ok || !d.result) throw new Error("busy");
      var r = d.result;
      if (r.unreadable === true) {
        out.innerHTML = '<div class="diag-error">مش قادرين نقرا الصورة — جرّب صورة أوضح للورقة أو الثمرة في ضوء كويس.</div>';
        return;
      }
      var adv = (r.advice || []).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
      var prods = matchProducts(r.products || []);
      var prodHtml = prods.length ?
        '<div class="diag-prods"><b>منتجات مقترحة من المتجر:</b><div class="diag-prod-grid">' +
        prods.map(function (p) {
          return '<a class="diag-prod" href="#/product/' + p.sku + '"><img src="images/' + p.img + '" alt="' + esc(p.name) + '" loading="lazy"><span>' + esc(p.name) + '</span><b>' + p.price + ' ج</b></a>';
        }).join("") + '</div></div>' : "";
      var conf = (typeof r.confidence === "number" && r.confidence > 0) ? '<span class="diag-conf">نسبة الثقة: ' + r.confidence + '٪</span>' : "";
      out.innerHTML = '<div class="diag-result">' +
        '<div class="diag-result-head"><span>🩺</span><b>' + esc(r.problem || "تعذر التشخيص") + "</b>" + conf + "</div>" +
        (r.plant ? '<p class="diag-meta">النبات: ' + esc(r.plant) + (r.status ? " — " + esc(r.status) : "") + "</p>" : "") +
        (adv ? '<ul class="diag-advice">' + adv + "</ul>" : "") +
        prodHtml +
        '<p class="diag-note">لو الأعراض مستمرة كلم مهندسينا على <a href="tel:01122208509" dir="ltr"><b>01122208509</b></a></p>' +
      "</div>";
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = "🔍 شخّص النبات";
      var msg = "حصلت مشكلة في الاتصال — اتأكد من النت وجرّب تاني.";
      if (err && err.message === "busy") msg = "السيرفر مشغول شوية — جرّب تاني بعد دقيقة 🙏";
      else if (err && err.message === "badimg") msg = "الصورة وصلتش سليمة — جرّب صورة تانية.";
      out.innerHTML = '<div class="diag-error">' + msg + "</div>";
    });
  }

  /* ---------- من نحن ---------- */
  function viewAbout() {
    if((window.DELLMAR_CONTENT||{}).about) return '<section class="section"><h1>عن الشركة</h1><div class="form-card" style="white-space:pre-line">'+esc(window.DELLMAR_CONTENT.about)+'</div></section>';
    return '' +
    '<div class="cart-wrap">' +
      '<div class="section-head"><h2 class="section-title">من نحن</h2>' +
      '<p class="section-sub">شركة ديلمار ايجيبت للاستيراد والتصدير والتنمية الزراعية</p>' +
      '<div class="section-ornament"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div></div>' +
      '<div class="form-card about-card">' +
        '<img class="about-logo" src="images/logo.png" alt="شعار ديلمار ايجيبت">' +
        '<p class="about-lead">ديلمار ايجيبت شركة مصرية متخصصة في استيراد وتوريد الأسمدة والمبيدات ومستلزمات الإنتاج الزراعي — من السماد الورقي للسماد الأرضي، ومن المبيد الحشري للفطري ومبيدات النماتودا. شغلنا كله إن الفلاح المصري ياخد منتج أصلي يستاهل تعبه وأرضه.</p>' +
        '<h3 class="about-h">رسالتنا</h3>' +
        '<p>إننا نوصّل للمزارع منتج مضمون بسعر عادل، من غير وسطاء يكلفوه ولا منتجات مغشوشة تضيّع موسمه. المحصول الوفير يبدأ من مدخلات سليمة — وده اللي بنستورده ونوفره.</p>' +
        '<h3 class="about-h">وعدنا ليك</h3>' +
        '<ul class="about-list">' +
          '<li><b>منتجات أصلية 100%:</b> كل صنف في المتجر بنختاره ونعتمده قبل ما نعرضه.</li>' +
          '<li><b>أسعار عادلة:</b> تسعير واضح بالجنيه، من غير مفاجآت.</li>' +
          '<li><b>توصيل لجميع المحافظات:</b> طلبك يوصل لحد باب المزرعة أو المخزن.</li>' +
          '<li><b>الدفع عند الاستلام:</b> تشوف طلبك الأول وبعدين تدفع.</li>' +
          '<li><b>تشخيص مجاني لنباتك:</b> صوّر الورقة أو الثمرة وابعتها، ومهندسينا يردوا عليك بالتشخيص والعلاج المناسب من منتجاتنا.</li>' +
        '</ul>' +
        '<h3 class="about-h">كلمنا في أي وقت</h3>' +
        '<p>مكالمة أو واتساب: <a href="tel:01122208509" dir="ltr"><b>01122208509</b></a> — فريق ديلمار تحت أمرك في أي وقت.</p>' +
        '<div class="about-ctas">' +
          '<a class="btn" href="#/">تصفح المنتجات</a>' +
          '<a class="btn btn-wa" href="https://wa.me/201122208509" target="_blank" rel="noopener">كلمنا واتساب 💬</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- إتمام الطلب ---------- */
  var GOVS = ["القاهرة","الجيزة","الإسكندرية","القليوبية","الدقهلية","الشرقية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"];

  function viewCheckout() {
    if (!cartCount()) { location.hash = "#/cart"; return ""; }
    var c = getCart();
    var summary = Object.keys(c).map(function (sku) {
      var p = bySku(sku);
      return '<div class="cart-total-row"><span>' + esc(p.name) + ' × ' + c[sku] + '</span><span>' + (p.price * c[sku]).toLocaleString("en-EG") + ' ج.م</span></div>';
    }).join("");

    return '' +
    '<div class="cart-wrap">' +
      '<div class="section-head"><h2 class="section-title">إتمام الطلب</h2><p class="section-sub">اختار طريقة الدفع المناسبة ليك</p></div>' +
      '<div class="form-card">' +
        '<div class="cart-total-row grand" style="border:none;margin:0;padding-top:0"><span>إجمالي الطلب</span><span>' + fmtPrice(cartTotal()) + '</span></div>' +
        summary +
      '</div>' +
      '<form class="form-card" id="order-form" novalidate>' +
        '<div class="field"><label for="f-name">الاسم بالكامل *</label><input id="f-name" name="name" required autocomplete="name" placeholder="مثال: محمود أحمد"></div>' +
        '<div class="field"><label for="f-phone">رقم الموبايل *</label><input id="f-phone" name="phone" required inputmode="tel" autocomplete="tel" dir="ltr" placeholder="01xxxxxxxxx"><div class="hint">هنتواصل معاك على الرقم ده لتأكيد الطلب</div></div>' +
        '<div class="field"><label for="f-gov">المحافظة *</label><select id="f-gov" name="governorate" required><option value="">اختر المحافظة…</option>' +
          GOVS.map(function (g) { return "<option>" + g + "</option>"; }).join("") +
        '</select></div>' +
        '<div class="field"><label for="f-addr">العنوان بالتفصيل *</label><textarea id="f-addr" name="address" required placeholder="المركز / القرية / الشارع / علامة مميزة"></textarea></div>' +
        '<div class="field"><label for="f-notes">ملاحظات (اختياري)</label><textarea id="f-notes" name="notes" placeholder="أي تفاصيل إضافية عن الطلب أو التوصيل"></textarea></div>' +
        '<div class="field"><label for="f-payment">طريقة الدفع</label><select id="f-payment" name="payment"><option value="الدفع عند الاستلام">الدفع عند الاستلام</option><option value="اتصالات كاش">اتصالات كاش</option><option value="فودافون كاش">فودافون كاش</option><option value="انستاباي">انستاباي</option></select></div>' +
        '<div id="wallet-details" hidden><p>رقم التحويل: <b dir="ltr">01122208509</b></p><p class="form-note">راجع اسم المستلم داخل تطبيق الدفع قبل التحويل. مصاريف الشحن بتتأكد مع فريق ديلمار. رقم العملية بيتراجع يدوياً، تسجيله هنا مش تأكيد استلام المبلغ.</p><div class="field"><label for="f-ref">رقم العملية / مرجع التحويل</label><input id="f-ref" name="payment_ref" autocomplete="off"></div></div>' +
        '<button class="btn btn-block" type="submit" id="order-submit">تأكيد الطلب</button>' +
        '<p class="form-note">بالضغط على «تأكيد الطلب» هيتم إرسال طلبك لفريق ديلمار وهنتصل بيك للتأكيد.</p>' +
      '</form>' +
    '</div>';
  }

  /* ---------- صفحة نجاح الطلب ---------- */
  function viewDone(orderNo) {
    var last=null; try {last=JSON.parse(sessionStorage.getItem("dellmar_last_order"));}catch(e){}
    var confirmButton=last&&last.number===orderNo ? '<button class="btn btn-wa" id="confirm-order-wa">تأكيد الطلب على واتساب</button><p class="form-note">هيفتح واتساب برسالة فيها تفاصيل طلبك. راجعها واضغط إرسال بنفسك.</p>' : '';
    return '' +
    '<div class="done-wrap">' +
      '<div class="done-icon"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<h2 class="section-title">تم استلام طلبك بنجاح!</h2>' +
      '<p style="margin-top:8px">هنتواصل معاك في أقرب وقت لتأكيد الطلب وترتيب التوصيل.</p>' +
      '<div class="done-order-no" dir="ltr">' + esc(orderNo) + '</div>' +
      confirmButton +
      '<p style="margin-top:22px"><a class="btn" href="#/">العودة للمتجر</a></p>' +
    '</div>';
  }

  /* ---------- إرسال الطلب عبر Web3Forms ---------- */
  function submitOrder(form) {
    var btn = document.getElementById("order-submit");
    btn.disabled = true; btn.textContent = "جاري إرسال الطلب…";

    var c = getCart();
    var lines = Object.keys(c).map(function (sku) {
      var p = bySku(sku);
      return "- " + p.name + " (" + p.sku + ") × " + c[sku] + " = " + (p.price * c[sku]) + " EGP";
    });
    var orderNo = "DLM-" + Date.now().toString(36).toUpperCase();
    var f = new FormData(form);

    var message =
      "طلب جديد من متجر ديلمار ايجيبت\n" +
      "رقم الطلب: " + orderNo + "\n" +
      "------------------------\n" +
      "الاسم: " + f.get("name") + "\n" +
      "الموبايل: " + f.get("phone") + "\n" +
      "المحافظة: " + f.get("governorate") + "\n" +
      "العنوان: " + f.get("address") + "\n" +
      "ملاحظات: " + (f.get("notes") || "-") + "\n" +
      "------------------------\n" +
      "المنتجات:\n" + lines.join("\n") + "\n" +
      "------------------------\n" +
      "الإجمالي: " + cartTotal() + " EGP\n" +
      "طريقة الدفع: " + f.get("payment") + "\n" +
      "مرجع التحويل: " + (f.get("payment_ref") || "-");

    var payload = {
      access_key: CONFIG.web3formsAccessKey,
      subject: "طلب جديد " + orderNo + " — متجر ديلمار ايجيبت",
      from_name: "متجر ديلمار ايجيبت",
      replyto: CONFIG.orderEmail,
      message: message
    };

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.success) {
        sessionStorage.setItem("dellmar_last_order", JSON.stringify({number:orderNo,message:message}));
        saveCart({});
        location.hash = "#/done/" + orderNo;
      } else {
        throw new Error((res && res.message) || "send failed");
      }
    })
    .catch(function () {
      btn.disabled = false; btn.textContent = "تأكيد الطلب — الدفع عند الاستلام";
      flashToast("حصلت مشكلة في الإرسال — اتصل بينا على " + CONFIG.phone);
    });
  }

  /* ---------- الراوتر ---------- */
  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var qIdx = hash.indexOf("?");
    var query = {};
    if (qIdx > -1) {
      new URLSearchParams(hash.slice(qIdx + 1)).forEach(function (v, k) { query[k] = v; });
      hash = hash.slice(0, qIdx);
    }
    var parts = hash.split("/").filter(Boolean);
    var html;
    if (!parts.length) html = viewHome();
    else if (parts[0] === "login" || parts[0] === "admin") html = window.DellmarAccount.view();
    else if (parts[0] === "categories") html = viewCategories();
    else if (parts[0] === "cat") html = viewCategory(parts[1], query.sub);
    else if (parts[0] === "product") html = viewProduct(parts[1]);
    else if (parts[0] === "doctor") html = viewDoctor();
    else if (parts[0] === "about") html = viewAbout();
    else if (parts[0] === "cart") html = viewCart();
    else if (parts[0] === "checkout") html = viewCheckout();
    else if (parts[0] === "done") html = viewDone(parts[1] || "");
    else html = viewHome();

    app.innerHTML = html;
    window.scrollTo(0, 0);

    // تفعيل التبويب الحالي في الشريط السفلي
    var nav = !parts.length ? "home" : (parts[0] === "cart" || parts[0] === "checkout") ? "cart" : (parts[0] === "cat" || parts[0] === "categories") ? "cats" : "";
    document.querySelectorAll(".tabbar a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("data-nav") === nav);
    });
  }

  /* ---------- تفويض النقرات (أزرار السلة والكمية) ---------- */
  document.addEventListener("click", function (e) {
    if (e.target.id === "confirm-order-wa") {
      var last; try {last=JSON.parse(sessionStorage.getItem("dellmar_last_order"));}catch(err){}
      if (last && last.message) {
        var shareUrl = new URL("https://api.whatsapp.com/send");
        shareUrl.searchParams.set("phone", "201122208509");
        shareUrl.searchParams.set("text", last.message);
        window.open(shareUrl.href, "_blank", "noopener");
      }
      return;
    }
    var t = e.target.closest("[data-add],[data-add-qty],[data-line],[data-remove],[data-step],#d-diagnose,#d-clear");
    if (!t) return;
    if (t.dataset.add) { e.preventDefault(); addToCart(t.dataset.add, 1); }
    else if (t.dataset.addQty) {
      var q = parseInt(document.getElementById("pdp-qty").textContent, 10) || 1;
      addToCart(t.dataset.addQty, q);
    }
    else if (t.dataset.step) {
      var out = document.getElementById("pdp-qty");
      var v = Math.max(1, (parseInt(out.textContent, 10) || 1) + parseInt(t.dataset.step, 10));
      out.textContent = v;
    }
    else if (t.dataset.line) {
      var c = getCart(), sku = t.dataset.sku;
      setQty(sku, (c[sku] || 0) + parseInt(t.dataset.line, 10));
      route();
    }
    else if (t.dataset.remove) { setQty(t.dataset.remove, 0); route(); }
    else if (t.id === "d-diagnose") { runDiagnose(); }
    else if (t.id === "d-clear") {
      window.__dPhoto = null;
      window.__dPhotoURL = null;
      var inp = document.getElementById("d-photo");
      if (inp) inp.value = "";
      document.getElementById("d-preview").hidden = true;
      document.getElementById("d-pick").hidden = false;
      var db = document.getElementById("d-diagnose");
      if (db) db.disabled = true;
      var dr = document.getElementById("d-result");
      if (dr) dr.innerHTML = "";
    }
  });

  document.addEventListener("change", function (e) {
    if (e.target.id === "f-payment") {
      document.getElementById("wallet-details").hidden = e.target.value === "الدفع عند الاستلام";
      document.getElementById("f-ref").required = e.target.value !== "الدفع عند الاستلام";
    }
    if (e.target.id === "d-photo" && e.target.files && e.target.files[0]) {
      var dFile = e.target.files[0];
      window.__dPhoto = dFile;
      window.__dPhotoURL = null;
      var prevImg = document.getElementById("d-preview-img");
      prevImg.removeAttribute("src");
      document.getElementById("d-preview").hidden = false;
      document.getElementById("d-pick").hidden = true;
      var db = document.getElementById("d-diagnose");
      if (db) { db.disabled = true; db.textContent = "⏳ بنجهّز الصورة…"; }
      fileToDataURL(dFile, function (du) {
        if (window.__dPhoto !== dFile) return;
        window.__dPhotoURL = du;
        if(du) prevImg.src=du;
        if (db) { db.disabled = !du; db.textContent = "🔍 شخّص النبات"; }
        if (!du) {
          var dr = document.getElementById("d-result");
          if (dr) dr.innerHTML = '<div class="diag-error">مش قادرين نفتح الصورة دي على الموبايل — جرّب تصوّرها تاني أو اختار صورة مختلفة.</div>';
        }
      });
    }
  });

  document.addEventListener("submit", function (e) {
    if (e.target.id === "order-form") {
      e.preventDefault();
      var form = e.target;
      if (!form.name.value.trim() || !form.phone.value.trim() || !form.governorate.value || !form.address.value.trim()) {
        flashToast("من فضلك املأ كل الحقول المطلوبة");
        return;
      }
      if (!/^01[0-9]{9}$/.test(form.phone.value.trim())) {
        flashToast("رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01");
        return;
      }
      if (form.payment.value !== "الدفع عند الاستلام" && !form.payment_ref.value.trim()) {flashToast("اكتب رقم عملية التحويل للمراجعة"); return;}
      submitOrder(form);
    }
  });

  /* ---------- تشغيل ---------- */
  window.addEventListener("hashchange", route);
  window.addEventListener("dellmar:content", function(){var c=window.DELLMAR_CONTENT||{};if(c.company){document.querySelector('.footer-company').textContent=c.company;}if(location.hash===''||location.hash==='#/'||location.hash==='#/about')route();});
  window.addEventListener("dellmar:products", function () { PRODUCTS = window.DELLMAR.products; CATEGORIES.forEach(function(c){ c.count=PRODUCTS.filter(function(p){return p.cat_id===c.id;}).length; }); if(!document.getElementById("d-photo") && !document.getElementById("admin-product")) route(); });
  if(window.DellmarAccount) window.DellmarAccount.refresh().catch(function(){});
  updateCartBadge();
  route();

  /* ---------- تسجيل عامل الخدمة (PWA) ---------- */
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
