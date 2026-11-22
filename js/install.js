/* تثبيت المتجر كتطبيق (PWA) */
(function () {
  var deferred = null;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (standalone) return;
  var ua = navigator.userAgent || "";
  var isIOS = /iphone|ipad|ipod/i.test(ua);
  var KEY = "dellmar-install-dismissed";
  function dismissed() { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < 3 * 864e5; } catch (e) { return false; } }
  function bar() {
    var b = document.getElementById("install-bar");
    if (b) return b;
    b = document.createElement("div");
    b.id = "install-bar";
    b.setAttribute("role", "region");
    b.innerHTML = '<img src="icons/icon-192.png" alt="" width="40" height="40"><div class="ib-text"><strong>نزّل تطبيق ديلمار</strong><span id="ib-sub">أيقونة على شاشتك وبيفتح زي أي تطبيق</span></div><button type="button" id="ib-go" class="btn">نزّل التطبيق</button><button type="button" id="ib-x" aria-label="إغلاق">×</button>';
    document.body.appendChild(b);
    document.getElementById("ib-x").onclick = function () { b.hidden = true; try { localStorage.setItem(KEY, Date.now()); } catch (e) {} };
    document.getElementById("ib-go").onclick = install;
    return b;
  }
  function install() {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; var b = document.getElementById("install-bar"); if (b) b.hidden = true; });
    } else if (isIOS) {
      document.getElementById("ib-sub").textContent = "اضغط زر المشاركة في سفاري ثم «إضافة إلى الشاشة الرئيسية»";
    } else {
      document.getElementById("ib-sub").textContent = "افتح قائمة المتصفح (⋮) ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»";
    }
  }
  function show() { if (!dismissed()) bar().hidden = false; addHeaderBtn(); }
  function addHeaderBtn() {
    if (document.getElementById("install-head")) return;
    var h = document.querySelector(".header-actions");
    if (!h) return;
    var a = document.createElement("button");
    a.type = "button"; a.id = "install-head"; a.textContent = "نزّل التطبيق";
    a.onclick = install;
    h.insertBefore(a, h.firstChild);
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; show(); });
  window.addEventListener("appinstalled", function () { deferred = null; var b = document.getElementById("install-bar"); if (b) b.hidden = true; var h = document.getElementById("install-head"); if (h) h.remove(); });
  if (isIOS) window.addEventListener("load", function () { setTimeout(show, 2500); });
})();
