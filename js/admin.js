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
              <button class="edit-actions-btn btn secondary" style="font-size: 0.9rem; padding: 8px 14px;">Editar</button>
            </td>
          </tr>
          <tr class="actions-row" style="display: none;" data-id="${ticket.id}">
            <td colspan="7" style="padding: 16px;">
              <div style="display: grid; gap: 12px; max-width: 800px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="display: block; margin-bottom: 6px; font-size: 0.9rem;">Estado</label>
                    <select class="state-select" style="padding: 10px 12px; font-size: 0.9rem;">
                      ${OPC.statuses.map(status => `<option value="${status}" ${status === ticket.status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="display: block; margin-bottom: 6px; font-size: 0.9rem;">Asignar a</label>
                    <select class="agent-select" style="padding: 10px 12px; font-size: 0.9rem;">
                      <option value="">Sin asignar</option>
                      ${OPC.getAgents().map(agent => `<option value="${agent.id}" ${agent.id === ticket.assignedTo ? 'selected' : ''}>${agent.nombre}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label style="display: block; margin-bottom: 6px; font-size: 0.9rem;">Nota interna</label>
                  <textarea class="comment-input" rows="3" placeholder="Agrega una nota..."></textarea>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <button class="save-note-btn btn" style="padding: 10px 16px; font-size: 0.9rem;">Guardar cambios</button>
                  <button class="close-actions-btn btn secondary" style="padding: 10px 16px; font-size: 0.9rem;">Cancelar</button>
                </div>
              </div>
            </td>
          </tr>`;
      }).join('');

      bindTableActions();
    };

    const bindTableActions = () => {
      tableBody.querySelectorAll('tr').forEach(row => {
        const ticketId = row.dataset.id;
        const editBtn = row.querySelector('.edit-actions-btn');

        if (!editBtn) return;

        editBtn.addEventListener('click', () => {
          const actionsRow = tableBody.querySelector(`.actions-row[data-id="${ticketId}"]`);
          if (actionsRow) {
            actionsRow.style.display = '';
            attachActionHandlers(ticketId);
          }
        });
      });

      tableBody.querySelectorAll('.close-actions-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const row = btn.closest('.actions-row');
          if (row) row.style.display = 'none';
        });
      });
    };

    const attachActionHandlers = (ticketId) => {
      const actionsRow = tableBody.querySelector(`.actions-row[data-id="${ticketId}"]`);
      if (!actionsRow) return;

      const stateSelect = actionsRow.querySelector('.state-select');
      const agentSelect = actionsRow.querySelector('.agent-select');
      const saveNoteBtn = actionsRow.querySelector('.save-note-btn');
      const commentInput = actionsRow.querySelector('.comment-input');

      saveNoteBtn.addEventListener('click', () => {
        const note = commentInput.value.trim();

        OPC.updateTicket(ticketId, {
          status: stateSelect.value,
          assignedTo: agentSelect.value
        });

        if (note) {
          OPC.addComment(ticketId, note, user.nombre, user.role, true);
          showToast('Cambios guardados.', 'success');
        } else {
          showToast('Estado y asignación actualizados.', 'success');
        }

        renderTickets();
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
