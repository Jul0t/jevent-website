(() => {
    "use strict";

    const API_BASE =
        "https://api-beta.jevent.julot.fr";

    const MAX_TEXT_LAYERS = 3;

    const $ = selector =>
        document.querySelector(selector);

    const first = (...selectors) => {
        for (const selector of selectors) {
            const element = $(selector);

            if (element) {
                return element;
            }
        }

        return null;
    };

    const elements = {
        loading: $("#editorLoading"),
        error: $("#editorError"),
        errorMessage:
            $("#editorErrorMessage"),

        errorBackLink:
            $("#editorErrorBackLink"),

        application:
            $("#overlayEditorApplication"),

        backLink:
            $("#editorBackLink"),

        variantNameTop:
            $("#editorVariantNameTop"),

        saveState:
            $("#editorSaveState"),

        undoButton:
            $("#undoEditorButton"),

        redoButton:
            $("#redoEditorButton"),

        testButton:
            $("#testEditorButton"),

        saveButton:
            $("#saveEditorButton"),

        addTextButton:
            $("#addEditorTextButton"),

        addTextLargeButton:
            $("#addEditorTextLargeButton"),

        layersList:
            $("#editorLayersList"),

        layersEmpty:
            $("#editorLayersEmpty"),

        videoFile:
            $("#editorVideoFile"),

        soundFile:
            $("#editorSoundFile"),

        selectVideoButton:
            first(
                "#selectEditorVideoButton",
                "#editorSelectVideoButton"
            ),

        removeVideoButton:
            first(
                "#removeEditorVideoButton",
                "#editorRemoveVideoButton"
            ),

        selectSoundButton:
            first(
                "#selectEditorSoundButton",
                "#editorSelectSoundButton"
            ),

        removeSoundButton:
            first(
                "#removeEditorSoundButton",
                "#editorRemoveSoundButton"
            ),

        videoStatus:
            first(
                "#editorVideoStatus",
                "#editorVideoMediaStatus"
            ),

        soundStatus:
            first(
                "#editorSoundStatus",
                "#editorSoundMediaStatus"
            ),

        variantName:
            $("#editorVariantName"),

        variantWeight:
            $("#editorVariantWeight"),

        variantEnabled:
            $("#editorVariantEnabled"),

        canvasWidth:
            $("#editorCanvasWidth"),

        canvasHeight:
            $("#editorCanvasHeight"),

        totalDuration:
            $("#editorTotalDuration"),

        resolution:
            $("#editorResolution"),

        gridButton:
            $("#toggleEditorGridButton"),

        safeAreaButton:
            $("#toggleEditorSafeAreaButton"),

        zoomOutButton:
            $("#zoomOutEditorButton"),

        zoomInButton:
            $("#zoomInEditorButton"),

        zoomFitButton:
            $("#zoomFitEditorButton"),

        zoomValue:
            $("#editorZoomValue"),

        viewport:
            $("#editorViewport"),

        stage:
            $("#editorStage"),

        canvas:
            $("#editorCanvas"),

        grid:
            $("#editorGrid"),

        safeArea:
            $("#editorSafeArea"),

        videoLayer:
            $("#editorVideoLayer"),

        videoPreview:
            $("#editorVideoPreview"),

        videoPlaceholder:
            $("#editorVideoPlaceholder"),

        textLayers:
            $("#editorTextLayers"),

        selectionBox:
            $("#editorSelectionBox"),

        rotateHandle:
            $("#editorRotateHandle"),

        timeline:
            $("#editorTimeline"),

        timelineContent:
            $(".editor-timeline-content"),

        timelineRuler:
            $("#editorTimelineRuler"),

        timelineRows:
            $("#editorTimelineRows"),

        playhead:
            $("#editorPlayhead"),

        replayButton:
            $("#replayEditorButton"),

        timelineDuration:
            $("#editorTimelineDuration"),

        noSelection:
            $("#editorNoSelection"),

        properties:
            $("#editorProperties"),

        selectedLayerName:
            $("#editorSelectedLayerName"),

        selectedLayerType:
            $("#editorSelectedLayerType"),

        duplicateLayerButton:
            $("#duplicateEditorLayerButton"),

        deleteLayerButton:
            $("#deleteEditorLayerButton"),

        layerVisible:
            $("#editorLayerVisible"),

        layerLocked:
            $("#editorLayerLocked"),

        layerX:
            $("#editorLayerX"),

        layerY:
            $("#editorLayerY"),

        layerWidth:
            $("#editorLayerWidth"),

        layerHeight:
            $("#editorLayerHeight"),

        layerRotation:
            $("#editorLayerRotation"),

        layerOpacity:
            $("#editorLayerOpacity"),

        layerZIndex:
            $("#editorLayerZIndex"),

        textName:
            $("#editorTextName"),

        textTemplate:
            $("#editorTextTemplate"),

        textFont:
            $("#editorTextFont"),

        textSize:
            $("#editorTextSize"),

        textWeight:
            $("#editorTextWeight"),

        textColor:
            $("#editorTextColor"),

        textAlign:
            $("#editorTextAlign"),

        textLineHeight:
            $("#editorTextLineHeight"),

        textShadow:
            $("#editorTextShadow"),

        textProperties:
            $("#editorTextProperties"),

        videoProperties:
            $("#editorVideoProperties"),

        videoFit:
            $("#editorVideoFit"),

        videoLoop:
            $("#editorVideoLoop"),

        videoMuted:
            $("#editorVideoMuted"),

        animationProperties:
            $("#editorAnimationProperties"),

        enterAnimation:
            first(
                "#editorEnterAnimation",
                "#editorTextEnterAnimation"
            ),

        exitAnimation:
            first(
                "#editorExitAnimation",
                "#editorTextExitAnimation"
            ),

        animationDelay:
            first(
                "#editorAnimationDelay",
                "#editorTextDelay"
            ),

        animationDuration:
            first(
                "#editorAnimationDuration",
                "#editorTextDuration"
            ),

        selectedLayerStatus:
            $("#editorSelectedLayerStatus"),

        pointerCoordinates:
            $("#editorPointerCoordinates"),

        toastRegion:
            $("#editorToastRegion"),

    };

    Object.assign(elements, {
        resolution:
            $("#editorResolutionLabel"),

        zoomInput:
            $("#editorZoomInput"),

        zoomFitButton:
            $("#fitEditorCanvasButton"),

        timelineContent:
            $(".editor-timeline-content"),

        selectedLayerName:
            $("#selectedLayerName"),

        selectedLayerType:
            $("#selectedLayerType"),

        duplicateLayerButton:
            $("#duplicateLayerButton"),

        deleteLayerButton:
            $("#deleteLayerButton"),

        layerVisible:
            $("#layerVisible"),

        layerLocked:
            $("#layerLocked"),

        layerX:
            $("#layerX"),

        layerY:
            $("#layerY"),

        layerWidth:
            $("#layerWidth"),

        layerHeight:
            $("#layerHeight"),

        layerRotation:
            $("#layerRotation"),

        layerOpacity:
            $("#layerOpacity"),

        layerZIndex:
            $("#layerZIndex"),

        textProperties:
            $("#textLayerProperties"),

        textName:
            $("#textLayerName"),

        textTemplate:
            $("#textTemplate"),

        textFont:
            $("#textFontFamily"),

        textSize:
            $("#textFontSize"),

        textWeight:
            $("#textFontWeight"),

        textColor:
            $("#textColor"),

        textAlign:
            $("#textAlign"),

        textLineHeight:
            $("#textLineHeight"),

        textShadow:
            $("#textShadowEnabled"),

        videoProperties:
            $("#videoLayerProperties"),

        videoFit:
            $("#videoFit"),

        videoLoop:
            $("#videoLoop"),

        enterAnimation:
            $("#layerEnterAnimation"),

        exitAnimation:
            $("#layerExitAnimation"),

        animationDelay:
            $("#layerDelayMs"),

        animationDuration:
            $("#layerDurationMs")
    });

    const state = {
        creatorId: 0,
        rulePublicId: "",
        variantPublicId: "",

        rule: null,
        variant: null,
        settings: null,

        layout: null,
        selectedLayerId: null,

        zoom: 0.45,
        gridVisible: true,
        safeAreaVisible: true,

        dirty: false,
        saving: false,
        ready: false,

        videoFile: null,
        soundFile: null,

        removeVideo: false,
        removeSound: false,

        videoObjectUrl: null,
        soundObjectUrl: null,

        operation: null,

        currentTimeMs: 0,
        timelineScrubbing: false,

        history: [],
        future: [],

        previewAnimations: [],
        previewTimers: [],
        previewFrame: null,
        previewAudio: null
    };

    function clone(value) {
        if (
            typeof structuredClone ===
            "function"
        ) {
            return structuredClone(value);
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }

    function numberValue(
        value,
        fallback = 0
    ) {
        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : fallback;
    }

    function clamp(
        value,
        minimum,
        maximum
    ) {
        return Math.min(
            maximum,
            Math.max(minimum, value)
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

    function canvasWidth() {
        return numberValue(
            state.layout?.canvas?.width,
            1920
        );
    }

    function canvasHeight() {
        return numberValue(
            state.layout?.canvas?.height,
            1080
        );
    }

    function totalDurationMs() {
        const configured = numberValue(
            state.layout?.durationMs,
            6000
        );

        const textDuration =
            state.layout?.texts?.reduce(
                (maximum, layer) =>
                    Math.max(
                        maximum,
                        numberValue(
                            layer.delayMs,
                            0
                        ) +
                        numberValue(
                            layer.durationMs,
                            5000
                        )
                    ),
                0
            ) ?? 0;

        return Math.max(
            1000,
            configured,
            textDuration
        );
    }

    function defaultVideoLayer() {
        return {
            id: "video",
            type: "video",
            name: "Vidéo",

            visible: true,
            locked: false,

            x: 0,
            y: 0,

            width: 1920,
            height: 1080,

            rotation: 0,
            opacity: 1,
            zIndex: 0,

            fit: "contain",
            loop: false,
            muted: true
        };
    }

    function defaultTextLayer(
        position = 0
    ) {
        const defaults = [
            {
                name: "Nom et montant",
                template:
                    "{{donorName}} a donné {{amount}} {{unit}}",
                y: 330,
                fontSizePx: 82,
                fontWeight: 800
            },
            {
                name: "Message",
                template: "{{message}}",
                y: 500,
                fontSizePx: 46,
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
            defaults[position] ??
            defaults[2];

        return {
            id: createId(),
            type: "text",
            name: selected.name,

            visible: true,
            locked: false,

            template:
                selected.template,

            x: 160,
            y: selected.y,

            width: 1600,
            height: 160,

            rotation: 0,
            opacity: 1,
            zIndex: position + 1,

            fontFamily: "Inter",
            fontSizePx:
                selected.fontSizePx,

            fontWeight:
                selected.fontWeight,

            color: "#F4F0E6",
            textAlign: "center",
            lineHeight: 1.15,
            textShadow: true,

            delayMs: 0,
            durationMs: 5000,

            enterAnimation: "fade",
            exitAnimation: "fade"
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
            ...(layer || {}),

            id:
                layer?.id ??
                fallback.id,

            type: "text",

            visible:
                layer?.visible !== false,

            locked:
                Boolean(layer?.locked),

            x: numberValue(
                layer?.x,
                fallback.x
            ),

            y: numberValue(
                layer?.y,
                fallback.y
            ),

            width: Math.max(
                30,
                numberValue(
                    layer?.width,
                    fallback.width
                )
            ),

            height: Math.max(
                30,
                numberValue(
                    layer?.height,
                    fallback.height
                )
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

            lineHeight: numberValue(
                layer?.lineHeight,
                1.15
            ),

            textShadow:
                layer?.textShadow !== false,

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
            ),

            enterAnimation:
                layer?.enterAnimation ??
                layer?.animation ??
                "fade",

            exitAnimation:
                layer?.exitAnimation ??
                "fade"
        };
    }

    function normalizeLayout(layout) {
        const source =
            layout &&
                typeof layout === "object"
                ? clone(layout)
                : {};

        const width = clamp(
            numberValue(
                source.canvas?.width,
                1920
            ),
            320,
            3840
        );

        const height = clamp(
            numberValue(
                source.canvas?.height,
                1080
            ),
            180,
            2160
        );

        const video = {
            ...defaultVideoLayer(),
            ...(source.video || {})
        };

        video.id = "video";
        video.type = "video";

        video.visible =
            video.visible !== false;

        video.locked =
            Boolean(video.locked);

        video.opacity = clamp(
            numberValue(
                video.opacity,
                1
            ),
            0,
            1
        );

        return {
            version: 2,

            durationMs: Math.max(
                1000,
                numberValue(
                    source.durationMs,
                    6000
                )
            ),

            canvas: {
                width,
                height
            },

            video,

            texts:
                Array.isArray(source.texts)
                    ? source.texts
                        .slice(
                            0,
                            MAX_TEXT_LAYERS
                        )
                        .map(
                            normalizeTextLayer
                        )
                    : []
        };
    }

    async function apiFetch(
        pathname,
        options = {}
    ) {
        const headers = new Headers(
            options.headers || {}
        );

        headers.set(
            "Accept",
            "application/json"
        );

        if (
            options.body &&
            !(options.body instanceof FormData)
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );
        }

        const response = await fetch(
            API_BASE + pathname,
            {
                ...options,
                headers,
                credentials: "include"
            }
        );

        const raw = await response.text();

        let data = {};

        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch {
                data = {
                    error: raw
                };
            }
        }

        if (!response.ok) {
            const error = new Error(
                data.error ||
                "Une erreur est survenue."
            );

            error.status =
                response.status;

            error.data = data;

            throw error;
        }

        return data;
    }

    function routeParameters() {
        const url =
            new URL(window.location.href);

        return {
            creatorId:
                Number(
                    url.searchParams.get(
                        "creatorId"
                    )
                ),

            rulePublicId:
                url.searchParams.get(
                    "rule"
                ) ?? "",

            variantPublicId:
                url.searchParams.get(
                    "variant"
                ) ?? "",

            preview:
                url.searchParams.get(
                    "preview"
                ) === "1"
        };
    }

    function setPageState(
        loading,
        error,
        application
    ) {
        if (elements.loading) {
            elements.loading.hidden =
                !loading;
        }

        if (elements.error) {
            elements.error.hidden =
                !error;
        }

        if (elements.application) {
            elements.application.hidden =
                !application;
        }
    }

    function showError(error) {
        console.error(error);

        setPageState(
            false,
            true,
            false
        );

        if (elements.errorMessage) {
            elements.errorMessage.textContent =
                error.message ||
                "Impossible d’ouvrir l’éditeur.";
        }
    }

    function showToast(
        message,
        type = "success"
    ) {
        if (!elements.toastRegion) {
            return;
        }

        const toast =
            document.createElement("div");

        toast.className =
            `editor-toast is-${type}`;

        toast.textContent = message;

        elements.toastRegion.append(
            toast
        );

        window.setTimeout(
            () => toast.remove(),
            3500
        );
    }

    function setSaveState(text) {
        if (elements.saveState) {
            elements.saveState.textContent =
                text;
        }
    }

    function markDirty() {
        if (!state.ready) {
            return;
        }

        state.dirty = true;
        setSaveState(
            "Modifications non enregistrées"
        );
    }

    function markSaved() {
        state.dirty = false;
        setSaveState("Enregistré");
    }

    function createSnapshot() {
        return {
            layout:
                clone(state.layout),

            selectedLayerId:
                state.selectedLayerId,

            name:
                elements.variantName
                    ?.value ?? "",

            weight:
                elements.variantWeight
                    ?.value ?? "1",

            enabled:
                elements.variantEnabled
                    ?.checked ?? true
        };
    }

    function restoreSnapshot(snapshot) {
        if (!snapshot) {
            return;
        }

        state.layout =
            normalizeLayout(
                snapshot.layout
            );

        state.selectedLayerId =
            snapshot.selectedLayerId;

        if (elements.variantName) {
            elements.variantName.value =
                snapshot.name;
        }

        if (elements.variantWeight) {
            elements.variantWeight.value =
                snapshot.weight;
        }

        if (elements.variantEnabled) {
            elements.variantEnabled.checked =
                snapshot.enabled;
        }

        renderEverything();
        markDirty();
    }

    function pushHistory(snapshot) {
        state.history.push(
            snapshot ?? createSnapshot()
        );

        if (state.history.length > 60) {
            state.history.shift();
        }

        state.future = [];

        updateHistoryButtons();
    }

    function undo() {
        if (
            state.history.length === 0
        ) {
            return;
        }

        state.future.push(
            createSnapshot()
        );

        restoreSnapshot(
            state.history.pop()
        );

        updateHistoryButtons();
    }

    function redo() {
        if (
            state.future.length === 0
        ) {
            return;
        }

        state.history.push(
            createSnapshot()
        );

        restoreSnapshot(
            state.future.pop()
        );

        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        if (elements.undoButton) {
            elements.undoButton.disabled =
                state.history.length === 0;
        }

        if (elements.redoButton) {
            elements.redoButton.disabled =
                state.future.length === 0;
        }
    }

    function getLayer(layerId) {
        if (!state.layout) {
            return null;
        }

        if (layerId === "video") {
            return state.layout.video;
        }

        return (
            state.layout.texts.find(
                layer =>
                    layer.id === layerId
            ) ?? null
        );
    }

    function selectedLayer() {
        return getLayer(
            state.selectedLayerId
        );
    }

    function replaceVariables(template) {
        const values = {
            donorName: "Jean Dupont",
            name: "Jean Dupont",
            amount: "10.00",
            unit: "€",
            currency: "€",
            message:
                "Merci pour cet événement !",
            creator:
                state.rule?.creatorName ??
                "Créateur"
        };

        let result =
            String(template ?? "");

        for (
            const [key, value] of
            Object.entries(values)
        ) {
            const patterns = [
                `{{${key}}}`,
                `{${key}}`,
                `%${key}%`
            ];

            for (const pattern of patterns) {
                result =
                    result.replaceAll(
                        pattern,
                        value
                    );
            }
        }

        return result;
    }

    function mediaVideoUrl() {
        if (
            state.videoObjectUrl &&
            !state.removeVideo
        ) {
            return state.videoObjectUrl;
        }

        if (state.removeVideo) {
            return "";
        }

        return (
            state.variant?.videoUrl ??
            state.variant?.media
                ?.videoUrl ??
            ""
        );
    }

    function mediaSoundUrl() {
        if (
            state.soundObjectUrl &&
            !state.removeSound
        ) {
            return state.soundObjectUrl;
        }

        if (state.removeSound) {
            return "";
        }

        return (
            state.variant?.soundUrl ??
            state.variant?.media
                ?.soundUrl ??
            ""
        );
    }

    function applyLayerStyle(
        element,
        layer
    ) {
        if (!element || !layer) {
            return;
        }

        element.style.position =
            "absolute";

        element.style.left =
            `${layer.x}px`;

        element.style.top =
            `${layer.y}px`;

        element.style.width =
            `${layer.width}px`;

        element.style.height =
            `${layer.height}px`;

        element.style.opacity =
            String(layer.opacity);

        element.style.transform =
            `rotate(${layer.rotation}deg)`;

        element.style.zIndex =
            String(layer.zIndex);

        element.hidden =
            layer.visible === false;
    }

    function renderVideo() {
        const layer =
            state.layout.video;

        applyLayerStyle(
            elements.videoLayer,
            layer
        );

        const url =
            mediaVideoUrl();

        if (elements.videoPreview) {
            const current =
                elements.videoPreview
                    .getAttribute("src") ?? "";

            if (url && current !== url) {
                elements.videoPreview.src =
                    url;

                elements.videoPreview.load();
            }

            if (!url && current) {
                elements.videoPreview
                    .removeAttribute("src");

                elements.videoPreview.load();
            }

            elements.videoPreview.hidden =
                !url;

            elements.videoPreview.style
                .objectFit =
                layer.fit || "contain";

            elements.videoPreview.loop =
                Boolean(layer.loop);

            elements.videoPreview.muted =
                Boolean(layer.muted);
        }

        if (elements.videoPlaceholder) {
            elements.videoPlaceholder.hidden =
                Boolean(url);
        }

        if (elements.videoStatus) {
            elements.videoStatus.textContent =
                state.videoFile
                    ? state.videoFile.name
                    : url
                        ? "Vidéo configurée"
                        : "Aucune vidéo";
        }
    }

    function createTextElement(layer) {
        const element =
            document.createElement("div");

        element.className =
            "editor-canvas-text";

        element.dataset.layerId =
            layer.id;

        element.textContent =
            replaceVariables(
                layer.template
            );

        element.style.display = "flex";
        element.style.alignItems =
            "center";

        element.style.justifyContent =
            layer.textAlign === "left"
                ? "flex-start"
                : layer.textAlign === "right"
                    ? "flex-end"
                    : "center";

        element.style.padding =
            "8px";

        element.style.boxSizing =
            "border-box";

        element.style.whiteSpace =
            "pre-wrap";

        element.style.overflow =
            "hidden";

        element.style.fontFamily =
            layer.fontFamily;

        element.style.fontSize =
            `${layer.fontSizePx}px`;

        element.style.fontWeight =
            String(layer.fontWeight);

        element.style.color =
            layer.color;

        element.style.textAlign =
            layer.textAlign;

        element.style.lineHeight =
            String(layer.lineHeight);

        element.style.textShadow =
            layer.textShadow
                ? "0 3px 12px rgba(0, 0, 0, 0.72)"
                : "none";

        element.style.cursor =
            layer.locked
                ? "not-allowed"
                : "move";

        applyLayerStyle(
            element,
            layer
        );

        element.addEventListener(
            "pointerdown",
            event => {
                event.stopPropagation();

                selectLayer(layer.id);

                if (!layer.locked) {
                    startOperation(
                        event,
                        "move",
                        layer.id
                    );
                }
            }
        );

        return element;
    }

    function renderTextLayers() {
        if (!elements.textLayers) {
            return;
        }

        elements.textLayers
            .replaceChildren();

        const layers = [
            ...state.layout.texts
        ].sort(
            (firstLayer, secondLayer) =>
                firstLayer.zIndex -
                secondLayer.zIndex
        );

        for (const layer of layers) {
            elements.textLayers.append(
                createTextElement(layer)
            );
        }
    }

    function renderCanvas() {
        const width =
            canvasWidth();

        const height =
            canvasHeight();

        if (elements.canvas) {
            elements.canvas.style.width =
                `${width}px`;

            elements.canvas.style.height =
                `${height}px`;

            elements.canvas.style
                .transformOrigin =
                "top left";

            elements.canvas.style.transform =
                `scale(${state.zoom})`;
        }

        if (elements.stage) {
            elements.stage.style.width =
                `${width * state.zoom}px`;

            elements.stage.style.height =
                `${height * state.zoom}px`;
        }

        if (elements.resolution) {
            elements.resolution.textContent =
                `${width} × ${height}`;
        }

        if (elements.zoomValue) {
            elements.zoomValue.textContent =
                `${Math.round(
                    state.zoom * 100
                )} %`;
        }

        if (elements.grid) {
            elements.grid.hidden =
                !state.gridVisible;
        }

        if (elements.safeArea) {
            elements.safeArea.hidden =
                !state.safeAreaVisible;
        }

        if (elements.zoomInput) {
            elements.zoomInput.value =
                String(
                    Math.round(state.zoom * 100)
                );
        }


        renderVideo();
        renderTextLayers();
        renderSelection();
    }

    function renderSelection() {
        const layer =
            selectedLayer();

        if (
            !elements.selectionBox ||
            !layer ||
            layer.visible === false
        ) {
            if (elements.selectionBox) {
                elements.selectionBox.hidden =
                    true;
            }

            return;
        }

        elements.selectionBox.hidden =
            false;

        elements.selectionBox.style.left =
            `${layer.x}px`;

        elements.selectionBox.style.top =
            `${layer.y}px`;

        elements.selectionBox.style.width =
            `${layer.width}px`;

        elements.selectionBox.style.height =
            `${layer.height}px`;

        elements.selectionBox.style
            .transform =
            `rotate(${layer.rotation}deg)`;

        elements.selectionBox.style.zIndex =
            "1000";

        elements.selectionBox.classList
            .toggle(
                "is-locked",
                Boolean(layer.locked)
            );
    }

    function selectLayer(layerId) {
        state.selectedLayerId =
            getLayer(layerId)
                ? layerId
                : null;

        renderSelection();
        renderLayersList();
        renderProperties();
    }

    function layerTypeLabel(layer) {
        return layer?.type === "video"
            ? "Vidéo"
            : "Texte";
    }

    function renderLayersList() {
        if (!elements.layersList) {
            return;
        }

        elements.layersList
            .replaceChildren();

        const layers = [
            state.layout.video,
            ...state.layout.texts
        ].sort(
            (firstLayer, secondLayer) =>
                secondLayer.zIndex -
                firstLayer.zIndex
        );

        for (const layer of layers) {
            const row =
                document.createElement(
                    "article"
                );

            row.className =
                "editor-layer-row";

            row.classList.toggle(
                "is-selected",
                layer.id ===
                state.selectedLayerId
            );

            const selectButton =
                document.createElement(
                    "button"
                );

            selectButton.type = "button";
            selectButton.className =
                "editor-layer-select";

            const name =
                document.createElement(
                    "strong"
                );

            name.textContent =
                layer.name ||
                layerTypeLabel(layer);

            const type =
                document.createElement(
                    "span"
                );

            type.textContent =
                layerTypeLabel(layer);

            selectButton.append(
                name,
                type
            );

            selectButton.addEventListener(
                "click",
                () => selectLayer(layer.id)
            );

            const controls =
                document.createElement(
                    "div"
                );

            controls.className =
                "editor-layer-controls";

            const visibilityButton =
                document.createElement(
                    "button"
                );

            visibilityButton.type =
                "button";

            visibilityButton.title =
                layer.visible === false
                    ? "Afficher"
                    : "Masquer";

            visibilityButton.textContent =
                layer.visible === false
                    ? "Afficher"
                    : "Masquer";

            visibilityButton.addEventListener(
                "click",
                () => {
                    pushHistory();

                    layer.visible =
                        layer.visible === false;

                    markDirty();
                    renderEverything();
                }
            );

            const lockButton =
                document.createElement(
                    "button"
                );

            lockButton.type = "button";

            lockButton.title =
                layer.locked
                    ? "Déverrouiller"
                    : "Verrouiller";

            lockButton.textContent =
                layer.locked
                    ? "Déverrouiller"
                    : "Verrouiller";

            lockButton.addEventListener(
                "click",
                () => {
                    pushHistory();

                    layer.locked =
                        !layer.locked;

                    markDirty();
                    renderEverything();
                }
            );

            controls.append(
                visibilityButton,
                lockButton
            );

            row.append(
                selectButton,
                controls
            );

            elements.layersList.append(
                row
            );
        }

        if (elements.layersEmpty) {
            elements.layersEmpty.hidden =
                layers.length > 0;
        }

        const maximumReached =
            state.layout.texts.length >=
            MAX_TEXT_LAYERS;

        if (elements.addTextButton) {
            elements.addTextButton.disabled =
                maximumReached;
        }

        if (
            elements.addTextLargeButton
        ) {
            elements.addTextLargeButton
                .disabled =
                maximumReached;
        }
    }

    function setValue(
        element,
        value
    ) {
        if (element) {
            element.value =
                value ?? "";
        }
    }

    function setChecked(
        element,
        value
    ) {
        if (element) {
            element.checked =
                Boolean(value);
        }
    }

    function renderProperties() {
        const layer =
            selectedLayer();

        if (elements.noSelection) {
            elements.noSelection.hidden =
                Boolean(layer);
        }

        if (elements.properties) {
            elements.properties.hidden =
                !layer;
        }

        if (!layer) {
            if (
                elements.selectedLayerStatus
            ) {
                elements.selectedLayerStatus
                    .textContent =
                    "Aucun calque sélectionné";
            }

            return;
        }

        if (
            elements.selectedLayerName
        ) {
            elements.selectedLayerName
                .textContent =
                layer.name ||
                layerTypeLabel(layer);
        }

        if (
            elements.selectedLayerType
        ) {
            elements.selectedLayerType
                .textContent =
                layerTypeLabel(layer);
        }

        if (
            elements.selectedLayerStatus
        ) {
            elements.selectedLayerStatus
                .textContent =
                layer.locked
                    ? "Calque verrouillé"
                    : `${Math.round(
                        layer.x
                    )}, ${Math.round(
                        layer.y
                    )}`;
        }

        setChecked(
            elements.layerVisible,
            layer.visible !== false
        );

        setChecked(
            elements.layerLocked,
            layer.locked
        );

        setValue(
            elements.layerX,
            Math.round(layer.x)
        );

        setValue(
            elements.layerY,
            Math.round(layer.y)
        );

        setValue(
            elements.layerWidth,
            Math.round(layer.width)
        );

        setValue(
            elements.layerHeight,
            Math.round(layer.height)
        );

        setValue(
            elements.layerRotation,
            layer.rotation
        );

        setValue(
            elements.layerOpacity,
            Math.round(
                layer.opacity * 100
            )
        );

        setValue(
            elements.layerZIndex,
            layer.zIndex
        );

        const isText =
            layer.type === "text";

        if (elements.textProperties) {
            elements.textProperties.hidden =
                !isText;
        }

        if (elements.videoProperties) {
            elements.videoProperties.hidden =
                isText;
        }

        if (
            elements.animationProperties
        ) {
            elements.animationProperties
                .hidden =
                !isText;
        }

        if (
            elements.duplicateLayerButton
        ) {
            elements.duplicateLayerButton
                .hidden =
                !isText;
        }

        if (
            elements.deleteLayerButton
        ) {
            elements.deleteLayerButton
                .hidden =
                !isText;
        }

        if (isText) {
            setValue(
                elements.textName,
                layer.name
            );

            setValue(
                elements.textTemplate,
                layer.template
            );

            setValue(
                elements.textFont,
                layer.fontFamily
            );

            setValue(
                elements.textSize,
                layer.fontSizePx
            );

            setValue(
                elements.textWeight,
                layer.fontWeight
            );

            setValue(
                elements.textColor,
                layer.color
            );

            document
                .querySelectorAll(
                    "[data-editor-color]"
                )
                .forEach(button => {
                    button.classList.toggle(
                        "is-active",
                        button.dataset.editorColor
                            ?.toLowerCase() ===
                        String(layer.color)
                            .toLowerCase()
                    );
                });

            setValue(
                elements.textAlign,
                layer.textAlign
            );

            setValue(
                elements.textLineHeight,
                layer.lineHeight
            );

            setChecked(
                elements.textShadow,
                layer.textShadow
            );

            setValue(
                elements.enterAnimation,
                layer.enterAnimation
            );

            setValue(
                elements.exitAnimation,
                layer.exitAnimation
            );

            setValue(
                elements.animationDelay,
                layer.delayMs
            );

            setValue(
                elements.animationDuration,
                layer.durationMs
            );
        } else {
            setValue(
                elements.videoFit,
                layer.fit
            );

            setChecked(
                elements.videoLoop,
                layer.loop
            );

            setChecked(
                elements.videoMuted,
                layer.muted
            );
        }
    }

    function setPlayheadTime(
        rawTime,
        syncMedia = true
    ) {
        const duration =
            totalDurationMs();

        const time = clamp(
            numberValue(rawTime, 0),
            0,
            duration
        );

        state.currentTimeMs = time;

        if (
            elements.playhead &&
            elements.timelineContent
        ) {
            const availableWidth =
                Math.max(
                    1,
                    elements.timelineContent
                        .clientWidth - 170
                );

            elements.playhead.style.left =
                `${170 +
                time / duration *
                availableWidth
                }px`;
        }

        if (
            syncMedia &&
            elements.videoPreview &&
            Number.isFinite(
                elements.videoPreview.duration
            )
        ) {
            try {
                elements.videoPreview.currentTime =
                    Math.min(
                        time / 1000,
                        elements.videoPreview.duration
                    );
            } catch {
                // La vidéo n’est pas encore prête.
            }
        }
    }

    function seekTimeline(event) {
        if (!elements.timelineContent) {
            return;
        }

        const rect =
            elements.timelineContent
                .getBoundingClientRect();

        const trackLeft =
            rect.left + 170;

        const trackWidth =
            Math.max(
                1,
                rect.width - 170
            );

        const ratio = clamp(
            (
                event.clientX -
                trackLeft
            ) /
            trackWidth,
            0,
            1
        );

        setPlayheadTime(
            ratio * totalDurationMs()
        );
    }

    function startTimelineResize(
        event,
        layer
    ) {
        event.preventDefault();
        event.stopPropagation();

        const track =
            event.currentTarget.closest(
                ".editor-timeline-track"
            );

        if (!track) {
            return;
        }

        const startX =
            event.clientX;

        const trackWidth =
            Math.max(
                track.clientWidth,
                1
            );

        const timelineDuration =
            totalDurationMs();

        const startDuration =
            layer.type === "text"
                ? numberValue(
                    layer.durationMs,
                    5000
                )
                : numberValue(
                    state.layout.durationMs,
                    6000
                );

        pushHistory();

        const move = moveEvent => {
            const difference =
                (
                    moveEvent.clientX -
                    startX
                ) /
                trackWidth *
                timelineDuration;

            const duration = clamp(
                Math.round(
                    (
                        startDuration +
                        difference
                    ) / 100
                ) * 100,
                100,
                60000
            );

            if (layer.type === "text") {
                layer.durationMs =
                    duration;

                state.layout.durationMs =
                    Math.max(
                        state.layout.durationMs,
                        layer.delayMs +
                        duration
                    );
            } else {
                state.layout.durationMs =
                    Math.max(
                        1000,
                        duration
                    );
            }

            markDirty();
            renderGeneralSettings();
            renderTimeline();
            renderProperties();
        };

        const stop = () => {
            window.removeEventListener(
                "pointermove",
                move
            );
        };

        window.addEventListener(
            "pointermove",
            move
        );

        window.addEventListener(
            "pointerup",
            stop,
            {
                once: true
            }
        );
    }

    function renderTimeline() {
        if (!elements.timelineRows) {
            return;
        }

        const duration =
            totalDurationMs();

        elements.timelineRows
            .replaceChildren();

        const layers = [
            state.layout.video,
            ...state.layout.texts
        ].sort(
            (firstLayer, secondLayer) =>
                secondLayer.zIndex -
                firstLayer.zIndex
        );

        for (const layer of layers) {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "editor-timeline-row";

            const label =
                document.createElement(
                    "button"
                );

            label.type = "button";
            label.className =
                "editor-timeline-label";

            label.textContent =
                layer.name ||
                layerTypeLabel(layer);

            label.addEventListener(
                "click",
                () => selectLayer(layer.id)
            );

            const track =
                document.createElement(
                    "div"
                );

            track.className =
                "editor-timeline-track";

            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "editor-timeline-bar";

            const delay =
                layer.type === "text"
                    ? layer.delayMs
                    : 0;

            const layerDuration =
                layer.type === "text"
                    ? layer.durationMs
                    : duration;

            bar.style.left =
                `${delay / duration * 100}%`;

            bar.style.width =
                `${Math.min(
                    layerDuration,
                    duration - delay
                ) /
                duration *
                100
                }%`;

            bar.addEventListener(
                "click",
                () => selectLayer(layer.id)
            );

            const resizeHandle =
                document.createElement("button");

            resizeHandle.type = "button";

            resizeHandle.className =
                "editor-timeline-resize";

            resizeHandle.title =
                "Modifier la durée";

            resizeHandle.setAttribute(
                "aria-label",
                "Modifier la durée"
            );

            resizeHandle.addEventListener(
                "pointerdown",
                event => {
                    startTimelineResize(
                        event,
                        layer
                    );
                }
            );

            bar.append(
                resizeHandle
            );

            track.append(bar);

            row.append(
                label,
                track
            );

            elements.timelineRows.append(
                row
            );
        }

        if (elements.timelineRuler) {
            elements.timelineRuler
                .replaceChildren();

            const seconds =
                Math.ceil(
                    duration / 1000
                );

            for (
                let second = 0;
                second <= seconds;
                second += 1
            ) {
                const marker =
                    document.createElement(
                        "span"
                    );

                marker.textContent =
                    `${second}s`;

                marker.style.left =
                    `${second / seconds * 100}%`;

                elements.timelineRuler.append(
                    marker
                );
            }
        }

        if (elements.timelineDuration) {
            elements.timelineDuration
                .textContent =
                `${(
                    duration / 1000
                ).toFixed(1)} s`;
        }
        setPlayheadTime(
            state.currentTimeMs,
            false
        );

    }

    function renderGeneralSettings() {
        if (elements.variantNameTop) {
            elements.variantNameTop
                .textContent =
                elements.variantName
                    ?.value ||
                state.variant?.name ||
                "Variante";
        }

        setValue(
            elements.canvasWidth,
            canvasWidth()
        );

        setValue(
            elements.canvasHeight,
            canvasHeight()
        );

        setValue(
            elements.totalDuration,
            totalDurationMs()
        );

        if (elements.soundStatus) {
            elements.soundStatus.textContent =
                state.soundFile
                    ? state.soundFile.name
                    : mediaSoundUrl()
                        ? "Son configuré"
                        : "Aucun son";
        }
    }

    function renderEverything() {
        renderGeneralSettings();
        renderCanvas();
        renderLayersList();
        renderProperties();
        renderTimeline();
        updateHistoryButtons();
    }

    function addTextLayer() {
        if (
            state.layout.texts.length >=
            MAX_TEXT_LAYERS
        ) {
            showToast(
                "Trois textes maximum.",
                "error"
            );

            return;
        }

        pushHistory();

        const layer =
            defaultTextLayer(
                state.layout.texts.length
            );

        state.layout.texts.push(layer);

        state.selectedLayerId =
            layer.id;

        markDirty();
        renderEverything();
    }

    function duplicateSelectedLayer() {
        const layer =
            selectedLayer();

        if (
            !layer ||
            layer.type !== "text"
        ) {
            return;
        }

        if (
            state.layout.texts.length >=
            MAX_TEXT_LAYERS
        ) {
            showToast(
                "Trois textes maximum.",
                "error"
            );

            return;
        }

        pushHistory();

        const duplicate = {
            ...clone(layer),

            id: createId(),

            name:
                `${layer.name} - copie`,

            x: layer.x + 30,
            y: layer.y + 30,

            zIndex:
                Math.max(
                    ...state.layout.texts.map(
                        item => item.zIndex
                    ),
                    state.layout.video.zIndex
                ) + 1
        };

        state.layout.texts.push(
            duplicate
        );

        state.selectedLayerId =
            duplicate.id;

        markDirty();
        renderEverything();
    }

    function deleteSelectedLayer() {
        const layer =
            selectedLayer();

        if (
            !layer ||
            layer.type !== "text"
        ) {
            return;
        }

        pushHistory();

        state.layout.texts =
            state.layout.texts.filter(
                item =>
                    item.id !== layer.id
            );

        state.selectedLayerId =
            null;

        markDirty();
        renderEverything();
    }

    function pointerPosition(event) {
        const rect =
            elements.canvas
                .getBoundingClientRect();

        return {
            x:
                (
                    event.clientX -
                    rect.left
                ) *
                (
                    canvasWidth() /
                    rect.width
                ),

            y:
                (
                    event.clientY -
                    rect.top
                ) *
                (
                    canvasHeight() /
                    rect.height
                )
        };
    }

    function startOperation(
        event,
        type,
        layerId,
        handle = ""
    ) {
        const layer =
            getLayer(layerId);

        if (
            !layer ||
            layer.locked
        ) {
            return;
        }

        event.preventDefault();

        const point =
            pointerPosition(event);

        state.operation = {
            pointerId:
                event.pointerId,

            type,
            handle,
            layerId,

            startPoint: point,

            original:
                clone(layer),

            snapshot:
                createSnapshot(),

            changed: false
        };

        document.body.classList.add(
            "is-editor-dragging"
        );
    }

    function resizeLayer(
        layer,
        original,
        handle,
        dx,
        dy
    ) {
        let x = original.x;
        let y = original.y;

        let width =
            original.width;

        let height =
            original.height;

        if (handle.includes("e")) {
            width =
                original.width + dx;
        }

        if (handle.includes("s")) {
            height =
                original.height + dy;
        }

        if (handle.includes("w")) {
            width =
                original.width - dx;

            x =
                original.x + dx;
        }

        if (handle.includes("n")) {
            height =
                original.height - dy;

            y =
                original.y + dy;
        }

        if (width < 30) {
            if (handle.includes("w")) {
                x =
                    original.x +
                    original.width -
                    30;
            }

            width = 30;
        }

        if (height < 30) {
            if (handle.includes("n")) {
                y =
                    original.y +
                    original.height -
                    30;
            }

            height = 30;
        }

        layer.x = clamp(
            x,
            0,
            canvasWidth() - width
        );

        layer.y = clamp(
            y,
            0,
            canvasHeight() - height
        );

        layer.width = Math.min(
            width,
            canvasWidth() - layer.x
        );

        layer.height = Math.min(
            height,
            canvasHeight() - layer.y
        );
    }

    function handlePointerMove(event) {
        const operation =
            state.operation;

        if (
            !operation ||
            operation.pointerId !==
            event.pointerId
        ) {
            return;
        }

        const layer =
            getLayer(operation.layerId);

        if (!layer) {
            return;
        }

        const point =
            pointerPosition(event);

        const dx =
            point.x -
            operation.startPoint.x;

        const dy =
            point.y -
            operation.startPoint.y;

        if (
            operation.type === "move"
        ) {
            layer.x = clamp(
                operation.original.x + dx,
                0,
                canvasWidth() -
                layer.width
            );

            layer.y = clamp(
                operation.original.y + dy,
                0,
                canvasHeight() -
                layer.height
            );
        }

        if (
            operation.type === "resize"
        ) {
            resizeLayer(
                layer,
                operation.original,
                operation.handle,
                dx,
                dy
            );
        }

        if (
            operation.type === "rotate"
        ) {
            const centerX =
                operation.original.x +
                operation.original.width / 2;

            const centerY =
                operation.original.y +
                operation.original.height / 2;

            const angle =
                Math.atan2(
                    point.y - centerY,
                    point.x - centerX
                ) *
                180 /
                Math.PI +
                90;

            layer.rotation =
                Math.round(angle);
        }

        operation.changed = true;

        markDirty();
        renderCanvas();
        renderProperties();

        if (
            elements.pointerCoordinates
        ) {
            elements.pointerCoordinates
                .textContent =
                `X ${Math.round(
                    point.x
                )} · Y ${Math.round(
                    point.y
                )}`;
        }
    }

    function endOperation(event) {
        const operation =
            state.operation;

        if (
            !operation ||
            operation.pointerId !==
            event.pointerId
        ) {
            return;
        }

        if (operation.changed) {
            pushHistory(
                operation.snapshot
            );

            renderLayersList();
            renderTimeline();
        }

        state.operation = null;

        document.body.classList.remove(
            "is-editor-dragging"
        );
    }

    function updateLayerProperty(
        property,
        value
    ) {
        const layer =
            selectedLayer();

        if (!layer) {
            return;
        }

        layer[property] = value;

        markDirty();
        renderCanvas();
        renderLayersList();
        renderProperties();
        renderTimeline();
    }

    function bindNumericProperty(
        element,
        property,
        {
            minimum = -Infinity,
            maximum = Infinity,
            transform = value => value
        } = {}
    ) {
        if (!element) {
            return;
        }

        let snapshot = null;

        element.addEventListener(
            "focus",
            () => {
                snapshot =
                    createSnapshot();
            }
        );

        element.addEventListener(
            "input",
            () => {
                const layer =
                    selectedLayer();

                if (!layer) {
                    return;
                }

                let value =
                    numberValue(
                        element.value,
                        layer[property]
                    );

                value = clamp(
                    value,
                    minimum,
                    maximum
                );

                layer[property] =
                    transform(value);

                markDirty();
                renderCanvas();
                renderLayersList();
            }
        );

        element.addEventListener(
            "change",
            () => {
                if (snapshot) {
                    pushHistory(snapshot);
                    snapshot = null;
                }

                renderProperties();
                renderTimeline();
            }
        );
    }

    function bindTextProperty(
        element,
        property
    ) {
        if (!element) {
            return;
        }

        let snapshot = null;

        element.addEventListener(
            "focus",
            () => {
                snapshot =
                    createSnapshot();
            }
        );

        element.addEventListener(
            "input",
            () => {
                const layer =
                    selectedLayer();

                if (!layer) {
                    return;
                }

                layer[property] =
                    element.value;

                markDirty();
                renderCanvas();
                renderLayersList();
            }
        );

        element.addEventListener(
            "change",
            () => {
                if (snapshot) {
                    pushHistory(snapshot);
                    snapshot = null;
                }

                renderProperties();
                renderTimeline();
            }
        );
    }

    function clearPreview() {
        for (
            const animation of
            state.previewAnimations
        ) {
            try {
                animation.cancel();
            } catch {
                // Rien à faire.
            }
        }

        for (
            const timer of
            state.previewTimers
        ) {
            window.clearTimeout(timer);
        }

        if (state.previewFrame) {
            cancelAnimationFrame(
                state.previewFrame
            );
        }

        if (state.previewAudio) {
            state.previewAudio.pause();
            state.previewAudio = null;
        }

        state.previewAnimations = [];
        state.previewTimers = [];
        state.previewFrame = null;

        setPlayheadTime(0);

    }

    function enterKeyframes(
        layer,
        element
    ) {
        const base =
            `rotate(${layer.rotation}deg)`;

        switch (
        layer.enterAnimation
        ) {
            case "slide-up":
                return [
                    {
                        opacity: 0,
                        transform:
                            `${base} translateY(60px)`
                    },
                    {
                        opacity:
                            layer.opacity,
                        transform:
                            `${base} translateY(0)`
                    }
                ];

            case "slide-left":
                return [
                    {
                        opacity: 0,
                        transform:
                            `${base} translateX(80px)`
                    },
                    {
                        opacity:
                            layer.opacity,
                        transform:
                            `${base} translateX(0)`
                    }
                ];

            case "zoom":
                return [
                    {
                        opacity: 0,
                        transform:
                            `${base} scale(0.6)`
                    },
                    {
                        opacity:
                            layer.opacity,
                        transform:
                            `${base} scale(1)`
                    }
                ];

            case "bounce":
                return [
                    {
                        opacity: 0,
                        transform:
                            `${base} scale(0.4)`
                    },
                    {
                        opacity:
                            layer.opacity,
                        transform:
                            `${base} scale(1.12)`
                    },
                    {
                        opacity:
                            layer.opacity,
                        transform:
                            `${base} scale(1)`
                    }
                ];

            case "none":
                return [
                    {
                        opacity:
                            layer.opacity
                    },
                    {
                        opacity:
                            layer.opacity
                    }
                ];

            default:
                return [
                    {
                        opacity: 0
                    },
                    {
                        opacity:
                            layer.opacity
                    }
                ];
        }
    }

    function preview() {
        clearPreview();
        renderCanvas();

        const duration =
            totalDurationMs();

        const textElements =
            elements.textLayers
                ?.querySelectorAll(
                    "[data-layer-id]"
                ) ?? [];

        for (
            const element of textElements
        ) {
            const layer =
                getLayer(
                    element.dataset.layerId
                );

            if (
                !layer ||
                layer.visible === false
            ) {
                continue;
            }

            element.style.opacity = "0";

            const timer =
                window.setTimeout(
                    () => {
                        const animation =
                            element.animate(
                                enterKeyframes(
                                    layer,
                                    element
                                ),
                                {
                                    duration: 450,
                                    easing:
                                        "cubic-bezier(.2,.8,.2,1)",
                                    fill: "forwards"
                                }
                            );

                        state.previewAnimations.push(
                            animation
                        );
                    },
                    layer.delayMs
                );

            state.previewTimers.push(
                timer
            );

            const hideAt =
                layer.delayMs +
                layer.durationMs;

            const hideTimer =
                window.setTimeout(
                    () => {
                        const animation =
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
                                    duration: 300,
                                    fill: "forwards"
                                }
                            );

                        state.previewAnimations.push(
                            animation
                        );
                    },
                    hideAt
                );

            state.previewTimers.push(
                hideTimer
            );
        }

        if (
            elements.videoPreview &&
            mediaVideoUrl()
        ) {
            elements.videoPreview
                .currentTime = 0;

            elements.videoPreview
                .play()
                .catch(() => { });
        }

        const soundUrl =
            mediaSoundUrl();

        if (soundUrl) {
            state.previewAudio =
                new Audio(soundUrl);

            state.previewAudio
                .play()
                .catch(() => { });
        }

        const startedAt =
            performance.now();

        const updatePlayhead = now => {
            const elapsed =
                now - startedAt;

            setPlayheadTime(
                elapsed,
                false
            );

            if (elapsed < duration) {
                state.previewFrame =
                    requestAnimationFrame(
                        updatePlayhead
                    );
            }
        };

        state.previewFrame =
            requestAnimationFrame(
                updatePlayhead
            );
    }

    function revokeObjectUrl(key) {
        if (!state[key]) {
            return;
        }

        URL.revokeObjectURL(
            state[key]
        );

        state[key] = null;
    }

    function selectVideoFile() {
        const file =
            elements.videoFile
                ?.files?.[0];

        if (!file) {
            return;
        }

        const maximum =
            numberValue(
                state.settings?.limits
                    ?.maximumVideoFileSizeBytes,
                15 * 1024 * 1024
            );

        if (
            !file.type.startsWith(
                "video/"
            )
        ) {
            showToast(
                "Le fichier doit être une vidéo.",
                "error"
            );

            return;
        }

        if (file.size > maximum) {
            showToast(
                `Vidéo trop lourde. Maximum : ${Math.round(
                    maximum / 1024 / 1024
                )} Mo.`,
                "error"
            );

            elements.videoFile.value =
                "";

            return;
        }

        pushHistory();

        revokeObjectUrl(
            "videoObjectUrl"
        );

        state.videoFile = file;
        state.removeVideo = false;

        state.videoObjectUrl =
            URL.createObjectURL(file);

        const metadataVideo =
            document.createElement(
                "video"
            );

        metadataVideo.preload =
            "metadata";

        metadataVideo.src =
            state.videoObjectUrl;

        metadataVideo.addEventListener(
            "loadedmetadata",
            () => {
                if (
                    !Number.isFinite(
                        metadataVideo.duration
                    )
                ) {
                    return;
                }

                const duration =
                    clamp(
                        Math.round(
                            metadataVideo.duration *
                            1000
                        ),
                        1000,
                        60000
                    );

                state.layout.durationMs =
                    duration;

                for (
                    const text of
                    state.layout.texts
                ) {
                    text.durationMs =
                        Math.max(
                            100,
                            duration -
                            numberValue(
                                text.delayMs,
                                0
                            )
                        );
                }

                markDirty();
                renderEverything();
            },
            {
                once: true
            }
        );

        markDirty();
        renderEverything();
    }

    function selectSoundFile() {
        const file =
            elements.soundFile
                ?.files?.[0];

        if (!file) {
            return;
        }

        const maximum =
            numberValue(
                state.settings?.limits
                    ?.maximumSoundFileSizeBytes,
                8 * 1024 * 1024
            );

        if (
            !file.type.startsWith(
                "audio/"
            )
        ) {
            showToast(
                "Le fichier doit être un son.",
                "error"
            );

            return;
        }

        if (file.size > maximum) {
            showToast(
                `Son trop lourd. Maximum : ${Math.round(
                    maximum / 1024 / 1024
                )} Mo.`,
                "error"
            );

            elements.soundFile.value =
                "";

            return;
        }

        revokeObjectUrl(
            "soundObjectUrl"
        );

        state.soundFile = file;
        state.removeSound = false;

        state.soundObjectUrl =
            URL.createObjectURL(file);

        markDirty();
        renderGeneralSettings();
    }

    function removeVideo() {
        revokeObjectUrl(
            "videoObjectUrl"
        );

        state.videoFile = null;
        state.removeVideo = true;

        if (elements.videoFile) {
            elements.videoFile.value =
                "";
        }

        markDirty();
        renderEverything();
    }

    function removeSound() {
        revokeObjectUrl(
            "soundObjectUrl"
        );

        state.soundFile = null;
        state.removeSound = true;

        if (elements.soundFile) {
            elements.soundFile.value =
                "";
        }

        markDirty();
        renderGeneralSettings();
    }

    function mediaPath(type) {
        return (
            "/api/creator-panel/" +
            "donation-alerts/" +
            encodeURIComponent(
                state.rulePublicId
            ) +
            "/variants/" +
            encodeURIComponent(
                state.variantPublicId
            ) +
            `/media/${type}` +
            `?creatorId=${encodeURIComponent(
                state.creatorId
            )}`
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

        await apiFetch(
            mediaPath(type),
            {
                method: "POST",
                body: formData
            }
        );
    }

    async function deleteMedia(type) {
        await apiFetch(
            mediaPath(type),
            {
                method: "DELETE"
            }
        );
    }

    async function saveEditor() {
        if (state.saving) {
            return;
        }

        const name =
            elements.variantName
                ?.value.trim();

        if (!name) {
            showToast(
                "Le nom de la variante est obligatoire.",
                "error"
            );

            elements.variantName
                ?.focus();

            return;
        }

        state.saving = true;

        if (elements.saveButton) {
            elements.saveButton.disabled =
                true;
        }

        setSaveState(
            "Enregistrement…"
        );

        try {
            const path =
                (
                    "/api/creator-panel/" +
                    "donation-alerts/" +
                    encodeURIComponent(
                        state.rulePublicId
                    ) +
                    "/variants/" +
                    encodeURIComponent(
                        state.variantPublicId
                    ) +
                    `?creatorId=${encodeURIComponent(
                        state.creatorId
                    )}`
                );

            const payload = {
                name,

                enabled:
                    elements.variantEnabled
                        ?.checked ?? true,

                weight: Math.max(
                    1,
                    numberValue(
                        elements.variantWeight
                            ?.value,
                        1
                    )
                ),

                layout:
                    state.layout
            };

            await apiFetch(
                path,
                {
                    method: "PUT",
                    body:
                        JSON.stringify(payload)
                }
            );

            if (state.removeVideo) {
                await deleteMedia("video");
            }

            if (state.removeSound) {
                await deleteMedia("sound");
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

            state.videoFile = null;
            state.soundFile = null;

            state.removeVideo = false;
            state.removeSound = false;

            state.history = [];
            state.future = [];

            await loadEditorData(
                false
            );

            markSaved();

            showToast(
                "Variante enregistrée."
            );
        } catch (error) {
            console.error(error);

            setSaveState(
                "Erreur d’enregistrement"
            );

            showToast(
                error.message,
                "error"
            );
        } finally {
            state.saving = false;

            if (elements.saveButton) {
                elements.saveButton.disabled =
                    false;
            }
        }
    }

    function fitZoom() {
        if (
            !elements.viewport ||
            !state.layout
        ) {
            return;
        }

        const availableWidth =
            elements.viewport.clientWidth -
            60;

        const availableHeight =
            elements.viewport.clientHeight -
            60;

        state.zoom = clamp(
            Math.min(
                availableWidth /
                canvasWidth(),

                availableHeight /
                canvasHeight()
            ),
            0.1,
            1.5
        );

        renderCanvas();
    }

    async function loadEditorData(
        initialize = true
    ) {
        const data =
            await apiFetch(
                `/api/creator-panel/donation-alerts?creatorId=${encodeURIComponent(
                    state.creatorId
                )}`
            );

        const rules =
            Array.isArray(data.rules)
                ? data.rules
                : [];

        const rule =
            rules.find(
                item =>
                    item.publicId ===
                    state.rulePublicId
            );

        if (!rule) {
            throw new Error(
                "Cette règle d’alerte n’existe pas."
            );
        }

        const variants =
            Array.isArray(rule.variants)
                ? rule.variants
                : [];

        const variant =
            variants.find(
                item =>
                    item.publicId ===
                    state.variantPublicId
            );

        if (!variant) {
            throw new Error(
                "Cette variante n’existe pas."
            );
        }

        state.rule = rule;
        state.variant = variant;

        state.settings =
            data.editor ?? {};

        if (initialize) {
            state.layout =
                normalizeLayout(
                    variant.layout
                );

            state.selectedLayerId =
                state.layout.texts[0]?.id ??
                "video";

            if (elements.variantName) {
                elements.variantName.value =
                    variant.name ?? "";
            }

            if (
                elements.variantWeight
            ) {
                elements.variantWeight.value =
                    String(
                        variant.weight ?? 1
                    );
            }

            if (
                elements.variantEnabled
            ) {
                elements.variantEnabled.checked =
                    variant.enabled !== false;
            }

            document.title =
                `${variant.name} — Éditeur JEvent`;
        }

        renderEverything();
    }

    function bindTabs() {
        const buttons =
            document.querySelectorAll(
                "[data-editor-sidebar-tab]"
            );

        const panels =
            document.querySelectorAll(
                "[data-editor-sidebar-content]"
            );

        for (const button of buttons) {
            button.addEventListener(
                "click",
                () => {
                    const selected =
                        button.dataset
                            .editorSidebarTab;

                    for (
                        const item of buttons
                    ) {
                        item.classList.toggle(
                            "is-active",
                            item === button
                        );
                    }

                    for (
                        const panel of panels
                    ) {
                        panel.hidden =
                            panel.dataset
                                .editorSidebarContent !==
                            selected;
                    }
                }
            );
        }
    }

    function bindVariableButtons() {
        const variables = {
            "{name}":
                "{{donorName}}",

            "{amount}":
                "{{amount}}",

            "{message}":
                "{{message}}",

            "{creator}":
                "{{creator}}"
        };

        document
            .querySelectorAll(
                "[data-editor-variable]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const layer =
                            selectedLayer();

                        if (
                            !layer ||
                            layer.type !== "text"
                        ) {
                            return;
                        }

                        const textarea =
                            elements.textTemplate;

                        const raw =
                            button.dataset
                                .editorVariable;

                        const variable =
                            variables[raw] ?? raw;

                        if (!textarea) {
                            return;
                        }

                        const start =
                            textarea.selectionStart;

                        const end =
                            textarea.selectionEnd;

                        const current =
                            textarea.value;

                        textarea.value =
                            current.slice(0, start) +
                            variable +
                            current.slice(end);

                        textarea.selectionStart =
                            textarea.selectionEnd =
                            start +
                            variable.length;

                        textarea.dispatchEvent(
                            new Event(
                                "input",
                                {
                                    bubbles: true
                                }
                            )
                        );

                        textarea.focus();
                    }
                );
            });
    }

    function bindColorButtons() {
        document
            .querySelectorAll(
                "[data-editor-color]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const layer =
                            selectedLayer();

                        if (
                            !layer ||
                            layer.type !== "text"
                        ) {
                            return;
                        }

                        pushHistory();

                        layer.color =
                            button.dataset
                                .editorColor;

                        markDirty();
                        renderEverything();
                    }
                );
            });
    }

    function bindSelectionHandles() {
        elements.selectionBox
            ?.addEventListener(
                "pointerdown",
                event => {
                    if (
                        event.target.closest(
                            "[data-resize-handle]"
                        ) ||
                        event.target.closest(
                            "#editorRotateHandle"
                        )
                    ) {
                        return;
                    }

                    const layer =
                        selectedLayer();

                    if (
                        layer &&
                        !layer.locked
                    ) {
                        startOperation(
                            event,
                            "move",
                            layer.id
                        );
                    }
                }
            );

        document
            .querySelectorAll(
                "[data-resize-handle]"
            )
            .forEach(handle => {
                handle.addEventListener(
                    "pointerdown",
                    event => {
                        event.stopPropagation();

                        const layer =
                            selectedLayer();

                        if (!layer) {
                            return;
                        }

                        startOperation(
                            event,
                            "resize",
                            layer.id,
                            handle.dataset
                                .resizeHandle
                        );
                    }
                );
            });

        elements.rotateHandle
            ?.addEventListener(
                "pointerdown",
                event => {
                    event.stopPropagation();

                    const layer =
                        selectedLayer();

                    if (!layer) {
                        return;
                    }

                    startOperation(
                        event,
                        "rotate",
                        layer.id
                    );
                }
            );
    }

    function bindEvents() {
        bindTabs();
        bindVariableButtons();
        bindColorButtons();
        bindSelectionHandles();

        elements.canvas
            ?.addEventListener(
                "pointerdown",
                event => {
                    if (
                        event.target ===
                        elements.canvas ||
                        event.target ===
                        elements.grid ||
                        event.target ===
                        elements.safeArea
                    ) {
                        selectLayer(null);
                    }
                }
            );

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            endOperation
        );

        elements.addTextButton
            ?.addEventListener(
                "click",
                addTextLayer
            );

        elements.addTextLargeButton
            ?.addEventListener(
                "click",
                addTextLayer
            );

        elements.duplicateLayerButton
            ?.addEventListener(
                "click",
                duplicateSelectedLayer
            );

        elements.deleteLayerButton
            ?.addEventListener(
                "click",
                deleteSelectedLayer
            );

        elements.undoButton
            ?.addEventListener(
                "click",
                undo
            );

        elements.redoButton
            ?.addEventListener(
                "click",
                redo
            );

        elements.testButton
            ?.addEventListener(
                "click",
                preview
            );

        elements.replayButton
            ?.addEventListener(
                "click",
                preview
            );

        elements.timelineContent
            ?.addEventListener(
                "pointerdown",
                event => {
                    if (
                        event.target.closest(
                            ".editor-timeline-label"
                        ) ||
                        event.target.closest(
                            ".editor-timeline-resize"
                        )
                    ) {
                        return;
                    }

                    clearPreview();
                    renderCanvas();

                    state.timelineScrubbing =
                        true;

                    seekTimeline(event);
                }
            );

        window.addEventListener(
            "pointermove",
            event => {
                if (
                    state.timelineScrubbing
                ) {
                    seekTimeline(event);
                }
            }
        );

        window.addEventListener(
            "pointerup",
            () => {
                state.timelineScrubbing =
                    false;
            }
        );

        elements.saveButton
            ?.addEventListener(
                "click",
                saveEditor
            );

        elements.selectVideoButton
            ?.addEventListener(
                "click",
                () =>
                    elements.videoFile
                        ?.click()
            );

        elements.selectSoundButton
            ?.addEventListener(
                "click",
                () =>
                    elements.soundFile
                        ?.click()
            );

        elements.videoFile
            ?.addEventListener(
                "change",
                selectVideoFile
            );

        elements.soundFile
            ?.addEventListener(
                "change",
                selectSoundFile
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

        elements.gridButton
            ?.addEventListener(
                "click",
                () => {
                    state.gridVisible =
                        !state.gridVisible;

                    renderCanvas();
                }
            );

        elements.safeAreaButton
            ?.addEventListener(
                "click",
                () => {
                    state.safeAreaVisible =
                        !state.safeAreaVisible;

                    renderCanvas();
                }
            );

        elements.zoomInButton
            ?.addEventListener(
                "click",
                () => {
                    state.zoom = clamp(
                        state.zoom + 0.1,
                        0.1,
                        2
                    );

                    renderCanvas();
                }
            );

        elements.zoomOutButton
            ?.addEventListener(
                "click",
                () => {
                    state.zoom = clamp(
                        state.zoom - 0.1,
                        0.1,
                        2
                    );

                    renderCanvas();
                }
            );

        elements.zoomFitButton
            ?.addEventListener(
                "click",
                fitZoom
            );

        elements.zoomInput?.addEventListener(
            "input",
            () => {
                state.zoom = clamp(
                    Number(
                        elements.zoomInput.value
                    ) / 100,
                    0.1,
                    2
                );

                renderCanvas();
            }
        );


        bindNumericProperty(
            elements.layerX,
            "x",
            {
                minimum: 0
            }
        );

        bindNumericProperty(
            elements.layerY,
            "y",
            {
                minimum: 0
            }
        );

        bindNumericProperty(
            elements.layerWidth,
            "width",
            {
                minimum: 30
            }
        );

        bindNumericProperty(
            elements.layerHeight,
            "height",
            {
                minimum: 30
            }
        );

        bindNumericProperty(
            elements.layerRotation,
            "rotation",
            {
                minimum: -360,
                maximum: 360
            }
        );

        bindNumericProperty(
            elements.layerOpacity,
            "opacity",
            {
                minimum: 0,
                maximum: 100,
                transform:
                    value => value / 100
            }
        );

        bindNumericProperty(
            elements.layerZIndex,
            "zIndex",
            {
                minimum: 0,
                maximum: 100
            }
        );

        bindTextProperty(
            elements.textName,
            "name"
        );

        bindTextProperty(
            elements.textTemplate,
            "template"
        );

        bindTextProperty(
            elements.textFont,
            "fontFamily"
        );

        bindNumericProperty(
            elements.textSize,
            "fontSizePx",
            {
                minimum: 8,
                maximum: 400
            }
        );

        bindNumericProperty(
            elements.textWeight,
            "fontWeight",
            {
                minimum: 100,
                maximum: 900
            }
        );

        bindTextProperty(
            elements.textColor,
            "color"
        );

        bindTextProperty(
            elements.textAlign,
            "textAlign"
        );

        bindNumericProperty(
            elements.textLineHeight,
            "lineHeight",
            {
                minimum: 0.5,
                maximum: 3
            }
        );

        bindTextProperty(
            elements.enterAnimation,
            "enterAnimation"
        );

        bindTextProperty(
            elements.exitAnimation,
            "exitAnimation"
        );

        bindNumericProperty(
            elements.animationDelay,
            "delayMs",
            {
                minimum: 0,
                maximum: 60000
            }
        );

        bindNumericProperty(
            elements.animationDuration,
            "durationMs",
            {
                minimum: 100,
                maximum: 60000
            }
        );

        bindTextProperty(
            elements.videoFit,
            "fit"
        );

        elements.layerVisible
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    updateLayerProperty(
                        "visible",
                        elements.layerVisible
                            .checked
                    );
                }
            );

        elements.layerLocked
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    updateLayerProperty(
                        "locked",
                        elements.layerLocked
                            .checked
                    );
                }
            );

        elements.textShadow
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    updateLayerProperty(
                        "textShadow",
                        elements.textShadow
                            .checked
                    );
                }
            );

        elements.videoLoop
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    updateLayerProperty(
                        "loop",
                        elements.videoLoop
                            .checked
                    );
                }
            );

        elements.videoMuted
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    updateLayerProperty(
                        "muted",
                        elements.videoMuted
                            .checked
                    );
                }
            );

        elements.variantName
            ?.addEventListener(
                "input",
                () => {
                    if (
                        elements.variantNameTop
                    ) {
                        elements.variantNameTop
                            .textContent =
                            elements.variantName
                                .value ||
                            "Variante";
                    }

                    markDirty();
                }
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

        elements.canvasWidth
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    state.layout.canvas.width =
                        clamp(
                            numberValue(
                                elements.canvasWidth
                                    .value,
                                1920
                            ),
                            320,
                            3840
                        );

                    markDirty();
                    renderEverything();
                    fitZoom();
                }
            );

        elements.canvasHeight
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    state.layout.canvas.height =
                        clamp(
                            numberValue(
                                elements.canvasHeight
                                    .value,
                                1080
                            ),
                            180,
                            2160
                        );

                    markDirty();
                    renderEverything();
                    fitZoom();
                }
            );

        elements.totalDuration
            ?.addEventListener(
                "change",
                () => {
                    pushHistory();

                    state.layout.durationMs =
                        Math.max(
                            1000,
                            numberValue(
                                elements.totalDuration
                                    .value,
                                6000
                            )
                        );

                    markDirty();
                    renderTimeline();
                }
            );

        elements.backLink
            ?.addEventListener(
                "click",
                event => {
                    if (
                        state.dirty &&
                        !window.confirm(
                            "Quitter sans enregistrer les modifications ?"
                        )
                    ) {
                        event.preventDefault();
                    }
                }
            );

        window.addEventListener(
            "keydown",
            event => {
                const modifier =
                    event.ctrlKey ||
                    event.metaKey;

                if (
                    modifier &&
                    event.key.toLowerCase() ===
                    "s"
                ) {
                    event.preventDefault();
                    saveEditor();
                }

                if (
                    modifier &&
                    event.key.toLowerCase() ===
                    "z" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();
                    undo();
                }

                if (
                    modifier &&
                    (
                        event.key.toLowerCase() ===
                        "y" ||
                        (
                            event.key.toLowerCase() ===
                            "z" &&
                            event.shiftKey
                        )
                    )
                ) {
                    event.preventDefault();
                    redo();
                }

                if (
                    event.key === "Delete" &&
                    !event.target.matches(
                        "input, textarea, select"
                    )
                ) {
                    deleteSelectedLayer();
                }
            }
        );

        window.addEventListener(
            "beforeunload",
            event => {
                if (!state.dirty) {
                    return;
                }

                event.preventDefault();
                event.returnValue = "";
            }
        );

        window.addEventListener(
            "resize",
            () => {
                if (state.ready) {
                    fitZoom();
                }
            }
        );
    }

    async function startApplication() {
        try {
            setPageState(
                true,
                false,
                false
            );

            const parameters =
                routeParameters();

            if (
                !parameters.creatorId ||
                !parameters.rulePublicId ||
                !parameters.variantPublicId
            ) {
                throw new Error(
                    "Le lien de l’éditeur est incomplet."
                );
            }

            state.creatorId =
                parameters.creatorId;

            state.rulePublicId =
                parameters.rulePublicId;

            state.variantPublicId =
                parameters.variantPublicId;

            const backUrl =
                (
                    "/createur-panel.html" +
                    `?creatorId=${encodeURIComponent(
                        state.creatorId
                    )}` +
                    "#overlays"
                );

            if (elements.backLink) {
                elements.backLink.href =
                    backUrl;
            }

            if (
                elements.errorBackLink
            ) {
                elements.errorBackLink.href =
                    backUrl;
            }

            bindEvents();

            await loadEditorData();

            state.ready = true;

            markSaved();

            setPageState(
                false,
                false,
                true
            );

            requestAnimationFrame(
                () => {
                    fitZoom();

                    if (parameters.preview) {
                        preview();
                    }
                }
            );
        } catch (error) {
            showError(error);
        }
    }

    startApplication();
})();