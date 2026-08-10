/* Shared controls for the sign-in and sign-up pages. */
(() => {
  const notify = message => {
    if (typeof window.showToast === 'function') window.showToast(message, 'info');
    else window.alert(message);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-social-login]').forEach(button => {
      button.addEventListener('click', () => {
        const provider = button.dataset.socialLogin;
        notify(`${provider} sign-in is simulated in this demo.`);
      });
    });
  });
})();
