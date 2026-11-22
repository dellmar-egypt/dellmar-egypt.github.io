/* Install entry never depends on Chrome's optional beforeinstallprompt event. */
(function () {
  var deferred = null;
  var entry = document.getElementById('install-entry');
  var button = document.getElementById('install-go');
  var dialog = document.getElementById('install-help');
  var steps = document.getElementById('install-steps');
  var close = document.getElementById('install-close');
  var display = window.matchMedia('(display-mode: standalone)');
  var installed = false;
  function sync() {
    entry.hidden = false;
  }
  function help() {
    var ua = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua)) {
      steps.textContent = 'افتح الموقع في Safari، واضغط زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية»، وبعدها «إضافة».';
    } else if (/android/i.test(ua)) {
      steps.textContent = 'افتح الموقع في Chrome نفسه، مش داخل واتساب أو فيسبوك. من قائمة Chrome (⋮) اختار «إضافة إلى الشاشة الرئيسية» ثم «تثبيت» أو «إنشاء اختصار». لو ظهر «تثبيت التطبيق» اختاره. لو الاختيار مش ظاهر، اتأكد إن Chrome محدّث وإنك مش في وضع التصفح المتخفي.';
    } else {
      steps.textContent = 'من قائمة المتصفح اختار «تثبيت ديلمار» أو «إضافة إلى الشاشة الرئيسية». على الكمبيوتر ممكن تلاقي علامة التثبيت جنب شريط العنوان. لو الاختيار مش موجود، جرّب Chrome أو Edge محدّث.';
    }
    if (!dialog.open) dialog.showModal();
  }
  async function install() {
    if (!deferred) { help(); return; }
    var prompt = deferred;
    deferred = null;
    button.disabled = true;
    try {
      await prompt.prompt();
      var choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') { installed = true; sync(); }
    } catch (e) { help(); }
    finally { button.disabled = false; }
  }
  button.addEventListener('click', install);
  close.addEventListener('click', function () { dialog.close(); button.focus(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault(); deferred = event; sync();
  });
  window.addEventListener('appinstalled', function () {
    installed = true; deferred = null; if (dialog.open) dialog.close(); sync();
  });
  if (display.addEventListener) display.addEventListener('change', sync);
  window.addEventListener('pageshow', sync);
  sync();
})();
