(() => {
  "use strict";

  const API_URL =
    "https://api-beta.jevent.julot.fr";

  const elements = {
    grid:
      document.querySelector(
        "#dashboardGrid"
      ),

    editor:
      document.querySelector(
        "#dashboardEditor"
      ),

    customizeButton:
      document.querySelector(
        "#customizeDashboardButton"
      ),

    availableWidgets:
      document.querySelector(
        "#dashboardAvailableWidgets"
      ),

    resetButton:
      document.querySelector(
        "#resetDashboardButton"
      ),

    status:
      document.querySelector(
        "#dashboardStatus"
      ),

    empty:
      document.querySelector(
        "#dashboardEmpty"
      ),

    refreshButton:
      document.querySelector(
        "#refreshButton"
      ),

    raisedAmount:
      document.querySelector(
        "#dashboardRaisedAmount"
      ),

    messagesCount:
      document.querySelector(
        "#dashboardMessagesCount"
      ),

    emotesCount:
      document.querySelector(
        "#dashboardEmotesCount"
      ),

    goalsCount:
      document.querySelector(
        "#dashboardGoalsCount"
      ),

    programEntriesCount:
      document.querySelector(
        "#dashboardProgramEntriesCount"
      ),

    streamlabsCount:
      document.querySelector(
        "#dashboardStreamlabsCount"
      )
  };

  if (!elements.grid) {
    return;
  }

  const widgets =
    new Map(
      [
        ...elements.grid.querySelectorAll(
          "[data-dashboard-widget]"
        )
      ].map(widget => [
        widget.dataset.dashboardWidget,
        widget
      ])
    );

  let layout =
    [...widgets.keys()];

  let defaultLayout =
    [...layout];

  let editing = false;
  let draggedWidgetId = null;

  async function apiFetch(
    path,
    options = {}
  ) {
    const response =
      await fetch(
        API_URL + path,
        {
          credentials: "include",

          headers: {
            Accept: "application/json",

            ...(options.body
              ? {
                  "Content-Type":
                    "application/json"
                }
              : {}),

            ...(options.headers ?? {})
          },

          ...options
        }
      );

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.error ??
        data.message ??
        `Erreur HTTP ${response.status}`
      );
    }

    return data;
  }

  function normalizeLayout(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    const normalized = [];

    for (const widgetId of value) {
      const id =
        String(widgetId ?? "").trim();

      if (
        widgets.has(id) &&
        !normalized.includes(id)
      ) {
        normalized.push(id);
      }
    }

    return normalized;
  }

  function showStatus(
    message = "",
    type = ""
  ) {
    if (!elements.status) {
      return;
    }

    elements.status.textContent =
      message;

    elements.status.className =
      "dashboard-status";

    elements.status.hidden =
      !message;

    if (type) {
      elements.status.classList.add(
        `is-${type}`
      );
    }
  }

  function formatNumber(value) {
    return Number(value ?? 0)
      .toLocaleString("fr-FR");
  }

  function formatMoney(value) {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency: "EUR"
      }
    ).format(
      Number(value ?? 0) / 100
    );
  }

  function readLayoutFromGrid() {
    return [
      ...elements.grid.querySelectorAll(
        ".dashboard-widget:not([hidden])"
      )
    ].map(
      widget =>
        widget.dataset.dashboardWidget
    );
  }

  function applyLayout(nextLayout) {
    layout =
      normalizeLayout(nextLayout);

    for (
      const [widgetId, widget]
      of widgets
    ) {
      widget.hidden =
        !layout.includes(widgetId);
    }

    for (const widgetId of layout) {
      const widget =
        widgets.get(widgetId);

      if (widget) {
        elements.grid.append(widget);
      }
    }

    elements.empty.hidden =
      layout.length !== 0;

    renderAvailableWidgets();
  }

  function renderAvailableWidgets() {
    elements.availableWidgets
      .replaceChildren();

    const hiddenWidgets =
      [...widgets.keys()].filter(
        widgetId =>
          !layout.includes(widgetId)
      );

    if (hiddenWidgets.length === 0) {
      const message =
        document.createElement("span");

      message.className =
        "dashboard-no-widget";

      message.textContent =
        "Tous les blocs sont affichés.";

      elements.availableWidgets.append(
        message
      );

      return;
    }

    for (
      const widgetId
      of hiddenWidgets
    ) {
      const widget =
        widgets.get(widgetId);

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "dashboard-add-widget";

      button.textContent =
        `+ ${
          widget.dataset.dashboardLabel
        }`;

      button.addEventListener(
        "click",
        async () => {
          applyLayout([
            ...layout,
            widgetId
          ]);

          await saveLayout();
        }
      );

      elements.availableWidgets.append(
        button
      );
    }
  }

  async function saveLayout() {
    try {
      showStatus(
        "Enregistrement…"
      );

      const result =
        await apiFetch(
          "/api/admin/dashboard/preferences",
          {
            method: "PUT",

            body: JSON.stringify({
              layout
            })
          }
        );

      layout =
        normalizeLayout(
          result.layout
        );

      applyLayout(layout);

      showStatus(
        "Disposition enregistrée.",
        "success"
      );
    } catch (error) {
      showStatus(
        error.message,
        "error"
      );
    }
  }

  function setEditing(value) {
    editing = Boolean(value);

    elements.grid.classList.toggle(
      "is-editing",
      editing
    );

    elements.editor.hidden =
      !editing;

    elements.customizeButton.textContent =
      editing
        ? "Terminer"
        : "Personnaliser";

    for (const widget of widgets.values()) {
      widget.draggable =
        editing && !widget.hidden;
    }

    renderAvailableWidgets();
  }

  function createWidgetControls(
    widgetId,
    widget
  ) {
    const controls =
      document.createElement("div");

    controls.className =
      "dashboard-widget-controls";

    const dragButton =
      document.createElement("button");

    dragButton.type = "button";
    dragButton.className =
      "dashboard-drag-handle";

    dragButton.title =
      "Déplacer ce bloc";

    dragButton.setAttribute(
      "aria-label",
      "Déplacer ce bloc"
    );

    dragButton.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M9 5.5a1.5 1.5 0 1 1-3 0
             1.5 1.5 0 0 1 3 0Zm0 6.5
             a1.5 1.5 0 1 1-3 0
             1.5 1.5 0 0 1 3 0Zm0 6.5
             a1.5 1.5 0 1 1-3 0
             1.5 1.5 0 0 1 3 0Zm9-13
             a1.5 1.5 0 1 1-3 0
             1.5 1.5 0 0 1 3 0ZM18 12
             a1.5 1.5 0 1 1-3 0
             1.5 1.5 0 0 1 3 0Zm0 6.5
             a1.5 1.5 0 1 1-3 0
             1.5 1.5 0 0 1 3 0Z"
          fill="currentColor"
        />
      </svg>
    `;

    const removeButton =
      document.createElement("button");

    removeButton.type = "button";

    removeButton.className =
      "dashboard-remove-widget";

    removeButton.title =
      "Masquer ce bloc";

    removeButton.setAttribute(
      "aria-label",
      `Masquer ${
        widget.dataset.dashboardLabel
      }`
    );

    removeButton.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M6 6l12 12M18 6 6 18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    `;

    removeButton.addEventListener(
      "click",
      async () => {
        layout =
          layout.filter(
            id => id !== widgetId
          );

        applyLayout(layout);

        await saveLayout();
      }
    );

    controls.append(
      dragButton,
      removeButton
    );

    widget.prepend(controls);
  }

  function installDragAndDrop(
    widgetId,
    widget
  ) {
    widget.addEventListener(
      "dragstart",
      event => {
        if (!editing) {
          event.preventDefault();
          return;
        }

        draggedWidgetId =
          widgetId;

        widget.classList.add(
          "is-dragging"
        );

        event.dataTransfer.effectAllowed =
          "move";

        event.dataTransfer.setData(
          "text/plain",
          widgetId
        );
      }
    );

    widget.addEventListener(
      "dragover",
      event => {
        if (
          !editing ||
          !draggedWidgetId ||
          draggedWidgetId === widgetId
        ) {
          return;
        }

        event.preventDefault();

        const draggedWidget =
          widgets.get(
            draggedWidgetId
          );

        if (!draggedWidget) {
          return;
        }

        const rectangle =
          widget.getBoundingClientRect();

        const centerX =
          rectangle.left +
          rectangle.width / 2;

        const centerY =
          rectangle.top +
          rectangle.height / 2;

        const verticalDistance =
          event.clientY - centerY;

        const insertAfter =
          Math.abs(verticalDistance) >
            rectangle.height * 0.25
            ? verticalDistance > 0
            : event.clientX > centerX;

        elements.grid.insertBefore(
          draggedWidget,
          insertAfter
            ? widget.nextSibling
            : widget
        );
      }
    );

    widget.addEventListener(
      "dragend",
      async () => {
        widget.classList.remove(
          "is-dragging"
        );

        draggedWidgetId = null;

        layout =
          readLayoutFromGrid();

        await saveLayout();
      }
    );
  }

  async function loadPreferences() {
    const data =
      await apiFetch(
        "/api/admin/dashboard/preferences"
      );

    defaultLayout =
      normalizeLayout(
        data.defaultLayout
      );

    layout =
      normalizeLayout(
        data.layout
      );

    applyLayout(layout);
  }

  async function loadDashboardStats() {
    const data =
      await apiFetch(
        "/api/admin/stats/overview"
      );

    const overview =
      data.overview ?? {};

    elements.raisedAmount.textContent =
      formatMoney(
        overview.raisedCents
      );

    elements.messagesCount.textContent =
      formatNumber(
        overview.messages
      );

    elements.emotesCount.textContent =
      formatNumber(
        overview.emotes
      );

    elements.goalsCount.textContent =
      formatNumber(
        overview.goals
      );

    elements.programEntriesCount.textContent =
      formatNumber(
        overview.programEntries
      );

    elements.streamlabsCount.textContent =
      formatNumber(
        overview.streamlabsConfigured
      );
  }

  for (
    const [widgetId, widget]
    of widgets
  ) {
    createWidgetControls(
      widgetId,
      widget
    );

    installDragAndDrop(
      widgetId,
      widget
    );
  }

  elements.customizeButton.addEventListener(
    "click",
    () => {
      setEditing(!editing);
    }
  );

  elements.resetButton.addEventListener(
    "click",
    async () => {
      applyLayout(defaultLayout);
      await saveLayout();
    }
  );

  elements.refreshButton?.addEventListener(
    "click",
    () => {
      void loadDashboardStats();
    }
  );

  async function init() {
    try {
      await loadPreferences();
      await loadDashboardStats();
    } catch (error) {
      showStatus(
        error.message,
        "error"
      );

      applyLayout(
        [...widgets.keys()]
      );
    }
  }

  void init();
})();