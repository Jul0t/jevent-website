(() => {
    "use strict";

    const API_URL =
        "https://api-beta.jevent.julot.fr";

    const SHOP_REDIRECT_URL =
        `${API_URL}/api/shop`;

    const SHOP_OPENING_AT =
        new Date(
            "2026-10-12T00:00:00+02:00"
        );

    const EVENT_START =
        new Date(
            "2026-10-26T16:00:00+01:00"
        );

    const EVENT_END =
        new Date(
            "2026-10-29T04:00:00+01:00"
        );

    const TIMEZONE =
        "Europe/Paris";

    const elements = {
        navigationToggle:
            document.querySelector(
                "#navigationToggle"
            ),

        navigation:
            document.querySelector(
                "#mainNavigation"
            ),

        countdownTitle:
            document.querySelector(
                "#countdownTitle"
            ),

        countdownDays:
            document.querySelector(
                "#countdownDays"
            ),

        countdownHours:
            document.querySelector(
                "#countdownHours"
            ),

        countdownMinutes:
            document.querySelector(
                "#countdownMinutes"
            ),

        countdownSeconds:
            document.querySelector(
                "#countdownSeconds"
            ),

        globalRaisedAmount:
            document.querySelector(
                "#globalRaisedAmount"
            ),

        globalRaisedDetail:
            document.querySelector(
                "#globalRaisedDetail"
            ),

        liveCreators:
            document.querySelector(
                "#liveCreators"
            ),

        liveEmpty:
            document.querySelector(
                "#liveEmpty"
            ),

        liveError:
            document.querySelector(
                "#liveError"
            ),

        currentActivityContent:
            document.querySelector(
                "#currentActivityContent"
            ),

        upcomingActivities:
            document.querySelector(
                "#upcomingActivities"
            ),

        programmeEmpty:
            document.querySelector(
                "#programmeEmpty"
            ),

        creatorPreview:
            document.querySelector(
                "#creatorPreview"
            ),

        creatorPreviewError:
            document.querySelector(
                "#creatorPreviewError"
            ),

        shopOpeningMessage:
            document.querySelector(
                "#shopOpeningMessage"
            ),

        shopNavigationBadge:
            document.querySelector(
                "#shopNavigationBadge"
            )
    };

    let creators = [];
    let programEntries = [];

    /*
     * API
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
                12_000
            );

        try {
            const response =
                await fetch(
                    API_URL + path,
                    {
                        credentials: "include",

                        headers: {
                            Accept: "application/json",

                            ...(options.headers ?? {})
                        },

                        signal: controller.signal,

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
                throw new Error(
                    data.error ??
                    data.message ??
                    `Erreur HTTP ${response.status}`
                );
            }

            return data;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    /*
     * Outils
     */

    function makeElement(
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

    function formatMoney(cents) {
        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency: "EUR"
            }
        ).format(
            Number(cents ?? 0) / 100
        );
    }

    function validDate(value) {
        const date =
            value instanceof Date
                ? value
                : new Date(value);

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }

    function formatTime(value) {
        const date =
            validDate(value);

        if (!date) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: TIMEZONE
            }
        ).format(date);
    }

    function formatDay(value) {
        const date =
            validDate(value);

        if (!date) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: TIMEZONE
            }
        ).format(date);
    }

    function formatShortDay(value) {
        const date =
            validDate(value);

        if (!date) {
            return {
                day: "—",
                month: ""
            };
        }

        return {
            day:
                new Intl.DateTimeFormat(
                    "fr-FR",
                    {
                        day: "2-digit",
                        timeZone: TIMEZONE
                    }
                ).format(date),

            month:
                new Intl.DateTimeFormat(
                    "fr-FR",
                    {
                        month: "short",
                        timeZone: TIMEZONE
                    }
                )
                    .format(date)
                    .replace(".", "")
        };
    }

    function creatorName(creator) {
        return (
            creator?.twitchDisplayName ??
            creator?.displayName ??
            creator?.creatorName ??
            creator?.name ??
            creator?.twitchLogin ??
            creator?.slug ??
            "Créateur JEvent"
        );
    }

    function creatorSlug(creator) {
        return (
            creator?.slug ??
            creator?.creatorSlug ??
            creator?.twitchLogin ??
            ""
        );
    }

    function creatorAvatar(creator) {
        return (
            creator?.twitchProfileImageUrl ??
            creator?.profileImageUrl ??
            creator?.avatarUrl ??
            "/assets/jevent_logo.png"
        );
    }

    function creatorPageUrl(creator) {
        const slug =
            creatorSlug(creator);

        return slug
            ? (
                "/createur.html?slug=" +
                encodeURIComponent(slug)
            )
            : "/createurs.html";
    }

    function getEntryCreator(entry) {
        return (
            entry?.primaryCreator ??
            entry?.creator ??
            entry?.participants?.find(
                participant =>
                    participant.primary ||
                    participant.isPrimary
            ) ??
            entry?.participants?.[0] ??
            null
        );
    }

    function getRaisedCents(value) {
        const candidates = [
            value?.raisedCents,
            value?.creatorRaisedCents,
            value?.totalRaisedCents,
            value?.fundraisingRaisedCents,
            value?.fundraising?.raisedCents,
            value?.fundraising?.totalRaisedCents,
            value?.streamlabs?.raisedCents
        ];

        for (const candidate of candidates) {
            if (
                candidate !== null &&
                candidate !== undefined &&
                Number.isFinite(
                    Number(candidate)
                )
            ) {
                return Number(candidate);
            }
        }

        return null;
    }

    /*
     * Navigation mobile
     */

    function setNavigationOpen(open) {
        if (
            !elements.navigation ||
            !elements.navigationToggle
        ) {
            return;
        }

        elements.navigation.classList.toggle(
            "is-open",
            open
        );

        elements.navigationToggle.classList.toggle(
            "is-open",
            open
        );

        elements.navigationToggle.setAttribute(
            "aria-expanded",
            String(open)
        );

        elements.navigationToggle.setAttribute(
            "aria-label",
            open
                ? "Fermer le menu"
                : "Ouvrir le menu"
        );
    }

    elements.navigationToggle
        ?.addEventListener(
            "click",
            () => {
                const open =
                    elements.navigationToggle
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
            if (window.innerWidth > 900) {
                setNavigationOpen(false);
            }
        }
    );

    /*
     * Boutique
     */

    function updateShopState() {
        const opened =
            Date.now() >=
            SHOP_OPENING_AT.getTime();

        const shopLinks =
            document.querySelectorAll(
                "[data-shop-link]"
            );

        for (const link of shopLinks) {
            if (opened) {
                link.href =
                    SHOP_REDIRECT_URL;

                link.classList.remove(
                    "is-disabled"
                );

                link.removeAttribute(
                    "aria-disabled"
                );
            } else {
                link.href =
                    "#boutique";

                link.classList.add(
                    "is-disabled"
                );

                link.setAttribute(
                    "aria-disabled",
                    "true"
                );
            }
        }

        const shopButton =
            document.querySelector(
                "#shopButton"
            );

        if (shopButton) {
            shopButton.textContent =
                opened
                    ? "Découvrir la boutique"
                    : "Ouverture le 12 octobre";
        }

        if (
            elements.shopNavigationBadge
        ) {
            elements.shopNavigationBadge
                .textContent =
                opened
                    ? "Ouverte"
                    : "12 oct.";
        }

        if (
            elements.shopOpeningMessage
        ) {
            elements.shopOpeningMessage
                .textContent =
                opened
                    ? (
                        "La boutique officielle " +
                        "du JEvent 2026 est ouverte."
                    )
                    : (
                        "Ouverture officielle " +
                        "le 12 octobre 2026."
                    );
        }
    }

    document
        .querySelectorAll(
            "[data-shop-link]"
        )
        .forEach(link => {
            link.addEventListener(
                "click",
                event => {
                    if (
                        Date.now() >=
                        SHOP_OPENING_AT.getTime()
                    ) {
                        return;
                    }

                    event.preventDefault();

                    document
                        .querySelector("#boutique")
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                }
            );
        });

    /*
     * Compte à rebours
     */

    function padCountdown(value) {
        return String(
            Math.max(0, value)
        ).padStart(2, "0");
    }

    function updateCountdown() {
        const now =
            Date.now();

        let target =
            EVENT_START.getTime();

        if (
            now >= EVENT_START.getTime() &&
            now < EVENT_END.getTime()
        ) {
            target =
                EVENT_END.getTime();

            if (elements.countdownTitle) {
                elements.countdownTitle
                    .textContent =
                    "Le JEvent se termine dans";
            }
        } else if (
            now >= EVENT_END.getTime()
        ) {
            if (elements.countdownTitle) {
                elements.countdownTitle
                    .textContent =
                    "Le JEvent 26 est terminé";
            }

            elements.countdownDays.textContent =
                "00";

            elements.countdownHours.textContent =
                "00";

            elements.countdownMinutes.textContent =
                "00";

            elements.countdownSeconds.textContent =
                "00";

            return;
        } else if (
            elements.countdownTitle
        ) {
            elements.countdownTitle
                .textContent =
                "Le JEvent commence dans";
        }

        const difference =
            Math.max(
                0,
                target - now
            );

        const totalSeconds =
            Math.floor(
                difference / 1000
            );

        const days =
            Math.floor(
                totalSeconds / 86_400
            );

        const hours =
            Math.floor(
                (
                    totalSeconds % 86_400
                ) / 3_600
            );

        const minutes =
            Math.floor(
                (
                    totalSeconds % 3_600
                ) / 60
            );

        const seconds =
            totalSeconds % 60;

        elements.countdownDays.textContent =
            padCountdown(days);

        elements.countdownHours.textContent =
            padCountdown(hours);

        elements.countdownMinutes.textContent =
            padCountdown(minutes);

        elements.countdownSeconds.textContent =
            padCountdown(seconds);
    }

    /*
     * Créateurs et directs
     */

    function normalizeCreators(data) {
        if (
            Array.isArray(data?.creators)
        ) {
            return data.creators;
        }

        if (
            Array.isArray(data?.results)
        ) {
            return data.results;
        }

        if (Array.isArray(data)) {
            return data;
        }

        return [];
    }

    function createLiveCard(creator) {
        const link =
            makeElement(
                "a",
                "live-card"
            );

        link.href =
            creatorPageUrl(creator);

        const media =
            makeElement(
                "div",
                "live-card-media"
            );

        const thumbnail =
            makeElement(
                "img",
                "live-card-thumbnail"
            );

        thumbnail.src =
            creator.live?.thumbnailUrl ||
            creatorAvatar(creator);

        thumbnail.alt =
            creator.live?.thumbnailUrl
                ? (
                    `Aperçu du direct de ` +
                    creatorName(creator)
                )
                : (
                    `Avatar de ` +
                    creatorName(creator)
                );

        thumbnail.loading =
            "lazy";

        const overlay =
            makeElement(
                "div",
                "live-card-overlay"
            );

        const liveBadge =
            makeElement(
                "span",
                "live-card-badge",
                "En direct"
            );

        media.append(
            thumbnail,
            overlay,
            liveBadge
        );

        const content =
            makeElement(
                "div",
                "live-card-content"
            );

        const identity =
            makeElement(
                "div",
                "live-card-identity"
            );

        const avatar =
            makeElement(
                "img",
                "live-card-avatar"
            );

        avatar.src =
            creatorAvatar(creator);

        avatar.alt = "";
        avatar.loading = "lazy";

        const nameBlock =
            makeElement(
                "div",
                "live-card-name"
            );

        nameBlock.append(
            makeElement(
                "strong",
                "",
                creatorName(creator)
            ),

            makeElement(
                "span",
                "",
                creator.live?.gameName ||
                "JEvent 26"
            )
        );

        identity.append(
            avatar,
            nameBlock
        );

        const title =
            makeElement(
                "p",
                "live-card-title",
                creator.live?.title ||
                "En direct pour le JEvent 26"
            );

        const viewers =
            makeElement(
                "span",
                "live-card-viewers",
                `${formatNumber(
                    creator.live?.viewerCount
                )
                } spectateur${Number(
                    creator.live?.viewerCount ?? 0
                ) > 1
                    ? "s"
                    : ""
                }`
            );

        content.append(
            identity,
            title,
            viewers
        );

        link.append(
            media,
            content
        );

        return link;
    }

    function renderLiveCreators() {
        if (!elements.liveCreators) {
            return;
        }

        elements.liveCreators
            .replaceChildren();

        elements.liveError.hidden =
            true;

        const liveCreators =
            creators
                .filter(
                    creator =>
                        creator.isLive &&
                        creator.live
                )
                .sort(
                    (first, second) =>
                        Number(
                            second.live?.viewerCount ?? 0
                        ) -
                        Number(
                            first.live?.viewerCount ?? 0
                        )
                );

        elements.liveEmpty.hidden =
            liveCreators.length !== 0;

        for (
            const creator of liveCreators
        ) {
            elements.liveCreators.append(
                createLiveCard(creator)
            );
        }
    }

    function createCreatorPreviewCard(
        creator
    ) {
        const link =
            makeElement(
                "a",
                "creator-preview-card"
            );

        link.href =
            creatorPageUrl(creator);

        const avatarWrapper =
            makeElement(
                "div",
                "creator-preview-avatar-wrapper"
            );

        const avatar =
            makeElement(
                "img",
                "creator-preview-avatar"
            );

        avatar.src =
            creatorAvatar(creator);

        avatar.alt =
            `Avatar de ${creatorName(creator)
            }`;

        avatar.loading =
            "lazy";

        avatarWrapper.append(avatar);

        if (creator.isLive) {
            avatarWrapper.append(
                makeElement(
                    "span",
                    "creator-live-dot"
                )
            );
        }

        const content =
            makeElement(
                "div",
                "creator-preview-content"
            );

        content.append(
            makeElement(
                "strong",
                "",
                creatorName(creator)
            ),

            makeElement(
                "span",
                "",
                creator.isLive
                    ? "En direct"
                    : (
                        `@${creator.twitchLogin ||
                        creatorSlug(creator)
                        }`
                    )
            )
        );

        const arrow =
            makeElement(
                "span",
                "creator-preview-arrow",
                "→"
            );

        arrow.setAttribute(
            "aria-hidden",
            "true"
        );

        link.append(
            avatarWrapper,
            content,
            arrow
        );

        return link;
    }

    function renderCreatorPreview() {
        if (!elements.creatorPreview) {
            return;
        }

        elements.creatorPreview
            .replaceChildren();

        elements.creatorPreviewError.hidden =
            true;

        const preview =
            [...creators]
                .sort(
                    (first, second) => {
                        if (
                            first.isLive !==
                            second.isLive
                        ) {
                            return first.isLive
                                ? -1
                                : 1;
                        }

                        return (
                            Number(
                                first.displayOrder ?? 100
                            ) -
                            Number(
                                second.displayOrder ?? 100
                            )
                        );
                    }
                )
                .slice(0, 8);

        for (const creator of preview) {
            elements.creatorPreview.append(
                createCreatorPreviewCard(
                    creator
                )
            );
        }
    }

    async function resolveGlobalRaised(
        listData
    ) {
        const directAmount =
            getRaisedCents(
                listData?.overview ??
                listData
            );

        if (directAmount !== null) {
            return directAmount;
        }

        const knownAmounts =
            creators
                .map(getRaisedCents)
                .filter(
                    amount =>
                        amount !== null
                );

        if (knownAmounts.length > 0) {
            return knownAmounts.reduce(
                (total, amount) =>
                    total + amount,
                0
            );
        }

        /*
         * Si la liste publique ne contient pas
         * les montants, on vérifie les profils
         * individuellement.
         */

        const results =
            await Promise.allSettled(
                creators.map(
                    async creator => {
                        const slug =
                            creatorSlug(creator);

                        if (!slug) {
                            return null;
                        }

                        const data =
                            await apiFetch(
                                `/api/creators/${encodeURIComponent(slug)
                                }`
                            );

                        return getRaisedCents(
                            data?.creator
                        );
                    }
                )
            );

        const amounts =
            results
                .filter(
                    result =>
                        result.status ===
                        "fulfilled"
                )
                .map(
                    result =>
                        result.value
                )
                .filter(
                    amount =>
                        amount !== null
                );

        if (amounts.length === 0) {
            return null;
        }

        return amounts.reduce(
            (total, amount) =>
                total + amount,
            0
        );
    }

    function renderGlobalRaised(
        amount
    ) {
        if (
            !elements.globalRaisedAmount
        ) {
            return;
        }

        if (amount === null) {
            elements.globalRaisedAmount
                .textContent =
                "Bientôt disponible";

            elements.globalRaisedDetail
                .textContent =
                "Le montant apparaîtra au lancement de la collecte.";

            return;
        }

        elements.globalRaisedAmount
            .textContent =
            formatMoney(amount);

        elements.globalRaisedDetail
            .textContent =
            "Total des cagnottes des créateurs";
    }

    async function loadCreators() {
        try {
            const data =
                await apiFetch(
                    "/api/creators"
                );

            creators =
                normalizeCreators(data);

            renderLiveCreators();
            renderCreatorPreview();

            const raised =
                await resolveGlobalRaised(
                    data
                );

            renderGlobalRaised(
                raised
            );
        } catch (error) {
            console.error(
                "Chargement des créateurs impossible :",
                error
            );

            creators = [];

            elements.liveCreators
                ?.replaceChildren();

            elements.creatorPreview
                ?.replaceChildren();

            if (elements.liveEmpty) {
                elements.liveEmpty.hidden =
                    true;
            }

            if (elements.liveError) {
                elements.liveError.hidden =
                    false;
            }

            if (
                elements.creatorPreviewError
            ) {
                elements.creatorPreviewError
                    .hidden = false;
            }

            renderGlobalRaised(null);
        }
    }

    /*
     * Programme
     */

    function conditionIsSatisfied(
        entry
    ) {
        const condition =
            String(
                entry.goalCondition ??
                entry.goal_condition ??
                "always"
            ).toLowerCase();

        if (condition === "always") {
            return true;
        }

        if (!entry.goal) {
            return false;
        }

        const reached =
            Boolean(entry.goal.reached);

        if (
            condition === "reached"
        ) {
            return reached;
        }

        if (
            condition === "not_reached"
        ) {
            return !reached;
        }

        return true;
    }

    function resolveProgramEntry(entry) {
        if (
            conditionIsSatisfied(entry)
        ) {
            return entry;
        }

        const fallbackEnabled =
            Boolean(
                entry.fallbackEnabled ??
                entry.fallback_enabled
            );

        const fallback =
            entry.fallback;

        if (
            !fallbackEnabled ||
            !fallback
        ) {
            return null;
        }

        return {
            ...entry,

            title:
                fallback.title ||
                "Activité de remplacement",

            descriptionMarkdown:
                fallback.descriptionMarkdown ??
                "",

            category:
                fallback.category ??
                entry.category,

            externalUrl:
                fallback.externalUrl ??
                null,

            goal: null,
            goalPublicId: null,
            goalCondition: "always",
            isFallback: true
        };
    }

    function normalizeProgram(data) {
        const entries =
            Array.isArray(data?.entries)
                ? data.entries
                : Array.isArray(data?.program)
                    ? data.program
                    : Array.isArray(data)
                        ? data
                        : [];

        return entries
            .filter(entry => {
                const status =
                    String(
                        entry.status ?? ""
                    ).toLowerCase();

                return (
                    status !== "cancelled" &&
                    status !== "canceled" &&
                    status !== "draft"
                );
            })
            .map(resolveProgramEntry)
            .filter(Boolean)
            .filter(
                entry =>
                    validDate(entry.startsAt) &&
                    validDate(entry.endsAt)
            )
            .sort(
                (first, second) =>
                    new Date(
                        first.startsAt
                    ) -
                    new Date(
                        second.startsAt
                    )
            );
    }

    function createConditionBadge(entry) {
        const condition =
            String(
                entry.goalCondition ??
                "always"
            ).toLowerCase();

        if (
            condition === "always" ||
            !entry.goal
        ) {
            return null;
        }

        const badge =
            makeElement(
                "span",
                "programme-condition"
            );

        badge.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        ></circle>

        <path
          d="M12 8v4l2.5 2.5"
        ></path>
      </svg>

      <span>
        ${condition === "reached"
                ? "Sous réserve d’objectif atteint"
                : "Si l’objectif n’est pas atteint"
            }
      </span>
    `;

        return badge;
    }

    function createCurrentActivity(
        entry
    ) {
        const creator =
            getEntryCreator(entry);

        const article =
            makeElement(
                "article",
                "current-activity"
            );

        const time =
            makeElement(
                "p",
                "current-activity-time",
                (
                    `${formatTime(
                        entry.startsAt
                    )} – ${formatTime(
                        entry.endsAt
                    )}`
                )
            );

        const title =
            makeElement(
                "h3",
                "",
                entry.title ||
                "Activité du JEvent"
            );

        const creatorLink =
            makeElement(
                "a",
                "current-activity-creator",
                creatorName(creator)
            );

        creatorLink.href =
            creatorPageUrl(creator);

        const condition =
            createConditionBadge(entry);

        article.append(
            time,
            title,
            creatorLink
        );

        if (condition) {
            article.append(condition);
        }

        return article;
    }

    function renderCurrentActivities() {
        if (
            !elements.currentActivityContent
        ) {
            return;
        }

        elements.currentActivityContent
            .replaceChildren();

        const now =
            Date.now();

        const currentEntries =
            programEntries.filter(
                entry => {
                    const start =
                        new Date(
                            entry.startsAt
                        ).getTime();

                    const end =
                        new Date(
                            entry.endsAt
                        ).getTime();

                    return (
                        now >= start &&
                        now < end
                    );
                }
            );

        if (
            currentEntries.length === 0
        ) {
            const empty =
                makeElement(
                    "div",
                    "current-activity-empty"
                );

            empty.append(
                makeElement(
                    "strong",
                    "",
                    "Aucune activité en cours"
                ),

                makeElement(
                    "p",
                    "",
                    now < EVENT_START.getTime()
                        ? (
                            "Les activités apparaîtront ici " +
                            "dès le début du JEvent."
                        )
                        : (
                            "Consulte les prochains " +
                            "rendez-vous du programme."
                        )
                )
            );

            elements.currentActivityContent
                .append(empty);

            return;
        }

        const list =
            makeElement(
                "div",
                "current-activities-list"
            );

        for (
            const entry of
            currentEntries.slice(0, 4)
        ) {
            list.append(
                createCurrentActivity(entry)
            );
        }

        elements.currentActivityContent
            .append(list);
    }

    function createUpcomingActivity(
        entry
    ) {
        const creator =
            getEntryCreator(entry);

        const article =
            makeElement(
                "article",
                "upcoming-item"
            );

        const dateParts =
            formatShortDay(
                entry.startsAt
            );

        const date =
            makeElement(
                "div",
                "upcoming-date"
            );

        date.append(
            makeElement(
                "strong",
                "",
                dateParts.day
            ),

            makeElement(
                "span",
                "",
                dateParts.month
            )
        );

        const content =
            makeElement(
                "div",
                "upcoming-content"
            );

        const time =
            makeElement(
                "span",
                "upcoming-time",
                (
                    `${formatTime(
                        entry.startsAt
                    )} – ${formatTime(
                        entry.endsAt
                    )}`
                )
            );

        const title =
            makeElement(
                "h4",
                "",
                entry.title ||
                "Activité du JEvent"
            );

        const creatorLink =
            makeElement(
                "a",
                "upcoming-creator",
                creatorName(creator)
            );

        creatorLink.href =
            creatorPageUrl(creator);

        content.append(
            time,
            title,
            creatorLink
        );

        const condition =
            createConditionBadge(entry);

        if (condition) {
            content.append(condition);
        }

        article.append(
            date,
            content
        );

        return article;
    }

    function renderUpcomingActivities() {
        if (
            !elements.upcomingActivities
        ) {
            return;
        }

        elements.upcomingActivities
            .replaceChildren();

        const now =
            Date.now();

        const upcoming =
            programEntries
                .filter(
                    entry =>
                        new Date(
                            entry.startsAt
                        ).getTime() > now
                )
                .slice(0, 5);

        elements.programmeEmpty.hidden =
            upcoming.length !== 0;

        for (const entry of upcoming) {
            elements.upcomingActivities.append(
                createUpcomingActivity(entry)
            );
        }
    }

    async function loadProgram() {
        try {
            const data =
                await apiFetch(
                    "/api/program"
                );

            programEntries =
                normalizeProgram(data);

            renderCurrentActivities();
            renderUpcomingActivities();
        } catch (error) {
            console.error(
                "Chargement du programme impossible :",
                error
            );

            programEntries = [];

            renderCurrentActivities();

            elements.upcomingActivities
                ?.replaceChildren();

            if (elements.programmeEmpty) {
                elements.programmeEmpty.hidden =
                    false;

                elements.programmeEmpty
                    .textContent =
                    "Le programme est momentanément indisponible.";
            }
        }
    }

    /*
     * Actualisation
     */

    async function refreshPublicData() {
        await Promise.allSettled([
            loadCreators(),
            loadProgram()
        ]);
    }

    function initialize() {
        updateShopState();
        updateCountdown();

        void refreshPublicData();

        window.setInterval(
            updateCountdown,
            1_000
        );

        window.setInterval(
            updateShopState,
            60_000
        );

        window.setInterval(
            () => {
                void refreshPublicData();
            },
            60_000
        );
    }

    initialize();
})();