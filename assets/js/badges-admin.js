(() => {
    "use strict";

    const API_URL =
        "https://api-beta.jevent.julot.fr";

    const EVENT_KEY =
        "jevent-2026";

    const elements = {
        loading:
            document.querySelector("#loadingState"),

        error:
            document.querySelector("#errorState"),

        errorMessage:
            document.querySelector("#errorMessage"),

        application:
            document.querySelector("#badgesApplication"),

        pageMessage:
            document.querySelector("#pageMessage"),

        refreshButton:
            document.querySelector("#refreshBadgesButton"),

        createButton:
            document.querySelector("#createBadgeButton"),

        emptyCreateButton:
            document.querySelector("#emptyCreateBadgeButton"),

        badgesCount:
            document.querySelector("#badgesCount"),

        activeBadgesCount:
            document.querySelector("#activeBadgesCount"),

        automaticBadgesCount:
            document.querySelector("#automaticBadgesCount"),

        awardedBadgesCount:
            document.querySelector("#awardedBadgesCount"),

        searchInput:
            document.querySelector("#badgeSearchInput"),

        filterButtons:
            [
                ...document.querySelectorAll(
                    ".badge-filter"
                )
            ],

        resultDescription:
            document.querySelector("#badgesResultDescription"),

        list:
            document.querySelector("#badgesList"),

        empty:
            document.querySelector("#badgesEmpty"),

        dialog:
            document.querySelector("#badgeDialog"),

        form:
            document.querySelector("#badgeForm"),

        dialogEyebrow:
            document.querySelector("#badgeDialogEyebrow"),

        dialogTitle:
            document.querySelector("#badgeDialogTitle"),

        closeDialogButton:
            document.querySelector("#closeBadgeDialog"),

        cancelButton:
            document.querySelector("#cancelBadgeButton"),

        deleteButton:
            document.querySelector("#deleteBadgeButton"),

        saveButton:
            document.querySelector("#saveBadgeButton"),

        formMessage:
            document.querySelector("#badgeFormMessage"),

        key:
            document.querySelector("#badgeKey"),

        label:
            document.querySelector("#badgeLabel"),

        description:
            document.querySelector("#badgeDescription"),

        icon:
            document.querySelector("#badgeIcon"),

        displayOrder:
            document.querySelector("#badgeDisplayOrder"),

        acquisitionModes:
            [
                ...document.querySelectorAll(
                    'input[name="acquisitionMode"]'
                )
            ],

        automaticFields:
            document.querySelector("#automaticRequirementFields"),

        advancedFields:
            document.querySelector("#advancedRequirementFields"),

        metric:
            document.querySelector("#badgeMetric"),

        scope:
            document.querySelector("#badgeScope"),

        eventDayField:
            document.querySelector("#badgeEventDayField"),

        eventDay:
            document.querySelector("#badgeEventDay"),

        threshold:
            document.querySelector("#badgeThreshold"),

        advancedKey:
            document.querySelector("#badgeAdvancedKey"),

        requirementsHidden:
            document.querySelector("#badgeRequirementsHidden"),

        active:
            document.querySelector("#badgeActive"),

        previewIcon:
            document.querySelector("#badgePreviewIcon"),

        previewLabel:
            document.querySelector("#badgePreviewLabel"),

        previewDescription:
            document.querySelector("#badgePreviewDescription"),

        previewMode:
            document.querySelector("#badgePreviewMode"),

        assignmentsDialog:
            document.querySelector("#badgeAssignmentsDialog"),

        assignmentsIcon:
            document.querySelector("#badgeAssignmentsIcon"),

        assignmentsTitle:
            document.querySelector("#badgeAssignmentsTitle"),

        assignmentsDescription:
            document.querySelector("#badgeAssignmentsDescription"),

        assignmentsSearch:
            document.querySelector("#badgeAssignmentSearch"),

        assignmentsCount:
            document.querySelector("#badgeAssignmentsCount"),

        assignmentsMessage:
            document.querySelector("#badgeAssignmentsMessage"),

        assignmentsList:
            document.querySelector("#badgeAssignmentsList"),

        assignmentsEmpty:
            document.querySelector("#badgeAssignmentsEmpty"),

        closeAssignmentsButton:
            document.querySelector("#closeBadgeAssignmentsDialog"),

        finishAssignmentsButton:
            document.querySelector("#finishBadgeAssignmentsButton")
    };

    let badges = [];
    let selectedFilter = "all";
    let searchValue = "";
    let saving = false;
    let assignmentBadge = null;
    let assignmentUsers = [];
    let assignmentSearchTimer = null;
    let loadingAssignments = false;

    /*
     * API
     */

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
            error.data = data;

            throw error;
        }

        return data;
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
            element.className = className;
        }

        if (text !== "") {
            element.textContent = text;
        }

        return element;
    }

    function formatNumber(value) {
        return Number(value ?? 0)
            .toLocaleString("fr-FR");
    }

    function normalizeText(value) {
        return String(value ?? "")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .trim();
    }

    function showPageMessage(
        message = "",
        type = ""
    ) {
        if (!elements.pageMessage) {
            return;
        }

        elements.pageMessage.textContent =
            message;

        elements.pageMessage.className =
            "page-message";

        elements.pageMessage.hidden =
            !message;

        if (type) {
            elements.pageMessage.classList.add(
                `is-${type}`
            );
        }
    }

    function showFormMessage(
        message = "",
        type = ""
    ) {
        if (!elements.formMessage) {
            return;
        }

        elements.formMessage.textContent =
            message;

        elements.formMessage.className =
            "badge-form-message";

        elements.formMessage.hidden =
            !message;

        if (type) {
            elements.formMessage.classList.add(
                `is-${type}`
            );
        }
    }

    function showApplication() {
        elements.loading.hidden = true;
        elements.error.hidden = true;
        elements.application.hidden = false;
    }

    function showError(error) {
        elements.loading.hidden = true;
        elements.application.hidden = true;
        elements.error.hidden = false;

        elements.errorMessage.textContent =
            error?.message ||
            "Une erreur est survenue.";
    }

    /*
     * Icônes
     */

    function badgeIconSvg(iconKey) {
        const icons = {
            award: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m12 3 2.5 5.2 5.7.8-4.1 4
               1 5.7-5.1-2.7-5.1 2.7
               1-5.7-4.1-4 5.7-.8L12 3Z"
          ></path>
        </svg>
      `,

            messages: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16v12H8l-4 4V5Z"></path>
        </svg>
      `,

            chat: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 4h14a2 2 0 0 1 2 2v9
               a2 2 0 0 1-2 2h-7l-5 4v-4H5
               a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          ></path>
        </svg>
      `,

            emote: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path
            d="M8.5 10h.01M15.5 10h.01
               M8 14c1.1 1.3 2.4 2 4 2
               s2.9-.7 4-2"
          ></path>
        </svg>
      `,

            calendar: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 4v3M19 4v3M4 9h16
               M5 6h14a1 1 0 0 1 1 1v12
               a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1
               V7a1 1 0 0 1 1-1Z"
          ></path>
        </svg>
      `,

            explorer: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"></path>
        </svg>
      `,

            heart: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s-7-4.6-7-11a4 4 0 0 1
               7-2.6A4 4 0 0 1 19 10c0 6.4-7 11-7 11Z"
          ></path>
        </svg>
      `,

            creator: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h14v10H5V5Zm4 14h6M12 15v4"></path>
        </svg>
      `,

            moderator: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3 20 7v5c0 5-3.4 8-8 9
               -4.6-1-8-4-8-9V7l8-4Z"
          ></path>
          <path d="m9 12 2 2 4-5"></path>
        </svg>
      `
        };

        return icons[iconKey] ??
            icons.award;
    }

    /*
     * Libellés
     */

    function acquisitionModeLabel(mode) {
        const labels = {
            automatic: "Automatique",
            manual: "Manuel",
            advanced: "Avancé"
        };

        return labels[mode] ?? "Automatique";
    }

    function metricLabel(metric) {
        const labels = {
            messages: "messages",
            emotes: "emotes",
            channels: "chaînes visitées",
            event_days: "jours de participation",
        };

        return labels[metric] ??
            "actions";
    }

    function scopeLabel(requirement) {
        const scope =
            requirement?.scope;

        if (scope === "all_time") {
            return "toutes éditions";
        }

        if (scope === "event_day") {
            return (
                `jour ${Number(
                    requirement.eventDay ?? 1
                )}`
            );
        }

        return "JEvent 26";
    }

    function requirementLabel(badge) {
        const mode =
            badge.acquisitionMode;

        if (mode === "manual") {
            return "Attribution manuelle";
        }

        if (mode === "advanced") {
            return (
                "Règle avancée : " +
                (
                    badge.requirement
                        ?.advancedKey ||
                    "non configurée"
                )
            );
        }

        const requirement =
            badge.requirement ?? {};

        return (
            `${formatNumber(
                requirement.threshold ??
                badge.threshold
            )} ` +
            `${metricLabel(
                requirement.metric
            )} — ` +
            scopeLabel(requirement)
        );
    }

    /*
     * Statistiques
     */

    function renderStatistics() {
        const activeCount =
            badges.filter(
                badge => badge.active
            ).length;

        const automaticCount =
            badges.filter(
                badge =>
                    badge.acquisitionMode ===
                    "automatic"
            ).length;

        const awardedCount =
            badges.reduce(
                (total, badge) =>
                    total +
                    Number(
                        badge.awardedCount ?? 0
                    ),
                0
            );

        elements.badgesCount.textContent =
            formatNumber(badges.length);

        elements.activeBadgesCount.textContent =
            formatNumber(activeCount);

        elements.automaticBadgesCount.textContent =
            formatNumber(automaticCount);

        elements.awardedBadgesCount.textContent =
            formatNumber(awardedCount);
    }

    /*
     * Filtres
     */

    function badgeMatchesFilter(badge) {
        if (
            selectedFilter === "active"
        ) {
            return badge.active;
        }

        if (
            selectedFilter === "inactive"
        ) {
            return !badge.active;
        }

        if (
            [
                "automatic",
                "manual",
                "advanced"
            ].includes(selectedFilter)
        ) {
            return (
                badge.acquisitionMode ===
                selectedFilter
            );
        }

        return true;
    }

    function badgeMatchesSearch(badge) {
        if (!searchValue) {
            return true;
        }

        const text = normalizeText(
            [
                badge.label,
                badge.description,
                badge.key,
                requirementLabel(badge)
            ].join(" ")
        );

        return text.includes(
            normalizeText(searchValue)
        );
    }

    function filteredBadges() {
        return badges.filter(
            badge =>
                badgeMatchesFilter(badge) &&
                badgeMatchesSearch(badge)
        );
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

    /*
     * Carte d’un badge
     */

    function createBadgeCard(badge) {
        const card =
            createElement(
                "article",
                "badge-admin-card"
            );

        if (!badge.active) {
            card.classList.add(
                "is-inactive"
            );
        }

        const icon =
            createElement(
                "span",
                "badge-admin-icon"
            );

        icon.innerHTML =
            badgeIconSvg(
                badge.iconKey
            );

        const content =
            createElement(
                "div",
                "badge-admin-content"
            );

        const heading =
            createElement(
                "div",
                "badge-admin-heading"
            );

        heading.append(
            createElement(
                "h3",
                "",
                badge.label
            )
        );

        heading.append(
            createElement(
                "span",
                (
                    "badge-status " +
                    (
                        badge.active
                            ? "is-active"
                            : "is-inactive"
                    )
                ),
                badge.active
                    ? "Actif"
                    : "Désactivé"
            )
        );

        const description =
            createElement(
                "p",
                "badge-admin-description",
                badge.description
            );

        const metadata =
            createElement(
                "div",
                "badge-admin-metadata"
            );

        metadata.append(
            createElement(
                "span",
                "",
                acquisitionModeLabel(
                    badge.acquisitionMode
                )
            ),

            createElement(
                "span",
                "",
                requirementLabel(badge)
            ),

            createElement(
                "span",
                "",
                `${formatNumber(
                    badge.awardedCount
                )} attribution${Number(
                    badge.awardedCount
                ) > 1
                    ? "s"
                    : ""
                }`
            )
        );

        if (badge.requirementsHidden) {
            metadata.append(
                createElement(
                    "span",
                    "is-hidden-requirement",
                    "Méthode masquée"
                )
            );
        }

        const key =
            createElement(
                "code",
                "badge-admin-key",
                badge.key
            );

        content.append(
            heading,
            description,
            metadata,
            key
        );

        const actions =
            createElement(
                "div",
                "badge-admin-actions"
            );

        const toggleButton =
            createElement(
                "button",
                "button button-secondary",
                badge.active
                    ? "Désactiver"
                    : "Activer"
            );

        toggleButton.type = "button";

        toggleButton.addEventListener(
            "click",
            () => {
                void toggleBadgeActive(
                    badge,
                    toggleButton
                );
            }
        );

        const editButton =
            createElement(
                "button",
                "button button-primary",
                "Modifier"
            );

        editButton.type = "button";

        editButton.addEventListener(
            "click",
            () => {
                openBadgeDialog(badge);
            }
        );

        if (
            badge.acquisitionMode ===
            "manual"
        ) {
            const assignmentsButton =
                createElement(
                    "button",
                    "button button-secondary",
                    "Attributions"
                );

            assignmentsButton.type =
                "button";

            assignmentsButton.addEventListener(
                "click",
                () => {
                    void openAssignmentsDialog(
                        badge
                    );
                }
            );

            actions.append(
                assignmentsButton
            );
        }

        actions.append(
            toggleButton,
            editButton
        );

        card.append(
            icon,
            content,
            actions
        );

        return card;
    }

    function renderBadges() {
        const results =
            filteredBadges();

        elements.list.replaceChildren();

        for (const badge of results) {
            elements.list.append(
                createBadgeCard(badge)
            );
        }

        elements.empty.hidden =
            results.length !== 0;

        elements.resultDescription
            .textContent =
            (
                `${formatNumber(
                    results.length
                )} badge${results.length > 1
                    ? "s"
                    : ""
                } affiché${results.length > 1
                    ? "s"
                    : ""
                }.`
            );

        updateFilterButtons();
        renderStatistics();
    }

    /*
     * Formulaire
     */

    function selectedAcquisitionMode() {
        return (
            elements.acquisitionModes
                .find(input =>
                    input.checked
                )
                ?.value ??
            "automatic"
        );
    }

    function setAcquisitionMode(mode) {
        for (
            const input of
            elements.acquisitionModes
        ) {
            input.checked =
                input.value === mode;
        }
    }

    function updateConditionalFields() {
        const mode =
            selectedAcquisitionMode();

        elements.automaticFields.hidden =
            mode !== "automatic";

        elements.advancedFields.hidden =
            mode !== "advanced";

        elements.eventDayField.hidden =
            (
                mode !== "automatic" ||
                elements.scope.value !==
                "event_day"
            );

        updatePreview();
    }

    function updatePreview() {
        const label =
            elements.label.value.trim() ||
            "Nouveau badge";

        const description =
            elements.description.value.trim() ||
            "Description du badge.";

        const mode =
            selectedAcquisitionMode();

        elements.previewIcon.innerHTML =
            badgeIconSvg(
                elements.icon.value
            );

        elements.previewLabel.textContent =
            label;

        elements.previewDescription
            .textContent =
            description;

        elements.previewMode.textContent =
            acquisitionModeLabel(mode);
    }

    function resetBadgeForm() {
        elements.form.reset();

        elements.key.value = "";
        elements.displayOrder.value = "100";
        elements.icon.value = "award";
        elements.metric.value = "messages";
        elements.scope.value = "event";
        elements.eventDay.value = "1";
        elements.threshold.value = "100";
        elements.advancedKey.value = "";
        elements.active.checked = true;
        elements.requirementsHidden.checked =
            false;

        setAcquisitionMode(
            "automatic"
        );

        elements.deleteButton.hidden =
            true;

        showFormMessage();
        updateConditionalFields();
        updatePreview();
    }

    function fillBadgeForm(badge) {
        elements.key.value =
            badge.key;

        elements.label.value =
            badge.label ?? "";

        elements.description.value =
            badge.description ?? "";

        elements.icon.value =
            badge.iconKey || "award";

        elements.displayOrder.value =
            String(
                badge.displayOrder ?? 100
            );

        elements.active.checked =
            Boolean(badge.active);

        elements.requirementsHidden.checked =
            Boolean(
                badge.requirementsHidden
            );

        const mode =
            badge.acquisitionMode ||
            "automatic";

        setAcquisitionMode(mode);

        const requirement =
            badge.requirement ?? {};

        elements.metric.value =
            requirement.metric ||
            "messages";

        elements.scope.value =
            requirement.scope ||
            "event";

        elements.eventDay.value =
            String(
                requirement.eventDay ?? 1
            );

        elements.threshold.value =
            String(
                requirement.threshold ??
                badge.threshold ??
                100
            );

        elements.advancedKey.value =
            requirement.advancedKey ||
            "";

        elements.deleteButton.hidden =
            false;

        showFormMessage();
        updateConditionalFields();
        updatePreview();
    }

    function openBadgeDialog(
        badge = null
    ) {
        resetBadgeForm();

        if (badge) {
            fillBadgeForm(badge);

            elements.dialogEyebrow
                .textContent =
                "Modification";

            elements.dialogTitle
                .textContent =
                "Modifier le badge";
        } else {
            elements.dialogEyebrow
                .textContent =
                "Nouveau badge";

            elements.dialogTitle
                .textContent =
                "Créer un badge";
        }

        elements.dialog.showModal();

        window.setTimeout(
            () => {
                elements.label.focus();
            },
            50
        );
    }

    function closeBadgeDialog() {
        if (saving) {
            return;
        }

        elements.dialog.close();
    }

    function buildPayload() {
        const mode =
            selectedAcquisitionMode();

        const payload = {
            label:
                elements.label.value.trim(),

            description:
                elements.description
                    .value.trim(),

            iconKey:
                elements.icon.value,

            eventKey:
                EVENT_KEY,

            acquisitionMode:
                mode,

            requirementsHidden:
                elements
                    .requirementsHidden
                    .checked,

            active:
                elements.active.checked,

            displayOrder:
                Number(
                    elements.displayOrder.value ||
                    100
                )
        };

        if (mode === "automatic") {
            const scope =
                elements.scope.value;

            payload.requirement = {
                metric:
                    elements.metric.value,

                scope,

                eventKey:
                    scope === "all_time"
                        ? null
                        : EVENT_KEY,

                eventDay:
                    scope === "event_day"
                        ? Number(
                            elements.eventDay
                                .value
                        )
                        : null,

                threshold:
                    Number(
                        elements.threshold.value
                    )
            };
        }

        if (mode === "advanced") {
            payload.requirement = {
                metric: "advanced",

                advancedKey:
                    elements.advancedKey
                        .value.trim(),

                parameters: {}
            };
        }

        return payload;
    }

    /*
     * Enregistrement
     */

    async function saveBadge(event) {
        event.preventDefault();

        if (saving) {
            return;
        }

        const payload =
            buildPayload();

        if (!payload.label) {
            showFormMessage(
                "Le nom du badge est obligatoire.",
                "error"
            );

            elements.label.focus();
            return;
        }

        if (!payload.description) {
            showFormMessage(
                "La description est obligatoire.",
                "error"
            );

            elements.description.focus();
            return;
        }

        if (
            payload.acquisitionMode ===
            "automatic" &&
            (
                !Number.isFinite(
                    payload.requirement.threshold
                ) ||
                payload.requirement.threshold <
                1
            )
        ) {
            showFormMessage(
                "Le nombre requis doit être supérieur à zéro.",
                "error"
            );

            elements.threshold.focus();
            return;
        }

        if (
            payload.acquisitionMode ===
            "advanced" &&
            !payload.requirement.advancedKey
        ) {
            showFormMessage(
                "La clé avancée est obligatoire.",
                "error"
            );

            elements.advancedKey.focus();
            return;
        }

        saving = true;

        elements.saveButton.disabled =
            true;

        elements.deleteButton.disabled =
            true;

        showFormMessage(
            "Enregistrement…"
        );

        try {
            const badgeKey =
                elements.key.value.trim();

            const path =
                badgeKey
                    ? (
                        "/api/admin/badges/" +
                        encodeURIComponent(
                            badgeKey
                        )
                    )
                    : "/api/admin/badges";

            const result =
                await apiFetch(
                    path,
                    {
                        method:
                            badgeKey
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify(payload)
                    }
                );

            if (badgeKey) {
                const index =
                    badges.findIndex(
                        badge =>
                            badge.key ===
                            badgeKey
                    );

                if (index !== -1) {
                    badges[index] =
                        result.badge;
                }
            } else {
                badges.push(
                    result.badge
                );
            }

            badges.sort(
                (first, second) =>
                    Number(
                        first.displayOrder ?? 100
                    ) -
                    Number(
                        second.displayOrder ?? 100
                    ) ||
                    String(first.label)
                        .localeCompare(
                            String(second.label),
                            "fr"
                        )
            );

            renderBadges();

            elements.dialog.close();

            showPageMessage(
                badgeKey
                    ? "Badge modifié."
                    : "Badge créé.",
                "success"
            );
        } catch (error) {
            showFormMessage(
                error.message,
                "error"
            );
        } finally {
            saving = false;

            elements.saveButton.disabled =
                false;

            elements.deleteButton.disabled =
                false;
        }
    }

    /*
     * Activation rapide
     */

    async function toggleBadgeActive(
        badge,
        button
    ) {
        const nextActive =
            !badge.active;

        button.disabled = true;

        try {
            await apiFetch(
                (
                    "/api/admin/badges/" +
                    encodeURIComponent(
                        badge.key
                    ) +
                    "/active"
                ),
                {
                    method: "PUT",

                    body: JSON.stringify({
                        active: nextActive
                    })
                }
            );

            badge.active = nextActive;

            renderBadges();

            showPageMessage(
                nextActive
                    ? "Badge activé."
                    : "Badge désactivé.",
                "success"
            );
        } catch (error) {
            button.disabled = false;

            showPageMessage(
                error.message,
                "error"
            );
        }
    }

    /*
     * Suppression
     */

    async function deleteCurrentBadge() {
        const badgeKey =
            elements.key.value.trim();

        if (!badgeKey || saving) {
            return;
        }

        const badge =
            badges.find(
                item =>
                    item.key === badgeKey
            );

        const confirmed =
            window.confirm(
                (
                    "Supprimer définitivement le badge " +
                    `« ${badge?.label || badgeKey} » ?`
                )
            );

        if (!confirmed) {
            return;
        }

        saving = true;

        elements.deleteButton.disabled =
            true;

        elements.saveButton.disabled =
            true;

        try {
            await apiFetch(
                (
                    "/api/admin/badges/" +
                    encodeURIComponent(
                        badgeKey
                    )
                ),
                {
                    method: "DELETE"
                }
            );

            badges =
                badges.filter(
                    item =>
                        item.key !== badgeKey
                );

            renderBadges();

            elements.dialog.close();

            showPageMessage(
                "Badge supprimé.",
                "success"
            );
        } catch (error) {
            showFormMessage(
                error.message,
                "error"
            );
        } finally {
            saving = false;

            elements.deleteButton.disabled =
                false;

            elements.saveButton.disabled =
                false;
        }
    }

    /*
 * Attributions manuelles
 */

    function formatAssignmentDate(value) {
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
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(date);
    }

    function showAssignmentsMessage(
        message = "",
        type = ""
    ) {
        if (!elements.assignmentsMessage) {
            return;
        }

        elements.assignmentsMessage
            .textContent =
            message;

        elements.assignmentsMessage
            .className =
            "badge-assignments-message";

        elements.assignmentsMessage.hidden =
            !message;

        if (type) {
            elements.assignmentsMessage
                .classList.add(
                    `is-${type}`
                );
        }
    }

    function assignmentUserName(user) {
        return (
            user.twitchDisplayName ||
            user.twitchLogin ||
            `Compte ${user.id}`
        );
    }

    function createAssignmentUserRow(user) {
        const row =
            createElement(
                "article",
                "badge-assignment-user"
            );

        if (user.assigned) {
            row.classList.add(
                "is-assigned"
            );
        }

        if (!user.active) {
            row.classList.add(
                "is-disabled"
            );
        }

        const avatar =
            createElement(
                "img",
                "badge-assignment-avatar"
            );

        avatar.src =
            user.twitchProfileImageUrl ||
            "/assets/jevent_logo.png";

        avatar.alt =
            `Avatar de ${assignmentUserName(user)
            }`;

        avatar.loading = "lazy";

        const content =
            createElement(
                "div",
                "badge-assignment-content"
            );

        const heading =
            createElement(
                "div",
                "badge-assignment-heading"
            );

        heading.append(
            createElement(
                "strong",
                "",
                assignmentUserName(user)
            )
        );

        if (user.assigned) {
            heading.append(
                createElement(
                    "span",
                    "badge-assignment-status",
                    "Badge attribué"
                )
            );
        }

        const login =
            createElement(
                "span",
                "badge-assignment-login",
                user.twitchLogin
                    ? `@${user.twitchLogin}`
                    : `Compte n°${user.id}`
            );

        content.append(
            heading,
            login
        );

        if (user.assigned) {
            const metadata =
                createElement(
                    "span",
                    "badge-assignment-metadata"
                );

            const awardedAt =
                formatAssignmentDate(
                    user.awardedAt
                );

            const awardedBy =
                user.awardedBy
                    ?.twitchDisplayName ||
                user.awardedBy
                    ?.twitchLogin;

            if (awardedAt && awardedBy) {
                metadata.textContent =
                    `Attribué le ${awardedAt} par ${awardedBy}.`;
            } else if (awardedAt) {
                metadata.textContent =
                    `Attribué le ${awardedAt}.`;
            } else {
                metadata.textContent =
                    "Badge attribué manuellement.";
            }

            content.append(metadata);
        }

        const action =
            createElement(
                "button",
                (
                    user.assigned
                        ? "button button-danger"
                        : "button button-primary"
                ),
                user.assigned
                    ? "Retirer"
                    : "Attribuer"
            );

        action.type = "button";

        action.addEventListener(
            "click",
            () => {
                void updateBadgeAssignment(
                    user,
                    action
                );
            }
        );

        row.append(
            avatar,
            content,
            action
        );

        return row;
    }

    function renderAssignmentUsers() {
        if (!elements.assignmentsList) {
            return;
        }

        elements.assignmentsList
            .replaceChildren();

        for (
            const user of assignmentUsers
        ) {
            elements.assignmentsList.append(
                createAssignmentUserRow(user)
            );
        }

        elements.assignmentsEmpty.hidden =
            assignmentUsers.length !== 0;

        const assignedCount =
            assignmentUsers.filter(
                user => user.assigned
            ).length;

        elements.assignmentsCount.textContent =
            (
                `${formatNumber(
                    assignedCount
                )} attribution${assignedCount > 1
                    ? "s"
                    : ""
                }`
            );
    }

    async function loadBadgeAssignments(
        search = ""
    ) {
        if (
            !assignmentBadge ||
            loadingAssignments
        ) {
            return;
        }

        loadingAssignments = true;

        elements.assignmentsEmpty.hidden =
            true;

        elements.assignmentsList
            .replaceChildren(
                createElement(
                    "p",
                    "badge-assignments-loading",
                    "Chargement des comptes…"
                )
            );

        showAssignmentsMessage();

        try {
            const parameters =
                new URLSearchParams();

            if (search.trim()) {
                parameters.set(
                    "search",
                    search.trim()
                );
            }

            const query =
                parameters.toString();

            const data =
                await apiFetch(
                    (
                        "/api/admin/badges/" +
                        encodeURIComponent(
                            assignmentBadge.key
                        ) +
                        "/assignments" +
                        (query ? `?${query}` : "")
                    )
                );

            assignmentUsers =
                Array.isArray(data.users)
                    ? data.users
                    : [];

            renderAssignmentUsers();
        } catch (error) {
            assignmentUsers = [];

            elements.assignmentsList
                .replaceChildren();

            elements.assignmentsEmpty.hidden =
                false;

            showAssignmentsMessage(
                error.message,
                "error"
            );
        } finally {
            loadingAssignments = false;
        }
    }

    async function updateBadgeAssignment(
        user,
        button
    ) {
        if (!assignmentBadge) {
            return;
        }

        const enabled =
            !user.assigned;

        const previousText =
            button.textContent;

        button.disabled = true;

        button.textContent =
            enabled
                ? "Attribution…"
                : "Retrait…";

        try {
            const result =
                await apiFetch(
                    (
                        "/api/admin/badges/" +
                        encodeURIComponent(
                            assignmentBadge.key
                        ) +
                        "/assignments/" +
                        encodeURIComponent(
                            user.id
                        )
                    ),
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            enabled
                        })
                    }
                );

            user.assigned =
                Boolean(result.assigned);

            user.awardedAt =
                result.awardedAt ??
                (
                    user.assigned
                        ? new Date().toISOString()
                        : null
                );

            user.awardedBy =
                user.assigned
                    ? null
                    : null;

            const previousAwardedCount =
                Number(
                    assignmentBadge
                        .awardedCount ?? 0
                );

            assignmentBadge.awardedCount =
                Math.max(
                    0,
                    previousAwardedCount +
                    (
                        user.assigned
                            ? 1
                            : -1
                    )
                );

            renderAssignmentUsers();
            renderBadges();

            showAssignmentsMessage(
                user.assigned
                    ? (
                        `Badge attribué à ${assignmentUserName(user)
                        }.`
                    )
                    : (
                        `Badge retiré de ${assignmentUserName(user)
                        }.`
                    ),
                "success"
            );
        } catch (error) {
            button.disabled = false;
            button.textContent =
                previousText;

            showAssignmentsMessage(
                error.message,
                "error"
            );
        }
    }

    async function openAssignmentsDialog(
        badge
    ) {
        if (
            !elements.assignmentsDialog
        ) {
            return;
        }

        assignmentBadge = badge;
        assignmentUsers = [];

        elements.assignmentsSearch.value =
            "";

        elements.assignmentsTitle.textContent =
            badge.label ||
            "Gérer les attributions";

        elements.assignmentsDescription
            .textContent =
            badge.description ||
            "Badge attribué manuellement.";

        elements.assignmentsIcon.innerHTML =
            badgeIconSvg(
                badge.iconKey
            );

        elements.assignmentsCount.textContent =
            "Chargement…";

        showAssignmentsMessage();

        elements.assignmentsDialog
            .showModal();

        await loadBadgeAssignments();

        elements.assignmentsSearch.focus();
    }

    function closeAssignmentsDialog() {
        if (
            !elements.assignmentsDialog
                ?.open
        ) {
            return;
        }

        elements.assignmentsDialog.close();

        assignmentBadge = null;
        assignmentUsers = [];

        window.clearTimeout(
            assignmentSearchTimer
        );
    }

    /*
     * Chargement
     */

    async function loadBadges({
        silent = false
    } = {}) {
        if (!silent) {
            elements.loading.hidden =
                false;

            elements.error.hidden =
                true;

            elements.application.hidden =
                true;
        }

        try {
            const data =
                await apiFetch(
                    "/api/admin/badges"
                );

            badges =
                Array.isArray(data.badges)
                    ? data.badges
                    : [];

            renderBadges();
            showApplication();

            if (silent) {
                showPageMessage(
                    "Badges actualisés.",
                    "success"
                );
            }
        } catch (error) {
            console.error(
                "Impossible de charger les badges :",
                error
            );

            if (silent) {
                showPageMessage(
                    error.message,
                    "error"
                );
            } else {
                showError(error);
            }
        }
    }

    /*
     * Événements
     */

    elements.createButton
        ?.addEventListener(
            "click",
            () => {
                openBadgeDialog();
            }
        );

    elements.emptyCreateButton
        ?.addEventListener(
            "click",
            () => {
                openBadgeDialog();
            }
        );

    elements.refreshButton
        ?.addEventListener(
            "click",
            () => {
                void loadBadges({
                    silent: true
                });
            }
        );

    elements.searchInput
        ?.addEventListener(
            "input",
            event => {
                searchValue =
                    event.target.value.trim();

                renderBadges();
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

                renderBadges();
            }
        );
    }

    elements.form
        ?.addEventListener(
            "submit",
            saveBadge
        );

    elements.closeDialogButton
        ?.addEventListener(
            "click",
            closeBadgeDialog
        );

    elements.cancelButton
        ?.addEventListener(
            "click",
            closeBadgeDialog
        );

    elements.deleteButton
        ?.addEventListener(
            "click",
            () => {
                void deleteCurrentBadge();
            }
        );

    elements.dialog
        ?.addEventListener(
            "cancel",
            event => {
                event.preventDefault();
                closeBadgeDialog();
            }
        );

    elements.dialog
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    elements.dialog
                ) {
                    closeBadgeDialog();
                }
            }
        );

    for (
        const input of
        elements.acquisitionModes
    ) {
        input.addEventListener(
            "change",
            updateConditionalFields
        );
    }

    elements.scope
        ?.addEventListener(
            "change",
            updateConditionalFields
        );

    [
        elements.label,
        elements.description,
        elements.icon
    ].forEach(element => {
        element?.addEventListener(
            "input",
            updatePreview
        );

        element?.addEventListener(
            "change",
            updatePreview
        );
    });

    elements.assignmentsSearch
        ?.addEventListener(
            "input",
            event => {
                window.clearTimeout(
                    assignmentSearchTimer
                );

                const search =
                    event.target.value;

                assignmentSearchTimer =
                    window.setTimeout(
                        () => {
                            void loadBadgeAssignments(
                                search
                            );
                        },
                        350
                    );
            }
        );

    elements.closeAssignmentsButton
        ?.addEventListener(
            "click",
            closeAssignmentsDialog
        );

    elements.finishAssignmentsButton
        ?.addEventListener(
            "click",
            closeAssignmentsDialog
        );

    elements.assignmentsDialog
        ?.addEventListener(
            "cancel",
            event => {
                event.preventDefault();

                closeAssignmentsDialog();
            }
        );

    elements.assignmentsDialog
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    elements.assignmentsDialog
                ) {
                    closeAssignmentsDialog();
                }
            }
        );

    /*
     * Démarrage
     */

    void loadBadges();
})();