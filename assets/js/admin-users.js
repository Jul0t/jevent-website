(() => {
  "use strict";

  const API_URL =
    "https://api-beta.jevent.julot.fr";

  const elements = {
    list:
      document.querySelector(
        "#adminUsersList"
      ),

    empty:
      document.querySelector(
        "#adminUsersEmpty"
      ),

    message:
      document.querySelector(
        "#adminUsersMessage"
      ),

    searchInput:
      document.querySelector(
        "#adminUserSearchInput"
      ),

    refreshButton:
      document.querySelector(
        "#refreshButton"
      )
  };

  if (!elements.list) {
    return;
  }

  let users = [];
  let currentUserId = null;
  let loading = false;

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

  function normalizeSearch(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  function showMessage(
    message = "",
    type = ""
  ) {
    elements.message.textContent =
      message;

    elements.message.className =
      "admin-users-message";

    elements.message.hidden =
      !message;

    if (type) {
      elements.message.classList.add(
        `is-${type}`
      );
    }
  }

  function createAvatar(user) {
    const image =
      document.createElement("img");

    image.className =
      "admin-user-avatar";

    image.src =
      user.twitchProfileImageUrl ||
      "/assets/jevent_logo.png";

    image.alt =
      `Avatar de ${
        user.twitchDisplayName ||
        user.twitchLogin
      }`;

    return image;
  }

  function createBadge(
    text,
    className = ""
  ) {
    const badge =
      document.createElement("span");

    badge.className =
      "admin-user-badge";

    if (className) {
      badge.classList.add(className);
    }

    badge.textContent = text;

    return badge;
  }

  async function updateSuperAdminRole(
    user,
    enabled,
    button
  ) {
    const action =
      enabled
        ? "donner l’accès Admin à"
        : "retirer l’accès Admin de";

    const confirmed =
      window.confirm(
        `Veux-tu vraiment ${action} ` +
        `${user.twitchDisplayName} ?`
      );

    if (!confirmed) {
      return;
    }

    const previousText =
      button.textContent;

    button.disabled = true;
    button.textContent =
      "Enregistrement…";

    try {
      const result =
        await apiFetch(
          `/api/admin/users/${
            encodeURIComponent(user.id)
          }/super-admin`,
          {
            method: "PUT",

            body: JSON.stringify({
              enabled
            })
          }
        );

      user.superAdmin =
        Boolean(result.superAdmin);

      renderUsers();

      showMessage(
        enabled
          ? `${user.twitchDisplayName} est maintenant Admin.`
          : `${user.twitchDisplayName} n’est plus Admin.`,
        "success"
      );
    } catch (error) {
      button.disabled = false;
      button.textContent =
        previousText;

      showMessage(
        error.message,
        "error"
      );
    }
  }

  function createUserCard(user) {
    const card =
      document.createElement("article");

    card.className =
      "admin-user-card";

    if (!user.active) {
      card.classList.add(
        "is-disabled"
      );
    }

    const avatar =
      createAvatar(user);

    const content =
      document.createElement("div");

    content.className =
      "admin-user-content";

    const heading =
      document.createElement("div");

    heading.className =
      "admin-user-heading";

    const name =
      document.createElement("h3");

    name.textContent =
      user.twitchDisplayName ||
      user.twitchLogin;

    heading.append(name);

    if (
      Number(user.id) ===
      Number(currentUserId)
    ) {
      heading.append(
        createBadge(
          "Ton compte",
          "is-current"
        )
      );
    }

    if (user.superAdmin) {
      heading.append(
        createBadge(
          "Admin",
          "is-admin"
        )
      );
    }

    const login =
      document.createElement("p");

    login.className =
      "admin-user-login";

    login.textContent =
      `@${user.twitchLogin}`;

    const meta =
      document.createElement("p");

    meta.className =
      "admin-user-meta";

    meta.textContent =
      `Compte n°${user.id}`;

    content.append(
      heading,
      login,
      meta
    );

    const actions =
      document.createElement("div");

    actions.className =
      "admin-user-actions";

    const button =
      document.createElement("button");

    button.type = "button";

    const isCurrentUser =
      Number(user.id) ===
      Number(currentUserId);

    if (isCurrentUser) {
      button.className =
        "button button-secondary";

      button.textContent =
        "Ton compte";

      button.disabled = true;
    } else if (user.superAdmin) {
      button.className =
        "button button-danger";

      button.textContent =
        "Retirer l’accès";

      button.addEventListener(
        "click",
        () => {
          void updateSuperAdminRole(
            user,
            false,
            button
          );
        }
      );
    } else {
      button.className =
        "button button-primary";

      button.textContent =
        "Donner l’accès";

      button.addEventListener(
        "click",
        () => {
          void updateSuperAdminRole(
            user,
            true,
            button
          );
        }
      );
    }

    actions.append(button);

    card.append(
      avatar,
      content,
      actions
    );

    return card;
  }

  function renderUsers() {
    const search =
      normalizeSearch(
        elements.searchInput?.value
      );

    const filtered =
      users.filter(user => {
        const text =
          normalizeSearch(
            [
              user.twitchDisplayName,
              user.twitchLogin,
              user.id
            ].join(" ")
          );

        return text.includes(search);
      });

    elements.list.replaceChildren();

    elements.empty.hidden =
      filtered.length !== 0;

    for (const user of filtered) {
      elements.list.append(
        createUserCard(user)
      );
    }
  }

  async function loadUsers({
    silent = false
  } = {}) {
    if (loading) {
      return;
    }

    loading = true;

    if (!silent) {
      showMessage(
        "Chargement des comptes…"
      );
    }

    try {
      const data =
        await apiFetch(
          "/api/admin/users"
        );

      currentUserId =
        Number(data.currentUserId);

      users =
        Array.isArray(data.users)
          ? data.users
          : [];

      renderUsers();

      if (!silent) {
        showMessage(
          `${users.length} compte(s) chargé(s).`,
          "success"
        );
      }
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    } finally {
      loading = false;
    }
  }

  elements.searchInput
    ?.addEventListener(
      "input",
      renderUsers
    );

  elements.refreshButton
    ?.addEventListener(
      "click",
      () => {
        void loadUsers({
          silent: true
        });
      }
    );

  void loadUsers();
})();