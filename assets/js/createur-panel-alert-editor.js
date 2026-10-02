(() => {
    "use strict";

    const $ = selector =>
        document.querySelector(selector);

    function firstElement(...selectors) {
        for (const selector of selectors) {
            const element = $(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }

    const elements = {
        dialog:
            $("#donationAlertEditorDialog"),

        form:
            $("#donationAlertEditorForm"),

        rulePublicId:
            $("#donationAlertEditorRulePublicId"),

        variantPublicId:
            $("#donationAlertEditorVariantPublicId"),

        variantName:
            $("#donationAlertVariantName"),

        variantWeight:
            $("#donationAlertVariantWeight"),

        variantEnabled:
            $("#donationAlertVariantEnabled"),

        closeButton:
            firstElement(
                "#closeDonationAlertEditorButton",
                "#closeDonationAlertVariantButton"
            ),

        cancelButton:
            firstElement(
                "#cancelDonationAlertEditorButton",
                "#cancelDonationAlertVariantButton"
            ),

        saveButton:
            firstElement(
                "#saveDonationAlertVariantButton",
                "#saveDonationAlertEditorButton"
            ),

        testButton:
            firstElement(
                "#testDonationAlertVariantButton",
                "#testDonationAlertEditorButton"
            ),

        replayButton:
            $("#replayDonationAlertButton"),

        message:
            $("#donationAlertEditorMessage"),

        addTextButton:
            $("#addDonationAlertTextButton"),

        layersList:
            $("#donationAlertLayersList"),

        zoom:
            $("#donationAlertEditorZoom"),

        canvas:
            $("#donationAlertCanvas"),

        videoLayer:
            $("#donationAlertVideoLayer"),

        videoPreview:
            $("#donationAlertVideoPreview"),

        videoPlaceholder:
            $("#donationAlertVideoPlaceholder"),

        textsContainer:
            $("#donationAlertCanvasTexts"),

        selectedLayerName:
            $("#donationAlertSelectedLayerName"),

        videoProperties:
            $("#donationAlertVideoProperties"),

        videoFile:
            $("#donationAlertVideoFile"),

        removeVideoButton:
            $("#removeDonationAlertVideoButton"),

        videoFit:
            $("#donationAlertVideoFit"),

        textProperties:
            $("#donationAlertTextProperties"),

        textName:
            $("#donationAlertTextName"),

        textTemplate:
            $("#donationAlertTextTemplate"),

        textFont:
            $("#donationAlertTextFont"),

        textColors:
            $("#donationAlertTextColors"),

        textColor:
            $("#donationAlertTextColor"),

        textAlign:
            $("#donationAlertTextAlign"),

        textSize:
            $("#donationAlertTextSize"),

        textWeight:
            $("#donationAlertTextWeight"),

        textAnimation:
            $("#donationAlertTextAnimation"),

        textDelay:
            $("#donationAlertTextDelay"),

        textDuration:
            $("#donationAlertTextDuration"),

        deleteTextButton:
            $("#deleteDonationAlertTextButton"),

        commonProperties:
            $("#donationAlertCommonProperties"),

        layerX:
            $("#donationAlertLayerX"),

        layerY:
            $("#donationAlertLayerY"),

        layerWidth:
            $("#donationAlertLayerWidth"),

        layerHeight:
            $("#donationAlertLayerHeight"),

        layerRotation:
            $("#donationAlertLayerRotation"),

        layerOpacity:
            $("#donationAlertLayerOpacity"),

        layerVisible:
            $("#donationAlertLayerVisible"),

        soundFile:
            $("#donationAlertSoundFile"),

        soundPreview:
            $("#donationAlertSoundPreview"),

        removeSoundButton:
            $("#removeDonationAlertSoundButton")
    };

    const RECOMMENDED_COLORS = [
        {
            name: "Vert sombre",
            value: "#173D2C"
        },
        {
            name: "Vert clair",
            value: "#62D38B"
        },
        {
            name: "Crème",
            value: "#F4F0E6"
        }
    ];

    const DEFAULT_FONTS = [
        "Inter",
        "Arial",
        "Montserrat",
        "Poppins",
        "Verdana",
        "Georgia"
    ];

    const state = {
        context: null,
        layout: null,
        selectedLayerId: null,

        dragging: null,
        dirty: false,
        previewing: false,

        videoFile: null,
        soundFile: null,

        removeVideo: false,
        removeSound: false,

        videoObjectUrl: null,
        soundObjectUrl: null,

        animations: [],
        timers: []
    };

    function clone(value) {
        return JSON.parse(
            JSON.stringify(value)
        );
    }

    function createId() {
        if (crypto.randomUUID) {
            return (
                "text_" +
                crypto.randomUUID()
            );
        }

        return (
            "text_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(16)
                .slice(2)
        );
    }

    function numberValue(
        value,
        fallback = 0
    ) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function clamp(
        value,
        minimum,
        maximum
    ) {
        return Math.min(
            maximum,
            Math.max(
                minimum,
                value
            )
        );
    }

    function canvasWidth() {
        return numberValue(
            state.layout
                ?.canvas?.width,
            1920
        );
    }

    function canvasHeight() {
        return numberValue(
            state.layout
                ?.canvas?.height,
            1080
        );
    }

    function defaultVideoLayer() {
        return {
            id: "video",
            name: "Vidéo",
            type: "video",

            visible: true,

            x: 0,
            y: 0,

            width: 1920,
            height: 1080,

            opacity: 1,
            rotation: 0,

            fit: "contain",
            zIndex: 0
        };
    }

    function defaultTextLayer(
        position = 0
    ) {
        const defaults = [
            {
                name: "Nom et montant",
                template:
                    "{{donorName}} a donné {{amount}}",

                y: 340,
                fontSizePx: 82,
                fontWeight: 800
            },
            {
                name: "Message",
                template:
                    "{{message}}",

                y: 500,
                fontSizePx: 48,
                fontWeight: 600
            },
            {
                name: "Texte supplémentaire",
                template:
                    "Merci pour ton soutien !",

                y: 650,
                fontSizePx: 42,
                fontWeight: 700
            }
        ];

        const selected =
            defaults[position] ||
            defaults[2];

        return {
            id: createId(),
            type: "text",

            name: selected.name,
            visible: true,

            template:
                selected.template,

            x: 160,
            y: selected.y,

            width: 1600,
            height: 160,

            fontFamily: "Inter",
            fontSizePx:
                selected.fontSizePx,

            fontWeight:
                selected.fontWeight,

            color: "#F4F0E6",
            textAlign: "center",

            opacity: 1,
            rotation: 0,
            zIndex: position + 1,

            delayMs: 0,
            durationMs: 5000,

            animation: "fade"
        };
    }

    function normalizeTextLayer(
        layer,
        index
    ) {
        const fallback =
            defaultTextLayer(index);

        return {
            ...fallback,
            ...layer,

            id:
                layer?.id ||
                fallback.id,

            type: "text",

            visible:
                layer?.visible !== false,

            x: numberValue(
                layer?.x,
                fallback.x
            ),

            y: numberValue(
                layer?.y,
                fallback.y
            ),

            width: numberValue(
                layer?.width,
                fallback.width
            ),

            height: numberValue(
                layer?.height,
                fallback.height
            ),

            opacity: clamp(
                numberValue(
                    layer?.opacity,
                    1
                ),
                0,
                1
            ),

            rotation: numberValue(
                layer?.rotation,
                0
            ),

            zIndex: numberValue(
                layer?.zIndex,
                index + 1
            ),

            delayMs: Math.max(
                0,
                numberValue(
                    layer?.delayMs,
                    0
                )
            ),

            durationMs: Math.max(
                100,
                numberValue(
                    layer?.durationMs,
                    5000
                )
            )
        };
    }

    function normalizeLayout(
        layout
    ) {
        const source =
            layout &&
            typeof layout === "object"
                ? clone(layout)
                : {};

        const canvas = {
            width: numberValue(
                source.canvas?.width,
                1920
            ),

            height: numberValue(
                source.canvas?.height,
                1080
            )
        };

        const video = {
            ...defaultVideoLayer(),
            ...(source.video || {})
        };

        video.type = "video";
        video.id = "video";

        video.visible =
            video.visible !== false;

        video.opacity = clamp(
            numberValue(
                video.opacity,
                1
            ),
            0,
            1
        );

        const texts =
            Array.isArray(source.texts)
                ? source.texts
                    .slice(0, 3)
                    .map(
                        normalizeTextLayer
                    )
                : [];

        return {
            version: 1,
            canvas,
            video,
            texts
        };
    }

    function setMessage(
        message = "",
        type = ""
    ) {
        if (!elements.message) {
            return;
        }

        elements.message.textContent =
            message;

        elements.message.className =
            "dashboard-message";

        if (type) {
            elements.message.classList.add(
                `is-${type}`
            );
        }

        elements.message.hidden =
            !message;
    }

    function markDirty() {
        state.dirty = true;
    }

    function clearTimers() {
        for (
            const timer of
            state.timers
        ) {
            window.clearTimeout(timer);
        }

        state.timers = [];
    }

    function clearAnimations() {
        for (
            const animation of
            state.animations
        ) {
            try {
                animation.cancel();
            } catch {
                // Rien à faire.
            }
        }

        state.animations = [];
    }

    function revokeObjectUrl(
        key
    ) {
        const url = state[key];

        if (!url) {
            return;
        }

        URL.revokeObjectURL(url);
        state[key] = null;
    }

    function cleanupLocalMedia() {
        revokeObjectUrl(
            "videoObjectUrl"
        );

        revokeObjectUrl(
            "soundObjectUrl"
        );
    }

    function getSelectedLayer() {
        if (!state.layout) {
            return null;
        }

        if (
            state.selectedLayerId ===
            "video"
        ) {
            return state.layout.video;
        }

        return state.layout.texts.find(
            layer =>
                layer.id ===
                state.selectedLayerId
        ) || null;
    }

    function findLayerElement(
        layerId
    ) {
        if (layerId === "video") {
            return elements.videoLayer;
        }

        return elements
            .textsContainer
            ?.querySelector(
                `[data-layer-id="${CSS.escape(
                    layerId
                )}"]`
            ) || null;
    }

    function layerToStyle(
        element,
        layer
    ) {
        if (!element || !layer) {
            return;
        }

        const width =
            canvasWidth();

        const height =
            canvasHeight();

        element.style.left =
            `${layer.x / width * 100}%`;

        element.style.top =
            `${layer.y / height * 100}%`;

        element.style.width =
            `${layer.width / width * 100}%`;

        element.style.height =
            `${layer.height / height * 100}%`;

        element.style.opacity =
            String(layer.opacity);

        element.style.transform =
            `rotate(${layer.rotation}deg)`;

        element.style.zIndex =
            String(layer.zIndex);

        element.hidden =
            layer.visible === false;

        element.classList.toggle(
            "is-selected",
            layer.id ===
                state.selectedLayerId
        );
    }

    function replaceVariables(
        template,
        values = {}
    ) {
        let result =
            String(template || "");

        const variables = {
            donorName:
                values.donorName ||
                "Jean Dupont",

            amount:
                values.amount ||
                "10,00 €",

            message:
                values.message ||
                "Merci pour cet événement !"
        };

        for (
            const [
                key,
                value
            ] of Object.entries(
                variables
            )
        ) {
            const patterns = [
                `{{${key}}}`,
                `{${key}}`,
                `%${key}%`
            ];

            for (
                const pattern of
                patterns
            ) {
                result =
                    result.replaceAll(
                        pattern,
                        value
                    );
            }
        }

        return result;
    }

    function renderVideo() {
        const layer =
            state.layout?.video;

        if (
            !layer ||
            !elements.videoLayer
        ) {
            return;
        }

        layerToStyle(
            elements.videoLayer,
            layer
        );

        if (elements.videoPreview) {
            elements.videoPreview
                .style.objectFit =
                layer.fit || "contain";
        }

        const hasSource =
            Boolean(
                elements.videoPreview
                    ?.getAttribute("src")
            );

        const hasStoredVideo =
            Boolean(
                state.context?.variant
                    ?.videoStorageKey ||
                state.context?.variant
                    ?.videoUrl
            );

        if (elements.videoPreview) {
            elements.videoPreview.hidden =
                !hasSource;
        }

        if (
            elements.videoPlaceholder
        ) {
            elements.videoPlaceholder.hidden =
                hasSource;

            if (
                !hasSource &&
                hasStoredVideo
            ) {
                elements.videoPlaceholder
                    .textContent =
                    "Vidéo enregistrée";
            } else if (!hasSource) {
                elements.videoPlaceholder
                    .textContent =
                    "Aucune vidéo";
            }
        }
    }

    function createTextElement(
        layer
    ) {
        const element =
            document.createElement(
                "div"
            );

        element.className =
            "donation-alert-canvas-text";

        element.dataset.layerId =
            layer.id;

        element.textContent =
            replaceVariables(
                layer.template
            );

        element.style.fontFamily =
            layer.fontFamily;

        element.style.fontSize =
            `${layer.fontSizePx / canvasHeight() * 100}cqh`;

        element.style.fontWeight =
            String(layer.fontWeight);

        element.style.color =
            layer.color;

        element.style.textAlign =
            layer.textAlign;

        element.style.alignItems =
            layer.textAlign === "left"
                ? "flex-start"
                : layer.textAlign === "right"
                    ? "flex-end"
                    : "center";

        layerToStyle(
            element,
            layer
        );

        element.addEventListener(
            "pointerdown",
            event => {
                startDragging(
                    event,
                    layer.id
                );
            }
        );

        element.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                selectLayer(
                    layer.id
                );
            }
        );

        return element;
    }

    function renderTexts() {
        if (
            !elements.textsContainer ||
            !state.layout
        ) {
            return;
        }

        elements.textsContainer
            .replaceChildren();

        const layers =
            [...state.layout.texts]
                .sort(
                    (first, second) =>
                        first.zIndex -
                        second.zIndex
                );

        for (const layer of layers) {
            elements.textsContainer
                .append(
                    createTextElement(
                        layer
                    )
                );
        }
    }

    function renderCanvas() {
        if (!state.layout) {
            return;
        }

        renderVideo();
        renderTexts();

        if (elements.canvas) {
            elements.canvas
                .style.aspectRatio =
                (
                    `${canvasWidth()} / ` +
                    `${canvasHeight()}`
                );
        }

        applyZoom();
    }

    function createLayerButton(
        layer
    ) {
        const row =
            document.createElement(
                "div"
            );

        row.className =
            "donation-alert-layer-row";

        if (
            layer.id ===
            state.selectedLayerId
        ) {
            row.classList.add(
                "is-selected"
            );
        }

        const selectButton =
            document.createElement(
                "button"
            );

        selectButton.type = "button";
        selectButton.className =
            "donation-alert-layer-select";

        selectButton.textContent =
            layer.name ||
            (
                layer.type === "video"
                    ? "Vidéo"
                    : "Texte"
            );

        selectButton.addEventListener(
            "click",
            () => selectLayer(
                layer.id
            )
        );

        const controls =
            document.createElement(
                "div"
            );

        controls.className =
            "donation-alert-layer-controls";

        const downButton =
            document.createElement(
                "button"
            );

        downButton.type = "button";
        downButton.title =
            "Reculer le calque";

        downButton.textContent = "↓";

        downButton.addEventListener(
            "click",
            () => moveLayerZIndex(
                layer.id,
                -1
            )
        );

        const upButton =
            document.createElement(
                "button"
            );

        upButton.type = "button";
        upButton.title =
            "Avancer le calque";

        upButton.textContent = "↑";

        upButton.addEventListener(
            "click",
            () => moveLayerZIndex(
                layer.id,
                1
            )
        );

        controls.append(
            downButton,
            upButton
        );

        row.append(
            selectButton,
            controls
        );

        return row;
    }

    function renderLayersList() {
        if (
            !elements.layersList ||
            !state.layout
        ) {
            return;
        }

        elements.layersList
            .replaceChildren();

        const layers = [
            state.layout.video,
            ...state.layout.texts
        ].sort(
            (first, second) =>
                second.zIndex -
                first.zIndex
        );

        for (const layer of layers) {
            elements.layersList.append(
                createLayerButton(layer)
            );
        }

        if (elements.addTextButton) {
            elements.addTextButton.disabled =
                state.layout.texts.length >= 3;
        }
    }

    function moveLayerZIndex(
        layerId,
        direction
    ) {
        const layer =
            layerId === "video"
                ? state.layout.video
                : state.layout.texts.find(
                    item =>
                        item.id === layerId
                );

        if (!layer) {
            return;
        }

        layer.zIndex = clamp(
            numberValue(
                layer.zIndex,
                0
            ) + direction,
            0,
            20
        );

        markDirty();
        renderCanvas();
        renderLayersList();
    }

    function setInputValue(
        element,
        value
    ) {
        if (!element) {
            return;
        }

        element.value =
            value ?? "";
    }

    function setCheckboxValue(
        element,
        value
    ) {
        if (!element) {
            return;
        }

        element.checked =
            Boolean(value);
    }

    function opacityInputValue(
        opacity
    ) {
        if (
            numberValue(
                elements.layerOpacity
                    ?.max,
                1
            ) > 1
        ) {
            return Math.round(
                opacity * 100
            );
        }

        return opacity;
    }

    function opacityFromInput() {
        const maximum =
            numberValue(
                elements.layerOpacity
                    ?.max,
                1
            );

        const value =
            numberValue(
                elements.layerOpacity
                    ?.value,
                maximum
            );

        return maximum > 1
            ? value / 100
            : value;
    }

    function renderProperties() {
        const layer =
            getSelectedLayer();

        if (!layer) {
            if (
                elements.commonProperties
            ) {
                elements.commonProperties
                    .hidden = true;
            }

            return;
        }

        if (elements.commonProperties) {
            elements.commonProperties.hidden =
                false;
        }

        if (
            elements.selectedLayerName
        ) {
            elements.selectedLayerName
                .textContent =
                layer.name ||
                (
                    layer.type === "video"
                        ? "Vidéo"
                        : "Texte"
                );
        }

        setInputValue(
            elements.layerX,
            Math.round(layer.x)
        );

        setInputValue(
            elements.layerY,
            Math.round(layer.y)
        );

        setInputValue(
            elements.layerWidth,
            Math.round(layer.width)
        );

        setInputValue(
            elements.layerHeight,
            Math.round(layer.height)
        );

        setInputValue(
            elements.layerRotation,
            layer.rotation
        );

        setInputValue(
            elements.layerOpacity,
            opacityInputValue(
                layer.opacity
            )
        );

        setCheckboxValue(
            elements.layerVisible,
            layer.visible
        );

        const isVideo =
            layer.type === "video";

        if (elements.videoProperties) {
            elements.videoProperties.hidden =
                !isVideo;
        }

        if (elements.textProperties) {
            elements.textProperties.hidden =
                isVideo;
        }

        if (isVideo) {
            setInputValue(
                elements.videoFit,
                layer.fit || "contain"
            );

            return;
        }

        setInputValue(
            elements.textName,
            layer.name
        );

        setInputValue(
            elements.textTemplate,
            layer.template
        );

        setInputValue(
            elements.textFont,
            layer.fontFamily
        );

        setInputValue(
            elements.textColor,
            layer.color
        );

        setInputValue(
            elements.textAlign,
            layer.textAlign
        );

        setInputValue(
            elements.textSize,
            layer.fontSizePx
        );

        setInputValue(
            elements.textWeight,
            layer.fontWeight
        );

        setInputValue(
            elements.textAnimation,
            layer.animation
        );

        setInputValue(
            elements.textDelay,
            layer.delayMs
        );

        setInputValue(
            elements.textDuration,
            layer.durationMs
        );
    }

    function selectLayer(layerId) {
        state.selectedLayerId =
            layerId;

        renderCanvas();
        renderLayersList();
        renderProperties();
    }

    function startDragging(
        event,
        layerId
    ) {
        if (
            event.button !== undefined &&
            event.button !== 0
        ) {
            return;
        }

        const layer =
            layerId === "video"
                ? state.layout.video
                : state.layout.texts.find(
                    item =>
                        item.id === layerId
                );

        if (
            !layer ||
            !elements.canvas
        ) {
            return;
        }

        event.preventDefault();
        selectLayer(layerId);

        state.dragging = {
            layer,
            pointerId:
                event.pointerId,

            startClientX:
                event.clientX,

            startClientY:
                event.clientY,

            startX: layer.x,
            startY: layer.y
        };

        event.currentTarget
            ?.setPointerCapture?.(
                event.pointerId
            );
    }

    function moveDragging(event) {
        if (
            !state.dragging ||
            !elements.canvas
        ) {
            return;
        }

        const rectangle =
            elements.canvas
                .getBoundingClientRect();

        if (
            rectangle.width <= 0 ||
            rectangle.height <= 0
        ) {
            return;
        }

        const movementX =
            (
                event.clientX -
                state.dragging
                    .startClientX
            ) *
            canvasWidth() /
            rectangle.width;

        const movementY =
            (
                event.clientY -
                state.dragging
                    .startClientY
            ) *
            canvasHeight() /
            rectangle.height;

        const layer =
            state.dragging.layer;

        layer.x = Math.round(
            clamp(
                state.dragging.startX +
                movementX,

                0,
                Math.max(
                    0,
                    canvasWidth() -
                    layer.width
                )
            )
        );

        layer.y = Math.round(
            clamp(
                state.dragging.startY +
                movementY,

                0,
                Math.max(
                    0,
                    canvasHeight() -
                    layer.height
                )
            )
        );

        markDirty();

        layerToStyle(
            findLayerElement(
                layer.id
            ),
            layer
        );

        setInputValue(
            elements.layerX,
            layer.x
        );

        setInputValue(
            elements.layerY,
            layer.y
        );
    }

    function stopDragging() {
        state.dragging = null;
    }

    function updateSelectedLayer(
        changes
    ) {
        const layer =
            getSelectedLayer();

        if (!layer) {
            return;
        }

        Object.assign(
            layer,
            changes
        );

        layer.x = clamp(
            numberValue(layer.x),
            0,
            Math.max(
                0,
                canvasWidth() -
                numberValue(layer.width)
            )
        );

        layer.y = clamp(
            numberValue(layer.y),
            0,
            Math.max(
                0,
                canvasHeight() -
                numberValue(layer.height)
            )
        );

        layer.width = clamp(
            numberValue(layer.width),
            20,
            canvasWidth()
        );

        layer.height = clamp(
            numberValue(layer.height),
            20,
            canvasHeight()
        );

        markDirty();
        renderCanvas();
        renderLayersList();
        renderProperties();
    }

    function addTextLayer() {
        if (
            state.layout.texts.length >= 3
        ) {
            setMessage(
                "Une animation peut contenir trois textes maximum.",
                "error"
            );

            return;
        }

        const layer =
            defaultTextLayer(
                state.layout.texts.length
            );

        state.layout.texts.push(
            layer
        );

        markDirty();
        selectLayer(layer.id);
    }

    function deleteSelectedText() {
        const layer =
            getSelectedLayer();

        if (
            !layer ||
            layer.type !== "text"
        ) {
            return;
        }

        state.layout.texts =
            state.layout.texts.filter(
                item =>
                    item.id !==
                    layer.id
            );

        state.selectedLayerId =
            state.layout.texts[0]?.id ||
            "video";

        markDirty();
        renderCanvas();
        renderLayersList();
        renderProperties();
    }

    function prepareFonts() {
        if (!elements.textFont) {
            return;
        }

        if (
            elements.textFont
                .options.length > 0
        ) {
            return;
        }

        const configuredFonts =
            state.context
                ?.editorSettings
                ?.fonts;

        const fonts =
            Array.isArray(
                configuredFonts
            ) &&
            configuredFonts.length > 0
                ? configuredFonts
                : DEFAULT_FONTS;

        for (const font of fonts) {
            const option =
                document.createElement(
                    "option"
                );

            if (
                typeof font === "string"
            ) {
                option.value = font;
                option.textContent = font;
            } else {
                option.value =
                    font.value ||
                    font.name;

                option.textContent =
                    font.label ||
                    font.name ||
                    font.value;
            }

            elements.textFont.append(
                option
            );
        }
    }

    function prepareColors() {
        if (!elements.textColors) {
            return;
        }

        elements.textColors
            .replaceChildren();

        const configured =
            state.context
                ?.editorSettings
                ?.colors;

        const colors =
            Array.isArray(configured) &&
            configured.length > 0
                ? configured
                : RECOMMENDED_COLORS;

        for (const color of colors) {
            const value =
                typeof color === "string"
                    ? color
                    : color.value;

            const name =
                typeof color === "string"
                    ? color
                    : (
                        color.label ||
                        color.name ||
                        color.value
                    );

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "donation-alert-color-button";

            button.title = name;

            button.style
                .setProperty(
                    "--alert-color",
                    value
                );

            button.dataset.color =
                value;

            button.addEventListener(
                "click",
                () => {
                    updateSelectedLayer({
                        color: value
                    });
                }
            );

            elements.textColors.append(
                button
            );
        }
    }

    function applyZoom() {
        if (
            !elements.canvas ||
            !elements.zoom
        ) {
            return;
        }

        const zoom = clamp(
            numberValue(
                elements.zoom.value,
                100
            ),
            25,
            150
        );

        elements.canvas.style
            .setProperty(
                "--editor-zoom",
                String(zoom / 100)
            );
    }

    function setVideoSource(url) {
        if (!elements.videoPreview) {
            return;
        }

        if (!url) {
            elements.videoPreview
                .removeAttribute("src");

            elements.videoPreview
                .load();

            renderVideo();
            return;
        }

        elements.videoPreview.src =
            url;

        elements.videoPreview.load();

        renderVideo();
    }

    function setSoundSource(url) {
        if (!elements.soundPreview) {
            return;
        }

        if (!url) {
            elements.soundPreview
                .removeAttribute("src");

            elements.soundPreview
                .load();

            return;
        }

        elements.soundPreview.src =
            url;

        elements.soundPreview.load();
    }

    function handleVideoFile() {
        const file =
            elements.videoFile
                ?.files?.[0];

        if (!file) {
            return;
        }

        const maximum =
            numberValue(
                state.context
                    ?.editorSettings
                    ?.limits
                    ?.maximumVideoFileSizeBytes,
                15 * 1024 * 1024
            );

        if (file.size > maximum) {
            setMessage(
                (
                    "La vidéo est trop lourde. " +
                    `Maximum : ${
                        Math.round(
                            maximum /
                            1024 /
                            1024
                        )
                    } Mo.`
                ),
                "error"
            );

            elements.videoFile.value =
                "";

            return;
        }

        if (
            !file.type.startsWith(
                "video/"
            )
        ) {
            setMessage(
                "Le fichier sélectionné n’est pas une vidéo.",
                "error"
            );

            return;
        }

        revokeObjectUrl(
            "videoObjectUrl"
        );

        state.videoFile = file;
        state.removeVideo = false;

        state.videoObjectUrl =
            URL.createObjectURL(file);

        setVideoSource(
            state.videoObjectUrl
        );

        markDirty();
        setMessage();
    }

    function handleSoundFile() {
        const file =
            elements.soundFile
                ?.files?.[0];

        if (!file) {
            return;
        }

        const maximum =
            numberValue(
                state.context
                    ?.editorSettings
                    ?.limits
                    ?.maximumSoundFileSizeBytes,
                8 * 1024 * 1024
            );

        if (file.size > maximum) {
            setMessage(
                (
                    "Le son est trop lourd. " +
                    `Maximum : ${
                        Math.round(
                            maximum /
                            1024 /
                            1024
                        )
                    } Mo.`
                ),
                "error"
            );

            elements.soundFile.value =
                "";

            return;
        }

        if (
            !file.type.startsWith(
                "audio/"
            )
        ) {
            setMessage(
                "Le fichier sélectionné n’est pas un son.",
                "error"
            );

            return;
        }

        revokeObjectUrl(
            "soundObjectUrl"
        );

        state.soundFile = file;
        state.removeSound = false;

        state.soundObjectUrl =
            URL.createObjectURL(file);

        setSoundSource(
            state.soundObjectUrl
        );

        markDirty();
        setMessage();
    }

    function removeVideo() {
        state.videoFile = null;
        state.removeVideo = true;

        revokeObjectUrl(
            "videoObjectUrl"
        );

        if (elements.videoFile) {
            elements.videoFile.value =
                "";
        }

        setVideoSource(null);
        markDirty();
    }

    function removeSound() {
        state.soundFile = null;
        state.removeSound = true;

        revokeObjectUrl(
            "soundObjectUrl"
        );

        if (elements.soundFile) {
            elements.soundFile.value =
                "";
        }

        setSoundSource(null);
        markDirty();
    }

    function animationKeyframes(
        animation
    ) {
        if (animation === "slide-up") {
            return [
                {
                    opacity: 0,
                    transform:
                        "translateY(80px)"
                },
                {
                    opacity: 1,
                    transform:
                        "translateY(0)"
                }
            ];
        }

        if (animation === "slide-down") {
            return [
                {
                    opacity: 0,
                    transform:
                        "translateY(-80px)"
                },
                {
                    opacity: 1,
                    transform:
                        "translateY(0)"
                }
            ];
        }

        if (animation === "zoom") {
            return [
                {
                    opacity: 0,
                    transform:
                        "scale(0.65)"
                },
                {
                    opacity: 1,
                    transform:
                        "scale(1)"
                }
            ];
        }

        if (animation === "bounce") {
            return [
                {
                    opacity: 0,
                    transform:
                        "scale(0.4)"
                },
                {
                    opacity: 1,
                    transform:
                        "scale(1.12)",
                    offset: 0.7
                },
                {
                    opacity: 1,
                    transform:
                        "scale(1)"
                }
            ];
        }

        if (animation === "none") {
            return [
                {
                    opacity: 1
                },
                {
                    opacity: 1
                }
            ];
        }

        return [
            {
                opacity: 0
            },
            {
                opacity: 1
            }
        ];
    }

    function preview(
        values = {}
    ) {
        if (
            !state.layout ||
            state.previewing
        ) {
            return;
        }

        state.previewing = true;

        clearTimers();
        clearAnimations();
        renderCanvas();

        if (elements.videoPreview?.src) {
            try {
                elements.videoPreview
                    .currentTime = 0;

                elements.videoPreview
                    .play()
                    .catch(() => {});
            } catch {
                // La vidéo reste optionnelle.
            }
        }

        if (elements.soundPreview?.src) {
            try {
                elements.soundPreview
                    .currentTime = 0;

                elements.soundPreview
                    .play()
                    .catch(() => {});
            } catch {
                // Le son reste optionnel.
            }
        }

        let maximumEnd = 500;

        for (
            const layer of
            state.layout.texts
        ) {
            const element =
                findLayerElement(
                    layer.id
                );

            if (
                !element ||
                layer.visible === false
            ) {
                continue;
            }

            element.textContent =
                replaceVariables(
                    layer.template,
                    values
                );

            const duration =
                Math.max(
                    100,
                    layer.durationMs
                );

            const delay =
                Math.max(
                    0,
                    layer.delayMs
                );

            maximumEnd = Math.max(
                maximumEnd,
                delay + duration
            );

            const animation =
                element.animate(
                    animationKeyframes(
                        layer.animation
                    ),
                    {
                        duration:
                            Math.min(
                                700,
                                duration
                            ),

                        delay,
                        easing:
                            "cubic-bezier(.2,.8,.2,1)",

                        fill: "both"
                    }
                );

            state.animations.push(
                animation
            );

            const hideTimer =
                window.setTimeout(
                    () => {
                        element.animate(
                            [
                                {
                                    opacity:
                                        layer.opacity
                                },
                                {
                                    opacity: 0
                                }
                            ],
                            {
                                duration: 250,
                                fill: "forwards"
                            }
                        );
                    },
                    delay + duration
                );

            state.timers.push(
                hideTimer
            );
        }

        const finishTimer =
            window.setTimeout(
                () => {
                    state.previewing =
                        false;
                },
                maximumEnd + 300
            );

        state.timers.push(
            finishTimer
        );
    }

    async function uploadMedia(
        type,
        file
    ) {
        if (!file) {
            return;
        }

        const formData =
            new FormData();

        formData.append(
            "file",
            file,
            file.name
        );

        const rulePublicId =
            state.context.rule.publicId;

        const variantPublicId =
            state.context.variant.publicId;

        await state.context.apiFetch(
            (
                "/api/creator-panel/" +
                "donation-alerts/" +
                encodeURIComponent(
                    rulePublicId
                ) +
                "/variants/" +
                encodeURIComponent(
                    variantPublicId
                ) +
                `/media/${type}` +
                `?creatorId=${encodeURIComponent(
                    state.context.creatorId
                )}`
            ),
            {
                method: "POST",
                body: formData
            }
        );
    }

    async function deleteMedia(type) {
        const rulePublicId =
            state.context.rule.publicId;

        const variantPublicId =
            state.context.variant.publicId;

        await state.context.apiFetch(
            (
                "/api/creator-panel/" +
                "donation-alerts/" +
                encodeURIComponent(
                    rulePublicId
                ) +
                "/variants/" +
                encodeURIComponent(
                    variantPublicId
                ) +
                `/media/${type}` +
                `?creatorId=${encodeURIComponent(
                    state.context.creatorId
                )}`
            ),
            {
                method: "DELETE"
            }
        );
    }

    async function saveEditor(event) {
        event.preventDefault();

        if (!state.context) {
            return;
        }

        const name =
            elements.variantName
                ?.value.trim();

        if (!name) {
            setMessage(
                "Le nom de la variante est obligatoire.",
                "error"
            );

            elements.variantName
                ?.focus();

            return;
        }

        elements.saveButton.disabled =
            true;

        setMessage(
            "Enregistrement…"
        );

        try {
            const rulePublicId =
                state.context.rule
                    .publicId;

            const variantPublicId =
                state.context.variant
                    .publicId;

            const payload = {
                name,

                enabled:
                    elements.variantEnabled
                        ? elements
                            .variantEnabled
                            .checked
                        : true,

                weight:
                    Math.max(
                        1,
                        numberValue(
                            elements
                                .variantWeight
                                ?.value,
                            1
                        )
                    ),

                layout:
                    state.layout
            };

            const data =
                await state.context
                    .apiFetch(
                        (
                            "/api/creator-panel/" +
                            "donation-alerts/" +
                            encodeURIComponent(
                                rulePublicId
                            ) +
                            "/variants/" +
                            encodeURIComponent(
                                variantPublicId
                            ) +
                            `?creatorId=${encodeURIComponent(
                                state.context
                                    .creatorId
                            )}`
                        ),
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

            if (state.removeVideo) {
                await deleteMedia(
                    "video"
                );
            }

            if (state.removeSound) {
                await deleteMedia(
                    "sound"
                );
            }

            if (state.videoFile) {
                await uploadMedia(
                    "video",
                    state.videoFile
                );
            }

            if (state.soundFile) {
                await uploadMedia(
                    "sound",
                    state.soundFile
                );
            }

            state.context.variant = {
                ...state.context.variant,
                ...(data.variant || {}),
                ...payload
            };

            state.videoFile = null;
            state.soundFile = null;

            state.removeVideo = false;
            state.removeSound = false;

            state.dirty = false;

            await state.context
                .reload?.();

            setMessage(
                "Variante enregistrée.",
                "success"
            );
        } catch (error) {
            console.error(
                "Impossible d’enregistrer la variante :",
                error
            );

            setMessage(
                error.message ||
                "Impossible d’enregistrer la variante.",
                "error"
            );
        } finally {
            elements.saveButton.disabled =
                false;
        }
    }

    function requestClose() {
        if (
            state.dirty &&
            !window.confirm(
                "Fermer l’éditeur sans enregistrer les modifications ?"
            )
        ) {
            return;
        }

        closeEditor();
    }

    function closeEditor() {
        clearTimers();
        clearAnimations();
        cleanupLocalMedia();

        elements.videoPreview
            ?.pause();

        elements.soundPreview
            ?.pause();

        state.context = null;
        state.layout = null;

        state.selectedLayerId = null;
        state.dragging = null;

        state.videoFile = null;
        state.soundFile = null;

        state.removeVideo = false;
        state.removeSound = false;

        state.dirty = false;
        state.previewing = false;

        elements.dialog?.close();
    }

    function openEditor(context) {
        if (
            !context?.rule ||
            !context?.variant
        ) {
            return;
        }

        state.context = context;

        state.layout =
            normalizeLayout(
                context.variant.layout
            );

        state.selectedLayerId =
            state.layout.texts[0]?.id ||
            "video";

        state.videoFile = null;
        state.soundFile = null;

        state.removeVideo = false;
        state.removeSound = false;

        state.dirty = false;
        state.previewing = false;

        if (elements.rulePublicId) {
            elements.rulePublicId.value =
                context.rule.publicId;
        }

        if (elements.variantPublicId) {
            elements.variantPublicId.value =
                context.variant.publicId;
        }

        setInputValue(
            elements.variantName,
            context.variant.name ||
            "Variante"
        );

        setInputValue(
            elements.variantWeight,
            numberValue(
                context.variant.weight,
                1
            )
        );

        setCheckboxValue(
            elements.variantEnabled,
            context.variant.enabled !==
                false
        );

        if (elements.videoFile) {
            elements.videoFile.value =
                "";
        }

        if (elements.soundFile) {
            elements.soundFile.value =
                "";
        }

        const videoUrl =
            context.variant.videoUrl ||
            context.variant.media
                ?.videoUrl ||
            null;

        const soundUrl =
            context.variant.soundUrl ||
            context.variant.media
                ?.soundUrl ||
            null;

        setVideoSource(videoUrl);
        setSoundSource(soundUrl);

        prepareFonts();
        prepareColors();

        setMessage();

        renderCanvas();
        renderLayersList();
        renderProperties();

        elements.dialog?.showModal();
    }

    function bindNumberInput(
        element,
        property,
        {
            minimum = -Infinity,
            maximum = Infinity
        } = {}
    ) {
        element?.addEventListener(
            "input",
            () => {
                const value =
                    clamp(
                        numberValue(
                            element.value
                        ),
                        minimum,
                        maximum
                    );

                updateSelectedLayer({
                    [property]: value
                });
            }
        );
    }

    bindNumberInput(
        elements.layerX,
        "x",
        {
            minimum: 0
        }
    );

    bindNumberInput(
        elements.layerY,
        "y",
        {
            minimum: 0
        }
    );

    bindNumberInput(
        elements.layerWidth,
        "width",
        {
            minimum: 20
        }
    );

    bindNumberInput(
        elements.layerHeight,
        "height",
        {
            minimum: 20
        }
    );

    bindNumberInput(
        elements.layerRotation,
        "rotation",
        {
            minimum: -360,
            maximum: 360
        }
    );

    elements.layerOpacity
        ?.addEventListener(
            "input",
            () => {
                updateSelectedLayer({
                    opacity:
                        clamp(
                            opacityFromInput(),
                            0,
                            1
                        )
                });
            }
        );

    elements.layerVisible
        ?.addEventListener(
            "change",
            () => {
                updateSelectedLayer({
                    visible:
                        elements
                            .layerVisible
                            .checked
                });
            }
        );

    elements.videoFit
        ?.addEventListener(
            "change",
            () => {
                updateSelectedLayer({
                    fit:
                        elements
                            .videoFit
                            .value
                });
            }
        );

    elements.textName
        ?.addEventListener(
            "input",
            () => {
                updateSelectedLayer({
                    name:
                        elements
                            .textName
                            .value
                });
            }
        );

    elements.textTemplate
        ?.addEventListener(
            "input",
            () => {
                updateSelectedLayer({
                    template:
                        elements
                            .textTemplate
                            .value
                });
            }
        );

    elements.textFont
        ?.addEventListener(
            "change",
            () => {
                updateSelectedLayer({
                    fontFamily:
                        elements
                            .textFont
                            .value
                });
            }
        );

    elements.textColor
        ?.addEventListener(
            "input",
            () => {
                updateSelectedLayer({
                    color:
                        elements
                            .textColor
                            .value
                });
            }
        );

    elements.textAlign
        ?.addEventListener(
            "change",
            () => {
                updateSelectedLayer({
                    textAlign:
                        elements
                            .textAlign
                            .value
                });
            }
        );

    bindNumberInput(
        elements.textSize,
        "fontSizePx",
        {
            minimum: 10,
            maximum: 300
        }
    );

    bindNumberInput(
        elements.textWeight,
        "fontWeight",
        {
            minimum: 100,
            maximum: 900
        }
    );

    elements.textAnimation
        ?.addEventListener(
            "change",
            () => {
                updateSelectedLayer({
                    animation:
                        elements
                            .textAnimation
                            .value
                });
            }
        );

    bindNumberInput(
        elements.textDelay,
        "delayMs",
        {
            minimum: 0,
            maximum: 60000
        }
    );

    bindNumberInput(
        elements.textDuration,
        "durationMs",
        {
            minimum: 100,
            maximum: 60000
        }
    );

    elements.videoLayer
        ?.addEventListener(
            "pointerdown",
            event => {
                startDragging(
                    event,
                    "video"
                );
            }
        );

    elements.videoLayer
        ?.addEventListener(
            "click",
            event => {
                event.stopPropagation();
                selectLayer("video");
            }
        );

    elements.canvas
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    elements.canvas
                ) {
                    state.selectedLayerId =
                        null;

                    renderCanvas();
                    renderLayersList();
                    renderProperties();
                }
            }
        );

    window.addEventListener(
        "pointermove",
        moveDragging
    );

    window.addEventListener(
        "pointerup",
        stopDragging
    );

    window.addEventListener(
        "pointercancel",
        stopDragging
    );

    elements.addTextButton
        ?.addEventListener(
            "click",
            addTextLayer
        );

    elements.deleteTextButton
        ?.addEventListener(
            "click",
            deleteSelectedText
        );

    elements.videoFile
        ?.addEventListener(
            "change",
            handleVideoFile
        );

    elements.soundFile
        ?.addEventListener(
            "change",
            handleSoundFile
        );

    elements.removeVideoButton
        ?.addEventListener(
            "click",
            removeVideo
        );

    elements.removeSoundButton
        ?.addEventListener(
            "click",
            removeSound
        );

    elements.zoom
        ?.addEventListener(
            "input",
            applyZoom
        );

    elements.form
        ?.addEventListener(
            "submit",
            saveEditor
        );

    elements.testButton
        ?.addEventListener(
            "click",
            () => preview()
        );

    elements.replayButton
        ?.addEventListener(
            "click",
            () => {
                state.previewing = false;
                preview();
            }
        );

    elements.closeButton
        ?.addEventListener(
            "click",
            requestClose
        );

    elements.cancelButton
        ?.addEventListener(
            "click",
            requestClose
        );

    elements.dialog
        ?.addEventListener(
            "cancel",
            event => {
                event.preventDefault();
                requestClose();
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
                    requestClose();
                }
            }
        );

    elements.variantName
        ?.addEventListener(
            "input",
            markDirty
        );

    elements.variantWeight
        ?.addEventListener(
            "input",
            markDirty
        );

    elements.variantEnabled
        ?.addEventListener(
            "change",
            markDirty
        );

    window.JEventDonationAlertEditor = {
        open: openEditor,
        preview
    };
})();