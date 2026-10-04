(() => {
  "use strict";

  const API_BASE =
    "https://api-beta.jevent.julot.fr";

  const REFRESH_INTERVAL = 2000;
  const TIMER_INTERVAL = 250;

  const debugEnabled =
    new URLSearchParams(
      window.location.search
    ).get("debug") === "1";

  const elements = {
    overlay:
      document.querySelector(
        "#raffleOverlay"
      ),

    card:
      document.querySelector(
        "#raffleCard"
      ),

    status:
      document.querySelector(
        "#raffleStatus"
      ),

    method:
      document.querySelector(
        "#raffleMethod"
      ),

    timerLabel:
      document.querySelector(
        "#raffleTimerLabel"
      ),

    timer:
      document.querySelector(
        "#raffleTimer"
      ),

    title:
      document.querySelector(
        "#raffleTitle"
      ),

    description:
      document.querySelector(
        "#raffleDescription"
      ),

    winner:
      document.querySelector(
        "#raffleWinner"
      ),

    winnerName:
      document.querySelector(
        "#raffleWinnerName"
      ),

    entriesLabel:
      document.querySelector(
        "#raffleEntriesLabel"
      ),

    entries:
      document.querySelector(
        "#raffleEntries"
      ),

    participants:
      document.querySelector(
        "#raffleParticipants"
      ),

    amount:
      document.querySelector(
        "#raffleAmount"
      ),

    debugMessage:
      document.querySelector(
        "#debugMessage"
      )
  };

  const state = {
    token: "",
    raffle: null,
    overlaySettings: {},
    loading: false,
    lastSignature: ""
  };

  function getOverlayToken() {
    const queryToken =
      new URLSearchParams(
        window.location.search
      )
        .get("code")
        ?.trim();

    if (queryToken) {
      return queryToken;
    }

    const pathParts =
      window.location.pathname
        .split("/")
        .filter(Boolean);

    const tombolaIndex =
      pathParts.lastIndexOf(
        "tombola"
      );

    if (
      tombolaIndex < 0 ||
      !pathParts[tombolaIndex + 1]
    ) {
      return "";
    }

    try {
      return decodeURIComponent(
        pathParts[tombolaIndex + 1]
      );
    } catch {
      return pathParts[
        tombolaIndex + 1
      ];
    }
  }

  function parseApiDate(value) {
    if (!value) {
      return null;
    }

    let normalized =
      String(value).trim();

    /*
     * Les dates SQLite sans fuseau horaire
     * sont enregistrées en UTC.
     */
    if (
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
        .test(normalized)
    ) {
      normalized =
        normalized.replace(
          " ",
          "T"
        ) + "Z";
    }

    const date =
      new Date(normalized);

    return Number.isFinite(
      date.getTime()
    )
      ? date
      : null;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(
      "fr-FR"
    ).format(
      Number(value) || 0
    );
  }

  function formatMoney(cents) {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency: "EUR"
      }
    ).format(
      (Number(cents) || 0) / 100
    );
  }

  function formatDuration(
    milliseconds
  ) {
    const totalSeconds =
      Math.max(
        0,
        Math.ceil(
          milliseconds / 1000
        )
      );

    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (
          totalSeconds % 3600
        ) / 60
      );

    const seconds =
      totalSeconds % 60;

    const minuteText =
      String(minutes)
        .padStart(2, "0");

    const secondText =
      String(seconds)
        .padStart(2, "0");

    if (hours > 0) {
      return (
        String(hours)
          .padStart(2, "0") +
        ":" +
        minuteText +
        ":" +
        secondText
      );
    }

    return (
      minuteText +
      ":" +
      secondText
    );
  }

  function getWinnerName(winner) {
    if (!winner) {
      return "";
    }

    return (
      winner.twitchDisplayName ||
      winner.displayName ||
      winner.donorName ||
      winner.twitchLogin ||
      winner.name ||
      ""
    );
  }

  function getRaffleValue(
    raffle,
    ...keys
  ) {
    for (const key of keys) {
      const directValue =
        raffle?.[key];

      if (
        directValue !== null &&
        directValue !== undefined
      ) {
        return directValue;
      }

      const summaryValue =
        raffle?.summary?.[key];

      if (
        summaryValue !== null &&
        summaryValue !== undefined
      ) {
        return summaryValue;
      }
    }

    return 0;
  }

  function showDebug(message) {
    if (!debugEnabled) {
      return;
    }

    elements.debugMessage.hidden =
      false;

    elements.debugMessage.textContent =
      String(message);
  }

  function clearDebug() {
    elements.debugMessage.hidden =
      true;

    elements.debugMessage.textContent =
      "";
  }

  function hideOverlay() {
    elements.overlay.hidden = true;
    state.raffle = null;
  }

  function restartCardAnimation() {
    elements.card.classList.remove(
      "is-updated"
    );

    void elements.card.offsetWidth;

    elements.card.classList.add(
      "is-updated"
    );
  }

  function updateTimer() {
    const raffle =
      state.raffle;

    if (!raffle) {
      return;
    }

    const now =
      Date.now();

    switch (raffle.status) {
      case "countdown": {
        const startsAt =
          parseApiDate(
            raffle.startsAt
          );

        elements.timerLabel.textContent =
          "Commence dans";

        elements.timer.textContent =
          startsAt
            ? formatDuration(
                startsAt.getTime() -
                now
              )
            : "--:--";

        break;
      }

      case "active": {
        const endsAt =
          parseApiDate(
            raffle.endsAt
          );

        elements.timerLabel.textContent =
          "Temps restant";

        elements.timer.textContent =
          endsAt
            ? formatDuration(
                endsAt.getTime() -
                now
              )
            : "--:--";

        break;
      }

      case "drawing":
        elements.timerLabel.textContent =
          "Sélection";

        elements.timer.textContent =
          "TIRAGE";

        break;

      case "completed":
        elements.timerLabel.textContent =
          "Tombola";

        elements.timer.textContent =
          "TERMINÉE";

        break;

      default:
        elements.timerLabel.textContent =
          "Tombola";

        elements.timer.textContent =
          "--:--";
    }
  }

  function renderRaffle(
    overlay
  ) {
    const raffle =
      overlay?.raffle;

    if (
      !overlay?.enabled ||
      overlay.overlayType !==
        "raffle" ||
      !raffle ||
      raffle.status ===
        "cancelled"
    ) {
      hideOverlay();
      return;
    }

    state.raffle = raffle;
    state.overlaySettings =
      overlay.settings || {};

    elements.overlay.hidden = false;

    elements.card.dataset.status =
      raffle.status || "active";

    switch (raffle.status) {
      case "countdown":
        elements.status.textContent =
          "Tombola bientôt disponible";
        break;

      case "active":
        elements.status.textContent =
          "Tombola en cours";
        break;

      case "drawing":
        elements.status.textContent =
          "Tirage en cours";
        break;

      case "completed":
        elements.status.textContent =
          "Résultat de la tombola";
        break;

      default:
        elements.status.textContent =
          "Tombola";
    }

    elements.title.textContent =
      raffle.title ||
      "Tombola JEvent";

    const description =
      String(
        raffle.description || ""
      ).trim();

    elements.description.textContent =
      description;

    elements.description.hidden =
      !description;

    const ticketMethod =
      raffle.method ===
      "ticket_per_euro";

    elements.method.textContent =
      ticketMethod
        ? "1 € = 1 ticket"
        : "Le plus gros don remporte la tombola";

    const entryCount =
      ticketMethod
        ? getRaffleValue(
            raffle,
            "ticketCount",
            "ticketsCount"
          )
        : getRaffleValue(
            raffle,
            "donationsCount",
            "entriesCount"
          );

    elements.entriesLabel.textContent =
      ticketMethod
        ? "Tickets"
        : "Dons";

    elements.entries.textContent =
      formatNumber(entryCount);

    elements.participants.textContent =
      formatNumber(
        getRaffleValue(
          raffle,
          "participantsCount"
        )
      );

    elements.amount.textContent =
      formatMoney(
        getRaffleValue(
          raffle,
          "amountCents",
          "totalAmountCents"
        )
      );

    const winnerName =
      getWinnerName(
        raffle.winner
      );

    const showWinner =
      raffle.status ===
        "completed" &&
      Boolean(winnerName);

    elements.winner.hidden =
      !showWinner;

    if (showWinner) {
      elements.winnerName.textContent =
        winnerName;
    }

    const signature =
      [
        raffle.publicId,
        raffle.status,
        entryCount,
        getRaffleValue(
          raffle,
          "participantsCount"
        ),
        getRaffleValue(
          raffle,
          "amountCents",
          "totalAmountCents"
        ),
        winnerName
      ].join(":");

    if (
      signature !==
      state.lastSignature
    ) {
      state.lastSignature =
        signature;

      restartCardAnimation();
    }

    updateTimer();
  }

  async function refreshOverlay() {
    if (
      state.loading ||
      !state.token
    ) {
      return;
    }

    state.loading = true;

    try {
      const response =
        await fetch(
          API_BASE +
          "/api/overlays/" +
          encodeURIComponent(
            state.token
          ),
          {
            headers: {
              Accept:
                "application/json"
            },

            cache: "no-store"
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
        throw new Error(
          data.error ||
          "Impossible de charger l’overlay."
        );
      }

      clearDebug();

      renderRaffle(
        data.overlay
      );
    } catch (error) {
      console.error(
        "[Overlay tombola]",
        error
      );

      hideOverlay();

      showDebug(
        error.message ||
        "Erreur inconnue."
      );
    } finally {
      state.loading = false;
    }
  }

  function start() {
    state.token =
      getOverlayToken();

    if (!state.token) {
      hideOverlay();

      showDebug(
        "Aucun code d’overlay dans l’URL."
      );

      return;
    }

    refreshOverlay();

    window.setInterval(
      refreshOverlay,
      REFRESH_INTERVAL
    );

    window.setInterval(
      updateTimer,
      TIMER_INTERVAL
    );
  }

  start();
})();