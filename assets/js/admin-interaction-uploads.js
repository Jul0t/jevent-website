(() => {
  "use strict";

  const API_URL =
    "https://api-beta.jevent.julot.fr";

  const elements = {
    refreshButton:
      document.querySelector(
        "#refreshInteractionUploadsButton"
      ),

    statusFilters: [
      ...document.querySelectorAll(
        "[data-upload-status]"
      )
    ],

    search:
      document.querySelector(
        "#interactionUploadSearch"
      ),

    message:
      document.querySelector(
        "#interactionUploadsMessage"
      ),

    list:
      document.querySelector(
        "#interactionUploadsList"
      ),

    empty:
      document.querySelector(
        "#interactionUploadsEmpty"
      ),

    pendingCount:
      document.querySelector(
        "#pendingUploadsCount"
      ),

    approvedCount:
      document.querySelector(
        "#approvedUploadsCount"
      ),

    rejectedCount:
      document.querySelector(
        "#rejectedUploadsCount"
      ),

    totalCount:
      document.querySelector(
        "#totalUploadsCount"
      ),

    dialog:
      document.querySelector(
        "#interactionUploadDialog"
      ),

    dialogTitle:
      document.querySelector(
        "#interactionUploadDialogTitle"
      ),

    closeDialogButton:
      document.querySelector(
        "#closeInteractionUploadDialog"
      ),

    image:
      document.querySelector(
        "#interactionUploadImage"
      ),

    imageLoading:
      document.querySelector(
        "#interactionUploadImageLoading"
      ),

    user:
      document.querySelector(
        "#interactionUploadUser"
      ),

    creator:
      document.querySelector(
        "#interactionUploadCreator"
      ),

    interaction:
      document.querySelector(
        "#interactionUploadInteraction"
      ),

    file:
      document.querySelector(
        "#interactionUploadFile"
      ),

    cost:
      document.querySelector(
        "#interactionUploadCost"
      ),

    date:
      document.querySelector(
        "#interactionUploadDate"
      ),

    status:
      document.querySelector(
        "#interactionUploadStatus"
      ),

    note:
      document.querySelector(
        "#interactionUploadModerationNote"
      ),

    dialogMessage:
      document.querySelector(
        "#interactionUploadDialogMessage"
      ),

    rejectButton:
      document.querySelector(
        "#rejectInteractionUploadButton"
      ),

    approveButton:
      document.querySelector(
        "#approveInteractionUploadButton"
      )
  };

  if (
    !elements.list ||
    !elements.dialog
  ) {
    return;
  }

  const state = {
    uploads: [],
    counts: {},
    selectedUpload: null,

    status: "pending",
    search: "",

    loading: false,
    moderating: false,

    searchTimer: null
  };

  const STATUS_LABELS = {
    pending:
      "En attente",

    approved:
      "Acceptée",

    rejected:
      "Refusée",

    cancelled:
      "Annulée"
  };

  /* =======================================================
     API
     ======================================================= */

  async function apiFetch(
    pathname,
    options = {}
  ) {
    const headers = {
      Accept:
        "application/json",

      ...(options.headers || {})
    };

    if (
      options.body &&
      typeof options.body ===
        "string"
    ) {
      headers["Content-Type"] =
        "application/json";
    }

    const response =
      await fetch(
        API_URL + pathname,
        {
          ...options,
          headers,
          credentials: "include"
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error =
        new Error(
          data.error ||
          data.message ||
          `Erreur HTTP ${response.status}`
        );

      error.status =
        response.status;

      error.data =
        data;

      throw error;
    }

    return data;
  }

  /* =======================================================
     OUTILS
     ======================================================= */

  function createElement(
    tagName,
    className = "",
    textContent = ""
  ) {
    const element =
      document.createElement(
        tagName
      );

    if (className) {
      element.className =
        className;
    }

    if (textContent) {
      element.textContent =
        textContent;
    }

    return element;
  }

  function formatNumber(value) {
    return Number(value || 0)
      .toLocaleString("fr-FR");
  }

  function formatCredits(
    cents
  ) {
    const credits =
      Number(cents || 0) / 100;

    const value =
      new Intl.NumberFormat(
        "fr-FR",
        {
          maximumFractionDigits: 2
        }
      ).format(credits);

    return (
      `${value} crédit` +
      (
        credits > 1 ||
        credits === 0
          ? "s"
          : ""
      )
    );
  }

  function formatFileSize(
    bytes
  ) {
    const size =
      Number(bytes || 0);

    if (size < 1024) {
      return `${size} octets`;
    }

    if (
      size <
      1024 * 1024
    ) {
      return (
        `${(
          size / 1024
        ).toFixed(1)} Ko`
      );
    }

    return (
      `${(
        size /
        1024 /
        1024
      ).toFixed(2)} Mo`
    );
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Paris"
      }
    ).format(date);
  }

  function userName(upload) {
    return (
      upload.user
        ?.twitchDisplayName ||
      upload.user
        ?.twitchLogin ||
      "Participant"
    );
  }

  function creatorName(upload) {
    return (
      upload.creator
        ?.displayName ||
      upload.creator
        ?.slug ||
      "Créateur inconnu"
    );
  }

  function interactionName(
    upload
  ) {
    return (
      upload.interaction
        ?.title ||
      "Interaction supprimée"
    );
  }

  function setMessage(
    message = "",
    type = ""
  ) {
    if (!elements.message) {
      return;
    }

    elements.message.textContent =
      message;

    elements.message.className =
      "admin-inline-message";

    elements.message.hidden =
      !message;

    if (type) {
      elements.message.classList.add(
        `is-${type}`
      );
    }
  }

  function setDialogMessage(
    message = "",
    type = ""
  ) {
    if (
      !elements.dialogMessage
    ) {
      return;
    }

    elements.dialogMessage
      .textContent =
        message;

    elements.dialogMessage
      .className =
        "admin-inline-message";

    elements.dialogMessage.hidden =
      !message;

    if (type) {
      elements.dialogMessage
        .classList.add(
          `is-${type}`
        );
    }
  }

  /* =======================================================
     COMPTEURS
     ======================================================= */

  function renderCounts() {
    const counts =
      state.counts || {};

    if (elements.pendingCount) {
      elements.pendingCount
        .textContent =
          formatNumber(
            counts.pending
          );
    }

    if (elements.approvedCount) {
      elements.approvedCount
        .textContent =
          formatNumber(
            counts.approved
          );
    }

    if (elements.rejectedCount) {
      elements.rejectedCount
        .textContent =
          formatNumber(
            counts.rejected
          );
    }

    if (elements.totalCount) {
      elements.totalCount
        .textContent =
          formatNumber(
            counts.total
          );
    }
  }

  function renderStatusFilters() {
    for (
      const button of
      elements.statusFilters
    ) {
      const active =
        button.dataset
          .uploadStatus ===
        state.status;

      button.classList.toggle(
        "is-active",
        active
      );

      button.setAttribute(
        "aria-pressed",
        String(active)
      );
    }
  }

  /* =======================================================
     LISTE
     ======================================================= */

  function createStatusBadge(
    status
  ) {
    const badge =
      createElement(
        "span",
        (
          "interaction-upload-status " +
          `is-${status}`
        ),
        STATUS_LABELS[status] ||
        status
      );

    return badge;
  }

  function createUploadCard(
    upload
  ) {
    const card =
      createElement(
        "article",
        "interaction-upload-card"
      );

    card.classList.add(
      `is-${upload.status}`
    );

    const icon =
      createElement(
        "div",
        "interaction-upload-card-icon"
      );

    icon.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="3"
        ></rect>

        <circle
          cx="9"
          cy="10"
          r="2"
        ></circle>

        <path
          d="m5 18 5-5 3 3 2-2 4 4"
        ></path>
      </svg>
    `;

    const content =
      createElement(
        "div",
        "interaction-upload-card-content"
      );

    const heading =
      createElement(
        "div",
        "interaction-upload-card-heading"
      );

    const title =
      createElement(
        "h3",
        "",
        upload.originalName ||
        "Image"
      );

    heading.append(
      title,
      createStatusBadge(
        upload.status
      )
    );

    const context =
      createElement(
        "p",
        "interaction-upload-card-context"
      );

    context.textContent =
      (
        `${userName(upload)} → ` +
        `${creatorName(upload)}`
      );

    const metadata =
      createElement(
        "div",
        "interaction-upload-card-metadata"
      );

    metadata.append(
      createElement(
        "span",
        "",
        interactionName(upload)
      ),

      createElement(
        "span",
        "",
        formatFileSize(
          upload.fileSizeBytes
        )
      ),

      createElement(
        "span",
        "",
        formatCredits(
          upload.creditCostCents
        )
      ),

      createElement(
        "span",
        "",
        formatDate(
          upload.createdAt
        )
      )
    );

    content.append(
      heading,
      context,
      metadata
    );

    if (
      upload.moderationNote
    ) {
      const note =
        createElement(
          "p",
          "interaction-upload-card-note",
          upload.moderationNote
        );

      content.append(note);
    }

    const button =
      createElement(
        "button",
        "button button-secondary",
        upload.status ===
          "pending"
          ? "Modérer"
          : "Consulter"
      );

    button.type = "button";

    button.addEventListener(
      "click",
      () => {
        openUploadDialog(
          upload
        );
      }
    );

    card.append(
      icon,
      content,
      button
    );

    return card;
  }

  function renderUploads() {
    elements.list
      .replaceChildren();

    const hasUploads =
      state.uploads.length > 0;

    if (elements.empty) {
      elements.empty.hidden =
        hasUploads;
    }

    if (!hasUploads) {
      return;
    }

    for (
      const upload of
      state.uploads
    ) {
      elements.list.append(
        createUploadCard(
          upload
        )
      );
    }
  }

  /* =======================================================
     CHARGEMENT
     ======================================================= */

  async function loadUploads({
    silent = false
  } = {}) {
    if (state.loading) {
      return;
    }

    state.loading = true;

    if (
      elements.refreshButton
    ) {
      elements.refreshButton
        .disabled = true;

      elements.refreshButton
        .textContent =
          "Actualisation…";
    }

    if (!silent) {
      setMessage(
        "Chargement des participations…"
      );
    }

    try {
      const parameters =
        new URLSearchParams();

      parameters.set(
        "status",
        state.status
      );

      if (state.search) {
        parameters.set(
          "search",
          state.search
        );
      }

      const data =
        await apiFetch(
          (
            "/api/admin/" +
            "interaction-uploads?" +
            parameters.toString()
          )
        );

      state.uploads =
        Array.isArray(
          data.uploads
        )
          ? data.uploads
          : [];

      state.counts =
        data.counts || {};

      renderCounts();
      renderStatusFilters();
      renderUploads();

      if (!silent) {
        setMessage(
          "Participations actualisées.",
          "success"
        );
      }
    } catch (error) {
      console.error(
        "Impossible de charger les participations :",
        error
      );

      setMessage(
        error.message,
        "error"
      );
    } finally {
      state.loading = false;

      if (
        elements.refreshButton
      ) {
        elements.refreshButton
          .disabled = false;

        elements.refreshButton
          .textContent =
            "Actualiser";
      }
    }
  }

  /* =======================================================
     DIALOGUE
     ======================================================= */

  function resetImagePreview() {
    if (elements.image) {
      elements.image.hidden =
        true;

      elements.image
        .removeAttribute(
          "src"
        );

      elements.image.onload =
        null;

      elements.image.onerror =
        null;
    }

    if (
      elements.imageLoading
    ) {
      elements.imageLoading
        .hidden = false;

      elements.imageLoading
        .textContent =
          "Chargement de l’image…";
    }
  }

  function loadImagePreview(
    upload
  ) {
    resetImagePreview();

    if (
      !elements.image ||
      !upload.fileUrl
    ) {
      if (
        elements.imageLoading
      ) {
        elements.imageLoading
          .textContent =
            "Image indisponible.";
      }

      return;
    }

    elements.image.onload =
      () => {
        elements.image.hidden =
          false;

        if (
          elements.imageLoading
        ) {
          elements.imageLoading
            .hidden = true;
        }
      };

    elements.image.onerror =
      () => {
        elements.image.hidden =
          true;

        if (
          elements.imageLoading
        ) {
          elements.imageLoading
            .hidden = false;

          elements.imageLoading
            .textContent =
              "Impossible de charger l’image.";
        }
      };

    const separator =
      upload.fileUrl.includes("?")
        ? "&"
        : "?";

    elements.image.src =
      (
        upload.fileUrl +
        separator +
        "version=" +
        encodeURIComponent(
          upload.updatedAt ||
          upload.createdAt ||
          Date.now()
        )
      );
  }

  function updateDialogActions(
    upload
  ) {
    const pending =
      upload.status ===
      "pending";

    if (elements.note) {
      elements.note.value =
        upload.moderationNote ||
        "";

      elements.note.disabled =
        !pending;
    }

    if (
      elements.approveButton
    ) {
      elements.approveButton
        .hidden =
          !pending;

      elements.approveButton
        .disabled =
          state.moderating;
    }

    if (
      elements.rejectButton
    ) {
      elements.rejectButton
        .hidden =
          !pending;

      elements.rejectButton
        .disabled =
          state.moderating;
    }
  }

  function openUploadDialog(
    upload
  ) {
    state.selectedUpload =
      upload;

    setDialogMessage();

    if (elements.dialogTitle) {
      elements.dialogTitle
        .textContent =
          upload.originalName ||
          "Participation";
    }

    if (elements.user) {
      elements.user.textContent =
        userName(upload);
    }

    if (elements.creator) {
      elements.creator.textContent =
        creatorName(upload);
    }

    if (elements.interaction) {
      elements.interaction
        .textContent =
          interactionName(
            upload
          );
    }

    if (elements.file) {
      elements.file.textContent =
        (
          `${upload.originalName} · ` +
          formatFileSize(
            upload.fileSizeBytes
          )
        );
    }

    if (elements.cost) {
      elements.cost.textContent =
        formatCredits(
          upload.creditCostCents
        );

      if (
        upload.creditRefunded
      ) {
        elements.cost.textContent +=
          " — remboursés";
      }
    }

    if (elements.date) {
      elements.date.textContent =
        formatDate(
          upload.createdAt
        );
    }

    if (elements.status) {
      elements.status
        .replaceChildren(
          createStatusBadge(
            upload.status
          )
        );
    }

    updateDialogActions(
      upload
    );

    loadImagePreview(
      upload
    );

    if (
      typeof elements.dialog
        .showModal === "function"
    ) {
      elements.dialog.showModal();
    } else {
      elements.dialog
        .setAttribute(
          "open",
          ""
        );
    }
  }

  function closeUploadDialog() {
    if (state.moderating) {
      return;
    }

    resetImagePreview();

    state.selectedUpload =
      null;

    setDialogMessage();

    if (
      elements.dialog.open &&
      typeof elements.dialog
        .close === "function"
    ) {
      elements.dialog.close();
    } else {
      elements.dialog
        .removeAttribute(
          "open"
        );
    }
  }

  /* =======================================================
     MODÉRATION
     ======================================================= */

  async function moderateUpload(
    action
  ) {
    const upload =
      state.selectedUpload;

    if (
      !upload ||
      state.moderating
    ) {
      return;
    }

    const note =
      elements.note
        ?.value
        .trim() || "";

    if (
      action === "reject" &&
      !note
    ) {
      setDialogMessage(
        "Indique la raison du refus.",
        "error"
      );

      elements.note?.focus();

      return;
    }

    state.moderating =
      true;

    if (
      elements.approveButton
    ) {
      elements.approveButton
        .disabled = true;
    }

    if (
      elements.rejectButton
    ) {
      elements.rejectButton
        .disabled = true;
    }

    setDialogMessage(
      action === "approve"
        ? "Acceptation en cours…"
        : "Refus et remboursement en cours…"
    );

    try {
      await apiFetch(
        (
          "/api/admin/" +
          "interaction-uploads/" +
          encodeURIComponent(
            upload.publicId
          ) +
          "/moderate"
        ),
        {
          method: "PUT",

          body:
            JSON.stringify({
              action,
              note
            })
        }
      );

      closeUploadDialogForced();

      await loadUploads({
        silent: true
      });

      setMessage(
        action === "approve"
          ? "Participation acceptée."
          : (
              "Participation refusée " +
              "et crédits remboursés."
            ),
        "success"
      );
    } catch (error) {
      setDialogMessage(
        error.message,
        "error"
      );
    } finally {
      state.moderating =
        false;

      if (
        state.selectedUpload
      ) {
        updateDialogActions(
          state.selectedUpload
        );
      }
    }
  }

  function closeUploadDialogForced() {
    resetImagePreview();

    state.selectedUpload =
      null;

    setDialogMessage();

    if (
      elements.dialog.open &&
      typeof elements.dialog
        .close === "function"
    ) {
      elements.dialog.close();
    } else {
      elements.dialog
        .removeAttribute(
          "open"
        );
    }
  }

  /* =======================================================
     ÉVÉNEMENTS
     ======================================================= */

  elements.refreshButton
    ?.addEventListener(
      "click",
      () => {
        void loadUploads();
      }
    );

  for (
    const button of
    elements.statusFilters
  ) {
    button.addEventListener(
      "click",
      () => {
        state.status =
          button.dataset
            .uploadStatus ||
          "pending";

        renderStatusFilters();

        void loadUploads();
      }
    );
  }

  elements.search
    ?.addEventListener(
      "input",
      event => {
        window.clearTimeout(
          state.searchTimer
        );

        state.searchTimer =
          window.setTimeout(
            () => {
              state.search =
                event.target
                  .value
                  .trim();

              void loadUploads({
                silent: true
              });
            },
            350
          );
      }
    );

  elements.closeDialogButton
    ?.addEventListener(
      "click",
      closeUploadDialog
    );

  elements.dialog
    ?.addEventListener(
      "cancel",
      event => {
        event.preventDefault();

        closeUploadDialog();
      }
    );

  elements.dialog
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          elements.dialog
        ) {
          closeUploadDialog();
        }
      }
    );

  elements.approveButton
    ?.addEventListener(
      "click",
      () => {
        void moderateUpload(
          "approve"
        );
      }
    );

  elements.rejectButton
    ?.addEventListener(
      "click",
      () => {
        void moderateUpload(
          "reject"
        );
      }
    );

  document
    .querySelector(
      "#refreshButton"
    )
    ?.addEventListener(
      "click",
      () => {
        void loadUploads({
          silent: true
        });
      }
    );

  void loadUploads();
})();