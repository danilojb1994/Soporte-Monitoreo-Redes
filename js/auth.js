(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.OPC) {
      console.error('La librería OPC no está disponible.');
      return;
    }
    OPC.initStorage();

    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        OPC.clearSession();
        window.location.href = 'index.html';
      });
    });

    const session = OPC.getCurrentUser();
    if (session && window.location.pathname.endsWith('index.html')) {
      const redirectTarget = session.role === 'admin' ? 'admin.html' : 'dashboard.html';
      window.location.href = redirectTarget;
      return;
    }

    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const user = OPC.authenticate(email, password);
      const messageElement = document.getElementById('loginMessage');

      if (!user) {
        if (messageElement) {
          messageElement.textContent = 'Credenciales incorrectas. Intenta nuevamente.';
          messageElement.classList.add('error-text');
        }
        showToast('Error de inicio de sesión.', 'error');
        return;
      }

      OPC.setCurrentUser({ id: user.id, nombre: user.nombre, email: user.email, role: user.role });
      showToast('Inicio de sesión exitoso.', 'success');

      const nextPage = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      setTimeout(() => {
        window.location.href = nextPage;
      }, 600);
    });
  });
})();
