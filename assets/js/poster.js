(() => {
  "use strict";

  const API_BASE =
    "https://api-beta.jevent.julot.fr";

  const ABSOLUTE_MAX_FILE_SIZE =
    2 * 1024 * 1024;

  const DEFAULT_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const CONTENT_TYPE_LABELS = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP"
  };

  const STATUS_LABELS = {
    pending: "En attente de modération",
    approved: "Acceptée",
    rejected: "Refusée",
    cancelled: "Annulée"
  };

  const elements = {
    loadingState:
      document.querySelector(
        "#loadingState"
      ),

    errorState:
      document.querySelector(
        "#errorState"
      ),

    errorMessage:
      document.querySelector(
        "#errorMessage"
      ),

    retryButton:
      document.querySelector(
        "#retryButton"
      ),

    pageContent:
      document.querySelector(
        "#pageContent"
      ),

    creditBalance:
      document.querySelector(
        "#creditBalance"
      ),

    creditInformation:
      document.querySelector(
        "#creditInformation"
      ),

    personalCode:
      document.querySelector(
        "#personalCode"
      ),

    copyCodeButton:
      document.querySelector(
        "#copyCodeButton"
      ),

    interactionsList:
      document.querySelector(
        "#interactionsList"
      ),

    interactionsEmpty:
      document.querySelector(
        "#interactionsEmpty"
      ),

    uploadSection:
      document.querySelector(
        "#uploadSection"
      ),

    selectedInteractionTitle:
      document.querySelector(
        "#selectedInteractionTitle"
      ),

    selectedInteractionDescription:
      document.querySelector(
        "#selectedInteractionDescription"
      ),

    selectedCreatorName:
      document.querySelector(
        "#selectedCreatorName"
      ),

    selectedInteractionCost:
      document.querySelector(
        "#selectedInteractionCost"
      ),

    selectedInteractionFormats:
      document.querySelector(
        "#selectedInteractionFormats"
      ),

    changeInteractionButton:
      document.querySelector(
        "#changeInteractionButton"
      ),

    uploadForm:
      document.querySelector(
        "#uploadForm"
      ),

    interactionPublicId:
      document.querySelector(
        "#interactionPublicId"
      ),

    imageInput:
      document.querySelector(
        "#imageInput"
      ),

    dropZone:
      document.querySelector(
        "#dropZone"
      ),

    selectedFile:
      document.querySelector(
        "#selectedFile"
      ),

    imagePreview:
      document.querySelector(
        "#imagePreview"
      ),

    selectedFileName:
      document.querySelector(
        "#selectedFileName"
      ),

    selectedFileSize:
      document.querySelector(
        "#selectedFileSize"
      ),

    removeFileButton:
      document.querySelector(
        "#removeFileButton"
      ),

    submitButton:
      document.querySelector(
        "#submitButton"
      ),

    uploadMessage:
      document.querySelector(
        "#uploadMessage"
      ),

    uploadsList:
      document.querySelector(
        "#uploadsList"
      ),

    uploadsEmpty:
      document.querySelector(
        "#uploadsEmpty"
      ),

    refreshUploadsButton:
      document.querySelector(
        "#refreshUploadsButton"
      )
  };

  const state = {
    wallet: null,
    settings: null,
    interactions: [],
    uploads: [],

    selectedInteraction: null,
    selectedFile: null,

    previewUrl: null,

    loading: false,
    uploading: false
  };

  /* =========================================================
     OUTILS
     ========================================================= */

  function onSafe(
    element,
    eventName,
    callback
  ) {
    if (!element) {
      return;
    }

    element.addEventListener(
      eventName,
      callback
    );
  }

  function setHidden(
    element,
    hidden
  ) {
    if (element) {
      element.hidden = hidden;
    }
  }

  function numberOrZero(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  function formatCredits(cents) {
    const credits =
      numberOrZero(cents) / 100;

    const formatted =
      new Intl.NumberFormat(
        "fr-FR",
        {
          minimumFractionDigits:
            Number.isInteger(credits)
              ? 0
              : 2,

          maximumFractionDigits: 2
        }
      ).format(credits);

    return (
      `${formatted} crédit` +
      (
        credits > 1 ||
        credits === 0
          ? "s"
          : ""
      )
    );
  }

  function formatFileSize(bytes) {
    const size =
      numberOrZero(bytes);

    if (size < 1024) {
      return `${size} octets`;
    }

    if (size < 1024 * 1024) {
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

  function formatDate(value) {
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

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Paris"
      }
    ).format(date);
  }

  function parseConfiguration(value) {
    if (
      value &&
      typeof value === "object"
    ) {
      return value;
    }

    if (typeof value !== "string") {
      return {};
    }

    try {
      const parsed =
        JSON.parse(value);

      return (
        parsed &&
        typeof parsed === "object"
          ? parsed
          : {}
      );
    } catch {
      return {};
    }
  }

  function setMessage(
    text = "",
    type = ""
  ) {
    if (!elements.uploadMessage) {
      return;
    }

    elements.uploadMessage.textContent =
      text;

    elements.uploadMessage.className =
      "poster-message";

    if (type) {
      elements.uploadMessage.classList.add(
        `is-${type}`
      );
    }

    elements.uploadMessage.hidden =
      !text;
  }

  function createSvgIcon(type) {
    const svg =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );

    svg.setAttribute(
      "viewBox",
      "0 0 24 24"
    );

    svg.setAttribute(
      "aria-hidden",
      "true"
    );

    svg.setAttribute(
      "fill",
      "none"
    );

    svg.setAttribute(
      "stroke",
      "currentColor"
    );

    svg.setAttribute(
      "stroke-width",
      "1.8"
    );

    svg.setAttribute(
      "stroke-linecap",
      "round"
    );

    svg.setAttribute(
      "stroke-linejoin",
      "round"
    );

    const paths = {
      image: [
        '<rect x="3" y="4" width="18" height="16" rx="3"/>',
        '<circle cx="9" cy="10" r="2"/>',
        '<path d="m5 18 5-5 3 3 2-2 4 4"/>'
      ],

      text: [
        '<path d="M5 6h14"/>',
        '<path d="M12 6v12"/>',
        '<path d="M8 18h8"/>'
      ],

      sound: [
        '<path d="M9 9H5v6h4l5 4V5L9 9Z"/>',
        '<path d="M17 9a4 4 0 0 1 0 6"/>'
      ],

      code: [
        '<path d="m8 9-3 3 3 3"/>',
        '<path d="m16 9 3 3-3 3"/>',
        '<path d="m14 6-4 12"/>'
      ],

      advanced: [
        '<circle cx="12" cy="12" r="3"/>',
        '<path d="M12 3v3"/>',
        '<path d="M12 18v3"/>',
        '<path d="M3 12h3"/>',
        '<path d="M18 12h3"/>'
      ]
    };

    svg.innerHTML =
      (
        paths[type] ||
        paths.advanced
      ).join("");

    return svg;
  }

  async function apiFetch(
    pathname,
    options = {}
  ) {
    const response =
      await fetch(
        API_BASE + pathname,
        {
          ...options,

          credentials: "include",

          headers: {
            Accept:
              "application/json",

            ...(
              options.headers || {}
            )
          }
        }
      );

    const contentType =
      response.headers.get(
        "Content-Type"
      ) || "";

    let data = {};

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      try {
        data =
          await response.json();
      } catch {
        data = {};
      }
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

  /* =========================================================
     NORMALISATION DES DONNÉES
     ========================================================= */

  function normalizeCreator(
    creator,
    interaction
  ) {
    const source =
      creator || {};

    return {
      id:
        numberOrZero(
          source.id ??
          source.creatorId ??
          interaction.creatorId
        ),

      slug:
        source.slug ??
        source.creatorSlug ??
        interaction.creatorSlug ??
        "",

      displayName:
        source.displayName ??
        source.twitchDisplayName ??
        source.name ??
        interaction.creatorName ??
        interaction.creatorDisplayName ??
        "Créateur",

      profileImageUrl:
        source.profileImageUrl ??
        source.twitchProfileImageUrl ??
        interaction.creatorProfileImageUrl ??
        ""
    };
  }

  function normalizeInteraction(
    interaction,
    fallbackCreator = null
  ) {
    const configuration =
      parseConfiguration(
        interaction.config ??
        interaction.configuration ??
        interaction.configJson ??
        interaction.config_json
      );

    const creator =
      normalizeCreator(
        interaction.creator ??
        fallbackCreator,
        interaction
      );

    const configuredTypes =
      configuration
        .allowedContentTypes;

    const allowedContentTypes =
      Array.isArray(
        configuredTypes
      ) &&
      configuredTypes.length > 0
        ? configuredTypes.filter(
            type =>
              DEFAULT_CONTENT_TYPES
                .includes(type)
          )
        : DEFAULT_CONTENT_TYPES;

    const configuredMaximum =
      Number(
        configuration
          .maximumFileSizeBytes ??
        configuration
          .maxFileSizeBytes
      );

    const maximumFileSizeBytes =
      Number.isFinite(
        configuredMaximum
      ) &&
      configuredMaximum > 0
        ? Math.min(
            configuredMaximum,
            ABSOLUTE_MAX_FILE_SIZE
          )
        : ABSOLUTE_MAX_FILE_SIZE;

    return {
      publicId:
        interaction.publicId ??
        interaction.public_id ??
        "",

      slug:
        interaction.slug ??
        "",

      title:
        interaction.title ??
        "Interaction",

      description:
        interaction.description ??
        "",

      type:
        interaction.interactionType ??
        interaction.interaction_type ??
        interaction.type ??
        "image",

      costCents:
        numberOrZero(
          interaction.costCents ??
          interaction.cost_cents ??
          500
        ),

      moderationRequired:
        Boolean(
          interaction.moderationRequired ??
          interaction.moderation_required ??
          true
        ),

      enabled:
        interaction.enabled !== false,

      visible:
        interaction.visible !== false,

      opensAt:
        interaction.opensAt ??
        interaction.opens_at ??
        null,

      closesAt:
        interaction.closesAt ??
        interaction.closes_at ??
        null,

      displayOrder:
        numberOrZero(
          interaction.displayOrder ??
          interaction.display_order ??
          100
        ),

      allowedContentTypes,

      maximumFileSizeBytes,

      configuration,
      creator
    };
  }

  function extractInteractions(
    data
  ) {
    if (
      Array.isArray(
        data?.interactions?.items
      )
    ) {
      return data.interactions.items
        .map(item =>
          normalizeInteraction(item)
        );
    }

    if (
      Array.isArray(
        data?.interactions
      )
    ) {
      return data.interactions.map(
        item =>
          normalizeInteraction(item)
      );
    }

    if (
      Array.isArray(
        data?.items
      )
    ) {
      return data.items.map(
        item =>
          normalizeInteraction(item)
      );
    }

    const groups =
      data?.interactions?.creators ??
      data?.creators;

    if (Array.isArray(groups)) {
      return groups.flatMap(
        group => {
          const items =
            group.interactions ??
            group.items ??
            [];

          if (!Array.isArray(items)) {
            return [];
          }

          return items.map(
            interaction =>
              normalizeInteraction(
                interaction,
                group.creator ?? group
              )
          );
        }
      );
    }

    return [];
  }

  function normalizeUpload(upload) {
    const interaction =
      upload.interaction || {};

    const creator =
      upload.creator ||
      interaction.creator ||
      {};

    return {
      publicId:
        upload.publicId ??
        upload.public_id ??
        "",

      originalName:
        upload.originalName ??
        upload.original_name ??
        "Image",

      contentType:
        upload.contentType ??
        upload.content_type ??
        "",

      fileSizeBytes:
        numberOrZero(
          upload.fileSizeBytes ??
          upload.file_size_bytes
        ),

      status:
        upload.status ??
        "pending",

      costCents:
        numberOrZero(
          upload.costCents ??
          upload.creditCostCents ??
          upload.credit_cost_cents
        ),

      moderationNote:
        upload.moderationNote ??
        upload.moderation_note ??
        "",

      createdAt:
        upload.createdAt ??
        upload.created_at ??
        null,

      reviewedAt:
        upload.reviewedAt ??
        upload.reviewed_at ??
        null,

      interactionTitle:
        upload.interactionTitle ??
        interaction.title ??
        "Interaction",

      creatorName:
        upload.creatorName ??
        creator.displayName ??
        creator.twitchDisplayName ??
        creator.name ??
        ""
    };
  }

  function extractUploads(data) {
    const uploads =
      Array.isArray(
        data?.uploads?.items
      )
        ? data.uploads.items
        : Array.isArray(
            data?.uploads
          )
          ? data.uploads
          : [];

    return uploads.map(
      normalizeUpload
    );
  }

  /* =========================================================
     DISPONIBILITÉ
     ========================================================= */

  function getAvailability(
    interaction
  ) {
    if (
      !interaction.enabled ||
      !interaction.visible
    ) {
      return {
        available: false,
        label: "Indisponible"
      };
    }

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
        return {
          available: false,

          label:
            `Ouverture le ${
              formatDate(
                interaction.opensAt
              )
            }`
        };
      }
    }

    if (interaction.closesAt) {
      const closesAt =
        new Date(
          interaction.closesAt
        ).getTime();

      if (
        Number.isFinite(closesAt) &&
        now > closesAt
      ) {
        return {
          available: false,
          label: "Interaction terminée"
        };
      }
    }

    return {
      available: true,
      label: "Disponible"
    };
  }

  /* =========================================================
     PORTEFEUILLE
     ========================================================= */

  function renderWallet() {
    const wallet =
      state.wallet || {};

    const balanceCents =
      numberOrZero(
        wallet.balanceCents ??
        wallet.balance_cents
      );

    const personalCode =
      wallet.personalCode ??
      wallet.personal_code ??
      "—";

    if (elements.creditBalance) {
      elements.creditBalance.textContent =
        formatCredits(
          balanceCents
        );
    }

    if (elements.personalCode) {
      elements.personalCode.textContent =
        personalCode;
    }

    if (
      elements.creditInformation
    ) {
      const totalEarned =
        numberOrZero(
          wallet.totalEarnedCents ??
          wallet.total_earned_cents
        );

      elements.creditInformation
        .textContent =
          totalEarned > 0
            ? (
                `${formatCredits(
                  totalEarned
                )} obtenu${
                  totalEarned > 100
                    ? "s"
                    : ""
                } au total`
              )
            : "1 € donné = 1 crédit";
    }
  }

  async function copyPersonalCode() {
    const code =
      state.wallet?.personalCode ??
      state.wallet?.personal_code;

    if (!code) {
      return;
    }

    try {
      await navigator.clipboard
        .writeText(code);
    } catch {
      const input =
        document.createElement(
          "textarea"
        );

      input.value = code;
      input.style.position =
        "fixed";
      input.style.opacity =
        "0";

      document.body.append(input);

      input.select();

      document.execCommand(
        "copy"
      );

      input.remove();
    }

    if (
      !elements.copyCodeButton
    ) {
      return;
    }

    const oldText =
      elements.copyCodeButton
        .textContent;

    elements.copyCodeButton
      .textContent =
        "Code copié";

    window.setTimeout(
      () => {
        elements.copyCodeButton
          .textContent =
            oldText;
      },
      1800
    );
  }

  /* =========================================================
     CATALOGUE
     ========================================================= */

  function groupInteractions() {
    const groups =
      new Map();

    for (
      const interaction of
      state.interactions
    ) {
      const creator =
        interaction.creator;

      const key =
        String(
          creator.id ||
          creator.slug ||
          creator.displayName
        );

      if (!groups.has(key)) {
        groups.set(
          key,
          {
            creator,
            interactions: []
          }
        );
      }

      groups
        .get(key)
        .interactions
        .push(interaction);
    }

    return Array.from(
      groups.values()
    );
  }

  function createInteractionCard(
    interaction
  ) {
    const availability =
      getAvailability(
        interaction
      );

    const balance =
      numberOrZero(
        state.wallet?.balanceCents ??
        state.wallet?.balance_cents
      );

    const canAfford =
      balance >=
      interaction.costCents;

    const supported =
      interaction.type === "image";

    const article =
      document.createElement(
        "article"
      );

    article.className =
      "poster-interaction-card";

    if (!availability.available) {
      article.classList.add(
        "is-unavailable"
      );
    }

    const icon =
      document.createElement(
        "div"
      );

    icon.className =
      "poster-interaction-icon";

    icon.append(
      createSvgIcon(
        interaction.type
      )
    );

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "poster-interaction-content";

    const heading =
      document.createElement(
        "div"
      );

    heading.className =
      "poster-interaction-heading";

    const title =
      document.createElement(
        "h3"
      );

    title.textContent =
      interaction.title;

    const cost =
      document.createElement(
        "span"
      );

    cost.className =
      "poster-interaction-cost";

    cost.textContent =
      formatCredits(
        interaction.costCents
      );

    heading.append(
      title,
      cost
    );

    const description =
      document.createElement(
        "p"
      );

    description.textContent =
      interaction.description ||
      (
        interaction.type === "image"
          ? "Envoie une image au créateur."
          : "Participe à cette interaction."
      );

    const availabilityLabel =
      document.createElement(
        "span"
      );

    availabilityLabel.className =
      "poster-interaction-availability";

    availabilityLabel.textContent =
      availability.label;

    content.append(
      heading,
      description,
      availabilityLabel
    );

    const button =
      document.createElement(
        "button"
      );

    button.type = "button";
    button.className =
      "poster-interaction-select";

    if (!supported) {
      button.textContent =
        "Bientôt disponible";

      button.disabled = true;
    } else if (
      !availability.available
    ) {
      button.textContent =
        "Indisponible";

      button.disabled = true;
    } else if (!canAfford) {
      button.textContent =
        "Crédits insuffisants";

      button.disabled = true;
    } else {
      button.textContent =
        "Choisir";

      button.addEventListener(
        "click",
        () => {
          selectInteraction(
            interaction
          );
        }
      );
    }

    article.append(
      icon,
      content,
      button
    );

    return article;
  }

  function renderInteractions() {
    if (
      !elements.interactionsList
    ) {
      return;
    }

    elements.interactionsList
      .replaceChildren();

    const interactions =
      state.interactions
        .filter(
          interaction =>
            interaction.visible &&
            interaction.enabled
        )
        .sort(
          (first, second) =>
            (
              first.displayOrder -
              second.displayOrder
            ) ||
            first.title.localeCompare(
              second.title,
              "fr"
            )
        );

    setHidden(
      elements.interactionsEmpty,
      interactions.length > 0
    );

    if (
      interactions.length === 0
    ) {
      return;
    }

    const groups =
      groupInteractions();

    for (const group of groups) {
      const section =
        document.createElement(
          "section"
        );

      section.className =
        "poster-creator-interactions";

      const header =
        document.createElement(
          "header"
        );

      header.className =
        "poster-creator-heading";

      if (
        group.creator
          .profileImageUrl
      ) {
        const avatar =
          document.createElement(
            "img"
          );

        avatar.src =
          group.creator
            .profileImageUrl;

        avatar.alt =
          `Avatar de ${
            group.creator.displayName
          }`;

        avatar.loading =
          "lazy";

        header.append(avatar);
      }

      const creatorInformation =
        document.createElement(
          "div"
        );

      const creatorLabel =
        document.createElement(
          "span"
        );

      creatorLabel.textContent =
        "Interactions de";

      const creatorName =
        document.createElement(
          "strong"
        );

      creatorName.textContent =
        group.creator.displayName;

      creatorInformation.append(
        creatorLabel,
        creatorName
      );

      header.append(
        creatorInformation
      );

      const grid =
        document.createElement(
          "div"
        );

      grid.className =
        "poster-interaction-grid";

      for (
        const interaction of
        group.interactions
      ) {
        grid.append(
          createInteractionCard(
            interaction
          )
        );
      }

      section.append(
        header,
        grid
      );

      elements.interactionsList
        .append(section);
    }
  }

  /* =========================================================
     SÉLECTION D’UNE INTERACTION
     ========================================================= */

  function selectInteraction(
    interaction
  ) {
    state.selectedInteraction =
      interaction;

    clearSelectedFile();
    setMessage();

    if (
      elements.interactionPublicId
    ) {
      elements.interactionPublicId
        .value =
          interaction.publicId;
    }

    if (
      elements
        .selectedInteractionTitle
    ) {
      elements
        .selectedInteractionTitle
        .textContent =
          interaction.title;
    }

    if (
      elements
        .selectedInteractionDescription
    ) {
      elements
        .selectedInteractionDescription
        .textContent =
          interaction.description ||
          "Sélectionne une image à envoyer.";
    }

    if (
      elements.selectedCreatorName
    ) {
      elements
        .selectedCreatorName
        .textContent =
          interaction.creator
            .displayName;
    }

    if (
      elements
        .selectedInteractionCost
    ) {
      elements
        .selectedInteractionCost
        .textContent =
          formatCredits(
            interaction.costCents
          );
    }

    if (
      elements
        .selectedInteractionFormats
    ) {
      elements
        .selectedInteractionFormats
        .textContent =
          interaction
            .allowedContentTypes
            .map(
              type =>
                CONTENT_TYPE_LABELS[
                  type
                ] || type
            )
            .join(", ");
    }

    if (elements.imageInput) {
      elements.imageInput.accept =
        interaction
          .allowedContentTypes
          .join(",");
    }

    setHidden(
      elements.uploadSection,
      false
    );

    updateSubmitButton();

    window.setTimeout(
      () => {
        elements.uploadSection
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      },
      50
    );
  }

  function deselectInteraction() {
    state.selectedInteraction =
      null;

    clearSelectedFile();
    setMessage();

    if (
      elements.interactionPublicId
    ) {
      elements.interactionPublicId
        .value = "";
    }

    setHidden(
      elements.uploadSection,
      true
    );

    elements.interactionsList
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }

  /* =========================================================
     FICHIERS
     ========================================================= */

  function getMaximumFileSize() {
    return Math.min(
      state.selectedInteraction
        ?.maximumFileSizeBytes ??
        ABSOLUTE_MAX_FILE_SIZE,

      ABSOLUTE_MAX_FILE_SIZE
    );
  }

  function validateFile(file) {
    if (!file) {
      throw new Error(
        "Sélectionne une image."
      );
    }

    if (
      !state.selectedInteraction
    ) {
      throw new Error(
        "Sélectionne d’abord une interaction."
      );
    }

    const allowedTypes =
      state.selectedInteraction
        .allowedContentTypes;

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      throw new Error(
        "Le fichier doit être une image JPEG, PNG ou WebP."
      );
    }

    const maximumSize =
      getMaximumFileSize();

    if (
      file.size < 1 ||
      file.size > maximumSize
    ) {
      throw new Error(
        `L’image doit peser au maximum ${
          formatFileSize(
            maximumSize
          )
        }.`
      );
    }
  }

  function clearSelectedFile() {
    state.selectedFile =
      null;

    if (elements.imageInput) {
      elements.imageInput.value =
        "";
    }

    if (state.previewUrl) {
      URL.revokeObjectURL(
        state.previewUrl
      );

      state.previewUrl =
        null;
    }

    if (elements.imagePreview) {
      elements.imagePreview
        .removeAttribute("src");
    }

    if (
      elements.selectedFileName
    ) {
      elements
        .selectedFileName
        .textContent = "";
    }

    if (
      elements.selectedFileSize
    ) {
      elements
        .selectedFileSize
        .textContent = "";
    }

    setHidden(
      elements.selectedFile,
      true
    );

    elements.dropZone
      ?.classList.remove(
        "has-file"
      );

    updateSubmitButton();
  }

  function displaySelectedFile(
    file
  ) {
    try {
      validateFile(file);
    } catch (error) {
      clearSelectedFile();

      setMessage(
        error.message,
        "error"
      );

      return;
    }

    state.selectedFile =
      file;

    if (state.previewUrl) {
      URL.revokeObjectURL(
        state.previewUrl
      );
    }

    state.previewUrl =
      URL.createObjectURL(file);

    if (elements.imagePreview) {
      elements.imagePreview.src =
        state.previewUrl;
    }

    if (
      elements.selectedFileName
    ) {
      elements
        .selectedFileName
        .textContent =
          file.name;
    }

    if (
      elements.selectedFileSize
    ) {
      elements
        .selectedFileSize
        .textContent =
          formatFileSize(
            file.size
          );
    }

    setHidden(
      elements.selectedFile,
      false
    );

    elements.dropZone
      ?.classList.add(
        "has-file"
      );

    setMessage();

    updateSubmitButton();
  }

  function updateSubmitButton() {
    if (!elements.submitButton) {
      return;
    }

    const balance =
      numberOrZero(
        state.wallet?.balanceCents ??
        state.wallet?.balance_cents
      );

    const cost =
      state.selectedInteraction
        ?.costCents ?? 0;

    const canSubmit =
      Boolean(
        state.selectedInteraction &&
        state.selectedFile &&
        balance >= cost &&
        !state.uploading
      );

    elements.submitButton.disabled =
      !canSubmit;

    elements.submitButton.textContent =
      state.uploading
        ? "Envoi en cours…"
        : "Envoyer l’image";

    if (elements.imageInput) {
      elements.imageInput.disabled =
        state.uploading;
    }

    if (
      elements.removeFileButton
    ) {
      elements
        .removeFileButton
        .disabled =
          state.uploading;
    }
  }

  /* =========================================================
     ENVOI
     ========================================================= */

  async function submitUpload(event) {
    event.preventDefault();

    if (
      state.uploading
    ) {
      return;
    }

    if (
      !state.selectedInteraction
    ) {
      setMessage(
        "Sélectionne une interaction.",
        "error"
      );

      return;
    }

    try {
      validateFile(
        state.selectedFile
      );
    } catch (error) {
      setMessage(
        error.message,
        "error"
      );

      return;
    }

    const balance =
      numberOrZero(
        state.wallet?.balanceCents ??
        state.wallet?.balance_cents
      );

    if (
      balance <
      state.selectedInteraction
        .costCents
    ) {
      setMessage(
        "Tu n’as pas assez de crédits.",
        "error"
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "interactionPublicId",
      state.selectedInteraction
        .publicId
    );

    formData.append(
      "image",
      state.selectedFile,
      state.selectedFile.name
    );

    state.uploading =
      true;

    updateSubmitButton();

    setMessage(
      "Envoi de l’image en cours…",
      "info"
    );

    try {
      const result =
        await apiFetch(
          "/api/interactions/uploads",
          {
            method: "POST",
            body: formData
          }
        );

      if (result.wallet) {
        state.wallet = {
          ...state.wallet,
          ...result.wallet
        };

        renderWallet();
      }

      const status =
        result.upload?.status;

      setMessage(
        status === "approved"
          ? "Ton image a été envoyée et acceptée."
          : "Ton image a été envoyée à la modération.",

        "success"
      );

      clearSelectedFile();

      await reloadAccountData({
        keepMessage: true
      });

      elements.uploadsList
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    } catch (error) {
      setMessage(
        error.message ||
        "Impossible d’envoyer l’image.",

        "error"
      );
    } finally {
      state.uploading =
        false;

      updateSubmitButton();
    }
  }

  /* =========================================================
     HISTORIQUE
     ========================================================= */

  function createUploadRow(upload) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "poster-upload-item";

    article.classList.add(
      `is-${
        upload.status
      }`
    );

    const icon =
      document.createElement(
        "div"
      );

    icon.className =
      "poster-upload-icon";

    icon.append(
      createSvgIcon("image")
    );

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "poster-upload-content";

    const title =
      document.createElement(
        "strong"
      );

    title.textContent =
      upload.originalName;

    const details =
      document.createElement(
        "span"
      );

    const detailsParts = [
      upload.creatorName,
      upload.interactionTitle,
      formatFileSize(
        upload.fileSizeBytes
      )
    ].filter(Boolean);

    details.textContent =
      detailsParts.join(" · ");

    const date =
      document.createElement(
        "small"
      );

    date.textContent =
      upload.createdAt
        ? (
            `Envoyée le ${
              formatDate(
                upload.createdAt
              )
            }`
          )
        : "";

    content.append(
      title,
      details,
      date
    );

    if (
      upload.moderationNote
    ) {
      const note =
        document.createElement(
          "p"
        );

      note.className =
        "poster-upload-note";

      note.textContent =
        upload.moderationNote;

      content.append(note);
    }

    const aside =
      document.createElement(
        "div"
      );

    aside.className =
      "poster-upload-state";

    const status =
      document.createElement(
        "span"
      );

    status.className =
      "poster-status-badge";

    status.textContent =
      STATUS_LABELS[
        upload.status
      ] || upload.status;

    aside.append(status);

    if (
      upload.costCents > 0
    ) {
      const cost =
        document.createElement(
          "small"
        );

      cost.textContent =
        `− ${formatCredits(
          upload.costCents
        )}`;

      aside.append(cost);
    }

    article.append(
      icon,
      content,
      aside
    );

    return article;
  }

  function renderUploads() {
    if (!elements.uploadsList) {
      return;
    }

    elements.uploadsList
      .replaceChildren();

    setHidden(
      elements.uploadsEmpty,
      state.uploads.length > 0
    );

    for (
      const upload of
      state.uploads
    ) {
      elements.uploadsList
        .append(
          createUploadRow(
            upload
          )
        );
    }
  }

  /* =========================================================
     CHARGEMENT
     ========================================================= */

  function applyAccountData(data) {
    state.wallet =
      data.wallet ??
      data.account?.wallet ??
      {};

    state.settings =
      data.settings ?? {};

    state.interactions =
      extractInteractions(data);

    state.uploads =
      extractUploads(data);

    renderWallet();
    renderInteractions();
    renderUploads();

    if (
      state.selectedInteraction
    ) {
      const current =
        state.interactions.find(
          interaction =>
            interaction.publicId ===
            state.selectedInteraction
              .publicId
        );

      if (current) {
        state.selectedInteraction =
          current;

        selectInteraction(
          current
        );
      } else {
        deselectInteraction();
      }
    }
  }

  async function reloadAccountData({
    keepMessage = false
  } = {}) {
    if (
      elements
        .refreshUploadsButton
    ) {
      elements
        .refreshUploadsButton
        .disabled = true;

      elements
        .refreshUploadsButton
        .textContent =
          "Actualisation…";
    }

    try {
      const data =
        await apiFetch(
          "/api/interactions/account"
        );

      applyAccountData(data);

      if (!keepMessage) {
        setMessage();
      }
    } finally {
      if (
        elements
          .refreshUploadsButton
      ) {
        elements
          .refreshUploadsButton
          .disabled = false;

        elements
          .refreshUploadsButton
          .textContent =
            "Actualiser";
      }
    }
  }

  function showLoading() {
    setHidden(
      elements.loadingState,
      false
    );

    setHidden(
      elements.errorState,
      true
    );

    setHidden(
      elements.pageContent,
      true
    );
  }

  function showPage() {
    setHidden(
      elements.loadingState,
      true
    );

    setHidden(
      elements.errorState,
      true
    );

    setHidden(
      elements.pageContent,
      false
    );
  }

  function showError(error) {
    setHidden(
      elements.loadingState,
      true
    );

    setHidden(
      elements.pageContent,
      true
    );

    setHidden(
      elements.errorState,
      false
    );

    if (elements.errorMessage) {
      elements.errorMessage
        .textContent =
          error.status === 401
            ? (
                "Connecte-toi avec Twitch depuis la page d’accueil pour accéder aux interactions."
              )
            : (
                error.message ||
                "Une erreur est survenue."
              );
    }
  }

  async function startApplication() {
    if (state.loading) {
      return;
    }

    state.loading = true;

    showLoading();

    try {
      const data =
        await apiFetch(
          "/api/interactions/account"
        );

      applyAccountData(data);

      showPage();
    } catch (error) {
      console.error(
        "Impossible de charger les interactions :",
        error
      );

      showError(error);
    } finally {
      state.loading = false;
    }
  }

  /* =========================================================
     ÉVÉNEMENTS
     ========================================================= */

  onSafe(
    elements.retryButton,
    "click",
    startApplication
  );

  onSafe(
    elements.copyCodeButton,
    "click",
    copyPersonalCode
  );

  onSafe(
    elements.changeInteractionButton,
    "click",
    deselectInteraction
  );

  onSafe(
    elements.imageInput,
    "change",
    event => {
      const file =
        event.target.files?.[0];

      if (file) {
        displaySelectedFile(file);
      }
    }
  );

  onSafe(
    elements.removeFileButton,
    "click",
    clearSelectedFile
  );

  onSafe(
    elements.uploadForm,
    "submit",
    submitUpload
  );

  onSafe(
    elements.refreshUploadsButton,
    "click",
    async () => {
      try {
        await reloadAccountData();
      } catch (error) {
        setMessage(
          error.message ||
          "Impossible d’actualiser les participations.",

          "error"
        );
      }
    }
  );

  const dragEvents = [
    "dragenter",
    "dragover"
  ];

  for (
    const eventName of
    dragEvents
  ) {
    onSafe(
      elements.dropZone,
      eventName,
      event => {
        event.preventDefault();

        if (!state.uploading) {
          elements.dropZone
            ?.classList.add(
              "is-dragging"
            );
        }
      }
    );
  }

  const dragLeaveEvents = [
    "dragleave",
    "drop"
  ];

  for (
    const eventName of
    dragLeaveEvents
  ) {
    onSafe(
      elements.dropZone,
      eventName,
      event => {
        event.preventDefault();

        elements.dropZone
          ?.classList.remove(
            "is-dragging"
          );
      }
    );
  }

  onSafe(
    elements.dropZone,
    "drop",
    event => {
      if (state.uploading) {
        return;
      }

      const file =
        event.dataTransfer
          ?.files?.[0];

      if (file) {
        displaySelectedFile(file);
      }
    }
  );

  window.addEventListener(
    "beforeunload",
    () => {
      if (state.previewUrl) {
        URL.revokeObjectURL(
          state.previewUrl
        );
      }
    }
  );

  startApplication();
})();