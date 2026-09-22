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

        creatorsCount:
            document.querySelector(
                "#creatorsCount"
            ),

        liveCreatorsCount:
            document.querySelector(
                "#liveCreatorsCount"
            ),

        donationCreatorsCount:
            document.querySelector(
                "#donationCreatorsCount"
            ),

        searchInput:
            document.querySelector(
                "#creatorSearchInput"
            ),

        clearSearchButton:
            document.querySelector(
                "#clearSearchButton"
            ),

        filterButtons:
            [
                ...document.querySelectorAll(
                    ".creator-filter-button"
                )
            ],

        allFilterCount:
            document.querySelector(
                "#allFilterCount"
            ),

        liveFilterCount:
            document.querySelector(
                "#liveFilterCount"
            ),

        offlineFilterCount:
            document.querySelector(
                "#offlineFilterCount"
            ),

        sortMenu:
            document.querySelector(
                "#creatorSortMenu"
            ),

        sortLabel:
            document.querySelector(
                "#creatorSortLabel"
            ),

        sortOptions:
            [
                ...document.querySelectorAll(
                    ".creator-sort-option"
                )
            ],

        resultsTitle:
            document.querySelector(
                "#creatorsResultsTitle"
            ),

        resultsDescription:
            document.querySelector(
                "#creatorsResultsDescription"
            ),

        resetButton:
            document.querySelector(
                "#resetCreatorsFilters"
            ),

        loading:
            document.querySelector(
                "#creatorsLoading"
            ),

        error:
            document.querySelector(
                "#creatorsError"
            ),

        errorMessage:
            document.querySelector(
                "#creatorsErrorMessage"
            ),

        retryButton:
            document.querySelector(
                "#retryCreatorsButton"
            ),

        grid:
            document.querySelector(
                "#creatorsGrid"
            ),

        empty:
            document.querySelector(
                "#creatorsEmpty"
            ),

        emptyResetButton:
            document.querySelector(
                "#emptyResetCreatorsButton"
            )
    };

    const SORT_LABELS = {
        default: "En direct d’abord",
        name: "Nom de A à Z",
        viewers: "Plus regardés"
    };

    const FILTER_LABELS = {
        all: "Tous les créateurs",
        live: "Créateurs en direct",
        offline: "Créateurs hors ligne"
    };

    let creators = [];
    let programEntries = [];

    let selectedFilter = "all";
    let selectedSort = "default";
    let searchValue = "";

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
     * Outils
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

    function normalizeText(value) {
        return String(value ?? "")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .trim();
    }

    function formatNumber(value) {
        return new Intl.NumberFormat(
            "fr-FR"
        ).format(
            Number(value ?? 0)
        );
    }

    function creatorName(creator) {
        return (
            creator?.twitchDisplayName ??
            creator?.displayName ??
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

    function creatorIsLive(creator) {
        return Boolean(
            creator?.isLive ||
            creator?.live
        );
    }

    function creatorViewerCount(creator) {
        return Number(
            creator?.live?.viewerCount ??
            creator?.viewerCount ??
            0
        );
    }

    function creatorCanReceiveDonations(
        creator
    ) {
        return Boolean(
            creator?.donationUrl &&
            creator?.donationAvailable !== false
        );
    }

    function creatorDonationUrl(creator) {
        return creator?.donationUrl ?? null;
    }

    function normalizeThumbnail(value) {
        if (!value) {
            return null;
        }

        return String(value)
            .replace("{width}", "640")
            .replace("{height}", "360");
    }

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

    /*
     * Programme et activités en cours
     */

    function validDate(value) {
        const date =
            new Date(value);

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }

    function conditionIsSatisfied(entry) {
        const condition =
            String(
                entry?.goalCondition ??
                entry?.goal_condition ??
                "always"
            ).toLowerCase();

        if (condition === "always") {
            return true;
        }

        if (!entry?.goal) {
            return false;
        }

        const reached =
            Boolean(entry.goal.reached);

        if (condition === "reached") {
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
                entry?.fallbackEnabled ??
                entry?.fallback_enabled
            );

        if (
            !fallbackEnabled ||
            !entry?.fallback
        ) {
            return null;
        }

        return {
            ...entry,

            title:
                entry.fallback.title ||
                "Activité de remplacement",

            descriptionMarkdown:
                entry.fallback
                    .descriptionMarkdown ?? "",

            category:
                entry.fallback.category ??
                entry.category,

            externalUrl:
                entry.fallback.externalUrl ??
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
                        entry?.status ?? ""
                    ).toLowerCase();

                return (
                    status !== "draft" &&
                    status !== "cancelled" &&
                    status !== "canceled"
                );
            })
            .map(resolveProgramEntry)
            .filter(Boolean)
            .filter(
                entry =>
                    validDate(entry.startsAt) &&
                    validDate(entry.endsAt)
            );
    }

    function getEntryCreators(entry) {
        const creatorsList = [];

        if (entry?.primaryCreator) {
            creatorsList.push(
                entry.primaryCreator
            );
        }

        if (
            Array.isArray(
                entry?.participants
            )
        ) {
            creatorsList.push(
                ...entry.participants
            );
        }

        if (entry?.creator) {
            creatorsList.push(
                entry.creator
            );
        }

        return creatorsList;
    }

    function entryBelongsToCreator(
        entry,
        creator
    ) {
        const targetId =
            Number(creator?.id ?? 0);

        const targetSlug =
            normalizeText(
                creatorSlug(creator)
            );

        return getEntryCreators(entry)
            .some(participant => {
                const participantId =
                    Number(
                        participant?.id ??
                        participant?.creatorId ??
                        0
                    );

                const participantSlug =
                    normalizeText(
                        participant?.slug ??
                        participant?.creatorSlug ??
                        participant?.twitchLogin
                    );

                return (
                    (
                        targetId &&
                        participantId === targetId
                    ) ||
                    (
                        targetSlug &&
                        participantSlug === targetSlug
                    )
                );
            });
    }

    function currentActivityForCreator(
        creator
    ) {
        const now =
            Date.now();

        return (
            programEntries.find(entry => {
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
                    now < end &&
                    entryBelongsToCreator(
                        entry,
                        creator
                    )
                );
            }) ??
            null
        );
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
     * Boutique
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
                    link.href =
                        SHOP_REDIRECT_URL;

                    link.classList.remove(
                        "is-disabled"
                    );

                    link.removeAttribute(
                        "aria-disabled"
                    );

                    return;
                }

                link.href = "/#boutique";

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
     * Filtres
     */

    function creatorMatchesSearch(
        creator
    ) {
        if (!searchValue) {
            return true;
        }

        const searchableText =
            normalizeText(
                [
                    creatorName(creator),
                    creatorSlug(creator),
                    creator?.twitchLogin
                ].join(" ")
            );

        return searchableText.includes(
            normalizeText(searchValue)
        );
    }

    function creatorMatchesFilter(
        creator
    ) {
        if (selectedFilter === "live") {
            return creatorIsLive(creator);
        }

        if (
            selectedFilter === "offline"
        ) {
            return !creatorIsLive(creator);
        }

        if (
            selectedFilter === "donation"
        ) {
            return creatorCanReceiveDonations(
                creator
            );
        }

        return true;
    }

    function sortCreators(list) {
        return [...list].sort(
            (first, second) => {
                if (
                    selectedSort === "name"
                ) {
                    return creatorName(first)
                        .localeCompare(
                            creatorName(second),
                            "fr",
                            {
                                sensitivity: "base"
                            }
                        );
                }

                if (
                    selectedSort === "viewers"
                ) {
                    const viewerDifference =
                        creatorViewerCount(second) -
                        creatorViewerCount(first);

                    if (viewerDifference !== 0) {
                        return viewerDifference;
                    }

                    return creatorName(first)
                        .localeCompare(
                            creatorName(second),
                            "fr",
                            {
                                sensitivity: "base"
                            }
                        );
                }

                const firstLive =
                    creatorIsLive(first);

                const secondLive =
                    creatorIsLive(second);

                if (
                    firstLive !== secondLive
                ) {
                    return firstLive ? -1 : 1;
                }

                if (
                    firstLive &&
                    secondLive
                ) {
                    const viewerDifference =
                        creatorViewerCount(second) -
                        creatorViewerCount(first);

                    if (viewerDifference !== 0) {
                        return viewerDifference;
                    }
                }

                const orderDifference =
                    Number(
                        first.displayOrder ?? 100
                    ) -
                    Number(
                        second.displayOrder ?? 100
                    );

                if (orderDifference !== 0) {
                    return orderDifference;
                }

                return creatorName(first)
                    .localeCompare(
                        creatorName(second),
                        "fr",
                        {
                            sensitivity: "base"
                        }
                    );
            }
        );
    }

    function filteredCreators() {
        return sortCreators(
            creators.filter(
                creator =>
                    creatorMatchesSearch(
                        creator
                    ) &&
                    creatorMatchesFilter(
                        creator
                    )
            )
        );
    }

    /*
     * Carte d’un créateur
     */

    function createCreatorCard(creator) {
        const isLive =
            creatorIsLive(creator);

        const canDonate =
            creatorCanReceiveDonations(
                creator
            );

        const currentActivity =
            currentActivityForCreator(
                creator
            );

        const card =
            createElement(
                "article",
                "creator-card"
            );

        if (isLive) {
            card.classList.add(
                "is-live"
            );
        }

        /*
         * Visuel
         */

        const mediaLink =
            createElement(
                "a",
                "creator-card-media"
            );

        mediaLink.href =
            creatorPageUrl(creator);

        mediaLink.setAttribute(
            "aria-label",
            `Voir la page de ${creatorName(creator)
            }`
        );

        const cover =
            createElement(
                "img",
                "creator-card-cover"
            );

        cover.src =
            normalizeThumbnail(
                creator?.live?.thumbnailUrl
            ) ??
            creatorAvatar(creator);

        cover.alt = isLive
            ? (
                `Aperçu du direct de ${creatorName(creator)
                }`
            )
            : (
                `Avatar de ${creatorName(creator)
                }`
            );

        cover.loading = "lazy";

        mediaLink.append(cover);

        if (isLive) {
            mediaLink.append(
                createElement(
                    "span",
                    "creator-card-live-badge",
                    "En direct"
                )
            );

            const viewers =
                creatorViewerCount(creator);

            if (viewers > 0) {
                mediaLink.append(
                    createElement(
                        "span",
                        "creator-card-viewers",
                        (
                            `${formatNumber(viewers)} ` +
                            `spectateur${viewers > 1
                                ? "s"
                                : ""
                            }`
                        )
                    )
                );
            }
        }

        /*
         * Contenu
         */

        const body =
            createElement(
                "div",
                "creator-card-body"
            );

        const identity =
            createElement(
                "div",
                "creator-card-identity"
            );

        const avatarWrapper =
            createElement(
                "div",
                "creator-card-avatar-wrapper"
            );

        const avatar =
            createElement(
                "img",
                "creator-card-avatar"
            );

        avatar.src =
            creatorAvatar(creator);

        avatar.alt =
            `Avatar de ${creatorName(creator)
            }`;

        avatar.loading = "lazy";

        avatarWrapper.append(avatar);

        if (isLive) {
            avatarWrapper.append(
                createElement(
                    "span",
                    "creator-card-live-dot"
                )
            );
        }

        const identityCopy =
            createElement(
                "div",
                "creator-card-identity-copy"
            );

        const nameLink =
            createElement(
                "a",
                "creator-card-name",
                creatorName(creator)
            );

        nameLink.href =
            creatorPageUrl(creator);

        const state =
            createElement(
                "span",
                "creator-card-state",
                isLive
                    ? "Actuellement en direct"
                    : "Participant au JEvent"
            );

        identityCopy.append(
            nameLink,
            state
        );

        identity.append(
            avatarWrapper,
            identityCopy
        );

        body.append(identity);

        /*
         * Titre du live
         */

        if (isLive && creator?.live) {
            const liveInformation =
                createElement(
                    "div",
                    "creator-card-live-information"
                );

            const liveTitle =
                createElement(
                    "p",
                    "creator-card-live-title",
                    (
                        creator.live.title ||
                        "En direct pour le JEvent 26"
                    )
                );

            liveInformation.append(
                liveTitle
            );

            if (creator.live.gameName) {
                liveInformation.append(
                    createElement(
                        "span",
                        "creator-card-game",
                        creator.live.gameName
                    )
                );
            }

            body.append(liveInformation);
        }

        /*
         * Activité en cours
         */

        if (currentActivity) {
            const activity =
                createElement(
                    "div",
                    "creator-card-activity"
                );

            activity.append(
                createElement(
                    "span",
                    "creator-card-activity-label",
                    "En ce moment"
                ),

                createElement(
                    "strong",
                    "creator-card-activity-title",
                    (
                        currentActivity.title ||
                        "Activité du JEvent"
                    )
                )
            );

            body.append(activity);
        }

        /*
         * Actions
         */

        const actions =
            createElement(
                "div",
                "creator-card-actions"
            );

        const profileButton =
            createElement(
                "a",
                "button button-secondary",
                "Voir le créateur"
            );

        profileButton.href =
            creatorPageUrl(creator);

        actions.append(
            profileButton
        );

        if (canDonate) {
            const donationButton =
                createElement(
                    "a",
                    "button button-primary",
                    "Faire un don"
                );

            donationButton.href =
                creatorDonationUrl(creator);

            donationButton.target =
                "_blank";

            donationButton.rel =
                "noopener noreferrer";

            actions.append(
                donationButton
            );
        }

        body.append(actions);

        card.append(
            mediaLink,
            body
        );

        return card;
    }

    /*
     * Affichage
     */

    function updateCounters() {
        const liveCount =
            creators.filter(
                creatorIsLive
            ).length;

        const donationCount =
            creators.filter(
                creatorCanReceiveDonations
            ).length;

        const offlineCount =
            creators.length - liveCount;

        elements.creatorsCount.textContent =
            formatNumber(
                creators.length
            );

        elements.liveCreatorsCount.textContent =
            formatNumber(liveCount);

        elements.donationCreatorsCount
            .textContent =
            formatNumber(donationCount);

        elements.allFilterCount.textContent =
            formatNumber(
                creators.length
            );

        elements.liveFilterCount.textContent =
            formatNumber(liveCount);

        elements.offlineFilterCount
            .textContent =
            formatNumber(offlineCount);
    }

    function updateFilterButtons() {
        for (
            const button of
            elements.filterButtons
        ) {
            const active =
                button.dataset.filter ===
                selectedFilter;

            button.classList.toggle(
                "is-active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                String(active)
            );
        }
    }

    function updateSortOptions() {
        elements.sortLabel.textContent =
            SORT_LABELS[selectedSort] ??
            SORT_LABELS.default;

        for (
            const option of
            elements.sortOptions
        ) {
            option.classList.toggle(
                "is-selected",
                option.dataset.sort ===
                selectedSort
            );
        }
    }

    function updateResultsHeading(
        resultCount
    ) {
        elements.resultsTitle.textContent =
            FILTER_LABELS[selectedFilter] ??
            FILTER_LABELS.all;

        if (searchValue) {
            elements.resultsDescription
                .textContent =
                (
                    `${resultCount} résultat${resultCount > 1 ? "s" : ""
                    } pour « ${searchValue} ».`
                );
        } else {
            elements.resultsDescription
                .textContent =
                (
                    `${resultCount} créateur${resultCount > 1 ? "s" : ""
                    } affiché${resultCount > 1 ? "s" : ""
                    }.`
                );
        }

        const hasFilters =
            selectedFilter !== "all" ||
            selectedSort !== "default" ||
            Boolean(searchValue);

        elements.resetButton.hidden =
            !hasFilters;

        elements.clearSearchButton.hidden =
            !searchValue;
    }

    function renderCreators() {
        const results =
            filteredCreators();

        elements.grid.replaceChildren();

        updateCounters();
        updateFilterButtons();
        updateSortOptions();
        updateResultsHeading(
            results.length
        );

        elements.loading.hidden = true;
        elements.error.hidden = true;

        elements.grid.hidden =
            results.length === 0;

        elements.empty.hidden =
            results.length !== 0;

        for (const creator of results) {
            elements.grid.append(
                createCreatorCard(creator)
            );
        }

        updateUrl();
    }

    function showLoading() {
        elements.loading.hidden = false;
        elements.error.hidden = true;
        elements.grid.hidden = true;
        elements.empty.hidden = true;
    }

    function showError(error) {
        elements.loading.hidden = true;
        elements.grid.hidden = true;
        elements.empty.hidden = true;
        elements.error.hidden = false;

        elements.errorMessage.textContent =
            error?.message ||
            "Une erreur est survenue.";
    }

    /*
     * URL
     */

    function updateUrl() {
        const url =
            new URL(window.location.href);

        if (
            selectedFilter === "all"
        ) {
            url.searchParams.delete(
                "filtre"
            );
        } else {
            url.searchParams.set(
                "filtre",
                selectedFilter
            );
        }

        if (
            selectedSort === "default"
        ) {
            url.searchParams.delete(
                "tri"
            );
        } else {
            url.searchParams.set(
                "tri",
                selectedSort
            );
        }

        if (searchValue) {
            url.searchParams.set(
                "recherche",
                searchValue
            );
        } else {
            url.searchParams.delete(
                "recherche"
            );
        }

        window.history.replaceState(
            {},
            "",
            url
        );
    }

    function loadStateFromUrl() {
        const parameters =
            new URLSearchParams(
                window.location.search
            );

        const requestedFilter =
            parameters.get("filtre");

        const requestedSort =
            parameters.get("tri");

        const requestedSearch =
            parameters.get("recherche");

        if (
            Object.hasOwn(
                FILTER_LABELS,
                requestedFilter
            )
        ) {
            selectedFilter =
                requestedFilter;
        }

        if (
            Object.hasOwn(
                SORT_LABELS,
                requestedSort
            )
        ) {
            selectedSort =
                requestedSort;
        }

        if (requestedSearch) {
            searchValue =
                requestedSearch.trim();

            elements.searchInput.value =
                searchValue;
        }
    }

    /*
     * Réinitialisation
     */

    function resetFilters() {
        selectedFilter = "all";
        selectedSort = "default";
        searchValue = "";

        elements.searchInput.value = "";

        if (elements.sortMenu) {
            elements.sortMenu.open = false;
        }

        renderCreators();
    }

    /*
     * Chargement
     */

    async function loadCreators() {
        showLoading();

        try {
            const [
                creatorsResult,
                programResult
            ] = await Promise.allSettled([
                apiFetch(
                    "/api/creators"
                ),

                apiFetch(
                    "/api/program"
                )
            ]);

            if (
                creatorsResult.status !==
                "fulfilled"
            ) {
                throw creatorsResult.reason;
            }

            creators =
                normalizeCreators(
                    creatorsResult.value
                );

            if (
                programResult.status ===
                "fulfilled"
            ) {
                programEntries =
                    normalizeProgram(
                        programResult.value
                    );
            } else {
                programEntries = [];

                console.warn(
                    "Le programme n’a pas pu être chargé :",
                    programResult.reason
                );
            }

            renderCreators();
        } catch (error) {
            console.error(
                "Impossible de charger les créateurs :",
                error
            );

            showError(error);
        }
    }

    /*
     * Événements
     */

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
            if (
                window.innerWidth > 1100
            ) {
                setNavigationOpen(false);
            }
        }
    );

    elements.searchInput
        ?.addEventListener(
            "input",
            event => {
                searchValue =
                    event.target.value.trim();

                renderCreators();
            }
        );

    elements.clearSearchButton
        ?.addEventListener(
            "click",
            () => {
                searchValue = "";
                elements.searchInput.value = "";

                renderCreators();

                elements.searchInput.focus();
            }
        );

    for (
        const button of
        elements.filterButtons
    ) {
        button.addEventListener(
            "click",
            () => {
                selectedFilter =
                    button.dataset.filter ||
                    "all";

                renderCreators();
            }
        );
    }

    for (
        const option of
        elements.sortOptions
    ) {
        option.addEventListener(
            "click",
            () => {
                selectedSort =
                    option.dataset.sort ||
                    "default";

                if (elements.sortMenu) {
                    elements.sortMenu.open =
                        false;
                }

                renderCreators();
            }
        );
    }

    elements.resetButton
        ?.addEventListener(
            "click",
            resetFilters
        );

    elements.emptyResetButton
        ?.addEventListener(
            "click",
            resetFilters
        );

    elements.retryButton
        ?.addEventListener(
            "click",
            () => {
                void loadCreators();
            }
        );

    document.addEventListener(
        "click",
        event => {
            if (
                elements.sortMenu?.open &&
                !elements.sortMenu.contains(
                    event.target
                )
            ) {
                elements.sortMenu.open =
                    false;
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape" &&
                elements.sortMenu?.open
            ) {
                elements.sortMenu.open =
                    false;
            }
        }
    );

    /*
     * Démarrage
     */

    loadStateFromUrl();
    updateShopState();

    void loadCreators();
})();