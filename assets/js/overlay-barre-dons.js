    (() => {
  "use strict";

  const API_BASE =
    "https://api.jevent.julot.fr";

  const REFRESH_INTERVAL_MS = 5000;

  const elements = {
    overlay:
      document.querySelector(
        "#donationBarOverlay"
      ),

    title:
      document.querySelector(
        "#donationBarTitle"
      ),

    percentage:
      document.querySelector(
        "#donationBarPercentage"
      ),

    progress:
      document.querySelector(
        "#donationBarProgress"
      ),

    current:
      document.querySelector(
        "#donationBarCurrent"
      ),

    target:
      document.querySelector(
        "#donationBarTarget"
      ),

    debug:
      document.querySelector(
        "#donationBarDebug"
      )
  };

  const state = {
    token: "",
    overlay: null,
    timer: null
  };

  function getToken() {
    const url =
      new URL(window.location.href);

    const queryToken =
      url.searchParams.get("code");

    if (queryToken) {
      return queryToken.trim();
    }

    const match =
      url.pathname.match(
        /\/overlay\/barre-dons\/([^/?#]+)/
      );

    if (!match) {
      return "";
    }

    return decodeURIComponent(
      match[1]
    ).trim();
  }

  async function fetchJson(pathname) {
    const response =
      await fetch(
        API_BASE + pathname,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

    const data =
      await response.json()
        .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        `Erreur HTTP ${response.status}`
      );
    }

    return data;
  }

  function formatMoney(
    cents,
    currency = "EUR"
  ) {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency
      }
    ).format(
      Number(cents || 0) / 100
    );
  }

  function setVariable(name, value) {
    if (!value) {
      return;
    }

    document.documentElement
      .style.setProperty(
        name,
        String(value)
      );
  }

  function applySettings(settings = {}) {
    setVariable(
      "--bar-color",
      settings.primaryColor
    );

    setVariable(
      "--bar-secondary-color",
      settings.secondaryColor
    );

    setVariable(
      "--bar-background",
      settings.backgroundColor
    );

    setVariable(
      "--bar-track",
      settings.trackColor
    );

    setVariable(
      "--bar-text",
      settings.textColor
    );
  }

  function selectGoal(
    goals,
    settings
  ) {
    if (!Array.isArray(goals)) {
      return null;
    }

    if (settings.goalPublicId) {
      const selected =
        goals.find(
          goal =>
            goal.publicId ===
            settings.goalPublicId
        );

      if (selected) {
        return selected;
      }
    }

    return (
      goals.find(goal => !goal.reached) ||
      goals.at(-1) ||
      null
    );
  }

  function render(
    fundraising,
    settings
  ) {
    const goal =
      selectGoal(
        fundraising.goals,
        settings
      );

    if (!goal) {
      elements.overlay.hidden = true;
      return;
    }

    const raisedCents =
      Math.max(
        0,
        Number(
          fundraising
            .creatorAmountRaisedCents || 0
        )
      );

    const targetCents =
      Math.max(
        1,
        Number(
          goal.thresholdCents || 0
        )
      );

    const percentage =
      Math.min(
        100,
        Math.max(
          0,
          (
            raisedCents /
            targetCents
          ) * 100
        )
      );

    const customTitle =
      String(
        settings.title || ""
      ).trim();

    elements.title.textContent =
      customTitle || goal.title;

    elements.current.textContent =
      formatMoney(
        raisedCents,
        goal.currency
      );

    elements.target.textContent =
      "sur " +
      formatMoney(
        targetCents,
        goal.currency
      );

    elements.percentage.textContent =
      `${Math.round(percentage)} %`;

    elements.title.hidden =
      settings.showTitle === false;

    elements.current.parentElement.hidden =
      settings.showAmounts === false;

    elements.percentage.hidden =
      settings.showPercentage === false;

    elements.overlay.hidden =
      Boolean(
        settings.hideWhenComplete &&
        percentage >= 100
      );

    requestAnimationFrame(() => {
      elements.progress.style.width =
        `${percentage}%`;
    });
  }

  async function refresh() {
    const overlayData =
      await fetchJson(
        "/api/overlays/" +
        encodeURIComponent(
          state.token
        )
      );

    const overlay =
      overlayData.overlay;

    if (
      !overlay ||
      overlay.overlayType !==
        "donation_bar"
    ) {
      throw new Error(
        "Ce lien ne correspond pas à une barre de dons."
      );
    }

    state.overlay = overlay;

    const settings =
      overlay.settings || {};

    applySettings(settings);

    const creatorSlug =
      overlay.creator?.slug;

    if (!creatorSlug) {
      throw new Error(
        "Créateur introuvable."
      );
    }

    const fundraising =
      await fetchJson(
        "/api/goals/creator/" +
        encodeURIComponent(
          creatorSlug
        )
      );

    render(
      fundraising,
      settings
    );
  }

  function showError(error) {
    console.error(
      "[Barre de dons]",
      error
    );

    const debugEnabled =
      new URL(window.location.href)
        .searchParams
        .has("debug");

    if (debugEnabled) {
      elements.debug.hidden = false;
      elements.debug.textContent =
        error.message ||
        String(error);
    }
  }

  async function start() {
    state.token = getToken();

    if (!state.token) {
      showError(
        new Error(
          "Jeton de l’overlay manquant."
        )
      );

      return;
    }

    try {
      await refresh();
    } catch (error) {
      showError(error);
    }

    state.timer =
      window.setInterval(
        async () => {
          try {
            await refresh();
          } catch (error) {
            showError(error);
          }
        },
        REFRESH_INTERVAL_MS
      );
  }

  start();
})();