(() => {
  "use strict";

  const API_URL =
    "https://api-beta.jevent.julot.fr";

  const elements = {
    loadingState:
      document.querySelector("#loadingState"),

    errorState:
      document.querySelector("#errorState"),

    errorMessage:
      document.querySelector("#errorMessage"),

    application:
      document.querySelector("#adminApplication"),

    refreshButton:
      document.querySelector("#refreshButton"),

    searchInput:
      document.querySelector("#searchInput"),

    membersList:
      document.querySelector("#membersList"),

    emptyState:
      document.querySelector("#emptyState"),

    pageMessage:
      document.querySelector("#pageMessage"),

    membersCount:
      document.querySelector("#membersCount"),

    importedCount:
      document.querySelector("#importedCount"),

    availableCount:
      document.querySelector("#availableCount")
  };

  let members = [];

  async function apiFetch(
    path,
    options = {}
  ) {
    const response = await fetch(
      API_URL + path,
      {
        credentials: "include",

        headers: {
          Accept: "application/json",

          ...(
            options.body
              ? {
                  "Content-Type":
                    "application/json"
                }
              : {}
          ),

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
      const error = new Error(
        data.error ??
        data.message ??
        `Erreur HTTP ${response.status}`
      );

      error.status = response.status;
      throw error;
    }

    return data;
  }

  function showMessage(
    message = "",
    type = ""
  ) {
    elements.pageMessage.textContent =
      message;

    elements.pageMessage.className =
      "page-message";

    if (type) {
      elements.pageMessage.classList.add(
        `is-${type}`
      );
    }
  }

  function normalizeSearch(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  function updateStatistics() {
    const imported =
      members.filter(
        member => member.imported
      ).length;

    elements.membersCount.textContent =
      String(members.length);

    elements.importedCount.textContent =
      String(imported);

    elements.availableCount.textContent =
      String(members.length - imported);
  }

  function createAvatar(member) {
    const avatar =
      document.createElement("img");

    avatar.className = "member-avatar";
    avatar.alt =
      `Avatar de ${member.twitchDisplayName}`;

    avatar.src =
      member.twitchProfileImageUrl ||
      "/assets/jevent_logo.png";

    return avatar;
  }

  function createMemberContent(member) {
    const content =
      document.createElement("div");

    const name =
      document.createElement("h3");

    name.className = "member-name";
    name.textContent =
      member.twitchDisplayName;

    const login =
      document.createElement("p");

    login.className = "member-login";
    login.textContent =
      `@${member.twitchLogin}`;

    const status =
      document.createElement("span");

    status.className = "member-status";
    status.textContent = member.imported
      ? "Déjà importé"
      : "Disponible à l’import";

    if (member.imported) {
      status.classList.add("is-imported");
    }

    content.append(name, login, status);

    return content;
  }

  function createProfileLink(member) {
    const link =
      document.createElement("a");

    link.className =
      "button button-secondary";

    link.textContent = "Voir le profil";

    link.href =
      `/createur.html?slug=${
        encodeURIComponent(
          member.creatorSlug
        )
      }`;

    return link;
  }

  function createImportButton(member) {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "button button-primary";

    button.textContent = "Importer";

    button.addEventListener(
      "click",
      () => importMember(member, button)
    );

    return button;
  }

  function renderMembers() {
    elements.membersList.replaceChildren();

    const search =
      normalizeSearch(
        elements.searchInput.value
      );

    const filtered = members.filter(
      member => {
        const searchable =
          normalizeSearch(
            [
              member.twitchDisplayName,
              member.twitchLogin,
              member.suggestedSlug
            ].join(" ")
          );

        return searchable.includes(search);
      }
    );

    elements.emptyState.hidden =
      filtered.length !== 0;

    for (const member of filtered) {
      const card =
        document.createElement("article");

      card.className = "member-card";

      const actions =
        document.createElement("div");

      actions.className =
        "member-actions";

      if (
        member.imported &&
        member.creatorSlug
      ) {
        actions.append(
          createProfileLink(member)
        );
      } else if (!member.imported) {
        actions.append(
          createImportButton(member)
        );
      }

      card.append(
        createAvatar(member),
        createMemberContent(member),
        actions
      );

      elements.membersList.append(card);
    }
  }

  async function loadMembers({
    silent = false
  } = {}) {
    if (!silent) {
      showMessage(
        "Récupération des membres Streamlabs…"
      );
    }

    elements.refreshButton.disabled = true;

    try {
      const data = await apiFetch(
        "/api/admin/streamlabs/members"
      );

      members = Array.isArray(data.members)
        ? data.members
        : [];

      updateStatistics();
      renderMembers();

      if (!silent) {
        showMessage(
          `${members.length} membre(s) récupéré(s).`,
          "success"
        );
      }
    } finally {
      elements.refreshButton.disabled =
        false;
    }
  }

  async function importMember(
    member,
    button
  ) {
    const confirmed = window.confirm(
      `Importer ${member.twitchDisplayName} dans JEvent ?`
    );

    if (!confirmed) {
      return;
    }

    button.disabled = true;
    button.textContent = "Import…";

    showMessage(
      `Import de ${member.twitchDisplayName}…`
    );

    try {
      const result = await apiFetch(
        "/api/admin/streamlabs/import",
        {
          method: "POST",

          body: JSON.stringify({
            teamMemberId:
              member.teamMemberId
          })
        }
      );

      showMessage(
        `${member.twitchDisplayName} a été importé.`,
        "success"
      );

      member.imported = true;
      member.creatorId =
        result.creator?.id ?? null;

      member.creatorSlug =
        result.creator?.slug ??
        member.suggestedSlug;

      updateStatistics();
      renderMembers();
    } catch (error) {
      showMessage(
        error.message ||
        "L’import a échoué.",
        "error"
      );

      button.disabled = false;
      button.textContent = "Importer";
    }
  }

  async function init() {
    try {
      const authData =
        await apiFetch("/api/auth/me");

      const user =
        authData.user ?? authData;

      if (
        !user?.permissions?.isSuperAdmin
      ) {
        throw new Error(
          "Cette page est réservée aux administrateurs."
        );
      }

      await loadMembers({
        silent: true
      });

      elements.loadingState.hidden = true;
      elements.errorState.hidden = true;
      elements.application.hidden = false;
    } catch (error) {
      console.error(error);

      elements.loadingState.hidden = true;
      elements.application.hidden = true;
      elements.errorState.hidden = false;

      elements.errorMessage.textContent =
        error.message ||
        "Impossible de charger l’administration.";
    }
  }

  elements.refreshButton.addEventListener(
    "click",
    () => loadMembers()
  );

  elements.searchInput.addEventListener(
    "input",
    renderMembers
  );

  init();
})();