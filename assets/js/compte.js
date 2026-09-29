(() => {
  "use strict";

  const API_URL =
    "https://api-beta.jevent.julot.fr";

  const SHOP_URL =
    `${API_URL}/api/shop`;

  const SHOP_OPENING_AT =
    new Date(
      "2026-10-12T00:00:00+02:00"
    );

  const elements = {
    navigationToggle:
      document.querySelector(
        "#navigationToggle"
      ),

    navigation:
      document.querySelector(
        "#mainNavigation"
      ),

    shopNavigationBadge:
      document.querySelector(
        "#shopNavigationBadge"
      ),

    loading:
      document.querySelector(
        "#accountLoading"
      ),

    error:
      document.querySelector(
        "#accountError"
      ),

    errorMessage:
      document.querySelector(
        "#accountErrorMessage"
      ),

    retryButton:
      document.querySelector(
        "#retryAccountButton"
      ),

    loginButton:
      document.querySelector(
        "#accountLoginButton"
      ),

    content:
      document.querySelector(
        "#accountContent"
      ),

    avatar:
      document.querySelector(
        "#accountAvatar"
      ),

    displayName:
      document.querySelector(
        "#accountDisplayName"
      ),

    login:
      document.querySelector(
        "#accountLogin"
      ),

    memberSince:
      document.querySelector(
        "#accountMemberSince"
      ),

    messagesCount:
      document.querySelector(
        "#accountMessagesCount"
      ),

    emotesCount:
      document.querySelector(
        "#accountEmotesCount"
      ),

    channelsCount:
      document.querySelector(
        "#accountChannelsCount"
      ),

    daysCount:
      document.querySelector(
        "#accountDaysCount"
      ),

    participationDays:
      [
        ...document.querySelectorAll(
          "[data-event-day]"
        )
      ],

    rolesList:
      document.querySelector(
        "#accountRolesList"
      ),

    creatorStats:
      document.querySelector(
        "#accountCreatorStats"
      ),

    creatorStatsEmpty:
      document.querySelector(
        "#accountCreatorStatsEmpty"
      ),

    unlockedBadgesList:
      document.querySelector(
        "#unlockedBadgesList"
      ),

    unlockedBadgesEmpty:
      document.querySelector(
        "#unlockedBadgesEmpty"
      ),

    unlockedBadgesCount:
      document.querySelector(
        "#unlockedBadgesCount"
      ),

    lockedBadgesList:
      document.querySelector(
        "#lockedBadgesList"
      ),

    lockedBadgesEmpty:
      document.querySelector(
        "#lockedBadgesEmpty"
      ),

    openBadgesButton:
      document.querySelector(
        "#openBadgesDialog"
      ),

    closeBadgesButton:
      document.querySelector(
        "#closeBadgesDialog"
      ),

    badgesDialog:
      document.querySelector(
        "#badgesDialog"
      ),

    badgesDialogGrid:
      document.querySelector(
        "#badgesDialogGrid"
      ),

    badgeHoverDetails:
      document.querySelector(
        "#badgeHoverDetails"
      ),

    badgesSummary:
      document.querySelector(
        "#accountBadgesSummary"
      ),

    creatorPageLink:
      document.querySelector(
        "#creatorPageLink"
      ),

    adminPanelLink:
      document.querySelector(
        "#adminPanelLink"
      ),

    moderationPanelLink:
      document.querySelector(
        "#moderationPanelLink"
      ),

    canvas:
      document.querySelector(
        "#badgeCardCanvas"
      ),

    downloadCardButton:
      document.querySelector(
        "#downloadBadgeCardButton"
      ),

    logoutButton:
      document.querySelector(
        "#logoutButton"
      ),
    badgeShowcaseList:
      document.querySelector(
        "#badgeShowcaseList"
      ),

    badgeShowcaseCount:
      document.querySelector(
        "#badgeShowcaseCount"
      ),

    badgeShowcaseMessage:
      document.querySelector(
        "#badgeShowcaseMessage"
      ),
  };

  let profile = null;
  let linkedCreator = null;
  let showcaseKeys = [];
  let draggedShowcaseKey = null;
  let savingShowcase = false;

  /*
   * =======================================================
   * API
   * =======================================================
   */

  async function apiFetch(
    path,
    options = {}
  ) {
    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        () => controller.abort(),
        15_000
      );

    try {
      const response =
        await fetch(
          API_URL + path,
          {
            credentials: "include",

            headers: {
              Accept:
                "application/json",

              ...(options.body
                ? {
                  "Content-Type":
                    "application/json"
                }
                : {}),

              ...(options.headers ?? {})
            },

            signal:
              controller.signal,

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
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "La requête a pris trop de temps."
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  /*
   * =======================================================
   * Outils généraux
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

  function formatNumber(value) {
    return new Intl.NumberFormat(
      "fr-FR"
    ).format(
      Number(value ?? 0)
    );
  }

  function formatDate(value) {
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
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(date);
  }

  function clampPercentage(value) {
    return Math.max(
      0,
      Math.min(
        100,
        Number(value ?? 0)
      )
    );
  }

  function getInitials(value) {
    const words =
      String(value ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
      return "JE";
    }

    return words
      .slice(0, 2)
      .map(word =>
        word.charAt(0)
      )
      .join("")
      .toUpperCase();
  }

  /*
   * =======================================================
   * Navigation mobile
   * =======================================================
   */

  function setNavigationOpen(open) {
    if (
      !elements.navigation ||
      !elements.navigationToggle
    ) {
      return;
    }

    elements.navigation.classList
      .toggle(
        "is-open",
        open
      );

    elements.navigationToggle
      .setAttribute(
        "aria-expanded",
        String(open)
      );

    elements.navigationToggle
      .setAttribute(
        "aria-label",
        open
          ? "Fermer le menu"
          : "Ouvrir le menu"
      );

    document.body.classList.toggle(
      "navigation-open",
      open
    );
  }

  /*
   * =======================================================
   * Boutique
   * =======================================================
   */

  function updateShopState() {
    const opened =
      Date.now() >=
      SHOP_OPENING_AT.getTime();

    document
      .querySelectorAll(
        "[data-shop-link]"
      )
      .forEach(link => {
        if (opened) {
          link.href = SHOP_URL;

          link.classList.remove(
            "is-disabled"
          );

          link.removeAttribute(
            "aria-disabled"
          );

          return;
        }

        link.href =
          "/#boutique";

        link.classList.add(
          "is-disabled"
        );

        link.setAttribute(
          "aria-disabled",
          "true"
        );
      });

    if (
      elements.shopNavigationBadge
    ) {
      elements.shopNavigationBadge
        .textContent =
        opened
          ? "Ouverte"
          : "12 oct.";
    }
  }

  /*
   * =======================================================
   * États de la page
   * =======================================================
   */

  function showLoading() {
    if (elements.loading) {
      elements.loading.hidden =
        false;
    }

    if (elements.error) {
      elements.error.hidden =
        true;
    }

    if (elements.content) {
      elements.content.hidden =
        true;
    }
  }

  function showContent() {
    if (elements.loading) {
      elements.loading.hidden =
        true;
    }

    if (elements.error) {
      elements.error.hidden =
        true;
    }

    if (elements.content) {
      elements.content.hidden =
        false;
    }
  }

  function showError(error) {
    if (elements.loading) {
      elements.loading.hidden =
        true;
    }

    if (elements.content) {
      elements.content.hidden =
        true;
    }

    if (elements.error) {
      elements.error.hidden =
        false;
    }

    if (elements.errorMessage) {
      elements.errorMessage.textContent =
        error?.message ||
        "Une erreur est survenue.";
    }

    const requiresLogin =
      Number(error?.status) === 401;

    if (elements.loginButton) {
      elements.loginButton.hidden =
        !requiresLogin;
    }

    if (elements.retryButton) {
      elements.retryButton.hidden =
        requiresLogin;
    }
  }

  /*
   * =======================================================
   * Profil Twitch
   * =======================================================
   */

  function renderIdentity() {
    const account =
      profile?.account;

    if (!account) {
      return;
    }

    const displayName =
      account.twitchDisplayName ||
      account.twitchLogin ||
      "Compte Twitch";

    document.title =
      `${displayName} — JEvent 26`;

    if (elements.avatar) {
      elements.avatar.src =
        account
          .twitchProfileImageUrl ||
        "/assets/jevent_logo.png";

      elements.avatar.alt =
        `Avatar de ${displayName}`;
    }

    if (elements.displayName) {
      elements.displayName.textContent =
        displayName;
    }

    if (elements.login) {
      elements.login.textContent =
        account.twitchLogin
          ? `@${account.twitchLogin}`
          : "";
    }

    const createdAt =
      formatDate(
        account.createdAt
      );

    if (elements.memberSince) {
      elements.memberSince.textContent =
        createdAt
          ? (
            "Membre du JEvent depuis " +
            createdAt
          )
          : "";
    }
  }

  /*
   * =======================================================
   * Statistiques
   * =======================================================
   */

  function renderStatistics() {
    const stats =
      profile?.stats ?? {};

    if (elements.messagesCount) {
      elements.messagesCount.textContent =
        formatNumber(
          stats.messages
        );
    }

    if (elements.emotesCount) {
      elements.emotesCount.textContent =
        formatNumber(
          stats.emotes
        );
    }

    if (elements.channelsCount) {
      elements.channelsCount.textContent =
        formatNumber(
          stats.channels
        );
    }

    if (elements.daysCount) {
      elements.daysCount.textContent =
        `${formatNumber(
          stats.days
        )} / 3`;
    }

    const participatedDays =
      new Set(
        Array.isArray(
          stats.eventDays
        )
          ? stats.eventDays.map(
            Number
          )
          : []
      );

    for (
      const dayElement of
      elements.participationDays
    ) {
      const day =
        Number(
          dayElement.dataset
            .eventDay
        );

      const completed =
        participatedDays.has(day);

      dayElement.classList.toggle(
        "is-completed",
        completed
      );

      dayElement.setAttribute(
        "aria-label",
        completed
          ? (
            `Jour ${day} : ` +
            "participation validée"
          )
          : (
            `Jour ${day} : ` +
            "participation non validée"
          )
      );

      let status =
        dayElement.querySelector(
          ".participation-day-status"
        );

      if (!status) {
        status =
          createElement(
            "span",
            "participation-day-status"
          );

        dayElement.append(status);
      }

      status.textContent =
        completed
          ? "Validé"
          : "À participer";
    }
  }

  /*
   * =======================================================
   * Grades
   * =======================================================
   */

  function roleIcon(role) {
    const type =
      String(
        role?.type ??
        role?.key ??
        ""
      );

    if (
      type.includes(
        "super_admin"
      )
    ) {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="m12 3 2.5 5.2 5.7.8-4.1 4
               1 5.7-5.1-2.7-5.1 2.7
               1-5.7-4.1-4 5.7-.8L12 3Z"
          ></path>
        </svg>
      `;
    }

    if (
      type.includes(
        "moderator"
      )
    ) {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 3 20 7v5c0 5-3.4 8-8 9
               -4.6-1-8-4-8-9V7l8-4Z"
          ></path>
          <path d="m9 12 2 2 4-5"></path>
        </svg>
      `;
    }

    if (
      type.includes(
        "creator"
      )
    ) {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 5h14v10H5V5Zm4 14h6
               M12 15v4"
          ></path>
        </svg>
      `;
    }

    return `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="8"
          r="4"
        ></circle>
        <path
          d="M4.5 21a7.5 7.5 0 0 1 15 0"
        ></path>
      </svg>
    `;
  }

  function roleClass(role) {
    const key =
      String(
        role?.key ??
        role?.type ??
        ""
      );

    if (
      key.includes(
        "super_admin"
      )
    ) {
      return "is-admin";
    }

    if (
      key.includes(
        "creator_moderator"
      )
    ) {
      return "is-channel-moderator";
    }

    if (
      key.includes(
        "moderator"
      )
    ) {
      return "is-moderator";
    }

    if (
      key.includes(
        "creator"
      )
    ) {
      return "is-creator";
    }

    return "is-viewer";
  }

  function renderRoles() {
    if (!elements.rolesList) {
      return;
    }

    elements.rolesList
      .replaceChildren();

    const roles =
      Array.isArray(profile?.roles)
        ? profile.roles
        : [];

    for (const role of roles) {
      const card =
        createElement(
          "article",
          "account-role"
        );

      card.classList.add(
        roleClass(role)
      );

      const icon =
        createElement(
          "span",
          "account-role-icon"
        );

      icon.innerHTML =
        roleIcon(role);

      const copy =
        createElement(
          "div",
          "account-role-copy"
        );

      copy.append(
        createElement(
          "strong",
          "",
          role.label ||
          "Rôle JEvent"
        )
      );

      if (
        role.type ===
        "creator_moderator" &&
        role.creator
      ) {
        copy.append(
          createElement(
            "span",
            "",
            "Rôle lié à une chaîne"
          )
        );
      } else if (
        role.key ===
        "super_admin"
      ) {
        copy.append(
          createElement(
            "span",
            "",
            "Accès complet au panel Admin"
          )
        );
      } else if (
        role.key === "creator"
      ) {
        copy.append(
          createElement(
            "span",
            "",
            "Créateur participant"
          )
        );
      } else {
        copy.append(
          createElement(
            "span",
            "",
            "Rôle global JEvent"
          )
        );
      }

      card.append(
        icon,
        copy
      );

      elements.rolesList.append(
        card
      );
    }

    if (roles.length === 0) {
      elements.rolesList.append(
        createElement(
          "p",
          "account-empty-message",
          "Aucun grade disponible."
        )
      );
    }
  }

  /*
   * =======================================================
   * Badges
   * =======================================================
   */

  function badgeIconSvg(iconKey) {
    const icon =
      String(iconKey ?? "");

    if (icon === "messages") {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M4 5h16v12H8l-4 4V5Z"
          ></path>
        </svg>
      `;
    }

    if (icon === "chat") {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 4h14a2 2 0 0 1 2 2v9
               a2 2 0 0 1-2 2h-7l-5 4v-4H5
               a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          ></path>
        </svg>
      `;
    }

    if (icon === "calendar") {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 4v3M19 4v3M4 9h16
               M5 6h14a1 1 0 0 1 1 1v12
               a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1
               V7a1 1 0 0 1 1-1Z"
          ></path>
          <path d="m9 14 2 2 4-4"></path>
        </svg>
      `;
    }

    if (icon === "explorer") {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
          ></circle>
          <path
            d="m15.5 8.5-2 5-5 2 2-5 5-2Z"
          ></path>
        </svg>
      `;
    }

    if (icon === "emote") {
      return `
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
          ></circle>
          <path
            d="M8.5 10h.01M15.5 10h.01
               M8 14c1.1 1.3 2.4 2 4 2
               s2.9-.7 4-2"
          ></path>
        </svg>
      `;
    }

    return `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="m12 3 2.5 5.2 5.7.8-4.1 4
             1 5.7-5.1-2.7-5.1 2.7
             1-5.7-4.1-4 5.7-.8L12 3Z"
        ></path>
      </svg>
    `;
  }

  function getAllAccountBadges() {
    const unlocked =
      Array.isArray(
        profile?.badges?.unlocked
      )
        ? profile.badges.unlocked.map(
          badge => ({
            ...badge,
            unlocked: true
          })
        )
        : [];

    const locked =
      Array.isArray(
        profile?.badges?.locked
      )
        ? profile.badges.locked.map(
          badge => ({
            ...badge,
            unlocked: false
          })
        )
        : [];

    return [
      ...unlocked,
      ...locked
    ];
  }
  function getUnlockedBadges() {
    return Array.isArray(
      profile?.badges?.unlocked
    )
      ? profile.badges.unlocked
      : [];
  }

  function initializeBadgeShowcase() {
    const unlockedBadges =
      getUnlockedBadges();

    const unlockedKeys =
      new Set(
        unlockedBadges.map(
          badge => badge.key
        )
      );

    const storedKeys =
      Array.isArray(
        profile?.badges?.showcase
      )
        ? profile.badges.showcase
        : [];

    showcaseKeys =
      storedKeys
        .filter(key =>
          unlockedKeys.has(key)
        )
        .slice(0, 5);

    /*
     * Si aucune sélection n’existe encore,
     * utilise les cinq premiers badges.
     */
    if (
      showcaseKeys.length === 0 &&
      unlockedBadges.length > 0
    ) {
      showcaseKeys =
        unlockedBadges
          .slice(0, 5)
          .map(badge => badge.key);
    }
  }

  function getUnlockedBadgeByKey(key) {
    return (
      getUnlockedBadges().find(
        badge => badge.key === key
      ) ?? null
    );
  }

  function showBadgeShowcaseMessage(
    message = "",
    type = ""
  ) {
    if (!elements.badgeShowcaseMessage) {
      return;
    }

    elements.badgeShowcaseMessage
      .textContent =
      message;

    elements.badgeShowcaseMessage
      .className =
      "badge-showcase-message";

    elements.badgeShowcaseMessage.hidden =
      !message;

    if (type) {
      elements.badgeShowcaseMessage
        .classList.add(
          `is-${type}`
        );
    }
  }

  async function saveBadgeShowcase(
    previousKeys
  ) {
    if (savingShowcase) {
      return;
    }

    savingShowcase = true;

    showBadgeShowcaseMessage(
      "Enregistrement…"
    );

    try {
      const result =
        await apiFetch(
          "/api/account/badge-showcase",
          {
            method: "PUT",

            body: JSON.stringify({
              badges: showcaseKeys
            })
          }
        );

      showcaseKeys =
        Array.isArray(result.showcase)
          ? result.showcase
          : [...showcaseKeys];

      if (profile?.badges) {
        profile.badges.showcase =
          [...showcaseKeys];
      }

      renderBadgeShowcase();
      renderBadgesDialog();

      await drawBadgeCard();

      showBadgeShowcaseMessage(
        "Carte mise à jour.",
        "success"
      );
    } catch (error) {
      showcaseKeys =
        [...previousKeys];

      renderBadgeShowcase();
      renderBadgesDialog();

      showBadgeShowcaseMessage(
        error.message,
        "error"
      );
    } finally {
      savingShowcase = false;
    }
  }

  async function toggleBadgeInShowcase(
    badge
  ) {
    if (
      savingShowcase ||
      !badge?.unlocked
    ) {
      return;
    }

    const previousKeys =
      [...showcaseKeys];

    const alreadySelected =
      showcaseKeys.includes(
        badge.key
      );

    if (alreadySelected) {
      /*
       * Garde au moins un badge sur la carte
       * lorsqu’un badge est disponible.
       */
      if (showcaseKeys.length === 1) {
        showBadgeShowcaseMessage(
          "La carte doit conserver au moins un badge.",
          "error"
        );

        return;
      }

      showcaseKeys =
        showcaseKeys.filter(
          key => key !== badge.key
        );
    } else {
      if (showcaseKeys.length >= 5) {
        showBadgeShowcaseMessage(
          "Tu peux sélectionner au maximum cinq badges.",
          "error"
        );

        return;
      }

      showcaseKeys.push(
        badge.key
      );
    }

    renderBadgeShowcase();
    renderBadgesDialog();

    await saveBadgeShowcase(
      previousKeys
    );
  }

  async function moveShowcaseBadge(
    sourceKey,
    targetKey
  ) {
    if (
      savingShowcase ||
      !sourceKey ||
      !targetKey ||
      sourceKey === targetKey
    ) {
      return;
    }

    const previousKeys =
      [...showcaseKeys];

    const sourceIndex =
      showcaseKeys.indexOf(
        sourceKey
      );

    const targetIndex =
      showcaseKeys.indexOf(
        targetKey
      );

    if (
      sourceIndex === -1 ||
      targetIndex === -1
    ) {
      return;
    }

    const nextKeys =
      [...showcaseKeys];

    const [movedKey] =
      nextKeys.splice(
        sourceIndex,
        1
      );

    nextKeys.splice(
      targetIndex,
      0,
      movedKey
    );

    showcaseKeys = nextKeys;

    renderBadgeShowcase();
    renderBadgesDialog();

    await saveBadgeShowcase(
      previousKeys
    );
  }

  function createShowcaseBadge(badge) {
    const item =
      createElement(
        "article",
        "badge-showcase-item"
      );

    item.draggable = true;

    item.dataset.badgeKey =
      badge.key;

    const icon =
      createElement(
        "span",
        "badge-showcase-icon"
      );

    icon.innerHTML =
      badgeIconSvg(
        badge.iconKey
      );

    const label =
      createElement(
        "strong",
        "badge-showcase-label",
        badge.label ||
        "Badge JEvent"
      );

    const removeButton =
      createElement(
        "button",
        "badge-showcase-remove"
      );

    removeButton.type = "button";

    removeButton.title =
      "Retirer de la carte";

    removeButton.setAttribute(
      "aria-label",
      `Retirer ${badge.label} de la carte`
    );

    removeButton.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18"></path>
    </svg>
  `;

    removeButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        void toggleBadgeInShowcase(
          {
            ...badge,
            unlocked: true
          }
        );
      }
    );

    item.addEventListener(
      "dragstart",
      event => {
        draggedShowcaseKey =
          badge.key;

        item.classList.add(
          "is-dragging"
        );

        event.dataTransfer.effectAllowed =
          "move";

        event.dataTransfer.setData(
          "text/plain",
          badge.key
        );
      }
    );

    item.addEventListener(
      "dragover",
      event => {
        if (
          !draggedShowcaseKey ||
          draggedShowcaseKey ===
          badge.key
        ) {
          return;
        }

        event.preventDefault();

        item.classList.add(
          "is-drag-target"
        );
      }
    );

    item.addEventListener(
      "dragleave",
      () => {
        item.classList.remove(
          "is-drag-target"
        );
      }
    );

    item.addEventListener(
      "drop",
      event => {
        event.preventDefault();

        item.classList.remove(
          "is-drag-target"
        );

        const sourceKey =
          draggedShowcaseKey ||
          event.dataTransfer.getData(
            "text/plain"
          );

        void moveShowcaseBadge(
          sourceKey,
          badge.key
        );
      }
    );

    item.addEventListener(
      "dragend",
      () => {
        draggedShowcaseKey = null;

        document
          .querySelectorAll(
            ".badge-showcase-item"
          )
          .forEach(element => {
            element.classList.remove(
              "is-dragging",
              "is-drag-target"
            );
          });
      }
    );

    item.append(
      icon,
      label,
      removeButton
    );

    return item;
  }

  function renderBadgeShowcase() {
    if (!elements.badgeShowcaseList) {
      return;
    }

    elements.badgeShowcaseList
      .replaceChildren();

    for (
      const badgeKey of
      showcaseKeys
    ) {
      const badge =
        getUnlockedBadgeByKey(
          badgeKey
        );

      if (!badge) {
        continue;
      }

      elements.badgeShowcaseList.append(
        createShowcaseBadge(badge)
      );
    }

    /*
     * Affiche les emplacements encore libres.
     */
    for (
      let index = showcaseKeys.length;
      index < 5;
      index += 1
    ) {
      const slot =
        createElement(
          "span",
          "badge-showcase-empty-slot",
          "Emplacement libre"
        );

      elements.badgeShowcaseList.append(
        slot
      );
    }

    if (elements.badgeShowcaseCount) {
      elements.badgeShowcaseCount
        .textContent =
        `${showcaseKeys.length} / 5`;
    }
  }

  function badgeRequirementLabel(badge) {
    if (
      badge.requirementsHidden === true ||
      badge.hideRequirements === true
    ) {
      return "Méthode d’obtention masquée.";
    }

    const current =
      Number(badge.current ?? 0);

    const target =
      Number(badge.target ?? 0);

    const ruleKey =
      String(badge.ruleKey ?? "");

    const labels = {
      message_count:
        "Messages envoyés",

      emote_count:
        "Emotes utilisées",

      channel_count:
        "Chaînes visitées",

      event_days:
        "Jours de participation",

      site_interaction:
        "Interaction sur le site",

      advanced:
        "Condition spéciale"
    };

    const label =
      labels[ruleKey] ??
      "Condition d’obtention";

    if (target > 0) {
      return (
        `${label} : ` +
        `${formatNumber(current)} / ` +
        `${formatNumber(target)}`
      );
    }

    return badge.unlocked
      ? "Badge obtenu."
      : "Condition non précisée.";
  }

  function renderBadgeDetails(badge) {
    if (!elements.badgeHoverDetails) {
      return;
    }

    elements.badgeHoverDetails
      .replaceChildren();

    const icon =
      createElement(
        "span",
        "badge-hover-icon"
      );

    icon.innerHTML =
      badgeIconSvg(
        badge.iconKey
      );

    const copy =
      createElement(
        "div",
        "badge-hover-copy"
      );

    copy.append(
      createElement(
        "strong",
        "",
        badge.label ||
        "Badge JEvent"
      )
    );

    if (
      badge.detailsHidden === true &&
      !badge.unlocked
    ) {
      copy.append(
        createElement(
          "p",
          "",
          "La description de ce badge est secrète."
        ),

        createElement(
          "span",
          "badge-hover-requirement",
          "Méthode d’obtention secrète."
        )
      );
    } else {
      copy.append(
        createElement(
          "p",
          "",
          badge.description ||
          "Aucune description."
        ),

        createElement(
          "span",
          "badge-hover-requirement",
          badgeRequirementLabel(badge)
        )
      );
    }

    const state =
      createElement(
        "span",
        (
          "badge-hover-state " +
          (
            badge.unlocked
              ? "is-unlocked"
              : "is-locked"
          )
        ),
        badge.unlocked
          ? "Débloqué"
          : "Non découvert"
      );

    elements.badgeHoverDetails.append(
      icon,
      copy,
      state
    );
  }

  function createBadgeTile(badge) {
    const tile =
      createElement(
        "article",
        (
          "badge-tile " +
          (
            badge.unlocked
              ? "is-unlocked"
              : "is-locked"
          )
        )
      );

    tile.tabIndex = 0;

    tile.setAttribute(
      "aria-label",
      (
        `${badge.label || "Badge JEvent"} — ` +
        (
          badge.unlocked
            ? "Débloqué"
            : "Non découvert"
        )
      )
    );

    const icon =
      createElement(
        "span",
        "badge-tile-icon"
      );

    icon.innerHTML =
      badgeIconSvg(
        badge.iconKey
      );

    const label =
      createElement(
        "strong",
        "badge-tile-label",
        badge.label ||
        "Badge JEvent"
      );

    const state =
      createElement(
        "span",
        "badge-tile-state",
        badge.unlocked
          ? "Débloqué"
          : "À découvrir"
      );

    tile.append(
      icon,
      label,
      state
    );

    if (badge.unlocked) {
      const selected =
        showcaseKeys.includes(
          badge.key
        );

      tile.classList.toggle(
        "is-showcased",
        selected
      );

      const showcaseButton =
        createElement(
          "button",
          "badge-tile-showcase-toggle"
        );

      showcaseButton.type =
        "button";

      showcaseButton.title =
        selected
          ? "Retirer de la carte"
          : "Ajouter à la carte";

      showcaseButton.setAttribute(
        "aria-label",
        selected
          ? (
            `Retirer ${badge.label} ` +
            "de la carte"
          )
          : (
            `Ajouter ${badge.label} ` +
            "à la carte"
          )
      );

      showcaseButton.innerHTML =
        selected
          ? `
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m5 12 4 4L19 6"></path>
          </svg>
        `
          : `
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14"></path>
          </svg>
        `;

      showcaseButton.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          void toggleBadgeInShowcase(
            badge
          );
        }
      );

      tile.append(
        showcaseButton
      );
    }

    tile.addEventListener(
      "mouseenter",
      () => {
        renderBadgeDetails(badge);
      }
    );

    tile.addEventListener(
      "focus",
      () => {
        renderBadgeDetails(badge);
      }
    );

    return tile;
  }

  function renderBadgesDialog() {
    if (!elements.badgesDialogGrid) {
      return;
    }

    renderBadgeShowcase();

    const badges =
      getAllAccountBadges();

    const unlockedCount =
      badges.filter(
        badge => badge.unlocked
      ).length;

    elements.badgesDialogGrid
      .replaceChildren();

    for (const badge of badges) {
      elements.badgesDialogGrid.append(
        createBadgeTile(badge)
      );
    }

    if (elements.badgesSummary) {
      elements.badgesSummary.textContent =
        (
          `${formatNumber(
            unlockedCount
          )} badge${unlockedCount > 1
            ? "s"
            : ""
          } débloqué${unlockedCount > 1
            ? "s"
            : ""
          } sur ${formatNumber(
            badges.length
          )}`
        );
    }

    if (badges.length > 0) {
      renderBadgeDetails(
        badges[0]
      );
    } else if (
      elements.badgeHoverDetails
    ) {
      elements.badgeHoverDetails
        .textContent =
        "Aucun badge disponible.";
    }
  }

  function openBadgesDialog() {
    if (!elements.badgesDialog) {
      return;
    }

    renderBadgesDialog();

    elements.badgesDialog.showModal();
  }

  function closeBadgesDialog() {
    elements.badgesDialog?.close();
  }

  /*
   * =======================================================
   * Statistiques par créateur
   * =======================================================
   */

  function renderCreatorStats() {
    if (!elements.creatorStats) {
      return;
    }

    const creators =
      Array.isArray(
        profile?.stats?.byCreator
      )
        ? profile.stats.byCreator
        : [];

    elements.creatorStats
      .replaceChildren();

    for (const creator of creators) {
      const link =
        createElement(
          "a",
          "account-creator-stat"
        );

      link.href =
        creator.slug
          ? (
            "/createur.html?slug=" +
            encodeURIComponent(
              creator.slug
            )
          )
          : "/createurs.html";

      const identity =
        createElement(
          "div",
          "account-creator-stat-identity"
        );

      const avatar =
        createElement(
          "span",
          "account-creator-stat-avatar",
          getInitials(
            creator.displayName ||
            creator.slug
          )
        );

      const name =
        createElement(
          "strong",
          "",
          creator.displayName ||
          creator.slug ||
          "Créateur"
        );

      identity.append(
        avatar,
        name
      );

      const values =
        createElement(
          "div",
          "account-creator-stat-values"
        );

      values.append(
        createElement(
          "span",
          "",
          `${formatNumber(
            creator.messages
          )} messages`
        ),

        createElement(
          "span",
          "",
          `${formatNumber(
            creator.emotes
          )} emotes`
        )
      );

      link.append(
        identity,
        values
      );

      elements.creatorStats.append(
        link
      );
    }

    if (
      elements.creatorStatsEmpty
    ) {
      elements.creatorStatsEmpty
        .hidden =
        creators.length !== 0;
    }
  }

  /*
   * =======================================================
   * Liens liés aux rôles
   * =======================================================
   */

  function hasRole(key) {
    return (
      Array.isArray(profile?.roles) &&
      profile.roles.some(
        role =>
          role.key === key
      )
    );
  }

  function hasRoleType(type) {
    return (
      Array.isArray(profile?.roles) &&
      profile.roles.some(
        role =>
          role.type === type
      )
    );
  }

  async function findLinkedCreator() {
    if (
      !hasRole("creator") ||
      !profile?.account?.twitchId
    ) {
      linkedCreator = null;
      return;
    }

    try {
      const data =
        await apiFetch(
          "/api/creators"
        );

      const creators =
        Array.isArray(
          data?.creators
        )
          ? data.creators
          : [];

      linkedCreator =
        creators.find(
          creator =>
            String(
              creator.twitchId ?? ""
            ) ===
            String(
              profile.account
                .twitchId
            )
        ) ?? null;
    } catch (error) {
      linkedCreator = null;

      console.warn(
        "Impossible de retrouver le profil créateur :",
        error
      );
    }
  }

  function renderQuickLinks() {
    const isAdmin =
      hasRole("super_admin");

    const isModerator =
      hasRole("moderator") ||
      hasRoleType(
        "creator_moderator"
      );

    if (elements.adminPanelLink) {
      elements.adminPanelLink.hidden =
        !isAdmin;
    }

    if (
      elements.moderationPanelLink
    ) {
      elements.moderationPanelLink
        .hidden =
        !isModerator &&
        !isAdmin;
    }

    if (elements.creatorPageLink) {
      if (linkedCreator?.slug) {
        elements.creatorPageLink.href =
          (
            "/createur.html?slug=" +
            encodeURIComponent(
              linkedCreator.slug
            )
          );

        elements.creatorPageLink.hidden =
          false;
      } else {
        elements.creatorPageLink.hidden =
          true;
      }
    }
  }

  /*
   * =======================================================
   * Carte partageable
   * =======================================================
   */

  function roundedRectangle(
    context,
    x,
    y,
    width,
    height,
    radius
  ) {
    const safeRadius =
      Math.min(
        radius,
        width / 2,
        height / 2
      );

    context.beginPath();

    context.roundRect(
      x,
      y,
      width,
      height,
      safeRadius
    );

    context.closePath();
  }

  function loadCanvasImage(url) {
    return new Promise(
      (resolve, reject) => {
        const image =
          new Image();

        image.crossOrigin =
          "anonymous";

        image.onload =
          () => resolve(image);

        image.onerror =
          reject;

        image.src = url;
      }
    );
  }

  function drawCircularImage(
    context,
    image,
    x,
    y,
    size
  ) {
    context.save();

    context.beginPath();

    context.arc(
      x + size / 2,
      y + size / 2,
      size / 2,
      0,
      Math.PI * 2
    );

    context.clip();

    context.drawImage(
      image,
      x,
      y,
      size,
      size
    );

    context.restore();
  }

  function drawAvatarFallback(
    context,
    name,
    x,
    y,
    size
  ) {
    const gradient =
      context.createLinearGradient(
        x,
        y,
        x + size,
        y + size
      );

    gradient.addColorStop(
      0,
      "#00b237"
    );

    gradient.addColorStop(
      1,
      "#074719"
    );

    context.fillStyle =
      gradient;

    context.beginPath();

    context.arc(
      x + size / 2,
      y + size / 2,
      size / 2,
      0,
      Math.PI * 2
    );

    context.fill();

    context.fillStyle =
      "#ffffff";

    context.font =
      "900 52px system-ui";

    context.textAlign =
      "center";

    context.textBaseline =
      "middle";

    context.fillText(
      getInitials(name),
      x + size / 2,
      y + size / 2 + 2
    );
  }

  function cardBadges() {
    const unlocked =
      getUnlockedBadges();

    const badgesByKey =
      new Map(
        unlocked.map(
          badge => [
            badge.key,
            badge
          ]
        )
      );

    return showcaseKeys
      .map(key =>
        badgesByKey.get(key)
      )
      .filter(Boolean)
      .slice(0, 5);
  }

  async function drawBadgeCard() {
    if (
      !elements.canvas ||
      !profile?.account
    ) {
      return;
    }

    const canvas =
      elements.canvas;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    const account =
      profile.account;

    const displayName =
      account.twitchDisplayName ||
      account.twitchLogin ||
      "Participant JEvent";

    const badges =
      cardBadges();

    const background =
      context.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );

    background.addColorStop(
      0,
      "#040a06"
    );

    background.addColorStop(
      0.55,
      "#08150d"
    );

    background.addColorStop(
      1,
      "#062b12"
    );

    context.fillStyle =
      background;

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    /*
     * Décorations
     */

    context.fillStyle =
      "rgba(0, 178, 55, 0.10)";

    context.beginPath();

    context.arc(
      1080,
      70,
      270,
      0,
      Math.PI * 2
    );

    context.fill();

    context.strokeStyle =
      "rgba(108, 245, 143, 0.12)";

    context.lineWidth = 2;

    context.beginPath();

    context.arc(
      1080,
      70,
      205,
      0,
      Math.PI * 2
    );

    context.stroke();

    /*
     * Marque JEvent
     */

    context.fillStyle =
      "#6cf58f";

    context.font =
      "900 24px system-ui";

    context.textAlign =
      "left";

    context.textBaseline =
      "alphabetic";

    context.fillText(
      "JEVENT 26",
      70,
      75
    );

    context.fillStyle =
      "#95a99a";

    context.font =
      "700 18px system-ui";

    context.fillText(
      "Association Petits Princes",
      70,
      106
    );

    /*
     * Avatar
     */

    let avatarDrawn = false;

    if (
      account
        .twitchProfileImageUrl
    ) {
      try {
        const image =
          await loadCanvasImage(
            account
              .twitchProfileImageUrl
          );

        drawCircularImage(
          context,
          image,
          70,
          164,
          145
        );

        avatarDrawn = true;
      } catch {
        avatarDrawn = false;
      }
    }

    if (!avatarDrawn) {
      drawAvatarFallback(
        context,
        displayName,
        70,
        164,
        145
      );
    }

    context.strokeStyle =
      "#00b237";

    context.lineWidth = 6;

    context.beginPath();

    context.arc(
      142.5,
      236.5,
      75,
      0,
      Math.PI * 2
    );

    context.stroke();

    /*
     * Identité
     */

    context.fillStyle =
      "#ffffff";

    context.font =
      "900 48px system-ui";

    context.fillText(
      displayName,
      250,
      220
    );

    context.fillStyle =
      "#a9b9ac";

    context.font =
      "700 23px system-ui";

    context.fillText(
      account.twitchLogin
        ? `@${account.twitchLogin}`
        : "Participant JEvent",
      250,
      263
    );

    context.fillStyle =
      "#6cf58f";

    context.font =
      "800 20px system-ui";

    context.fillText(
      `${badges.length} badge${badges.length > 1
        ? "s"
        : ""
      } attribué${badges.length > 1
        ? "s"
        : ""
      }`,
      250,
      303
    );

    /*
     * Badges
     */

    const badgeY = 380;
    const badgeGap = 15;

    const availableWidth =
      canvas.width - 140;

    const badgeWidth =
      (
        availableWidth -
        badgeGap * 4
      ) / 5;

    for (
      let index = 0;
      index < 5;
      index += 1
    ) {
      const x =
        70 +
        index *
        (badgeWidth + badgeGap);

      const badge =
        badges[index];

      roundedRectangle(
        context,
        x,
        badgeY,
        badgeWidth,
        145,
        18
      );

      context.fillStyle =
        badge
          ? "rgba(0, 178, 55, 0.12)"
          : "rgba(255, 255, 255, 0.025)";

      context.fill();

      context.strokeStyle =
        badge
          ? "rgba(108, 245, 143, 0.35)"
          : "rgba(255, 255, 255, 0.07)";

      context.lineWidth = 2;
      context.stroke();

      if (!badge) {
        context.fillStyle =
          "#526057";

        context.font =
          "700 16px system-ui";

        context.textAlign =
          "center";

        context.fillText(
          "Badge à débloquer",
          x + badgeWidth / 2,
          badgeY + 80
        );

        context.textAlign =
          "left";

        continue;
      }

      context.fillStyle =
        "#6cf58f";

      context.beginPath();

      context.arc(
        x + badgeWidth / 2,
        badgeY + 42,
        17,
        0,
        Math.PI * 2
      );

      context.fill();

      context.fillStyle =
        "#001d09";

      context.font =
        "900 18px system-ui";

      context.textAlign =
        "center";

      context.fillText(
        "✓",
        x + badgeWidth / 2,
        badgeY + 49
      );

      context.fillStyle =
        "#ffffff";

      context.font =
        "800 17px system-ui";

      const label =
        String(
          badge.label ??
          "Badge JEvent"
        );

      const shortLabel =
        label.length > 20
          ? (
            label.slice(0, 18) +
            "…"
          )
          : label;

      context.fillText(
        shortLabel,
        x + badgeWidth / 2,
        badgeY + 96
      );

      context.fillStyle =
        "#95a99a";

      context.font =
        "700 13px system-ui";

      context.fillText(
        "Débloqué",
        x + badgeWidth / 2,
        badgeY + 120
      );

      context.textAlign =
        "left";
    }

    context.fillStyle =
      "#6e8173";

    context.font =
      "700 16px system-ui";

    context.textAlign =
      "right";

    context.fillText(
      "jevent.julot.fr",
      canvas.width - 70,
      canvas.height - 42
    );

    context.textAlign =
      "left";
  }

  function downloadBadgeCard() {
    if (!elements.canvas) {
      return;
    }

    const link =
      document.createElement("a");

    const login =
      profile?.account
        ?.twitchLogin ||
      "participant";

    link.download =
      `jevent-26-${login}-badges.png`;

    link.href =
      elements.canvas
        .toDataURL("image/png");

    link.click();
  }

  /*
   * =======================================================
   * Déconnexion
   * =======================================================
   */

  async function logout() {
    if (!elements.logoutButton) {
      return;
    }

    const previousText =
      elements.logoutButton
        .textContent;

    elements.logoutButton.disabled =
      true;

    elements.logoutButton.textContent =
      "Déconnexion…";

    try {
      await apiFetch(
        "/api/auth/logout",
        {
          method: "POST"
        }
      );
    } catch (error) {
      /*
       * Même si l’API ne renvoie aucun JSON,
       * on redirige vers l’accueil.
       */
      console.warn(
        "Réponse de déconnexion :",
        error
      );
    } finally {
      window.location.href = "/";
    }

    elements.logoutButton.textContent =
      previousText;
  }

  /*
   * =======================================================
   * Rendu complet
   * =======================================================
   */

  async function renderProfile() {
    renderIdentity();
    renderStatistics();
    renderRoles();
    initializeBadgeShowcase();
    renderBadgesDialog();
    renderCreatorStats();

    await findLinkedCreator();

    renderQuickLinks();

    showContent();

    /*
     * Attend que la page soit visible avant
     * de dessiner le canvas.
     */

    window.requestAnimationFrame(
      () => {
        void drawBadgeCard();
      }
    );
  }

  /*
   * =======================================================
   * Chargement
   * =======================================================
   */

  async function loadAccount() {
    showLoading();

    try {
      profile =
        await apiFetch(
          "/api/account/profile"
        );

      await renderProfile();
    } catch (error) {
      console.error(
        "Impossible de charger le compte :",
        error
      );

      showError(error);
    }
  }

  /*
   * =======================================================
   * Événements
   * =======================================================
   */

  elements.navigationToggle
    ?.addEventListener(
      "click",
      () => {
        const open =
          elements
            .navigationToggle
            .getAttribute(
              "aria-expanded"
            ) !== "true";

        setNavigationOpen(open);
      }
    );

  elements.navigation
    ?.querySelectorAll("a")
    .forEach(link => {
      link.addEventListener(
        "click",
        () => {
          setNavigationOpen(false);
        }
      );
    });

  window.addEventListener(
    "resize",
    () => {
      if (
        window.innerWidth > 1100
      ) {
        setNavigationOpen(false);
      }
    }
  );

  elements.retryButton
    ?.addEventListener(
      "click",
      () => {
        void loadAccount();
      }
    );

  elements.downloadCardButton
    ?.addEventListener(
      "click",
      downloadBadgeCard
    );

  elements.logoutButton
    ?.addEventListener(
      "click",
      () => {
        void logout();
      }
    );

  elements.openBadgesButton
    ?.addEventListener(
      "click",
      openBadgesDialog
    );

  elements.closeBadgesButton
    ?.addEventListener(
      "click",
      closeBadgesDialog
    );

  elements.badgesDialog
    ?.addEventListener(
      "cancel",
      event => {
        event.preventDefault();
        closeBadgesDialog();
      }
    );

  elements.badgesDialog
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          elements.badgesDialog
        ) {
          closeBadgesDialog();
        }
      }
    );

  /*
   * =======================================================
   * Démarrage
   * =======================================================
   */

  updateShopState();

  void loadAccount();
})();