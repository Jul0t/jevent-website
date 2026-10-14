(() => {
    "use strict";

    const API_BASE =
        "https://api.jevent.julot.fr";

    const REFRESH_INTERVAL_MS = 5000;

    const elements = {
        overlay:
            document.querySelector("#goalsOverlay"),

        creator:
            document.querySelector("#creatorName"),

        title:
            document.querySelector("#goalsTitle"),

        total:
            document.querySelector("#totalRaised"),

        list:
            document.querySelector("#goalsList"),

        debug:
            document.querySelector("#goalsDebug")
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
                /\/overlay\/objectifs-dons\/([^/?#]+)/
            );

        return match
            ? decodeURIComponent(match[1]).trim()
            : "";
    }

    async function fetchJson(pathname) {
        const response =
            await fetch(API_BASE + pathname, {
                cache: "no-store",
                headers: {
                    Accept: "application/json"
                }
            });

        const data =
            await response.json().catch(() => ({}));

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
        if (value) {
            document.documentElement
                .style.setProperty(name, value);
        }
    }

    function applySettings(settings = {}) {
        setVariable(
            "--goals-primary",
            settings.primaryColor
        );

        setVariable(
            "--goals-secondary",
            settings.secondaryColor
        );

        setVariable(
            "--goals-background",
            settings.backgroundColor
        );

        setVariable(
            "--goals-text",
            settings.textColor
        );
    }

    function createGoal(
        goal,
        raisedCents
    ) {
        const targetCents =
            Math.max(
                1,
                Number(goal.thresholdCents || 0)
            );

        const percentage =
            Math.min(
                100,
                Math.max(
                    0,
                    raisedCents / targetCents * 100
                )
            );

        const card =
            document.createElement("article");

        card.className =
            "goal-card" +
            (goal.reached ? " is-reached" : "");

        card.innerHTML = `
            <div class="goal-heading">
                <strong class="goal-title"></strong>
                <span class="goal-percentage"></span>
            </div>

            <div class="goal-track">
                <div class="goal-progress"></div>
            </div>

            <div class="goal-amounts">
                <span class="goal-current"></span>
                <span class="goal-target"></span>
            </div>
        `;

        card.querySelector(".goal-title")
            .textContent = goal.title;

        card.querySelector(".goal-percentage")
            .textContent = goal.reached
                ? "Atteint ✓"
                : `${Math.round(percentage)} %`;

        card.querySelector(".goal-current")
            .textContent =
                formatMoney(
                    raisedCents,
                    goal.currency
                );

        card.querySelector(".goal-target")
            .textContent =
                "sur " +
                formatMoney(
                    targetCents,
                    goal.currency
                );

        requestAnimationFrame(() => {
            card.querySelector(".goal-progress")
                .style.width = `${percentage}%`;
        });

        return card;
    }

    function render(
        overlay,
        fundraising
    ) {
        const settings =
            overlay.settings || {};

        const raisedCents =
            Math.max(
                0,
                Number(
                    fundraising
                        .creatorAmountRaisedCents || 0
                )
            );

        let goals =
            Array.isArray(fundraising.goals)
                ? fundraising.goals
                : [];

        if (settings.showReached === false) {
            goals =
                goals.filter(goal => !goal.reached);
        }

        const maximum =
            Number(settings.maximumGoals || 0);

        if (maximum > 0) {
            goals = goals.slice(0, maximum);
        }

        if (!goals.length) {
            elements.overlay.hidden = true;
            return;
        }

        applySettings(settings);

        elements.creator.textContent =
            overlay.creator?.slug ||
            "JEvent";

        elements.title.textContent =
            String(settings.title || "").trim() ||
            "Objectifs de dons";

        elements.total.textContent =
            formatMoney(raisedCents);

        elements.list.replaceChildren(
            ...goals.map(goal =>
                createGoal(goal, raisedCents)
            )
        );

        elements.overlay.hidden = false;
    }

    async function refresh() {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Jeton de l’overlay manquant."
            );
        }

        const overlayData =
            await fetchJson(
                "/api/overlays/" +
                encodeURIComponent(token)
            );

        const overlay =
            overlayData.overlay;

        if (
            !overlay ||
            overlay.overlayType !==
                "donation_goals"
        ) {
            throw new Error(
                "Ce lien ne correspond pas aux objectifs de dons."
            );
        }

        const slug =
            overlay.creator?.slug;

        if (!slug) {
            throw new Error(
                "Créateur introuvable."
            );
        }

        const fundraising =
            await fetchJson(
                "/api/goals/creator/" +
                encodeURIComponent(slug)
            );

        render(overlay, fundraising);
    }

    function showError(error) {
        console.error(
            "[Objectifs de dons]",
            error
        );

        if (
            new URL(window.location.href)
                .searchParams.has("debug")
        ) {
            elements.debug.hidden = false;
            elements.debug.textContent =
                error.message || String(error);
        }
    }

    async function start() {
        try {
            await refresh();
        } catch (error) {
            showError(error);
        }

        window.setInterval(async () => {
            try {
                await refresh();
            } catch (error) {
                showError(error);
            }
        }, REFRESH_INTERVAL_MS);
    }

    start();
})();