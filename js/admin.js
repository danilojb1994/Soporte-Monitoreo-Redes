(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.OPC) return;
    const user = OPC.requireAuth(['admin']);
    if (!user) return;

    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.nombre);
    document.querySelectorAll('.user-role').forEach(el => el.textContent = 'Administrador');

    const filters = {
      state: document.getElementById('filterEstado'),
      category: document.getElementById('filterCategoria'),
      priority: document.getElementById('filterPrioridad'),
      search: document.getElementById('searchTicket')
    };

    const exportButton = document.getElementById('exportCsvBtn');
    const tableBody = document.getElementById('adminTicketBody');

    const loadFilters = () => {
      const createOptions = (element, values) => {
        element.innerHTML = '<option value="">Todos</option>' + values.map(value => `<option value="${value}">${value}</option>`).join('');
      };
      createOptions(filters.state, OPC.statuses);
      createOptions(filters.category, OPC.categories);
      createOptions(filters.priority, OPC.priorities);
    };

    const getFilteredTickets = () => {
      let tickets = OPC.getTickets();
      if (filters.state.value) tickets = tickets.filter(ticket => ticket.status === filters.state.value);
      if (filters.category.value) tickets = tickets.filter(ticket => ticket.category === filters.category.value);
      if (filters.priority.value) tickets = tickets.filter(ticket => ticket.priority === filters.priority.value);
      if (filters.search.value.trim()) {
        const search = filters.search.value.trim().toLowerCase();
        tickets = tickets.filter(ticket =>
          ticket.title.toLowerCase().includes(search) ||
          ticket.description.toLowerCase().includes(search) ||
          ticket.id.toLowerCase().includes(search)
        );
      }
      return tickets;
    };

    const renderTickets = () => {
      const tickets = getFilteredTickets();
      if (!tickets.length) {
        tableBody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><strong>No hay tickets para mostrar.</strong><p>Ajusta los filtros o crea un nuevo ticket para comenzar.</p></div></td></tr>';
        return;
      }

      tableBody.innerHTML = tickets.map(ticket => {
        const assignee = ticket.assignedTo ? OPC.getUserById(ticket.assignedTo)?.nombre || 'Sin asignar' : 'Sin asignar';
        return `
          <tr data-id="${ticket.id}">
            <td><a class="link-button" href="detalle-ticket.html?id=${ticket.id}">${ticket.id}</a></td>
            <td>${ticket.title}</td>
            <td>${ticket.category}</td>
            <td>${ticket.priority}</td>
            <td><span class="badge ${OPC.mapStatusClass(ticket.status)}">${ticket.status}</span></td>
            <td>${assignee}</td>
            <td>
              <div class="filter-row">
                <select class="state-select">
                  ${OPC.statuses.map(status => `<option value="${status}" ${status === ticket.status ? 'selected' : ''}>${status}</option>`).join('')}
                </select>
                <select class="agent-select">
                  <option value="">Sin asignar</option>
                  ${OPC.getAgents().map(agent => `<option value="${agent.id}" ${agent.id === ticket.assignedTo ? 'selected' : ''}>${agent.nombre}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-top:12px;">
                <textarea class="comment-input" rows="3" placeholder="Nota interna"></textarea>
              </div>
              <button class="btn secondary save-note-btn">Guardar nota</button>
            </td>
          </tr>`;
      }).join('');

      bindTableActions();
    };

    const bindTableActions = () => {
      tableBody.querySelectorAll('tr').forEach(row => {
        const ticketId = row.dataset.id;
        const stateSelect = row.querySelector('.state-select');
        const agentSelect = row.querySelector('.agent-select');
        const saveNoteBtn = row.querySelector('.save-note-btn');
        const commentInput = row.querySelector('.comment-input');

        stateSelect.addEventListener('change', () => {
          OPC.updateTicket(ticketId, { status: stateSelect.value });
          showToast('Estado del ticket actualizado.', 'success');
          renderTickets();
        });

        agentSelect.addEventListener('change', () => {
          OPC.updateTicket(ticketId, { assignedTo: agentSelect.value });
          showToast('Asignación actualizada.', 'success');
          renderTickets();
        });

        saveNoteBtn.addEventListener('click', () => {
          const note = commentInput.value.trim();
          if (!note) {
            showToast('Ingresa una nota antes de guardar.', 'error');
            return;
          }
          OPC.addComment(ticketId, note, user.nombre, user.role, true);
          showToast('Nota interna agregada.', 'success');
          commentInput.value = '';
          renderTickets();
        });
      });
    };

    filters.state.addEventListener('change', renderTickets);
    filters.category.addEventListener('change', renderTickets);
    filters.priority.addEventListener('change', renderTickets);
    filters.search.addEventListener('input', renderTickets);
    exportButton.addEventListener('click', () => {
      const csv = OPC.exportTicketsToCSV(getFilteredTickets());
      OPCUtils.createDownloadFile('tickets-opc.csv', csv);
      showToast('Exportación CSV lista.', 'success');
    });

    loadFilters();
    renderTickets();
  });
})();
