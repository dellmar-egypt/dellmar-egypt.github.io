/* Install strip: visible unless the app is truly running installed; tap uses the PWA prompt when available, else always opens the help dialog with APK link and steps. */
(function () {
  var APK = 'https://github.com/dellmar-egypt/dellmar-egypt.github.io/releases/download/android-v1.0.0/Dellmar.apk';
  var KEY = 'dellmar-installed';
  var deferred = null;
  var entry = document.getElementById('install-entry');
  var button = document.getElementById('install-go');
  var dialog = document.getElementById('install-help');
  var steps = document.getElementById('install-steps');
  var apkBtn = document.getElementById('install-apk');
  var close = document.getElementById('install-close');
  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  var inApp = /; wv\)|FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok/i.test(ua);
  function flag() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function unflag() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function runningInstalled() {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
      if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    } catch (e) {}
    if (window.navigator.standalone === true) return true;
    if ((document.referrer || '').indexOf('android-app://') === 0) return true;
    return false;
  }
  function sync() {
    var installed = runningInstalled();
    if (installed) flag(); else unflag();
    entry.hidden = installed;
  }
  function help() {
    apkBtn.hidden = isIOS;
    if (isIOS) {
      steps.textContent = 'افتح الموقع في Safari، واضغط زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية»، وبعدها «إضافة».';
    } else if (isAndroid && inApp) {
      steps.textContent = 'أنت فاتح الموقع من داخل تطبيق تاني (زي واتساب)، والتثبيت من المتصفح مش بيشتغل من هنا. الأسهل: اضغط ⋮ من فوق واختار «فتح في Chrome» وبعدها دوس «نزّل التطبيق». أو حمّل ملف التطبيق مباشرة من الزرار اللي تحت.';
    } else if (isAndroid) {
      steps.textContent = 'من قائمة Chrome (⋮) اختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». ولو الاختيار مش ظاهر، حمّل ملف التطبيق مباشرة من الزرار اللي تحت.';
    } else {
      steps.textContent = 'من قائمة المتصفح اختار «تثبيت ديلمار»، وعلى الكمبيوتر ممكن تلاقي علامة التثبيت جنب شريط العنوان. ولو عندك أندرويد، تقدر تحمّل ملف التطبيق مباشرة من الزرار اللي تحت.';
    }
    if (!dialog.open) dialog.showModal();
  }
  function downloadApk() {
    var a = document.createElement('a');
    a.href = APK; a.download = 'Dellmar.apk'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    steps.textContent = 'بدأ تحميل تطبيق ديلمار. لما يخلص افتح الملف من إشعارات التحميل واضغط «تثبيت». لو الموبايل سأل، اسمح بالتثبيت من المتصفح مرة واحدة. بعدها هتلاقي ديلمار كتطبيق حقيقي على جهازك.';
    apkBtn.hidden = false;
    if (!dialog.open) dialog.showModal();
  }
  async function install() {
    if (isAndroid) { if (inApp) { help(); return; } downloadApk(); return; }
    if (deferred) {
      var prompt = deferred;
      deferred = null;
      button.disabled = true;
      try {
        await prompt.prompt();
        var choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') { flag(); sync(); }
      } catch (e) { help(); }
      finally { button.disabled = false; }
      return;
    }
    help();
  }
  button.addEventListener('click', install);
  close.addEventListener('click', function () { dialog.close(); button.focus(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault(); deferred = event; sync();
  });
  window.addEventListener('appinstalled', function () {
    flag(); deferred = null; if (dialog.open) dialog.close(); sync();
  });
  ['standalone', 'fullscreen', 'minimal-ui'].forEach(function (m) {
    var q = window.matchMedia('(display-mode: ' + m + ')');
    if (q.addEventListener) q.addEventListener('change', sync);
  });
  window.addEventListener('pageshow', sync);
  sync();
})();
