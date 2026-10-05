(() => {
  const addPrivacyLink = () => {
    const footers = document.querySelectorAll('footer, .guide-footer');
    footers.forEach((footer) => {
      if (footer.querySelector('a[href="/privacy/"]')) return;
      const container = footer.querySelector('.guide-footer-inner, .footer-trust-links') || footer;
      const link = document.createElement('a');
      link.href = '/privacy/';
      link.textContent = 'プライバシーポリシー';
      if (container.classList?.contains('guide-footer-inner') && container.textContent.trim()) {
        container.appendChild(document.createTextNode(' ｜ '));
      }
      container.appendChild(link);
    });
  };
  const run = () => {
    addPrivacyLink();
    setTimeout(addPrivacyLink, 250);
    setTimeout(addPrivacyLink, 1000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
