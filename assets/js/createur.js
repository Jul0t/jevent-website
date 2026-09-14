(() => {
  "use strict";

  const API_URL = "https://api-beta.jevent.julot.fr";
  const TIMEOUT_MS = 12000;

  const $ = (selector) => document.querySelector(selector);

  const elements = {
    loading: $("#loading"),
    errorState: $("#errorState"),
    errorMessage: $("#errorMessage"),
    profile: $("#profile"),

    profileBanner: $("#profileBanner"),
    creatorAvatar: $("#creatorAvatar"),
    creatorName: $("#creatorName"),
    creatorLogin: $("#creatorLogin"),
    liveStatus: $("#liveStatus"),
    twitchButton: $("#twitchButton"),
    donationButton: $("#donationButton"),
    description: $("#description"),
    liveInformation: $("#liveInformation"),
    programList: $("#programList"),
    programEmpty: $("#programEmpty"),
    editProgramButton: $("#editProgramButton"),

    editGoalsButton: $("#editGoalsButton"),
    addGoalButton: $("#addGoalButton"),
    goalsList: $("#goalsList"),
    goalsEmpty: $("#goalsEmpty"),

    // Goal modal
    goalDialog: $("#goalDialog"),
    goalForm: $("#goalForm"),
    goalDialogTitle: $("#goalDialogTitle"),
    goalPublicId: $("#goalPublicId"),
    goalTitle: $("#goalTitle"),
    goalAmount: $("#goalAmount"),
    goalDescription: $("#goalDescription"),
    goalFormMessage: $("#goalFormMessage"),
    saveGoalButton: $("#saveGoalButton"),
    deleteGoalButton: $("#deleteGoalButton"),
    closeGoalDialog: $("#closeGoalDialog"),
    cancelGoalButton: $("#cancelGoalButton"),

    // Description modal
    editDescriptionButton: $("#editDescriptionButton"),
    descriptionDialog: $("#descriptionDialog"),
    descriptionForm: $("#descriptionForm"),
    descriptionInput: $("#descriptionInput"),
    descriptionState: $("#descriptionState"),
    descriptionMessage: $("#descriptionMessage"),
    saveDescriptionButton: $("#saveDescriptionButton"),
    submitDescriptionButton: $("#submitDescriptionButton"),
    closeDescriptionDialog: $("#closeDescriptionDialog"),
    cancelDescriptionButton: $("#cancelDescriptionButton"),

    // Streamlabs modal

    streamlabsSettingsButton: $("#streamlabsSettingsButton"),
    streamlabsDialog: $("#streamlabsDialog"),
    streamlabsForm: $("#streamlabsForm"),
    streamlabsStatus: $("#streamlabsStatus"),
    streamlabsGoalUrl: $("#streamlabsGoalUrl"),
    streamlabsMessage: $("#streamlabsMessage"),
    closeStreamlabsDialog: $("#closeStreamlabsDialog"),
    cancelStreamlabsButton: $("#cancelStreamlabsButton"),
    saveStreamlabsButton: $("#saveStreamlabsButton")
  };

  let creator = null;
  let currentUser = null;
  let canManage = false;
  let publicGoals = [];
  let manageableGoals = [];
  let publicProgram = [];
  let descriptionWorkspace = null;
  let goalFormOrigin = "";
  let descFormOrigin = "";
  let creatorPanel = null;

  const painter = `P${"ath"}`; // garde-fou anti-linter inutile, ignoré

  function onSafe(el, type, fn) {
    if (el) el.addEventListener(type, fn);
  }

  function svgPencil() {
    return `
      <svg class="icon-pencil" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4L19 9l-4-4L4 16v4zm2-3.2 9-9 1.2 1.2-9 9H6v-1.2zM17.5 6.5l1-1a1.4 1.4 0 0 1 2 2l-1 1-2-2z"/>
      </svg>
    `;
  }

  function fmtMoney(cents, currency = "EUR") {
    const num = Number(cents || 0) / 100;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2
    }).format(num);
  }

  function fmtNumber(v) {
    return new Intl.NumberFormat("fr-FR").format(Number(v || 0));
  }

  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(d);
  }

  function setMessage(element, message, type = "") {
    if (!element) return;
    element.textContent = message;
    element.className = "form-message";
    if (type) element.classList.add(`is-${type}`);
  }

  function setVisibility(showLoading, showProfile, showError) {
    if (elements.loading) elements.loading.hidden = !showLoading;
    if (elements.profile) elements.profile.hidden = !showProfile;
    if (elements.errorState) elements.errorState.hidden = !showError;
  }

  async function apiFetch(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(API_URL + path, {
      credentials: "include",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      ...options
    });

    clearTimeout(timer);

    let data = {};
    try { data = await res.json(); } catch { }
    if (!res.ok) {
      const err = new Error(data.error || data.message || `Erreur ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function safeGet(path) {
    try { return await apiFetch(path); } catch (e) { console.warn("[safeGet]", path, e.message); return null; }
  }

  function routeDescriptionId() {
    return new URLSearchParams(location.search).get("slug");
  }

  function toMarkdownHtml(src) {
    if (!elements.description) return;
    elements.description.replaceChildren();

    const content = String(src || "").trim();
    if (!content) {
      const p = document.createElement("p");
      p.className = "markdown-empty";
      p.textContent = "Ce créateur n’a pas encore publié de description.";
      elements.description.append(p);
      return;
    }

    if (!window.marked || !window.DOMPurify) {
      elements.description.textContent = content;
      return;
    }

    const html = window.marked.parse(content, { gfm: true, breaks: true });
    elements.description.innerHTML = window.DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "del", "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "pre", "code", "hr"],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false
    });
  }

  function renderLive() {
    elements.liveStatus.replaceChildren();
    elements.liveInformation.replaceChildren();

    const isLive = !!creator?.isLive && !!creator?.live;
    if (!isLive) {
      const b = document.createElement("span");
      b.className = "status-badge offline";
      b.textContent = "Hors ligne";
      elements.liveStatus.appendChild(b);
      addInfo("Statut", "La chaîne est hors ligne.");
      return;
    }

    const live = creator.live || {};
    elements.liveStatus.append(
      Object.assign(document.createElement("span"), { className: "status-badge live", textContent: "En direct" }),
      Object.assign(document.createElement("span"), { className: "status-detail", textContent: `${fmtNumber(live.viewerCount)} spectateur${Number(live.viewerCount) > 1 ? "s" : ""}` }),
      Object.assign(document.createElement("span"), { className: "status-detail", textContent: live.gameName || "Catégorie inconnue" })
    );

    addInfo("Titre", live.title || "Live du JEvent 26");
    addInfo("Catégorie", live.gameName || "—");
    addInfo("Spectateurs", fmtNumber(live.viewerCount || 0));
    addInfo("Démarré le", fmtDate(live.startedAt));
    if (live.thumbnailUrl) {
      elements.profileBanner.style.backgroundImage = `url("${live.thumbnailUrl}")`;
      elements.profileBanner.classList.add("has-image");
    }
  }

  function addInfo(label, value) {
    const row = document.createElement("div");
    row.className = "information-row";
    const l = document.createElement("span");
    l.className = "information-label";
    l.textContent = label;
    const v = document.createElement("span");
    v.className = "information-value";
    v.textContent = value;
    row.append(l, v);
    elements.liveInformation.append(row);
  }

  function canUserManageCurrentCreator() {
    if (!currentUser || !creator) {
      return false;
    }

    if (
      currentUser.permissions?.isSuperAdmin
    ) {
      return true;
    }

    return (
      currentUser.creatorMemberships ?? []
    ).some(
      membership =>
        Number(membership.creatorId) ===
        Number(creator.id) &&
        membership.memberRole === "owner"
    );
  }

  function getCurrentCreatorGoals() {
    const reachedByPublicId = new Map(
      publicGoals.map(goal => [
        goal.publicId,
        Boolean(goal.reached)
      ])
    );

    return manageableGoals
      .filter(
        goal =>
          goal.scopeType === "creator" &&
          Number(goal.creatorId) ===
          Number(creator.id)
      )
      .map(goal => ({
        ...goal,

        reached:
          reachedByPublicId.get(
            goal.publicId
          ) ?? false
      }));
  }

  function getProgramDateKey(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const parts =
      new Intl.DateTimeFormat(
        "fr-FR",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "Europe/Paris"
        }
      ).formatToParts(date);

    const values = Object.fromEntries(
      parts.map(part => [
        part.type,
        part.value
      ])
    );

    return [
      values.year,
      values.month,
      values.day
    ].join("-");
  }

  function formatProgramDay(value) {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Paris"
      }
    ).format(new Date(value));
  }

  function formatProgramTime(value) {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Paris"
      }
    ).format(new Date(value));
  }

  function belongsToCurrentCreator(entry) {
    const primaryParticipant =
      (entry.participants ?? []).find(
        participant => participant.primary
      );

    const primaryCreatorId =
      entry.primaryCreator?.id ??
      primaryParticipant?.id ??
      null;

    return (
      Number(primaryCreatorId) ===
      Number(creator.id)
    );
  }

  async function reloadProgram() {
    const data = await safeGet(
      "/api/program"
    );

    const entries =
      Array.isArray(data?.entries)
        ? data.entries
        : Array.isArray(data?.program)
          ? data.program
          : [];

    publicProgram = entries
      .filter(belongsToCurrentCreator)
      .sort(
        (first, second) =>
          new Date(first.startsAt) -
          new Date(second.startsAt)
      );
  }

  function renderProgram() {
    if (
      !elements.programList ||
      !elements.programEmpty
    ) {
      return;
    }

    elements.programList.replaceChildren();

    elements.programEmpty.hidden =
      publicProgram.length !== 0;

    if (publicProgram.length === 0) {
      return;
    }

    const days = new Map();

    for (const entry of publicProgram) {
      const key =
        getProgramDateKey(entry.startsAt);

      if (!days.has(key)) {
        days.set(key, []);
      }

      days.get(key).push(entry);
    }

    for (const entries of days.values()) {
      const day =
        document.createElement("section");

      day.className = "program-day";

      const heading =
        document.createElement("h3");

      heading.className =
        "program-day-title";

      heading.textContent =
        formatProgramDay(
          entries[0].startsAt
        );

      day.append(heading);

      const activities =
        document.createElement("div");

      activities.className =
        "program-day-entries";

      for (const entry of entries) {
        const activity =
          document.createElement("article");

        activity.className =
          "program-entry";

        if (entry.status === "cancelled") {
          activity.classList.add(
            "is-cancelled"
          );
        }

        const time =
          document.createElement("div");

        time.className =
          "program-entry-time";

        time.innerHTML = `
        <strong>
          ${formatProgramTime(entry.startsAt)}
        </strong>

        <span>
          ${formatProgramTime(entry.endsAt)}
        </span>
      `;

        const content =
          document.createElement("div");

        content.className =
          "program-entry-content";

        const title =
          document.createElement("h4");

        title.textContent =
          entry.title || "Activité";

        content.append(title);

        if (entry.category) {
          const category =
            document.createElement("span");

          category.className =
            "program-entry-category";

          category.textContent =
            entry.category;

          content.append(category);
        }

        if (entry.descriptionMarkdown) {
          const description =
            document.createElement("p");

          description.className =
            "program-entry-description";

          description.textContent =
            entry.descriptionMarkdown;

          content.append(description);
        }

        const guests =
          (entry.participants ?? [])
            .filter(
              participant =>
                !participant.primary &&
                Number(participant.id) !==
                Number(creator.id)
            )
            .map(
              participant =>
                participant.twitchDisplayName ??
                participant.displayName ??
                participant.twitchLogin
            )
            .filter(Boolean);

        if (guests.length > 0) {
          const participants =
            document.createElement("p");

          participants.className =
            "program-entry-participants";

          participants.textContent =
            `Avec ${guests.join(", ")}`;

          content.append(participants);
        }

        if (entry.goal) {
          const goal =
            document.createElement("div");

          goal.className =
            "program-goal";

          if (entry.goal.reached) {
            goal.classList.add(
              "is-reached"
            );

            goal.textContent =
              `✓ Objectif atteint — ${fmtMoney(
                entry.goal.thresholdCents,
                entry.goal.currency ?? "EUR"
              )
              }`;
          } else {
            goal.textContent =
              `🎯 Sous réserve d’objectif atteint — ${fmtMoney(
                entry.goal.thresholdCents,
                entry.goal.currency ?? "EUR"
              )
              }`;
          }

          if (entry.goal.title) {
            goal.title = entry.goal.title;
          }

          content.append(goal);
        }

        if (entry.status === "cancelled") {
          const cancelled =
            document.createElement("div");

          cancelled.className =
            "program-cancelled";

          cancelled.textContent =
            entry.cancelledReason
              ? `Activité annulée — ${entry.cancelledReason}`
              : "Activité annulée";

          content.append(cancelled);
        }

        activity.append(time, content);
        activities.append(activity);
      }

      day.append(activities);
      elements.programList.append(day);
    }
  }

  function fillProfile() {
    if (!creator) return;

    document.title = `${creator.twitchDisplayName} — JEvent 26`;
    elements.creatorAvatar.src = creator.twitchProfileImageUrl || "/assets/jevent_logo.png";
    elements.creatorAvatar.alt = `Avatar de ${creator.twitchDisplayName}`;
    elements.creatorName.textContent = creator.twitchDisplayName;
    elements.creatorLogin.textContent = `@${creator.twitchLogin}`;
    elements.streamlabsSettingsButton.hidden = !canManage;

    elements.twitchButton.href = creator.twitchUrl || `https://twitch.tv/${creator.twitchLogin}`;
    if (creator.donationUrl) {
      elements.donationButton.href = creator.donationUrl;
      elements.donationButton.classList.remove("is-disabled");
      elements.donationButton.removeAttribute("aria-disabled");
    } else {
      elements.donationButton.href = "#";
      elements.donationButton.classList.add("is-disabled");
      elements.donationButton.setAttribute("aria-disabled", "true");
    }

    toMarkdownHtml(creator.descriptionMarkdown || "");

    elements.editGoalsButton.hidden = !canManage;
    elements.addGoalButton.hidden = !canManage;
    elements.editDescriptionButton.hidden = !canManage;
    if (elements.editGoalsButton) elements.editGoalsButton.innerHTML = svgPencil();
    if (elements.editDescriptionButton) elements.editDescriptionButton.innerHTML = svgPencil();
    if (elements.editProgramButton) {
      elements.editProgramButton.hidden = !canManage;
    }

    renderLive();
    renderGoals();
  }

  function getCurrentCreatorGoals() {
    const publicGoalsById = new Map(
      publicGoals.map(goal => [
        String(goal.publicId),
        goal
      ])
    );

    return manageableGoals
      .filter(
        goal =>
          goal.scopeType === "creator" &&
          Number(goal.creatorId) ===
          Number(creator.id) &&
          goal.status !== "cancelled"
      )
      .map(goal => ({
        ...goal,

        reached: Boolean(
          publicGoalsById.get(
            String(goal.publicId)
          )?.reached
        )
      }));
  }

  function renderGoals() {
    if (
      !elements.goalsList ||
      !elements.goalsEmpty
    ) {
      return;
    }

    elements.goalsList.replaceChildren();

    const managedGoals =
      manageableGoals.filter(goal =>
        goal.scopeType === "creator" &&
        Number(goal.creatorId) ===
        Number(creator.id)
      );

    const publicGoalsById = new Map(
      publicGoals.map(goal => [
        String(goal.publicId),
        goal
      ])
    );

    const goals =
      canManage && managedGoals.length > 0
        ? managedGoals.map(goal => ({
          ...goal,
          reached:
            publicGoalsById.get(
              String(goal.publicId)
            )?.reached ?? false
        }))
        : publicGoals;

    const visible = goals.filter(goal =>
      goal.status !== "cancelled" &&
      (
        canManage ||
        goal.status !== "draft"
      )
    );

    elements.goalsEmpty.hidden = visible.length > 0;
    if (visible.length === 0) return;

    for (const goal of visible) {
      const reached = !!goal.reached;
      const item = document.createElement("article");
      item.className = "goal-item";
      if (reached) item.classList.add("is-reached");

      const marker = document.createElement("div");
      marker.className = "goal-marker";
      marker.append(Object.assign(document.createElement("span"), {
        className: "goal-marker-amount",
        textContent: fmtMoney(goal.thresholdCents, goal.currency || "EUR")
      }));
      if (reached) {
        marker.prepend(Object.assign(document.createElement("span"), {
          className: "goal-marker-check",
          textContent: "✓"
        }));
      }

      const body = document.createElement("div");
      const title = document.createElement("h3");
      title.className = "goal-title";
      title.textContent = goal.title || "(Sans titre)";
      body.append(title);

      if (goal.descriptionMarkdown) {
        const desc = document.createElement("p");
        desc.className = "goal-description";
        desc.textContent = goal.descriptionMarkdown;
        body.append(desc);
      }

      const state = document.createElement("span");
      state.className = "goal-state";
      state.textContent = reached
        ? ((goal.status === "completed") ? "Objectif réalisé" : "Objectif atteint")
        : ((goal.status === "draft") ? "Brouillon" : "À débloquer");
      body.append(state);

      item.append(marker, body);

      if (canManage) {
        const button =
          document.createElement("button");

        button.type = "button";
        button.className = "goal-edit";
        button.title =
          `Modifier ${goal.title || "l’objectif"}`;

        button.innerHTML = svgPencil();

        button.addEventListener(
          "click",
          () => openGoalDialog(goal)
        );

        item.append(button);
      }

      elements.goalsList.append(item);
    }
  }

  function goalSnapshot() {
    return JSON.stringify({
      publicId: elements.goalPublicId?.value || "",
      title: elements.goalTitle?.value.trim() || "",
      amount: elements.goalAmount?.value || "",
      description: elements.goalDescription?.value.trim() || ""
    });
  }

  function openGoalDialog(goal = null) {
    if (!elements.goalDialog) return;
    elements.goalForm?.reset();
    setMessage(elements.goalFormMessage, "");

    if (elements.deleteGoalButton) elements.deleteGoalButton.hidden = true;

    if (!goal) {
      if (elements.goalDialogTitle) elements.goalDialogTitle.textContent = "Ajouter un objectif";
      if (elements.goalPublicId) elements.goalPublicId.value = "";
      goalFormOrigin = goalSnapshot();
      elements.goalDialog.showModal();
      elements.goalTitle?.focus();
      return;
    }

    if (elements.goalDialogTitle) elements.goalDialogTitle.textContent = "Modifier l’objectif";
    elements.goalPublicId.value = goal.publicId || "";
    elements.goalTitle.value = goal.title || "";
    elements.goalAmount.value = ((Number(goal.thresholdCents || 0) / 100).toFixed(2));
    elements.goalDescription.value = goal.descriptionMarkdown || "";
    if (elements.deleteGoalButton) elements.deleteGoalButton.hidden = false;

    goalFormOrigin = goalSnapshot();
    elements.goalDialog.showModal();
    elements.goalTitle.focus();
  }

  function requestCloseGoalDialog() {
    const changed = goalSnapshot() !== goalFormOrigin;
    if (changed && !window.confirm("Fermer sans enregistrer les modifications ?")) return;
    elements.goalDialog?.close();
  }

  async function saveGoal(e) {
    e.preventDefault();

    const title = (elements.goalTitle?.value || "").trim();
    const amount = Number(elements.goalAmount?.value || 0);

    if (!title) {
      setMessage(elements.goalFormMessage, "Le titre est obligatoire.", "error");
      elements.goalTitle?.focus();
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(elements.goalFormMessage, "Le montant doit être supérieur à 0.", "error");
      elements.goalAmount?.focus();
      return;
    }

    const payload = {
      creatorId: Number(creator.id),
      title,
      descriptionMarkdown:
        (elements.goalDescription?.value || "").trim(),
      targetAmountCents:
        Math.round(amount * 100)
    };

    const publicId = elements.goalPublicId?.value?.trim();
    try {
      elements.saveGoalButton.disabled = true;
      if (elements.deleteGoalButton) elements.deleteGoalButton.disabled = true;

      if (publicId) {
        await apiFetch(`/api/goals/manage/${encodeURIComponent(publicId)}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/goals/manage", { method: "POST", body: JSON.stringify(payload) });
      }

      await reloadGoals();
      renderGoals();
      elements.goalDialog?.close();
      setMessage(elements.goalFormMessage, "Enregistré.", "success");
    } catch (err) {
      setMessage(elements.goalFormMessage, err.message || "Erreur lors de l’enregistrement.", "error");
    } finally {
      elements.saveGoalButton.disabled = false;
      if (elements.deleteGoalButton) elements.deleteGoalButton.disabled = false;
    }
  }

  async function deleteGoal() {
    const publicId = elements.goalPublicId?.value?.trim();
    if (!publicId) return;
    if (!window.confirm("Supprimer définitivement cet objectif ?")) return;

    try {
      if (elements.deleteGoalButton) elements.deleteGoalButton.disabled = true;
      if (elements.saveGoalButton) elements.saveGoalButton.disabled = true;

      await apiFetch(`/api/goals/manage/${encodeURIComponent(publicId)}`, { method: "DELETE" });
      await reloadGoals();
      renderGoals();
      elements.goalDialog?.close();
    } catch (err) {
      setMessage(elements.goalFormMessage, err.message || "Suppression impossible.", "error");
    } finally {
      if (elements.deleteGoalButton) elements.deleteGoalButton.disabled = false;
      if (elements.saveGoalButton) elements.saveGoalButton.disabled = false;
    }
  }

  async function loadGoals() {
    const slug = new URLSearchParams(location.search).get("slug");
    const publicData = await apiFetch(`/api/goals/creator/${encodeURIComponent(slug)}`);
    publicGoals = Array.isArray(publicData?.goals) ? publicData.goals : [];

    if (canManage) {
      const manageData = await apiFetch("/api/goals/manage");
      manageableGoals = Array.isArray(manageData?.goals) ? manageData.goals : [];
    } else {
      manageableGoals = [];
    }
  }

  async function reloadGoals() {
    try { await loadGoals(); } catch (err) {
      console.error("Erreur reload goals:", err);
      publicGoals = [];
      manageableGoals = [];
    }
  }

  // Description
  function descSnapshot() {
    return elements.descriptionInput?.value || "";
  }

  function setDescriptionState() {
    if (!elements.descriptionState) return;
    elements.descriptionState.className = "description-state";

    if (descriptionWorkspace?.pending) {
      elements.descriptionState.classList.add("is-pending");
      elements.descriptionState.textContent = "Une version est en attente de validation.";
      if (elements.submitDescriptionButton) elements.submitDescriptionButton.disabled = true;
      return;
    }

    if (descriptionWorkspace?.lastRejected) {
      elements.descriptionState.classList.add("is-rejected");
      elements.descriptionState.textContent =
        `La dernière proposition a été refusée : ${descriptionWorkspace.lastRejected.moderationNote || "aucune note"}`;
      if (elements.submitDescriptionButton) elements.submitDescriptionButton.disabled = false;
      return;
    }

    elements.descriptionState.textContent = "La description sera envoyée à la modération.";
    if (elements.submitDescriptionButton) elements.submitDescriptionButton.disabled = false;
  }

  function openStreamlabsDialog() {
    elements.streamlabsGoalUrl.value = "";
    setMessage(elements.streamlabsMessage, "");

    const configured = Boolean(
      creatorPanel?.creator
        ?.streamlabsGoalConfigured
    );

    elements.streamlabsStatus.textContent =
      configured
        ? "Un lien Streamlabs est déjà configuré. Colle un nouveau lien pour le remplacer."
        : "Aucun lien Streamlabs n’est configuré.";

    elements.streamlabsDialog.showModal();
    elements.streamlabsGoalUrl.focus();
  }

  function closeStreamlabsDialog() {
    elements.streamlabsDialog.close();
  }

  async function saveStreamlabsSettings(event) {
    event.preventDefault();

    const streamlabsGoalUrl =
      elements.streamlabsGoalUrl.value.trim();

    if (!streamlabsGoalUrl) {
      setMessage(
        elements.streamlabsMessage,
        "Colle l’URL du widget Milestones.",
        "error"
      );

      return;
    }

    elements.saveStreamlabsButton.disabled = true;

    try {
      const result = await apiFetch(
        `/api/creator-panel/streamlabs?creatorId=${encodeURIComponent(creator.id)
        }`,
        {
          method: "PUT",
          body: JSON.stringify({
            streamlabsGoalUrl
          })
        }
      );

      creatorPanel = {
        ...(creatorPanel ?? {}),
        creator: {
          ...(creatorPanel?.creator ?? {}),
          streamlabsGoalConfigured:
            result.streamlabsGoalConfigured
        }
      };

      setMessage(
        elements.streamlabsMessage,
        "Lien Streamlabs enregistré.",
        "success"
      );

      elements.streamlabsStatus.textContent =
        "Le lien Streamlabs est configuré.";

      elements.streamlabsGoalUrl.value = "";
    } catch (error) {
      setMessage(
        elements.streamlabsMessage,
        error.message,
        "error"
      );
    } finally {
      elements.saveStreamlabsButton.disabled = false;
    }
  }

  async function loadDescriptionWorkspace() {
    if (!creator) return;

    const route =
      `/api/creator-panel/description?creatorId=${encodeURIComponent(creator.id)}`;

    try {
      descriptionWorkspace = await apiFetch(route);
      elements.descriptionInput.value =
        descriptionWorkspace?.draft?.markdown ??
        descriptionWorkspace?.pending?.markdown ??
        creator.descriptionMarkdown ??
        "";
      setDescriptionState();
      setMessage(elements.descriptionMessage, "");
      descFormOrigin = descSnapshot();
    } catch (e) {
      // si ce n'est pas encore dispo côté API
      setMessage(elements.descriptionMessage, "Édition indisponible pour le moment.", "error");
      if (elements.descriptionState) elements.descriptionState.textContent = "";
      throw e;
    }
  }

  async function openDescriptionDialog() {
    if (!elements.descriptionDialog) return;
    try {
      await loadDescriptionWorkspace();
    } catch {
      return;
    }
    elements.descriptionDialog.showModal();
    setMessage(elements.descriptionMessage, "");
    elements.descriptionInput?.focus();
  }

  function requestCloseDescriptionDialog() {
    const changed = descSnapshot() !== descFormOrigin;
    if (changed && !window.confirm("Fermer sans enregistrer le brouillon ?")) return;
    elements.descriptionDialog?.close();
  }

  async function saveDescriptionDraft() {
    try {
      elements.saveDescriptionButton.disabled = true;
      if (elements.submitDescriptionButton) elements.submitDescriptionButton.disabled = true;

      const data = await apiFetch(
        `/api/creator-panel/description/draft?creatorId=${encodeURIComponent(creator.id)}`,
        { method: "PUT", body: JSON.stringify({ markdown: elements.descriptionInput.value || "" }) }
      );

      if (data?.draft) {
        descriptionWorkspace = {
          ...(descriptionWorkspace ?? {}),
          draft: data.draft
        };
      }
      descFormOrigin = descSnapshot();
      setMessage(elements.descriptionMessage, "Brouillon enregistré.", "success");
      setDescriptionState();
    } catch (e) {
      setMessage(elements.descriptionMessage, e.message || "Erreur de sauvegarde.", "error");
    } finally {
      elements.saveDescriptionButton.disabled = false;
      if (elements.submitDescriptionButton) elements.submitDescriptionButton.disabled = false;
    }
  }

  async function submitDescription(e) {
    e.preventDefault();

    try {
      elements.submitDescriptionButton.disabled = true;
      elements.saveDescriptionButton.disabled = true;

      await apiFetch(
        `/api/creator-panel/description/draft?creatorId=${encodeURIComponent(creator.id)}`,
        { method: "PUT", body: JSON.stringify({ markdown: elements.descriptionInput.value || "" }) }
      );

      const result = await apiFetch(
        `/api/creator-panel/description/submit?creatorId=${encodeURIComponent(creator.id)}`,
        { method: "POST" }
      );

      if (result?.automaticallyApproved) {
        creator.descriptionMarkdown = elements.descriptionInput.value;
        toMarkdownHtml(creator.descriptionMarkdown);
        setMessage(elements.descriptionMessage, "Description publiée.", "success");
      } else {
        setMessage(elements.descriptionMessage, "Description envoyée à la modération.", "success");
      }

      await loadDescriptionWorkspace();
      descFormOrigin = descSnapshot();
    } catch (e) {
      setMessage(elements.descriptionMessage, e.message || "Erreur de validation.", "error");
    } finally {
      elements.submitDescriptionButton.disabled = false;
      elements.saveDescriptionButton.disabled = false;
      setDescriptionState();
    }
  }

  async function loadCurrentUser() {
    try {
      const data = await apiFetch("/api/auth/me");
      currentUser = data.user || data || null;
    } catch {
      currentUser = null;
    }
  }

  async function loadCreator() {
    const slug = routeDescriptionId();

    if (!slug) {
      throw new Error(
        "Aucun créateur sélectionné."
      );
    }

    const data = await apiFetch(
      `/api/creators/${encodeURIComponent(slug)}`
    );

    if (!data?.creator) {
      throw new Error(
        "Créateur introuvable."
      );
    }

    creator = data.creator;

    await loadCurrentUser();

    canManage =
      canUserManageCurrentCreator();

    if (canManage) {
      creatorPanel = await apiFetch(
        `/api/creator-panel?creatorId=${encodeURIComponent(creator.id)
        }`
      );
    }

    await reloadGoals();

    fillProfile();

    if (window.JEventCreatorCalendar) {
      await window.JEventCreatorCalendar.load({
        apiFetch,
        creator,
        canManage
      });
    }
  }

  async function init() {
    try {
      setVisibility(true, false, false);

      await loadCreator();

      setVisibility(false, true, false);
    } catch (error) {
      console.error(error);

      setVisibility(false, false, true);

      elements.errorMessage.textContent =
        error.message ||
        "Erreur de chargement.";
    }
  }

  /* Événements des objectifs */

  onSafe(
    elements.editGoalsButton,
    "click",
    () => {
      $(".goals-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  );

  onSafe(
    elements.addGoalButton,
    "click",
    () => openGoalDialog()
  );

  onSafe(
    elements.goalForm,
    "submit",
    saveGoal
  );

  onSafe(
    elements.deleteGoalButton,
    "click",
    deleteGoal
  );

  onSafe(
    elements.closeGoalDialog,
    "click",
    requestCloseGoalDialog
  );

  onSafe(
    elements.cancelGoalButton,
    "click",
    requestCloseGoalDialog
  );

  onSafe(
    elements.goalDialog,
    "cancel",
    event => {
      event.preventDefault();
      requestCloseGoalDialog();
    }
  );

  /* Événements de la description */

  onSafe(
    elements.editDescriptionButton,
    "click",
    openDescriptionDialog
  );

  onSafe(
    elements.saveDescriptionButton,
    "click",
    saveDescriptionDraft
  );

  onSafe(
    elements.descriptionForm,
    "submit",
    submitDescription
  );

  onSafe(
    elements.closeDescriptionDialog,
    "click",
    requestCloseDescriptionDialog
  );

  onSafe(
    elements.cancelDescriptionButton,
    "click",
    requestCloseDescriptionDialog
  );

  onSafe(
    elements.descriptionDialog,
    "cancel",
    event => {
      event.preventDefault();
      requestCloseDescriptionDialog();
    }
  );

  /* Événements Streamlabs */

  onSafe(
    elements.streamlabsSettingsButton,
    "click",
    openStreamlabsDialog
  );

  onSafe(
    elements.streamlabsForm,
    "submit",
    saveStreamlabsSettings
  );

  onSafe(
    elements.closeStreamlabsDialog,
    "click",
    closeStreamlabsDialog
  );

  onSafe(
    elements.cancelStreamlabsButton,
    "click",
    closeStreamlabsDialog
  );

  /* Démarrage */

  init();

})();
