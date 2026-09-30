(() => {
  "use strict";

  const API_URL =
    "https://api-beta.jevent.julot.fr";

  const elements = {
    panel:
      document.querySelector(
        '[data-panel="interactions"]'
      ),

    createButton:
      document.querySelector(
        "#createInteractionButton"
      ),

    message:
      document.querySelector(
        "#interactionsMessage"
      ),

    interactionsCount:
      document.querySelector(
        "#interactionsCount"
      ),

    activeInteractionsCount:
      document.querySelector(
        "#activeInteractionsCount"
      ),

    usagesCount:
      document.querySelector(
        "#interactionUsagesCount"
      ),

    searchInput:
      document.querySelector(
        "#interactionSearchInput"
      ),

    creatorFilters:
      document.querySelector(
        "#interactionCreatorFilters"
      ),

    stateFilters: [
      ...document.querySelectorAll(
        "[data-interaction-filter]"
      )
    ],

    resultDescription:
      document.querySelector(
        "#interactionsResultDescription"
      ),

    list:
      document.querySelector(
        "#interactionsList"
      ),

    empty:
      document.querySelector(
        "#interactionsEmpty"
      ),

    refreshButton:
      document.querySelector(
        "#refreshButton"
      ),

    dialog:
      document.querySelector(
        "#interactionDialog"
      ),

    form:
      document.querySelector(
        "#interactionForm"
      ),

    dialogEyebrow:
      document.querySelector(
        "#interactionDialogEyebrow"
      ),

    dialogTitle:
      document.querySelector(
        "#interactionDialogTitle"
      ),

    closeDialogButton:
      document.querySelector(
        "#closeInteractionDialog"
      ),

    cancelButton:
      document.querySelector(
        "#cancelInteractionButton"
      ),

    deleteButton:
      document.querySelector(
        "#deleteInteractionButton"
      ),

    saveButton:
      document.querySelector(
        "#saveInteractionButton"
      ),

    formMessage:
      document.querySelector(
        "#interactionFormMessage"
      ),

    publicId:
      document.querySelector(
        "#interactionPublicId"
      ),

    creator:
      document.querySelector(
        "#interactionCreator"
      ),

    title:
      document.querySelector(
        "#interactionTitle"
      ),

    slug:
      document.querySelector(
        "#interactionSlug"
      ),

    description:
      document.querySelector(
        "#interactionDescription"
      ),

    type:
      document.querySelector(
        "#interactionType"
      ),

    cost:
      document.querySelector(
        "#interactionCost"
      ),

    displayOrder:
      document.querySelector(
        "#interactionDisplayOrder"
      ),

    imageSettings:
      document.querySelector(
        "#interactionImageSettings"
      ),

    maximumFileSize:
      document.querySelector(
        "#interactionMaximumFileSize"
      ),

    allowJpeg:
      document.querySelector(
        "#interactionAllowJpeg"
      ),

    allowPng:
      document.querySelector(
        "#interactionAllowPng"
      ),

    allowWebp:
      document.querySelector(
        "#interactionAllowWebp"
      ),

    opensAt:
      document.querySelector(
        "#interactionOpensAt"
      ),

    closesAt:
      document.querySelector(
        "#interactionClosesAt"
      ),

    moderationRequired:
      document.querySelector(
        "#interactionModerationRequired"
      ),

    visible:
      document.querySelector(
        "#interactionVisible"
      ),

    enabled:
      document.querySelector(
        "#interactionEnabled"
      )
  };

  if (!elements.panel) {
    return;
  }

  let creators = [];
  let interactions = [];

  let selectedCreatorId = null;
  let selectedState = "all";
  let searchValue = "";

  let saving = false;
  let slugManuallyEdited = false;

  const TYPE_LABELS = {
    image: "Image",
    text: "Message texte",
    code: "Code ou commande",
    sound: "Son",
    advanced: "Interaction avancée"
  };

  /*
   * =======================================================
   * API
   * =======================================================
   */

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
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error =
        new Error(
          data.error ??
          data.message ??
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

  /*
   * =======================================================
   * Outils
   * =======================================================
   */

  function createElement(
    tagName,
    className = "",
    text = ""
  ) {
    const element =
      document.createElement(tagName);

    if (className) {
      element.className =
        className;
    }

    if (text !== "") {
      element.textContent =
        text;
    }

    return element;
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  function normalizeSlug(value) {
    return normalizeText(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function formatNumber(value) {
    return Number(value ?? 0)
      .toLocaleString("fr-FR");
  }

  function formatCreditsFromCents(
    value
  ) {
    const credits =
      Number(value ?? 0) / 100;

    return (
      new Intl.NumberFormat(
        "fr-FR",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      ).format(credits) +
      ` crédit${credits > 1 ? "s" : ""}`
    );
  }

  function formatDateTime(value) {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(date);
  }

  function toDateTimeLocal(value) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const localDate =
      new Date(
        date.getTime() -
        date.getTimezoneOffset() *
        60_000
      );

    return localDate
      .toISOString()
      .slice(0, 16);
  }

  function toIsoDate(value) {
    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date.toISOString();
  }

  function interactionTypeLabel(type) {
    return (
      TYPE_LABELS[type] ??
      "Interaction"
    );
  }

  function creatorName(creator) {
    return (
      creator?.displayName ??
      creator?.twitchLogin ??
      creator?.slug ??
      "Créateur"
    );
  }

  function creatorAvatar(creator) {
    return (
      creator?.profileImageUrl ??
      "/assets/jevent_logo.png"
    );
  }

  function findCreator(creatorId) {
    return (
      creators.find(
        creator =>
          Number(creator.id) ===
          Number(creatorId)
      ) ?? null
    );
  }

  function interactionIsOpen(
    interaction
  ) {
    const now =
      Date.now();

    if (interaction.opensAt) {
      const opensAt =
        new Date(
          interaction.opensAt
        ).getTime();

      if (
        Number.isFinite(opensAt) &&
        now < opensAt
      ) {
        return false;
      }
    }

    if (interaction.closesAt) {
      const closesAt =
        new Date(
          interaction.closesAt
        ).getTime();

      if (
        Number.isFinite(closesAt) &&
        now >= closesAt
      ) {
        return false;
      }
    }

    return true;
  }

  function showMessage(
    message = "",
    type = ""
  ) {
    if (!elements.message) {
      return;
    }

    elements.message.textContent =
      message;

    elements.message.className =
      "interactions-message";

    elements.message.hidden =
      !message;

    if (type) {
      elements.message.classList.add(
        `is-${type}`
      );
    }
  }

  function showFormMessage(
    message = "",
    type = ""
  ) {
    if (!elements.formMessage) {
      return;
    }

    elements.formMessage.textContent =
      message;

    elements.formMessage.className =
      "interaction-form-message";

    elements.formMessage.hidden =
      !message;

    if (type) {
      elements.formMessage.classList.add(
        `is-${type}`
      );
    }
  }

  /*
   * =======================================================
   * Résumé
   * =======================================================
   */

  function renderSummary() {
    const enabledCount =
      interactions.filter(
        interaction =>
          interaction.enabled
      ).length;

    const usages =
      interactions.reduce(
        (total, interaction) =>
          total +
          Number(
            interaction.usageCount ?? 0
          ),
        0
      );

    if (elements.interactionsCount) {
      elements.interactionsCount
        .textContent =
        formatNumber(
          interactions.length
        );
    }

    if (
      elements
        .activeInteractionsCount
    ) {
      elements
        .activeInteractionsCount
        .textContent =
        formatNumber(
          enabledCount
        );
    }

    if (elements.usagesCount) {
      elements.usagesCount
        .textContent =
        formatNumber(usages);
    }
  }

  /*
   * =======================================================
   * Filtres par créateur
   * =======================================================
   */

  function createCreatorFilterButton(
    creator = null
  ) {
    const button =
      createElement(
        "button",
        "interaction-creator-filter"
      );

    button.type = "button";

    const creatorId =
      creator
        ? Number(creator.id)
        : null;

    const selected =
      creatorId === null
        ? selectedCreatorId === null
        : (
            Number(
              selectedCreatorId
            ) === creatorId
          );

    button.classList.toggle(
      "is-active",
      selected
    );

    button.setAttribute(
      "aria-pressed",
      String(selected)
    );

    if (!creator) {
      const icon =
        createElement(
          "span",
          "interaction-creator-filter-all"
        );

      icon.innerHTML = `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="3"
          ></circle>

          <circle
            cx="16"
            cy="8"
            r="3"
          ></circle>

          <path
            d="M2.5 20a5.5 5.5 0 0 1 11 0
               M10.5 20a5.5 5.5 0 0 1 11 0"
          ></path>
        </svg>
      `;

      button.append(
        icon,
        createElement(
          "span",
          "",
          "Tous"
        )
      );
    } else {
      const avatar =
        createElement(
          "img",
          "interaction-creator-filter-avatar"
        );

      avatar.src =
        creatorAvatar(creator);

      avatar.alt = "";
      avatar.loading = "lazy";

      button.append(
        avatar,
        createElement(
          "span",
          "",
          creatorName(creator)
        )
      );
    }

    button.addEventListener(
      "click",
      () => {
        selectedCreatorId =
          creatorId;

        renderCreatorFilters();
        renderInteractions();
      }
    );

    return button;
  }

  function renderCreatorFilters() {
    if (!elements.creatorFilters) {
      return;
    }

    elements.creatorFilters
      .replaceChildren();

    elements.creatorFilters.append(
      createCreatorFilterButton()
    );

    for (const creator of creators) {
      elements.creatorFilters.append(
        createCreatorFilterButton(
          creator
        )
      );
    }
  }

  /*
   * =======================================================
   * Filtres d’état
   * =======================================================
   */

  function renderStateFilters() {
    for (
      const button of
      elements.stateFilters
    ) {
      const active =
        button.dataset
          .interactionFilter ===
        selectedState;

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

  function interactionMatchesFilters(
    interaction
  ) {
    if (
      selectedCreatorId !== null &&
      Number(interaction.creatorId) !==
        Number(selectedCreatorId)
    ) {
      return false;
    }

    if (
      selectedState === "enabled" &&
      !interaction.enabled
    ) {
      return false;
    }

    if (
      selectedState === "disabled" &&
      interaction.enabled
    ) {
      return false;
    }

    if (searchValue) {
      const creator =
        interaction.creator ??
        findCreator(
          interaction.creatorId
        );

      const searchableText =
        normalizeText(
          [
            interaction.title,
            interaction.description,
            interaction.slug,
            interaction.type,
            interactionTypeLabel(
              interaction.type
            ),
            creatorName(creator)
          ].join(" ")
        );

      if (
        !searchableText.includes(
          normalizeText(searchValue)
        )
      ) {
        return false;
      }
    }

    return true;
  }

  function filteredInteractions() {
    return interactions.filter(
      interaction =>
        interactionMatchesFilters(
          interaction
        )
    );
  }

  /*
   * =======================================================
   * Carte d’interaction
   * =======================================================
   */

  function createStatusBadge(
    label,
    className = ""
  ) {
    const badge =
      createElement(
        "span",
        "interaction-status-badge",
        label
      );

    if (className) {
      badge.classList.add(
        className
      );
    }

    return badge;
  }

  function createInteractionCard(
    interaction
  ) {
    const card =
      createElement(
        "article",
        "interaction-admin-card"
      );

    if (!interaction.enabled) {
      card.classList.add(
        "is-disabled"
      );
    }

    if (!interaction.visible) {
      card.classList.add(
        "is-hidden"
      );
    }

    const typeIcon =
      createElement(
        "span",
        (
          "interaction-type-icon " +
          `is-${interaction.type}`
        )
      );

    const icons = {
      image: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
          ></rect>
          <circle
            cx="9"
            cy="10"
            r="2"
          ></circle>
          <path
            d="m4 17 5-5 4 4 2-2 5 5"
          ></path>
        </svg>
      `,

      text: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5h16v12H8l-4 4V5Z"
          ></path>
          <path d="M8 9h8M8 13h5"></path>
        </svg>
      `,

      code: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"></path>
        </svg>
      `,

      sound: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 10v4h4l5 4V6l-5 4H5Z"
          ></path>
          <path
            d="M17 9a4 4 0 0 1 0 6
               M19 6a8 8 0 0 1 0 12"
          ></path>
        </svg>
      `,

      advanced: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3v3M12 18v3M3 12h3
               M18 12h3M5.6 5.6l2.1 2.1
               M16.3 16.3l2.1 2.1
               M18.4 5.6l-2.1 2.1
               M7.7 16.3l-2.1 2.1"
          ></path>
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
      `
    };

    typeIcon.innerHTML =
      icons[interaction.type] ??
      icons.advanced;

    const content =
      createElement(
        "div",
        "interaction-admin-content"
      );

    const heading =
      createElement(
        "div",
        "interaction-admin-heading"
      );

    heading.append(
      createElement(
        "h3",
        "",
        interaction.title ||
        "Interaction"
      )
    );

    const badges =
      createElement(
        "div",
        "interaction-status-list"
      );

    badges.append(
      createStatusBadge(
        interaction.enabled
          ? "Active"
          : "Désactivée",
        interaction.enabled
          ? "is-enabled"
          : "is-disabled"
      )
    );

    badges.append(
      createStatusBadge(
        interaction.visible
          ? "Visible"
          : "Masquée",
        interaction.visible
          ? "is-visible"
          : "is-hidden"
      )
    );

    if (
      !interactionIsOpen(
        interaction
      )
    ) {
      badges.append(
        createStatusBadge(
          "Indisponible",
          "is-closed"
        )
      );
    }

    heading.append(badges);

    const description =
      createElement(
        "p",
        "interaction-admin-description",
        interaction.description ||
        "Aucune description."
      );

    const metadata =
      createElement(
        "div",
        "interaction-admin-metadata"
      );

    metadata.append(
      createElement(
        "span",
        "",
        interactionTypeLabel(
          interaction.type
        )
      ),

      createElement(
        "span",
        "is-cost",
        formatCreditsFromCents(
          interaction.costCents
        )
      ),

      createElement(
        "span",
        "",
        (
          `${formatNumber(
            interaction.usageCount
          )} utilisation${
            Number(
              interaction.usageCount
            ) > 1
              ? "s"
              : ""
          }`
        )
      )
    );

    if (
      interaction.moderationRequired
    ) {
      metadata.append(
        createElement(
          "span",
          "",
          "Modération obligatoire"
        )
      );
    }

    const dates =
      createElement(
        "div",
        "interaction-admin-dates"
      );

    const opensAt =
      formatDateTime(
        interaction.opensAt
      );

    const closesAt =
      formatDateTime(
        interaction.closesAt
      );

    if (opensAt) {
      dates.append(
        createElement(
          "span",
          "",
          `Ouverture : ${opensAt}`
        )
      );
    }

    if (closesAt) {
      dates.append(
        createElement(
          "span",
          "",
          `Fermeture : ${closesAt}`
        )
      );
    }

    content.append(
      heading,
      description,
      metadata
    );

    if (dates.childElementCount > 0) {
      content.append(dates);
    }

    const actions =
      createElement(
        "div",
        "interaction-admin-actions"
      );

    const toggleButton =
      createElement(
        "button",
        "button button-secondary",
        interaction.enabled
          ? "Désactiver"
          : "Activer"
      );

    toggleButton.type = "button";

    toggleButton.addEventListener(
      "click",
      () => {
        void toggleInteraction(
          interaction,
          toggleButton
        );
      }
    );

    const editButton =
      createElement(
        "button",
        "button button-primary",
        "Modifier"
      );

    editButton.type = "button";

    editButton.addEventListener(
      "click",
      () => {
        openInteractionDialog(
          interaction
        );
      }
    );

    actions.append(
      toggleButton,
      editButton
    );

    card.append(
      typeIcon,
      content,
      actions
    );

    return card;
  }

  /*
   * =======================================================
   * Groupes par créateur
   * =======================================================
   */

  function createCreatorGroup(
    creator,
    creatorInteractions
  ) {
    const group =
      createElement(
        "section",
        "interaction-creator-group"
      );

    const heading =
      createElement(
        "header",
        "interaction-creator-group-heading"
      );

    const identity =
      createElement(
        "div",
        "interaction-creator-group-identity"
      );

    const avatar =
      createElement(
        "img",
        "interaction-creator-group-avatar"
      );

    avatar.src =
      creatorAvatar(creator);

    avatar.alt =
      `Avatar de ${creatorName(creator)}`;

    avatar.loading = "lazy";

    const copy =
      createElement(
        "div",
        "interaction-creator-group-copy"
      );

    copy.append(
      createElement(
        "strong",
        "",
        creatorName(creator)
      ),

      createElement(
        "span",
        "",
        (
          `${formatNumber(
            creatorInteractions.length
          )} interaction${
            creatorInteractions.length >
            1
              ? "s"
              : ""
          }`
        )
      )
    );

    identity.append(
      avatar,
      copy
    );

    const addButton =
      createElement(
        "button",
        "button button-secondary",
        "Ajouter"
      );

    addButton.type = "button";

    addButton.addEventListener(
      "click",
      () => {
        openInteractionDialog(
          null,
          creator.id
        );
      }
    );

    heading.append(
      identity,
      addButton
    );

    const list =
      createElement(
        "div",
        "interaction-creator-group-list"
      );

    for (
      const interaction of
      creatorInteractions
    ) {
      list.append(
        createInteractionCard(
          interaction
        )
      );
    }

    group.append(
      heading,
      list
    );

    return group;
  }

  function renderInteractions() {
    const results =
      filteredInteractions();

    elements.list.replaceChildren();

    renderSummary();
    renderStateFilters();

    elements.empty.hidden =
      results.length !== 0;

    elements.resultDescription
      .textContent =
      (
        `${formatNumber(
          results.length
        )} interaction${
          results.length > 1
            ? "s"
            : ""
        } affichée${
          results.length > 1
            ? "s"
            : ""
        }.`
      );

    if (results.length === 0) {
      return;
    }

    const interactionsByCreator =
      new Map();

    for (const interaction of results) {
      const creatorId =
        Number(
          interaction.creatorId
        );

      if (
        !interactionsByCreator.has(
          creatorId
        )
      ) {
        interactionsByCreator.set(
          creatorId,
          []
        );
      }

      interactionsByCreator
        .get(creatorId)
        .push(interaction);
    }

    for (const creator of creators) {
      const creatorInteractions =
        interactionsByCreator.get(
          Number(creator.id)
        );

      if (
        !creatorInteractions ||
        creatorInteractions.length === 0
      ) {
        continue;
      }

      elements.list.append(
        createCreatorGroup(
          creator,
          creatorInteractions
        )
      );
    }
  }

  /*
   * =======================================================
   * Sélecteur de créateur du formulaire
   * =======================================================
   */

  function renderCreatorSelect() {
    if (!elements.creator) {
      return;
    }

    const previousValue =
      elements.creator.value;

    elements.creator.replaceChildren();

    const emptyOption =
      createElement(
        "option",
        "",
        "Sélectionner un créateur"
      );

    emptyOption.value = "";

    elements.creator.append(
      emptyOption
    );

    for (const creator of creators) {
      const option =
        createElement(
          "option",
          "",
          creatorName(creator)
        );

      option.value =
        String(creator.id);

      elements.creator.append(
        option
      );
    }

    if (
      [
        ...elements.creator.options
      ].some(
        option =>
          option.value ===
          previousValue
      )
    ) {
      elements.creator.value =
        previousValue;
    }
  }

  /*
   * =======================================================
   * Formulaire
   * =======================================================
   */

  function updateTypeFields() {
    if (!elements.imageSettings) {
      return;
    }

    elements.imageSettings.hidden =
      elements.type.value !==
      "image";
  }

  function resetInteractionForm() {
    elements.form.reset();

    elements.publicId.value = "";
    elements.creator.value = "";
    elements.title.value = "";
    elements.slug.value = "";
    elements.description.value = "";

    elements.type.value = "image";
    elements.cost.value = "5";

    elements.displayOrder.value =
      "100";

    elements.maximumFileSize.value =
      "2097152";

    elements.allowJpeg.checked = true;
    elements.allowPng.checked = true;
    elements.allowWebp.checked = true;

    elements.opensAt.value = "";
    elements.closesAt.value = "";

    elements.moderationRequired
      .checked = true;

    elements.visible.checked = true;
    elements.enabled.checked = true;

    elements.deleteButton.hidden =
      true;

    slugManuallyEdited = false;

    showFormMessage();
    updateTypeFields();
  }

  function fillInteractionForm(
    interaction
  ) {
    elements.publicId.value =
      interaction.publicId ?? "";

    elements.creator.value =
      String(
        interaction.creatorId ?? ""
      );

    elements.title.value =
      interaction.title ?? "";

    elements.slug.value =
      interaction.slug ?? "";

    elements.description.value =
      interaction.description ?? "";

    elements.type.value =
      interaction.type ?? "image";

    elements.cost.value =
      String(
        Number(
          interaction.costCents ?? 0
        ) / 100
      );

    elements.displayOrder.value =
      String(
        interaction.displayOrder ??
        100
      );

    const config =
      interaction.config ?? {};

    elements.maximumFileSize.value =
      String(
        config.maximumFileSizeBytes ??
        2_097_152
      );

    const allowedTypes =
      new Set(
        Array.isArray(
          config.allowedContentTypes
        )
          ? config.allowedContentTypes
          : [
              "image/jpeg",
              "image/png",
              "image/webp"
            ]
      );

    elements.allowJpeg.checked =
      allowedTypes.has(
        "image/jpeg"
      );

    elements.allowPng.checked =
      allowedTypes.has(
        "image/png"
      );

    elements.allowWebp.checked =
      allowedTypes.has(
        "image/webp"
      );

    elements.opensAt.value =
      toDateTimeLocal(
        interaction.opensAt
      );

    elements.closesAt.value =
      toDateTimeLocal(
        interaction.closesAt
      );

    elements.moderationRequired
      .checked =
      Boolean(
        interaction
          .moderationRequired
      );

    elements.visible.checked =
      Boolean(interaction.visible);

    elements.enabled.checked =
      Boolean(interaction.enabled);

    elements.deleteButton.hidden =
      false;

    slugManuallyEdited = true;

    updateTypeFields();
  }

  function openInteractionDialog(
    interaction = null,
    creatorId = null
  ) {
    resetInteractionForm();

    if (interaction) {
      fillInteractionForm(
        interaction
      );

      elements.dialogEyebrow
        .textContent =
        "Modification";

      elements.dialogTitle
        .textContent =
        "Modifier l’interaction";
    } else {
      elements.dialogEyebrow
        .textContent =
        "Nouvelle interaction";

      elements.dialogTitle
        .textContent =
        "Ajouter une interaction";

      if (creatorId) {
        elements.creator.value =
          String(creatorId);
      }
    }

    elements.dialog.showModal();

    window.setTimeout(
      () => {
        if (!creatorId) {
          elements.creator.focus();
        } else {
          elements.title.focus();
        }
      },
      50
    );
  }

  function closeInteractionDialog() {
    if (saving) {
      return;
    }

    elements.dialog?.close();
  }

  function buildInteractionPayload() {
    const type =
      elements.type.value;

    const allowedContentTypes = [];

    if (elements.allowJpeg.checked) {
      allowedContentTypes.push(
        "image/jpeg"
      );
    }

    if (elements.allowPng.checked) {
      allowedContentTypes.push(
        "image/png"
      );
    }

    if (elements.allowWebp.checked) {
      allowedContentTypes.push(
        "image/webp"
      );
    }

    const payload = {
      creatorId:
        Number(
          elements.creator.value
        ),

      title:
        elements.title.value.trim(),

      slug:
        elements.slug.value.trim(),

      description:
        elements.description
          .value.trim(),

      type,

      costCents:
        Math.round(
          Number(
            elements.cost.value
          ) * 100
        ),

      displayOrder:
        Number(
          elements.displayOrder.value ||
          100
        ),

      moderationRequired:
        elements
          .moderationRequired
          .checked,

      visible:
        elements.visible.checked,

      enabled:
        elements.enabled.checked,

      opensAt:
        toIsoDate(
          elements.opensAt.value
        ),

      closesAt:
        toIsoDate(
          elements.closesAt.value
        ),

      config: {}
    };

    if (type === "image") {
      payload.config = {
        maximumFileSizeBytes:
          Number(
            elements
              .maximumFileSize
              .value
          ),

        allowedContentTypes
      };
    }

    return payload;
  }

  /*
   * =======================================================
   * Enregistrement
   * =======================================================
   */

  async function saveInteraction(
    event
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const payload =
      buildInteractionPayload();

    if (!payload.creatorId) {
      showFormMessage(
        "Sélectionne un créateur.",
        "error"
      );

      elements.creator.focus();
      return;
    }

    if (!payload.title) {
      showFormMessage(
        "Le titre est obligatoire.",
        "error"
      );

      elements.title.focus();
      return;
    }

    if (
      !Number.isFinite(
        payload.costCents
      ) ||
      payload.costCents < 0
    ) {
      showFormMessage(
        "Le coût est invalide.",
        "error"
      );

      elements.cost.focus();
      return;
    }

    if (
      payload.opensAt &&
      payload.closesAt &&
      new Date(payload.closesAt) <=
        new Date(payload.opensAt)
    ) {
      showFormMessage(
        "La fermeture doit avoir lieu après l’ouverture.",
        "error"
      );

      elements.closesAt.focus();
      return;
    }

    if (
      payload.type === "image" &&
      payload.config
        .allowedContentTypes
        .length === 0
    ) {
      showFormMessage(
        "Sélectionne au moins un format d’image.",
        "error"
      );

      return;
    }

    saving = true;

    elements.saveButton.disabled =
      true;

    elements.deleteButton.disabled =
      true;

    showFormMessage(
      "Enregistrement…"
    );

    try {
      const publicId =
        elements.publicId.value.trim();

      const path =
        publicId
          ? (
              "/api/admin/interactions/" +
              encodeURIComponent(
                publicId
              )
            )
          : "/api/admin/interactions";

      await apiFetch(
        path,
        {
          method:
            publicId
              ? "PUT"
              : "POST",

          body:
            JSON.stringify(payload)
        }
      );

      await loadInteractions({
        silent: true
      });

      elements.dialog.close();

      showMessage(
        publicId
          ? "Interaction modifiée."
          : "Interaction créée.",
        "success"
      );
    } catch (error) {
      showFormMessage(
        error.message,
        "error"
      );
    } finally {
      saving = false;

      elements.saveButton.disabled =
        false;

      elements.deleteButton.disabled =
        false;
    }
  }

  /*
   * =======================================================
   * Activation rapide
   * =======================================================
   */

  async function toggleInteraction(
    interaction,
    button
  ) {
    button.disabled = true;

    try {
      await apiFetch(
        (
          "/api/admin/interactions/" +
          encodeURIComponent(
            interaction.publicId
          )
        ),
        {
          method: "PUT",

          body: JSON.stringify({
            enabled:
              !interaction.enabled
          })
        }
      );

      interaction.enabled =
        !interaction.enabled;

      renderInteractions();

      showMessage(
        interaction.enabled
          ? "Interaction activée."
          : "Interaction désactivée.",
        "success"
      );
    } catch (error) {
      button.disabled = false;

      showMessage(
        error.message,
        "error"
      );
    }
  }

  /*
   * =======================================================
   * Suppression
   * =======================================================
   */

  async function deleteInteraction() {
    const publicId =
      elements.publicId.value.trim();

    if (!publicId || saving) {
      return;
    }

    const interaction =
      interactions.find(
        item =>
          item.publicId ===
          publicId
      );

    const confirmed =
      window.confirm(
        (
          "Supprimer définitivement " +
          `« ${
            interaction?.title ||
            "cette interaction"
          } » ?`
        )
      );

    if (!confirmed) {
      return;
    }

    saving = true;

    elements.deleteButton.disabled =
      true;

    elements.saveButton.disabled =
      true;

    try {
      await apiFetch(
        (
          "/api/admin/interactions/" +
          encodeURIComponent(
            publicId
          )
        ),
        {
          method: "DELETE"
        }
      );

      await loadInteractions({
        silent: true
      });

      elements.dialog.close();

      showMessage(
        "Interaction supprimée.",
        "success"
      );
    } catch (error) {
      showFormMessage(
        error.message,
        "error"
      );
    } finally {
      saving = false;

      elements.deleteButton.disabled =
        false;

      elements.saveButton.disabled =
        false;
    }
  }

  /*
   * =======================================================
   * Chargement
   * =======================================================
   */

  async function loadInteractions({
    silent = false
  } = {}) {
    if (!silent) {
      showMessage(
        "Chargement des interactions…"
      );
    }

    try {
      const data =
        await apiFetch(
          "/api/admin/interactions"
        );

      creators =
        Array.isArray(
          data.creators
        )
          ? data.creators
          : [];

      interactions =
        Array.isArray(
          data.interactions
        )
          ? data.interactions
          : [];

      renderCreatorSelect();
      renderCreatorFilters();
      renderInteractions();

      if (!silent) {
        showMessage(
          "Interactions chargées.",
          "success"
        );
      }
    } catch (error) {
      console.error(
        "Impossible de charger les interactions :",
        error
      );

      showMessage(
        error.message,
        "error"
      );
    }
  }

  /*
   * =======================================================
   * Événements
   * =======================================================
   */

  elements.createButton
    ?.addEventListener(
      "click",
      () => {
        openInteractionDialog();
      }
    );

  elements.searchInput
    ?.addEventListener(
      "input",
      event => {
        searchValue =
          event.target.value.trim();

        renderInteractions();
      }
    );

  for (
    const button of
    elements.stateFilters
  ) {
    button.addEventListener(
      "click",
      () => {
        selectedState =
          button.dataset
            .interactionFilter ??
          "all";

        renderInteractions();
      }
    );
  }

  elements.form
    ?.addEventListener(
      "submit",
      saveInteraction
    );

  elements.closeDialogButton
    ?.addEventListener(
      "click",
      closeInteractionDialog
    );

  elements.cancelButton
    ?.addEventListener(
      "click",
      closeInteractionDialog
    );

  elements.deleteButton
    ?.addEventListener(
      "click",
      () => {
        void deleteInteraction();
      }
    );

  elements.dialog
    ?.addEventListener(
      "cancel",
      event => {
        event.preventDefault();
        closeInteractionDialog();
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
          closeInteractionDialog();
        }
      }
    );

  elements.type
    ?.addEventListener(
      "change",
      updateTypeFields
    );

  elements.title
    ?.addEventListener(
      "input",
      () => {
        if (
          !slugManuallyEdited ||
          !elements.slug.value
        ) {
          elements.slug.value =
            normalizeSlug(
              elements.title.value
            );
        }
      }
    );

  elements.slug
    ?.addEventListener(
      "input",
      () => {
        slugManuallyEdited =
          Boolean(
            elements.slug.value.trim()
          );

        const cursorPosition =
          elements.slug
            .selectionStart;

        elements.slug.value =
          normalizeSlug(
            elements.slug.value
          );

        try {
          elements.slug
            .setSelectionRange(
              cursorPosition,
              cursorPosition
            );
        } catch {
          // Aucun traitement requis.
        }
      }
    );

  elements.refreshButton
    ?.addEventListener(
      "click",
      () => {
        void loadInteractions({
          silent: true
        });
      }
    );

  /*
   * =======================================================
   * Démarrage
   * =======================================================
   */

  void loadInteractions();
})();