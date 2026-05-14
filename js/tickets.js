(function () {
  const STORAGE_USERS = 'opc_users';
  const STORAGE_TICKETS = 'opc_tickets';
  const SESSION_KEY = 'opc_session';

  const defaultUsers = [
    { id: 'u-1', nombre: 'Empleado OPC', email: 'empleado@opc.com', password: 'pass123', role: 'empleado' },
    { id: 'u-2', nombre: 'Admin OPC', email: 'admin@opc.com', password: 'admin123', role: 'admin' },
    { id: 'u-3', nombre: 'Agente Soporte', email: 'agente@opc.com', password: 'agente123', role: 'admin' }
  ];

  const defaultTickets = [
    {
      id: 't-1001',
      title: 'Impresora principal no responde',
      category: 'Instalaciones',
      priority: 'Media',
      description: 'La impresora del segundo piso muestra error E12 y no imprime documentos importantes.',
      status: 'Abierto',
      createdBy: 'u-1',
      assignedTo: 'u-3',
      attachment: 'captura-error.png',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 72000000).toISOString(),
      comments: [
        {
          id: 'c-1001',
          author: 'Agente Soporte',
          role: 'admin',
          date: new Date(Date.now() - 72000000).toISOString(),
          text: 'Revisé la cola de impresión, parece que el driver necesita reinstalación. Programaré visita.',
          internal: true
        }
      ]
    }
  ];

  const categories = ['TI', 'Recursos Humanos', 'Instalaciones', 'Finanzas', 'Otro'];
  const priorities = ['Baja', 'Media', 'Alta', 'Crítica'];
  const statuses = ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado'];

  const statusMap = {
    Abierto: { className: 'open', dot: '#F4B400' },
    'En Proceso': { className: 'processing', dot: '#2979FF' },
    Resuelto: { className: 'resolved', dot: '#00C853' },
    Cerrado: { className: 'closed', dot: '#212121' }
  };

  function initStorage() {
    if (!localStorage.getItem(STORAGE_USERS)) {
      localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(STORAGE_TICKETS)) {
      localStorage.setItem(STORAGE_TICKETS, JSON.stringify(defaultTickets));
    }
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS)) || [];
  }

  function getTickets() {
    return JSON.parse(localStorage.getItem(STORAGE_TICKETS)) || [];
  }

  function saveTickets(tickets) {
    localStorage.setItem(STORAGE_TICKETS, JSON.stringify(tickets));
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  }

  function setCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function authenticate(email, password) {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase() && user.password === password) || null;
  }

  function requireAuth(allowedRoles = ['empleado', 'admin']) {
    initStorage();
    const session = getCurrentUser();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    if (!allowedRoles.includes(session.role)) {
      const target = session.role === 'admin' ? 'admin.html' : 'dashboard.html';
      window.location.href = target;
      return null;
    }
    return session;
  }

  function getTicketById(id) {
    return getTickets().find(ticket => ticket.id === id) || null;
  }

  function getUserById(id) {
    return getUsers().find(user => user.id === id) || null;
  }

  function createTicket({ title, category, priority, description, attachment, createdBy }) {
    const tickets = getTickets();
    const now = new Date().toISOString();
    const ticket = {
      id: `t-${Date.now()}`,
      title,
      category,
      priority,
      description,
      status: 'Abierto',
      createdBy,
      assignedTo: '',
      attachment: attachment || '',
      createdAt: now,
      updatedAt: now,
      comments: []
    };
    tickets.unshift(ticket);
    saveTickets(tickets);
    return ticket;
  }

  function updateTicket(id, data) {
    const tickets = getTickets();
    const index = tickets.findIndex(ticket => ticket.id === id);
    if (index === -1) return null;
    tickets[index] = {
      ...tickets[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    saveTickets(tickets);
    return tickets[index];
  }

  function addComment(ticketId, text, author, role, internal = false) {
    const tickets = getTickets();
    const index = tickets.findIndex(ticket => ticket.id === ticketId);
    if (index === -1) return null;
    const comment = {
      id: `c-${Date.now()}`,
      author,
      role,
      date: new Date().toISOString(),
      text,
      internal
    };
    tickets[index].comments.unshift(comment);
    tickets[index].updatedAt = new Date().toISOString();
    saveTickets(tickets);
    return comment;
  }

  function getAgents() {
    return getUsers().filter(user => user.role === 'admin');
  }

  function exportTicketsToCSV(tickets) {
    const rows = [
      ['ID', 'Título', 'Categoría', 'Prioridad', 'Estado', 'Creado Por', 'Asignado A', 'Creado', 'Actualizado']
    ];
    tickets.forEach(ticket => {
      const owner = getUserById(ticket.createdBy)?.nombre || ticket.createdBy;
      const agent = getUserById(ticket.assignedTo)?.nombre || ticket.assignedTo || 'Sin asignar';
      rows.push([
        ticket.id,
        ticket.title,
        ticket.category,
        ticket.priority,
        ticket.status,
        owner,
        agent,
        OPCUtils.formatDate(ticket.createdAt),
        OPCUtils.formatDate(ticket.updatedAt)
      ]);
    });
    return rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  function mapStatusClass(status) {
    return statusMap[status]?.className || 'open';
  }

  window.OPC = {
    initStorage,
    getUsers,
    getTickets,
    saveTickets,
    getCurrentUser,
    setCurrentUser,
    clearSession,
    authenticate,
    requireAuth,
    getTicketById,
    getUserById,
    createTicket,
    updateTicket,
    addComment,
    getAgents,
    exportTicketsToCSV,
    categories,
    priorities,
    statuses,
    mapStatusClass,
    getStatusMetadata: (status) => ({ status, className: statusMap[status]?.className || 'open' }),
    getPriorityLabel: (priority) => priority || '-'
  };
})();
