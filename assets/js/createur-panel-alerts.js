(() => {
    "use strict";

    const $ = selector =>
        document.querySelector(selector);

    const elements = {
        createButton:
            $("#createDonationAlertButton"),

        rulesList:
            $("#donationAlertsList"),

        rulesEmpty:
            $("#donationAlertsEmpty"),

        ruleDialog:
            $("#donationAlertDialog"),

        ruleForm:
            $("#donationAlertForm"),

        rulePublicId:
            $("#donationAlertPublicId"),

        ruleDialogTitle:
            $("#donationAlertDialogTitle"),

        closeRuleDialogButton:
            $("#closeDonationAlertDialogButton"),

        cancelRuleButton:
            $("#cancelDonationAlertButton"),

        deleteRuleButton:
            $("#deleteDonationAlertButton"),

        saveRuleButton:
            $("#saveDonationAlertButton"),

        ruleMessage:
            $("#donationAlertFormMessage"),

        ruleName:
            $("#donationAlertName"),

        ruleCondition:
            $("#donationAlertCondition"),

        minimumWrapper:
            $("#donationAlertMinimumWrapper"),

        minimumLabel:
            $("#donationAlertMinimumLabel"),

        minimum:
            $("#donationAlertMinimum"),

        maximumWrapper:
            $("#donationAlertMaximumWrapper"),

        maximum:
            $("#donationAlertMaximum"),

        selectionMode:
            $("#donationAlertSelectionMode"),

        delay:
            $("#donationAlertDelay"),

        duration:
            $("#donationAlertDuration"),

        volume:
            $("#donationAlertVolume"),

        volumeValue:
            $("#donationAlertVolumeValue"),

        priority:
            $("#donationAlertPriority"),

        enabled:
            $("#donationAlertEnabled"),

        variantsSection:
            $("#donationAlertVariantsSection"),

        variantsList:
            $("#donationAlertVariantsList"),

        variantsEmpty:
            $("#donationAlertVariantsEmpty"),

        createVariantButton:
            $("#createDonationAlertVariantButton")
    };

    const state = {
        creatorId: 0,
        rules: [],
        editorSettings: null,
        activeRulePublicId: null,
        loading: false
    };

    function dashboard() {
        return window
            .JEventCreatorDashboard;
    }

    function apiFetch(
        pathname,
        options = {}
    ) {
        const bridge = dashboard();

        if (!bridge?.apiFetch) {
            throw new Error(
                "Le tableau créateur n’est pas encore prêt."
            );
        }

        return bridge.apiFetch(
            pathname,
            options
        );
    }

    function currentCreatorId() {
        return Number(
            dashboard()
                ?.currentCreatorId?.() ||
            state.creatorId ||
            0
        );
    }

    function formatMoney(
        cents,
        currency = "EUR"
    ) {
        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency,
                maximumFractionDigits: 2
            }
        ).format(
            Number(cents || 0) / 100
        );
    }

    function eurosToCents(value) {
        const normalized =
            String(value ?? "")
                .trim()
                .replace(/\s/g, "")
                .replace(",", ".");

        if (!normalized) {
            return null;
        }

        const amount =
            Number.parseFloat(normalized);

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return null;
        }

        return Math.round(
            amount * 100
        );
    }

    function normalizeConditionType(value) {
        const normalized =
            String(value || "")
                .trim()
                .toLowerCase();

        const aliases = {
            all: "default",
            any: "default",
            always: "default",
            any_amount: "default",
            default: "default",

            minimum: "minimum",
            at_least: "minimum",
            minimum_amount: "minimum",

            exact: "exact",
            exact_amount: "exact",
            amount_exact: "exact",

            range: "range",
            between: "range",
            amount_range: "range"
        };

        return aliases[normalized] || normalized || "default";
    }

    function centsToEuros(value) {
        const cents =
            Number(value || 0);

        return (
            cents / 100
        ).toFixed(2);
    }

    function setMessage(
        message = "",
        type = ""
    ) {
        if (!elements.ruleMessage) {
            return;
        }

        elements.ruleMessage
            .textContent = message;

        elements.ruleMessage.className =
            "dashboard-message";

        if (type) {
            elements.ruleMessage
                .classList.add(
                    `is-${type}`
                );
        }

        elements.ruleMessage.hidden =
            !message;
    }

    function createElement(
        tagName,
        className = "",
        textContent = ""
    ) {
        const element =
            document.createElement(
                tagName
            );

        if (className) {
            element.className =
                className;
        }

        if (textContent) {
            element.textContent =
                textContent;
        }

        return element;
    }

    function getRuleByPublicId(
        publicId
    ) {
        return state.rules.find(
            rule =>
                rule.publicId ===
                publicId
        ) || null;
    }

    function getActiveRule() {
        return getRuleByPublicId(
            state.activeRulePublicId
        );
    }

    function getVariants(rule) {
        return Array.isArray(
            rule?.variants
        )
            ? rule.variants
            : [];
    }

    function conditionLabel(rule) {
        const type =
            rule.conditionType ||
            rule.condition ||
            "all";

        const minimum =
            Number(
                rule.minimumCents ??
                rule.minimumAmountCents ??
                0
            );

        const maximum =
            Number(
                rule.maximumCents ??
                rule.maximumAmountCents ??
                0
            );

        if (type === "exact") {
            return (
                "Don égal à " +
                formatMoney(minimum)
            );
        }

        if (type === "minimum") {
            return (
                "À partir de " +
                formatMoney(minimum)
            );
        }

        if (type === "range") {
            return (
                "Entre " +
                formatMoney(minimum) +
                " et " +
                formatMoney(maximum)
            );
        }

        return "Tous les dons";
    }

    function updateConditionFields() {
        const condition =
            normalizeConditionType(
                elements.ruleCondition
                    ?.value
            );

        const usesMinimum =
            condition === "minimum" ||
            condition === "exact" ||
            condition === "range";

        const usesMaximum =
            condition === "range";

        if (elements.minimumWrapper) {
            elements.minimumWrapper.hidden =
                !usesMinimum;
        }

        if (elements.maximumWrapper) {
            elements.maximumWrapper.hidden =
                !usesMaximum;
        }

        if (elements.minimum) {
            elements.minimum.required =
                usesMinimum;
        }

        if (elements.maximum) {
            elements.maximum.required =
                usesMaximum;
        }

        if (elements.minimumLabel) {
            elements.minimumLabel.textContent =
                condition === "exact"
                    ? "Montant exact"
                    : "Montant minimum";
        }
    }

    function updateVolumeValue() {
        if (
            !elements.volume ||
            !elements.volumeValue
        ) {
            return;
        }

        elements.volumeValue.textContent =
            `${elements.volume.value}%`;
    }

    function renderRules() {
        if (!elements.rulesList) {
            return;
        }

        elements.rulesList
            .replaceChildren();

        if (elements.rulesEmpty) {
            elements.rulesEmpty.hidden =
                state.rules.length > 0;
        }

        for (
            const rule of
            state.rules
        ) {
            const card =
                createElement(
                    "article",
                    "donation-alert-rule-card"
                );

            if (!rule.enabled) {
                card.classList.add(
                    "is-disabled"
                );
            }

            const heading =
                createElement(
                    "div",
                    "donation-alert-rule-heading"
                );

            const titleWrapper =
                createElement(
                    "div",
                    "donation-alert-rule-title"
                );

            const title =
                createElement(
                    "h3",
                    "",
                    rule.name ||
                    "Alerte sans nom"
                );

            const condition =
                createElement(
                    "p",
                    "",
                    conditionLabel(rule)
                );

            titleWrapper.append(
                title,
                condition
            );

            const status =
                createElement(
                    "span",
                    (
                        "donation-alert-rule-status " +
                        (
                            rule.enabled
                                ? "is-enabled"
                                : "is-disabled"
                        )
                    ),
                    rule.enabled
                        ? "Activée"
                        : "Désactivée"
                );

            heading.append(
                titleWrapper,
                status
            );

            const information =
                createElement(
                    "div",
                    "donation-alert-rule-information"
                );

            const variants =
                getVariants(rule);

            information.append(
                createElement(
                    "span",
                    "",
                    (
                        `${variants.length} variante` +
                        (
                            variants.length > 1
                                ? "s"
                                : ""
                        )
                    )
                ),
                createElement(
                    "span",
                    "",
                    (
                        `${Number(
                            rule.delayMs || 0
                        ) / 1000} s de retard`
                    )
                ),
                createElement(
                    "span",
                    "",
                    (
                        `${Number(
                            rule.durationMs || 0
                        ) / 1000} s d’affichage`
                    )
                )
            );

            const actions =
                createElement(
                    "div",
                    "donation-alert-rule-actions"
                );

            const testButton =
                createElement(
                    "button",
                    (
                        "dashboard-button " +
                        "dashboard-button-secondary"
                    ),
                    "Tester"
                );

            testButton.type = "button";

            testButton.addEventListener(
                "click",
                () => testRule(rule)
            );

            const editButton =
                createElement(
                    "button",
                    (
                        "dashboard-button " +
                        "dashboard-button-primary"
                    ),
                    "Modifier"
                );

            editButton.type = "button";

            editButton.addEventListener(
                "click",
                () => openRuleDialog(rule)
            );

            actions.append(
                testButton,
                editButton
            );

            card.append(
                heading,
                information,
                actions
            );

            elements.rulesList.append(
                card
            );
        }
    }

    async function loadRules() {
        const creatorId =
            currentCreatorId();

        if (
            !creatorId ||
            state.loading
        ) {
            return;
        }

        state.loading = true;

        try {
            const data =
                await apiFetch(
                    (
                        "/api/creator-panel/" +
                        "donation-alerts" +
                        `?creatorId=${encodeURIComponent(
                            creatorId
                        )}`
                    )
                );

            state.rules =
                Array.isArray(data.rules)
                    ? data.rules
                    : [];

            state.editorSettings =
                data.editor || null;

            renderRules();

            if (
                state.activeRulePublicId
            ) {
                const activeRule =
                    getActiveRule();

                if (activeRule) {
                    renderVariants(
                        activeRule
                    );
                }
            }
        } catch (error) {
            console.error(
                "Impossible de charger les alertes de dons :",
                error
            );

            if (elements.rulesEmpty) {
                elements.rulesEmpty.hidden =
                    false;

                elements.rulesEmpty
                    .textContent =
                    error.message ||
                    "Impossible de charger les alertes.";
            }
        } finally {
            state.loading = false;
        }
    }

    function resetRuleForm() {
        elements.ruleForm?.reset();

        if (elements.rulePublicId) {
            elements.rulePublicId.value =
                "";
        }

        if (elements.ruleName) {
            elements.ruleName.value =
                "";
        }

        if (elements.ruleCondition) {
            elements.ruleCondition.value =
                "default";
        }

        if (elements.minimum) {
            elements.minimum.value =
                "1.00";
        }

        if (elements.maximum) {
            elements.maximum.value =
                "100.00";
        }

        if (elements.selectionMode) {
            elements.selectionMode.value =
                "fixed";
        }

        if (elements.delay) {
            elements.delay.value = "0";
        }

        if (elements.duration) {
            elements.duration.value = "6";
        }

        if (elements.volume) {
            elements.volume.value = "100";
        }

        if (elements.priority) {
            elements.priority.value = "100";
        }

        if (elements.enabled) {
            elements.enabled.checked =
                true;
        }

        state.activeRulePublicId =
            null;

        setMessage();
        updateConditionFields();
        updateVolumeValue();

        if (elements.variantsSection) {
            elements.variantsSection.hidden =
                true;
        }

        if (elements.deleteRuleButton) {
            elements.deleteRuleButton.hidden =
                true;
        }

        elements.variantsList
            ?.replaceChildren();
    }

    function openRuleDialog(
        rule = null
    ) {
        resetRuleForm();

        if (rule) {
            state.activeRulePublicId =
                rule.publicId;

            elements.rulePublicId.value =
                rule.publicId || "";

            elements.ruleName.value =
                rule.name || "";

            elements.ruleCondition.value =
                normalizeConditionType(
                    rule.conditionType ||
                    rule.condition ||
                    "default"
                );

            elements.minimum.value =
                centsToEuros(
                    rule.minimumCents ??
                    rule.minimumAmountCents
                );

            elements.maximum.value =
                centsToEuros(
                    rule.maximumCents ??
                    rule.maximumAmountCents
                );

            elements.selectionMode.value =
                rule.selectionMode || "fixed";

            elements.delay.value =
                Number(
                    rule.delayMs || 0
                ) / 1000;

            elements.duration.value =
                Number(
                    rule.durationMs || 6000
                ) / 1000;

            elements.volume.value =
                Number(
                    rule.volume ?? 100
                );

            elements.priority.value =
                Number(
                    rule.priority ?? 100
                );

            elements.enabled.checked =
                rule.enabled !== false;

            elements.ruleDialogTitle
                .textContent =
                `Modifier « ${rule.name} »`;

            elements.variantsSection.hidden =
                false;

            elements.deleteRuleButton.hidden =
                false;

            renderVariants(rule);
        } else {
            elements.ruleDialogTitle
                .textContent =
                "Créer une alerte de don";
        }

        updateConditionFields();
        updateVolumeValue();

        elements.ruleDialog?.showModal();
    }

    function closeRuleDialog() {
        elements.ruleDialog?.close();
        resetRuleForm();
    }

    function buildRulePayload() {
        const conditionType =
            normalizeConditionType(
                elements.ruleCondition
                    ?.value
            );

        const needsAmount =
            conditionType === "minimum" ||
            conditionType === "exact" ||
            conditionType === "range";

        const minimumCents =
            needsAmount
                ? eurosToCents(
                    elements.minimum?.value
                )
                : null;

        const maximumCents =
            conditionType === "range"
                ? eurosToCents(
                    elements.maximum?.value
                )
                : null;

        return {
            name:
                elements.ruleName
                    ?.value.trim() || "",

            conditionType,

            /*
             * Plusieurs noms sont volontairement
             * envoyés pour être compatibles avec
             * les différentes conditions de l’API.
             */
            minimumCents,
            minimumAmountCents:
                minimumCents,

            maximumCents,
            maximumAmountCents:
                maximumCents,

            exactAmountCents:
                conditionType === "exact"
                    ? minimumCents
                    : null,

            amountCents:
                conditionType === "exact"
                    ? minimumCents
                    : null,

            selectionMode:
                elements.selectionMode
                    ?.value || "fixed",

            delayMs:
                Math.round(
                    Number(
                        elements.delay
                            ?.value || 0
                    ) * 1000
                ),

            durationMs:
                Math.round(
                    Number(
                        elements.duration
                            ?.value || 6
                    ) * 1000
                ),

            volume:
                Number(
                    elements.volume
                        ?.value || 100
                ),

            priority:
                Number(
                    elements.priority
                        ?.value || 100
                ),

            enabled:
                Boolean(
                    elements.enabled
                        ?.checked
                )
        };
    }

    async function saveRule(event) {
        event.preventDefault();

        const payload =
            buildRulePayload();

        if (!payload.name) {
            setMessage(
                "Le nom de l’alerte est obligatoire.",
                "error"
            );

            elements.ruleName?.focus();
            return;
        }

        const requiresMinimum =
            payload.conditionType ===
            "minimum" ||
            payload.conditionType ===
            "exact" ||
            payload.conditionType ===
            "range";

        if (
            requiresMinimum &&
            (
                !Number.isInteger(
                    payload.minimumCents
                ) ||
                payload.minimumCents <= 0
            )
        ) {
            setMessage(
                payload.conditionType === "exact"
                    ? "Indique un montant exact valide."
                    : "Indique un montant minimum valide.",
                "error"
            );

            elements.minimum?.focus();
            return;
        }

        if (
            payload.conditionType === "range" &&
            (
                !Number.isInteger(
                    payload.maximumCents
                ) ||
                payload.maximumCents <=
                payload.minimumCents
            )
        ) {
            setMessage(
                "Le montant maximum doit être supérieur au montant minimum.",
                "error"
            );

            elements.maximum?.focus();
            return;
        }

        const publicId =
            elements.rulePublicId
                ?.value.trim();

        elements.saveRuleButton.disabled =
            true;

        setMessage(
            "Enregistrement…"
        );

        try {
            const creatorId =
                currentCreatorId();

            const pathname =
                publicId
                    ? (
                        "/api/creator-panel/" +
                        "donation-alerts/" +
                        encodeURIComponent(
                            publicId
                        ) +
                        `?creatorId=${encodeURIComponent(
                            creatorId
                        )}`
                    )
                    : (
                        "/api/creator-panel/" +
                        "donation-alerts" +
                        `?creatorId=${encodeURIComponent(
                            creatorId
                        )}`
                    );

            const data =
                await apiFetch(
                    pathname,
                    {
                        method:
                            publicId
                                ? "PUT"
                                : "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            const savedRule =
                data.rule || null;

            await loadRules();

            if (savedRule?.publicId) {
                state.activeRulePublicId =
                    savedRule.publicId;

                elements.rulePublicId.value =
                    savedRule.publicId;

                elements.variantsSection.hidden =
                    false;

                elements.deleteRuleButton.hidden =
                    false;

                renderVariants(
                    getRuleByPublicId(
                        savedRule.publicId
                    ) || savedRule
                );
            }

            setMessage(
                publicId
                    ? "Alerte mise à jour."
                    : "Alerte créée. Tu peux maintenant ajouter une variante.",
                "success"
            );
        } catch (error) {
            setMessage(
                error.message ||
                "Impossible d’enregistrer l’alerte.",
                "error"
            );
        } finally {
            elements.saveRuleButton.disabled =
                false;
        }
    }

    async function deleteRule() {
        const rule =
            getActiveRule();

        if (!rule) {
            return;
        }

        const confirmed =
            window.confirm(
                (
                    `Supprimer l’alerte « ${rule.name} » ` +
                    "et toutes ses variantes ?"
                )
            );

        if (!confirmed) {
            return;
        }

        elements.deleteRuleButton.disabled =
            true;

        try {
            await apiFetch(
                (
                    "/api/creator-panel/" +
                    "donation-alerts/" +
                    encodeURIComponent(
                        rule.publicId
                    ) +
                    `?creatorId=${encodeURIComponent(
                        currentCreatorId()
                    )}`
                ),
                {
                    method: "DELETE"
                }
            );

            closeRuleDialog();
            await loadRules();
        } catch (error) {
            setMessage(
                error.message ||
                "Impossible de supprimer l’alerte.",
                "error"
            );
        } finally {
            elements.deleteRuleButton.disabled =
                false;
        }
    }

    function updateVariantCreationState(rule = getActiveRule()) {
        if (!elements.createVariantButton) {
            return;
        }

        const variants = getVariants(rule);
        updateVariantCreationState(rule);
        const mode =
            elements.selectionMode?.value ||
            rule?.selectionMode ||
            "fixed";

        const blocked =
            mode === "fixed" &&
            variants.length >= 1;

        elements.createVariantButton.disabled = blocked;
        elements.createVariantButton.title = blocked
            ? "Une alerte en variante fixe ne peut contenir qu’une variante."
            : "";
    }

    function renderVariants(rule) {
        if (!elements.variantsList) {
            return;
        }

        elements.variantsList
            .replaceChildren();

        const variants =
            getVariants(rule);

        if (elements.variantsEmpty) {
            elements.variantsEmpty.hidden =
                variants.length > 0;
        }

        for (
            const variant of variants
        ) {
            const item =
                createElement(
                    "article",
                    "donation-alert-variant"
                );

            const information =
                createElement(
                    "div",
                    "donation-alert-variant-information"
                );

            const title =
                createElement(
                    "strong",
                    "",
                    variant.name ||
                    "Variante sans nom"
                );

            const details =
                createElement(
                    "span",
                    "",
                    (
                        variant.enabled === false
                            ? "Désactivée"
                            : (
                                `Poids : ${Number(
                                    variant.weight ?? 1
                                )
                                }`
                            )
                    )
                );

            information.append(
                title,
                details
            );

            const actions =
                createElement(
                    "div",
                    "donation-alert-variant-actions"
                );

            const editButton =
                createElement(
                    "button",
                    (
                        "dashboard-button " +
                        "dashboard-button-secondary"
                    ),
                    "Éditer"
                );

            editButton.type = "button";

            editButton.addEventListener(
                "click",
                () => openVariantEditor(
                    rule,
                    variant
                )
            );

            const deleteButton =
                createElement(
                    "button",
                    (
                        "dashboard-button " +
                        "dashboard-button-danger"
                    ),
                    "Supprimer"
                );

            deleteButton.type = "button";

            deleteButton.addEventListener(
                "click",
                () => deleteVariant(
                    rule,
                    variant
                )
            );

            actions.append(
                editButton,
                deleteButton
            );

            item.append(
                information,
                actions
            );

            elements.variantsList.append(
                item
            );
        }
    }

    async function createVariant() {
        const rule =
            getActiveRule();

        if (!rule) {
            setMessage(
                "Enregistre d’abord l’alerte.",
                "error"
            );

            return;
        }

        const variants = getVariants(rule);

        const mode =
            elements.selectionMode?.value ||
            rule.selectionMode ||
            "fixed";

        if (
            mode === "fixed" &&
            variants.length >= 1
        ) {
            setMessage(
                "Une alerte en variante fixe ne peut contenir qu’une variante.",
                "error"
            );
            return;
        }

        elements.createVariantButton.disabled =
            true;

        try {

            const data =
                await apiFetch(
                    (
                        "/api/creator-panel/" +
                        "donation-alerts/" +
                        encodeURIComponent(
                            rule.publicId
                        ) +
                        "/variants" +
                        `?creatorId=${encodeURIComponent(
                            currentCreatorId()
                        )}`
                    ),
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                name:
                                    (
                                        "Variante " +
                                        (
                                            variants.length +
                                            1
                                        )
                                    ),

                                enabled: true,
                                weight: 1
                            })
                    }
                );

            await loadRules();

            const updatedRule =
                getRuleByPublicId(
                    rule.publicId
                );

            const variant =
                data.variant ||
                getVariants(
                    updatedRule
                ).at(-1);

            if (variant) {
                openVariantEditor(
                    updatedRule || rule,
                    variant
                );
            }
        } catch (error) {
            setMessage(
                error.message ||
                "Impossible de créer la variante.",
                "error"
            );
        } finally {
            updateVariantCreationState(
                getActiveRule() || rule
            );
        }
    }

    async function deleteVariant(
        rule,
        variant
    ) {
        const confirmed =
            window.confirm(
                (
                    `Supprimer la variante ` +
                    `« ${variant.name} » ?`
                )
            );

        if (!confirmed) {
            return;
        }

        try {
            await apiFetch(
                (
                    "/api/creator-panel/" +
                    "donation-alerts/" +
                    encodeURIComponent(
                        rule.publicId
                    ) +
                    "/variants/" +
                    encodeURIComponent(
                        variant.publicId
                    ) +
                    `?creatorId=${encodeURIComponent(
                        currentCreatorId()
                    )}`
                ),
                {
                    method: "DELETE"
                }
            );

            await loadRules();

            renderVariants(
                getRuleByPublicId(
                    rule.publicId
                ) || rule
            );

            setMessage(
                "Variante supprimée.",
                "success"
            );
        } catch (error) {
            setMessage(
                error.message ||
                "Impossible de supprimer la variante.",
                "error"
            );
        }
    }

    function openVariantEditor(
        rule,
        variant
    ) {
        const parameters =
            new URLSearchParams({
                creatorId:
                    String(currentCreatorId()),

                rule:
                    rule.publicId,

                variant:
                    variant.publicId
            });

        window.location.href =
            `/overlay-editor.html?${parameters.toString()}`;
    }

    function testRule(rule) {
        const variants =
            getVariants(rule).filter(
                variant =>
                    variant.enabled !== false
            );

        if (variants.length === 0) {
            window.alert(
                "Cette alerte ne possède aucune variante active."
            );

            return;
        }

        let variant = variants[0];

        if (
            rule.selectionMode ===
            "random"
        ) {
            variant =
                variants[
                Math.floor(
                    Math.random() *
                    variants.length
                )
                ];
        }

        openVariantEditor(
            rule,
            variant,
            true
        );
    }

    elements.selectionMode
        ?.addEventListener(
            "change",
            () => updateVariantCreationState()
        );
        
    elements.createButton
        ?.addEventListener(
            "click",
            () => openRuleDialog()
        );

    elements.ruleForm
        ?.addEventListener(
            "submit",
            saveRule
        );

    elements.ruleCondition
        ?.addEventListener(
            "change",
            updateConditionFields
        );

    elements.volume
        ?.addEventListener(
            "input",
            updateVolumeValue
        );

    elements.closeRuleDialogButton
        ?.addEventListener(
            "click",
            closeRuleDialog
        );

    elements.cancelRuleButton
        ?.addEventListener(
            "click",
            closeRuleDialog
        );

    elements.deleteRuleButton
        ?.addEventListener(
            "click",
            deleteRule
        );

    elements.createVariantButton
        ?.addEventListener(
            "click",
            createVariant
        );

    elements.ruleDialog
        ?.addEventListener(
            "cancel",
            event => {
                event.preventDefault();
                closeRuleDialog();
            }
        );

    elements.ruleDialog
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    elements.ruleDialog
                ) {
                    closeRuleDialog();
                }
            }
        );

    window.addEventListener(
        "jevent:creator-dashboard-ready",
        event => {
            const creatorId =
                Number(
                    event.detail
                        ?.creatorId || 0
                );

            if (!creatorId) {
                return;
            }

            const changed =
                creatorId !==
                state.creatorId;

            state.creatorId =
                creatorId;

            if (changed) {
                state.activeRulePublicId =
                    null;

                elements.ruleDialog
                    ?.close();
            }

            loadRules();
        }
    );

    updateConditionFields();
    updateVolumeValue();
})();