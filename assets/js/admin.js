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

    pageMessage:
      document.querySelector("#pageMessage"),

    creatorsCount:
      document.querySelector("#creatorsCount"),

    activeCreatorsCount:
      document.querySelector("#activeCreatorsCount"),

    membersCount:
      document.querySelector("#membersCount"),

    availableCount:
      document.querySelector("#availableCount"),

    creatorsList:
      document.querySelector("#creatorsList"),

    creatorsEmpty:
      document.querySelector("#creatorsEmpty"),

    creatorSearchInput:
      document.querySelector("#creatorSearchInput"),

    membersList:
      document.querySelector("#membersList"),

    membersEmpty:
      document.querySelector("#membersEmpty"),

    memberSearchInput:
      document.querySelector("#memberSearchInput"),

    statsCreatorsCount:
      document.querySelector("#statsCreatorsCount"),

    statsActiveCreatorsCount:
      document.querySelector("#statsActiveCreatorsCount"),

    statsGoalsCount:
      document.querySelector("#statsGoalsCount"),

    statsProgramEntriesCount:
      document.querySelector("#statsProgramEntriesCount"),

    statsStreamlabsCount:
      document.querySelector("#statsStreamlabsCount"),

    statsMessagesCount:
      document.querySelector("#statsMessagesCount"),

    statsEmotesCount:
      document.querySelector("#statsEmotesCount"),

    statsCreatorsList:
      document.querySelector("#statsCreatorsList"),

    statsCreatorsEmpty:
      document.querySelector("#statsCreatorsEmpty")
  };

  let creators = [];
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

  function escapeText(value) {
    return String(value ?? "");
  }

  function updateStatistics() {
    const activeCreators =
      creators.filter(
        creator =>
          creator.active &&
          !creator.archived
      ).length;

    const importedMembers =
      members.filter(
        member => member.imported
      ).length;

    elements.creatorsCount.textContent =
      String(creators.length);

    elements.activeCreatorsCount.textContent =
      String(activeCreators);

    elements.membersCount.textContent =
      String(members.length);

    elements.availableCount.textContent =
      String(
        members.length - importedMembers
      );
  }

  const TAB_HASHES = {
    overview: "accueil",
    creators: "createurs",
    stats: "statistiques",
    tools: "outils"
  };

  const HASH_TABS = Object.fromEntries(
    Object.entries(TAB_HASHES)
      .map(([tab, hash]) => [hash, tab])
  );

  function selectTab(tabName) {
    const validTabs = [
      "overview",
      "creators",
      "stats",
      "tools"
    ];

    if (!validTabs.includes(tabName)) {
      tabName = "overview";
    }

    document.querySelectorAll(".admin-tab").forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.tab === tabName
      );
    });

    document.querySelectorAll(".admin-tab-panel").forEach(panel => {
      panel.hidden =
        panel.dataset.panel !== tabName;
    });

    history.replaceState(
      null,
      "",
      `#${tabName}`
    );
  }

  function createAvatar(creator) {
    const image =
      document.createElement("img");

    image.className =
      "creator-admin-avatar";

    image.alt =
      `Avatar de ${creator.twitchDisplayName}`;

    image.src =
      creator.twitchProfileImageUrl ||
      "/assets/jevent_logo.png";

    return image;
  }

  function createCreatorStatus(creator) {
    const wrapper =
      document.createElement("div");

    wrapper.className =
      "creator-admin-statuses";

    const status =
      document.createElement("span");

    status.className =
      "creator-admin-status";

    if (creator.archived) {
      status.textContent = "Archivé";
      status.classList.add("is-danger");
    } else if (!creator.active) {
      status.textContent = "Désactivé";
      status.classList.add("is-warning");
    } else {
      status.textContent = "Actif";
      status.classList.add("is-success");
    }

    wrapper.append(status);

    if (creator.streamlabsConfigured) {
      const streamlabs =
        document.createElement("span");

      streamlabs.className =
        "creator-admin-status is-success";

      streamlabs.textContent =
        "Streamlabs configuré";

      wrapper.append(streamlabs);
    } else {
      const streamlabs =
        document.createElement("span");

      streamlabs.className =
        "creator-admin-status is-warning";

      streamlabs.textContent =
        "Streamlabs absent";

      wrapper.append(streamlabs);
    }

    return wrapper;
  }

  function createCreatorCard(creator) {
    const card =
      document.createElement("article");

    card.className =
      "creator-admin-card";

    if (creator.archived) {
      card.classList.add("is-archived");
    }

    const content =
      document.createElement("div");

    content.className =
      "creator-admin-content";

    const title =
      document.createElement("h3");

    title.textContent =
      creator.twitchDisplayName;

    const login =
      document.createElement("p");

    login.className =
      "creator-admin-login";

    login.textContent =
      `@${creator.twitchLogin}`;

    const meta =
      document.createElement("p");

    meta.className =
      "creator-admin-meta";

    meta.textContent =
      `Slug actuel : ${creator.slug}`;

    content.append(
      title,
      login,
      meta,
      createCreatorStatus(creator)
    );

    const controls =
      document.createElement("div");

    controls.className =
      "creator-admin-controls";

    const slugLabel =
      document.createElement("label");

    slugLabel.className =
      "admin-control";

    const slugText =
      document.createElement("span");

    slugText.textContent =
      "Slug";

    const slugInput =
      document.createElement("input");

    slugInput.type = "text";
    slugInput.value = creator.slug;
    slugInput.placeholder = "slug";

    slugLabel.append(slugText, slugInput);

    const orderLabel =
      document.createElement("label");

    orderLabel.className =
      "admin-control";

    const orderText =
      document.createElement("span");

    orderText.textContent =
      "Ordre";

    const orderInput =
      document.createElement("input");

    orderInput.type = "number";
    orderInput.min = "0";
    orderInput.step = "1";
    orderInput.value =
      String(creator.displayOrder ?? 100);

    orderLabel.append(orderText, orderInput);

    const checkLine =
      document.createElement("label");

    checkLine.className =
      "admin-checkbox";

    const activeInput =
      document.createElement("input");

    activeInput.type = "checkbox";
    activeInput.checked =
      Boolean(creator.active);

    const activeText =
      document.createElement("span");

    activeText.textContent =
      "Créateur actif";

    checkLine.append(
      activeInput,
      activeText
    );

    const archivedLine =
      document.createElement("label");

    archivedLine.className =
      "admin-checkbox";

    const archivedInput =
      document.createElement("input");

    archivedInput.type = "checkbox";
    archivedInput.checked =
      Boolean(creator.archived);

    const archivedText =
      document.createElement("span");

    archivedText.textContent =
      "Archivé";

    archivedLine.append(
      archivedInput,
      archivedText
    );

    const actions =
      document.createElement("div");

    actions.className =
      "creator-admin-actions";

    const saveButton =
      document.createElement("button");

    saveButton.type = "button";
    saveButton.className =
      "button button-primary";

    saveButton.textContent =
      "Enregistrer";

    saveButton.addEventListener(
      "click",
      async () => {
        saveButton.disabled = true;

        try {
          await apiFetch(
            `/api/admin/creators/${creator.id}`,
            {
              method: "PUT",

              body: JSON.stringify({
                slug: slugInput.value.trim(),
                active: activeInput.checked,
                archived: archivedInput.checked,
                displayOrder: Number(
                  orderInput.value
                )
              })
            }
          );

          showMessage(
            `${creator.twitchDisplayName} a été mis à jour.`,
            "success"
          );

          await loadCreators();
        } catch (error) {
          showMessage(
            error.message,
            "error"
          );
        } finally {
          saveButton.disabled = false;
        }
      }
    );

    actions.append(saveButton);

    if (!creator.archived) {
      const profileLink =
        document.createElement("a");

      profileLink.className =
        "button button-secondary";

      profileLink.textContent =
        "Voir le profil";

      profileLink.href =
        `/createur.html?slug=${encodeURIComponent(creator.slug)
        }`;

      actions.append(profileLink);
    }

    controls.append(
      slugLabel,
      orderLabel,
      checkLine,
      archivedLine,
      actions
    );

    card.append(
      createAvatar(creator),
      content,
      controls
    );

    return card;
  }

  function renderCreators() {
    elements.creatorsList.replaceChildren();

    const search =
      normalizeSearch(
        elements.creatorSearchInput.value
      );

    const filtered =
      creators.filter(creator => {
        const searchable =
          normalizeSearch(
            [
              creator.twitchDisplayName,
              creator.twitchLogin,
              creator.slug
            ].join(" ")
          );

        return searchable.includes(search);
      });

    elements.creatorsEmpty.hidden =
      filtered.length !== 0;

    filtered.forEach(creator => {
      elements.creatorsList.append(
        createCreatorCard(creator)
      );
    });
  }

  function createMemberAvatar(member) {
    const image =
      document.createElement("img");

    image.className =
      "member-avatar";

    image.alt =
      `Avatar de ${member.twitchDisplayName}`;

    image.src =
      member.twitchProfileImageUrl ||
      "/assets/jevent_logo.png";

    return image;
  }

  function createMemberCard(member) {
    const card =
      document.createElement("article");

    card.className =
      "member-card";

    const content =
      document.createElement("div");

    const title =
      document.createElement("h3");

    title.className =
      "member-name";

    title.textContent =
      member.twitchDisplayName;

    const login =
      document.createElement("p");

    login.className =
      "member-login";

    login.textContent =
      `@${member.twitchLogin}`;

    const status =
      document.createElement("span");

    status.className =
      "member-status";

    status.textContent =
      member.imported
        ? "Déjà importé"
        : "Disponible à l’import";

    if (member.imported) {
      status.classList.add("is-imported");
    }

    content.append(title, login, status);

    const actions =
      document.createElement("div");

    actions.className =
      "member-actions";

    if (
      member.imported &&
      member.creatorSlug
    ) {
      const link =
        document.createElement("a");

      link.className =
        "button button-secondary";

      link.textContent =
        "Voir le profil";

      link.href =
        `/createur.html?slug=${encodeURIComponent(
          member.creatorSlug
        )
        }`;

      actions.append(link);
    } else if (!member.imported) {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className =
        "button button-primary";

      button.textContent =
        "Importer";

      button.addEventListener(
        "click",
        () => importMember(member, button)
      );

      actions.append(button);
    }

    card.append(
      createMemberAvatar(member),
      content,
      actions
    );

    return card;
  }

  function renderMembers() {
    elements.membersList.replaceChildren();

    const search =
      normalizeSearch(
        elements.memberSearchInput.value
      );

    const filtered =
      members.filter(member => {
        const searchable =
          normalizeSearch(
            [
              member.twitchDisplayName,
              member.twitchLogin,
              member.suggestedSlug
            ].join(" ")
          );

        return searchable.includes(search);
      });

    elements.membersEmpty.hidden =
      filtered.length !== 0;

    filtered.forEach(member => {
      elements.membersList.append(
        createMemberCard(member)
      );
    });
  }

  function getInitialTab() {
    const hash =
      window.location.hash
        .replace(/^#/, "")
        .toLowerCase();

    return HASH_TABS[hash] ?? "overview";
  }

  function renderAdminStats(data) {
    const overview =
      data?.overview ?? {};

    const formatNumber = value =>
      Number(value ?? 0).toLocaleString(
        "fr-FR"
      );

    elements.statsCreatorsCount.textContent =
      formatNumber(overview.creators);

    elements.statsActiveCreatorsCount.textContent =
      formatNumber(
        overview.activeCreators
      );

    elements.statsGoalsCount.textContent =
      formatNumber(overview.goals);

    elements.statsProgramEntriesCount.textContent =
      formatNumber(
        overview.programEntries
      );

    elements.statsStreamlabsCount.textContent =
      formatNumber(
        overview.streamlabsConfigured
      );

    elements.statsMessagesCount.textContent =
      formatNumber(overview.messages);

    elements.statsEmotesCount.textContent =
      formatNumber(overview.emotes);

    elements.statsCreatorsList.replaceChildren();

    const creatorStats =
      Array.isArray(data?.creators)
        ? data.creators
        : [];

    elements.statsCreatorsEmpty.hidden =
      creatorStats.length !== 0;

    for (const creator of creatorStats) {
      const row =
        document.createElement("article");

      row.className =
        "stats-creator-row";

      const name =
        document.createElement("strong");

      name.textContent =
        creator.displayName ||
        creator.slug;

      const slug =
        document.createElement("span");

      slug.textContent =
        `@${creator.slug}`;

      const messages =
        document.createElement("span");

      messages.textContent =
        `${formatNumber(
          creator.messages
        )} messages`;

      const emotes =
        document.createElement("span");

      emotes.textContent =
        `${formatNumber(
          creator.emotes
        )} emotes`;

      const status =
        document.createElement("span");

      status.className =
        "stats-creator-status";

      status.textContent =
        creator.archived
          ? "Archivé"
          : creator.active
            ? "Actif"
            : "Désactivé";

      row.append(
        name,
        slug,
        messages,
        emotes,
        status
      );

      elements.statsCreatorsList.append(row);
    }
  }

  async function loadAdminStats() {
    try {
      const data =
        await apiFetch(
          "/api/admin/stats/overview"
        );

      renderAdminStats(data);
    } catch (error) {
      console.error(
        "Impossible de charger les statistiques :",
        error
      );

      renderAdminStats({
        overview: {},
        creators: []
      });
    }
  }

  async function loadCreators() {
    const data =
      await apiFetch(
        "/api/admin/creators"
      );

    creators = Array.isArray(
      data.creators
    )
      ? data.creators
      : [];

    updateStatistics();
    renderCreators();
  }

  async function loadMembers({
    silent = false
  } = {}) {
    if (!silent) {
      showMessage(
        "Récupération des membres Streamlabs…"
      );
    }

    const data =
      await apiFetch(
        "/api/admin/streamlabs/members"
      );

    members = Array.isArray(
      data.members
    )
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
  }

  async function importMember(
    member,
    button
  ) {
    if (
      !window.confirm(
        `Importer ${member.twitchDisplayName} dans JEvent ?`
      )
    ) {
      return;
    }

    button.disabled = true;
    button.textContent =
      "Import…";

    try {
      const result =
        await apiFetch(
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

      await loadCreators();
      renderMembers();
    } catch (error) {
      showMessage(
        error.message ||
        "L’import a échoué.",
        "error"
      );

      button.disabled = false;
      button.textContent =
        "Importer";
    }
  }

  async function reloadAll() {
    elements.refreshButton.disabled = true;

    try {
      await Promise.all([
        loadCreators(),

        loadMembers({
          silent: true
        }),

        loadAdminStats()
      ]);

      showMessage(
        "Données actualisées.",
        "success"
      );
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    } finally {
      elements.refreshButton.disabled = false;
    }
  }

  async function init() {
    try {
      const authData =
        await apiFetch(
          "/api/auth/me"
        );

      const user =
        authData.user ?? authData;

      if (
        !user?.permissions?.isSuperAdmin
      ) {
        throw new Error(
          "Cette page est réservée aux Admins."
        );
      }

      await reloadAll();

      elements.loadingState.hidden =
        true;

      elements.errorState.hidden =
        true;

      elements.application.hidden =
        false;

      selectTab(
        getInitialTab(),
        false
      );

    } catch (error) {
      console.error(error);

      elements.loadingState.hidden =
        true;

      elements.application.hidden =
        true;

      elements.errorState.hidden =
        false;

      elements.errorMessage.textContent =
        error.message ||
        "Impossible de charger l’administration.";
    }
  }

  document
    .querySelectorAll(".admin-tab")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => selectTab(button.dataset.tab)
      );
    });

  elements.refreshButton.addEventListener(
    "click",
    reloadAll
  );

  elements.creatorSearchInput.addEventListener(
    "input",
    renderCreators
  );

  elements.memberSearchInput.addEventListener(
    "input",
    renderMembers
  );

  window.addEventListener(
    "hashchange",
    () => {
      selectTab(
        getInitialTab(),
        false
      );
    }
  );

  init();
})();