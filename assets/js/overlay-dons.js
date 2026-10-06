(() => {
  "use strict";

  const API_BASE =
    "https://api-beta.jevent.julot.fr";

  const POLL_INTERVAL_MS = 1500;
  const CONFIG_REFRESH_MS = 30000;

  const elements = {
    root:
      document.querySelector(
        "#donationOverlay"
      ),

    viewport:
      document.querySelector(
        "#donationViewport"
      ),

    stage:
      document.querySelector(
        "#donationStage"
      ),

    debug:
      document.querySelector(
        "#donationDebug"
      )
  };

  const state = {
    accessToken: "",
    overlay: null,
    rules: [],

    canvasWidth: 1920,
    canvasHeight: 1080,

    processing: false,
    stopped: false,
    debugEnabled: false,

    activeMedia: [],
    activeTimers: []
  };

  function getOverlayToken() {
    const url =
      new URL(window.location.href);

    const queryToken =
      url.searchParams.get("code");

    if (queryToken) {
      return queryToken.trim();
    }

    const match =
      url.pathname.match(
        /\/overlay\/dons\/([^/?#]+)/
      );

    if (!match) {
      return "";
    }

    const token =
      decodeURIComponent(match[1]);

    if (
      token === "index.html" ||
      token === "index"
    ) {
      return "";
    }

    return token.trim();
  }

  async function apiFetch(
    pathname,
    options = {}
  ) {
    const response =
      await fetch(
        API_BASE + pathname,
        {
          ...options,

          headers: {
            Accept: "application/json",
            ...(
              options.body
                ? {
                  "Content-Type":
                    "application/json"
                }
                : {}
            ),
            ...(options.headers || {})
          }
        }
      );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data = null;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      const text =
        await response.text();

      data = text
        ? { error: text }
        : {};
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        `Erreur HTTP ${response.status}.`
      );
    }

    return data;
  }

  function debug(message, data) {
    if (!state.debugEnabled) {
      return;
    }

    console.log(
      "[Overlay dons]",
      message,
      data ?? ""
    );

    if (!elements.debug) {
      return;
    }

    elements.debug.hidden = false;

    const details =
      data === undefined
        ? ""
        : (
          "\n" +
          JSON.stringify(
            data,
            null,
            2
          )
        );

    elements.debug.textContent =
      message + details;
  }

  function sleep(duration) {
    return new Promise(resolve => {
      window.setTimeout(
        resolve,
        Math.max(0, duration)
      );
    });
  }

  function numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function booleanOr(
    value,
    fallback = true
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      return fallback;
    }

    if (
      value === false ||
      value === 0 ||
      value === "0" ||
      value === "false"
    ) {
      return false;
    }

    return true;
  }

  function parseObject(value) {
    if (
      value &&
      typeof value === "object"
    ) {
      return value;
    }

    if (typeof value !== "string") {
      return {};
    }

    try {
      const parsed =
        JSON.parse(value);

      return (
        parsed &&
          typeof parsed === "object"
          ? parsed
          : {}
      );
    } catch {
      return {};
    }
  }

  function clearTimers() {
    for (
      const timer of
      state.activeTimers
    ) {
      clearTimeout(timer);
    }

    state.activeTimers = [];
  }

  function addTimer(
    callback,
    duration
  ) {
    const timer =
      window.setTimeout(
        callback,
        Math.max(0, duration)
      );

    state.activeTimers.push(timer);

    return timer;
  }

  function cleanupScene() {
    clearTimers();

    for (
      const media of
      state.activeMedia
    ) {
      try {
        media.pause?.();
        media.removeAttribute?.("src");
        media.load?.();
      } catch {
        // Rien à faire.
      }
    }

    state.activeMedia = [];

    elements.stage?.replaceChildren();

    if (elements.viewport) {
      elements.viewport.hidden = true;
    }
  }

  function normalizeRules(
    donationAlerts
  ) {
    let source = [];

    if (
      Array.isArray(
        donationAlerts
      )
    ) {
      source = donationAlerts;
    } else if (
      Array.isArray(
        donationAlerts?.rules
      )
    ) {
      source =
        donationAlerts.rules;
    } else if (
      Array.isArray(
        donationAlerts?.alerts
      )
    ) {
      source =
        donationAlerts.alerts;
    } else if (
      Array.isArray(
        donationAlerts?.donationAlerts
      )
    ) {
      source =
        donationAlerts.donationAlerts;
    }

    return source
      .filter(rule =>
        booleanOr(
          rule.enabled,
          true
        )
      )
      .sort(
        (first, second) => {
          const priorityDifference =
            numberOr(
              second.priority
            ) -
            numberOr(
              first.priority
            );

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference;
          }

          return (
            numberOr(
              first.displayOrder,
              100
            ) -
            numberOr(
              second.displayOrder,
              100
            )
          );
        }
      );
  }

  async function loadConfiguration() {
    const data =
      await apiFetch(
        "/api/overlays/" +
        encodeURIComponent(
          state.accessToken
        )
      );

    const overlay =
      data?.overlay;

    if (!overlay) {
      throw new Error(
        "Configuration de l’overlay introuvable."
      );
    }

    if (
      overlay.overlayType !==
      "donations"
    ) {
      throw new Error(
        "Ce lien ne correspond pas à un overlay de dons."
      );
    }

    if (!overlay.enabled) {
      throw new Error(
        "Cet overlay est désactivé."
      );
    }

    state.overlay = overlay;

    state.rules =
      normalizeRules(
        overlay.donationAlerts
      );

    debug(
      "Configuration chargée.",
      {
        rules:
          state.rules.length,

        creator:
          overlay.creator
            ?.displayName
      }
    );
  }

  function normalizeCondition(
    value
  ) {
    return String(
      value || "all"
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim()
      .replace(
        /[\s-]+/g,
        "_"
      );
  }

  function ruleMatchesDonation(
    rule,
    amountCents
  ) {
    const condition =
      normalizeCondition(
        rule.conditionType
      );

    const minimum =
      numberOr(
        rule.minimumAmountCents,
        0
      );

    const maximum =
      numberOr(
        rule.maximumAmountCents,
        0
      );

    if (


      [
        "",
        "all",
        "always",
        "any",
        "all_donations",
        "tous_les_dons"
      ].includes(condition)
    ) {
      return true;
    }

    if (
      [
        "exact",
        "equal",
        "equals",
        "exact_amount",
        "montant_exact"
      ].includes(condition)
    ) {
      return (
        amountCents === minimum
      );
    }

    if (
      [
        "minimum",
        "minimum_amount",
        "at_least",
        "greater_or_equal",
        "superieur_ou_egal"
      ].includes(condition)
    ) {
      return (
        amountCents >= minimum
      );
    }

    if (
      [
        "maximum",
        "maximum_amount",
        "at_most",
        "less_or_equal",
        "inferieur_ou_egal"
      ].includes(condition)
    ) {
      return (
        amountCents <= maximum
      );
    }

    if (
      [
        "range",
        "between",
        "interval",
        "intervalle"
      ].includes(condition)
    ) {
      return (
        amountCents >= minimum &&
        amountCents <= maximum
      );
    }

    return false;
  }

  function findMatchingRule(
    donation
  ) {
    const amountCents =
      numberOr(
        donation.amountCents,
        0
      );

    return (
      state.rules.find(rule =>
        ruleMatchesDonation(
          rule,
          amountCents
        )
      ) || null
    );
  }

  function chooseVariant(rule) {
    const variants =
      (
        Array.isArray(
          rule.variants
        )
          ? rule.variants
          : []
      )
        .filter(variant =>
          booleanOr(
            variant.enabled,
            true
          )
        )
        .sort(
          (first, second) =>
            numberOr(
              first.displayOrder,
              100
            ) -
            numberOr(
              second.displayOrder,
              100
            )
        );

    if (
      variants.length === 0
    ) {
      return null;
    }

    const selectionMode =
      String(
        rule.selectionMode ||
        "weighted_random"
      ).toLowerCase();

    if (
      [
        "fixed",
        "first",
        "ordered"
      ].includes(selectionMode)
    ) {
      return variants[0];
    }

    const totalWeight =
      variants.reduce(
        (total, variant) =>
          total +
          Math.max(
            0,
            numberOr(
              variant.weight,
              1
            )
          ),
        0
      );

    if (totalWeight <= 0) {
      return variants[
        Math.floor(
          Math.random() *
          variants.length
        )
      ];
    }

    let cursor =
      Math.random() *
      totalWeight;

    for (
      const variant of variants
    ) {
      cursor -= Math.max(
        0,
        numberOr(
          variant.weight,
          1
        )
      );

      if (cursor <= 0) {
        return variant;
      }
    }

    return variants[
      variants.length - 1
    ];
  }

  function createDefaultLayout(
    rule,
    variant
  ) {
    const duration =
      Math.max(
        3000,
        numberOr(
          rule.displayDurationMs,
          7000
        )
      );

    return {
      version: 2,

      durationMs:
        duration,

      canvas: {
        width: 1920,
        height: 1080
      },

      video: {
        id: "video",
        type: "video",
        name: "Vidéo",

        visible:
          Boolean(
            variant.videoStorageKey ||
            variant.imageStorageKey
          ),

        locked: false,

        x: 360,
        y: 100,

        width: 1200,
        height: 675,

        rotation: 0,
        opacity: 1,
        zIndex: 1,

        delayMs: 0,
        durationMs: duration,

        fit: "contain",
        loop: false,
        muted: true,

        enterAnimation:
          "fade",

        exitAnimation:
          "fade"
      },

      texts: [
        {
          id: "main-text",
          type: "text",
          name: "Texte principal",

          visible: true,
          locked: false,

          template:
            rule.textTemplate ||
            "{{donorName}} a donné {{amount}}{{unit}}",

          x: 260,
          y: 790,

          width: 1400,
          height: 180,

          rotation: 0,
          opacity: 1,
          zIndex: 10,

          fontFamily:
            rule.fontFamily ||
            "Inter",

          fontSizePx:
            numberOr(
              rule.fontSizePx,
              64
            ),

          fontWeight:
            rule.fontWeight ||
            "800",

          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.15,
          textShadow: true,

          delayMs:
            numberOr(
              rule.textDelayMs,
              0
            ),

          durationMs:
            duration,

          enterAnimation:
            rule.animation ||
            "fade",

          exitAnimation:
            "fade"
        }
      ]
    };
  }

  function normalizeLayout(
    rule,
    variant
  ) {
    const parsed = parseObject(
      variant.layout ??
      variant.layoutJson ??
      variant.layoutConfig ??
      variant.settings ??
      null
    );

    const fallback =
      createDefaultLayout(
        rule,
        variant
      );

    const canvas =
      parseObject(
        parsed.canvas
      );

    const video =
      parsed.video &&
        typeof parsed.video ===
        "object"
        ? {
          ...fallback.video,
          ...parsed.video
        }
        : fallback.video;

    let texts = [];

    if (
      Array.isArray(
        parsed.texts
      )
    ) {
      texts =
        parsed.texts;
    } else if (
      Array.isArray(
        parsed.layers
      )
    ) {
      texts =
        parsed.layers.filter(
          layer =>
            layer.type === "text"
        );
    } else {
      texts =
        fallback.texts;
    }

    return {
      ...fallback,
      ...parsed,

      durationMs:
        Math.max(
          1000,
          numberOr(
            parsed.durationMs,
            fallback.durationMs
          )
        ),

      canvas: {
        width:
          Math.max(
            320,
            numberOr(
              canvas.width,
              1920
            )
          ),

        height:
          Math.max(
            180,
            numberOr(
              canvas.height,
              1080
            )
          )
      },

      video,

      texts:
        texts.slice(0, 3)
    };
  }

  function replaceVariables(
    template,
    donation
  ) {
    const variables = {
      name:
        donation.donorName ||
        "Anonyme",

      donorname:
        donation.donorName ||
        "Anonyme",

      amount:
        donation.amount ??
        (
          numberOr(
            donation.amountCents
          ) / 100
        ).toFixed(2),

      unit:
        donation.unit ||
        (
          donation.currency === "EUR"
            ? "€"
            : donation.currency || ""
        ),

      message:
        donation.message || "",

      creator:
        state.overlay?.creator
          ?.displayName || ""
    };

    return String(
      template || ""
    ).replace(
      /\{\{\s*([a-zA-Z]+)\s*\}\}|\{\s*([a-zA-Z]+)\s*\}|$\s*([a-zA-Z]+)\s*$/g,
      (
        match,
        first,
        second,
        third
      ) => {
        const key =
          String(
            first ||
            second ||
            third ||
            ""
          ).toLowerCase();

        return (
          variables[key] ??
          match
        );
      }
    );
  }

  const RICH_COLORS = {
    vert: "#183d2d",
    "vert-clair": "#55c685",
    creme: "#f1dfb3",
    blanc: "#ffffff"
  };

  function renderRichText(
    container,
    content
  ) {
    const pattern =
      /<(vert|vert-clair|creme|blanc)\s*:\s*([^>]*)>/gi;

    let cursor = 0;
    let match = null;

    while (
      (
        match =
        pattern.exec(content)
      )
    ) {
      if (
        match.index > cursor
      ) {
        container.append(
          document.createTextNode(
            content.slice(
              cursor,
              match.index
            )
          )
        );
      }

      const span =
        document.createElement(
          "span"
        );

      span.style.color =
        RICH_COLORS[
        match[1].toLowerCase()
        ];

      span.textContent =
        match[2];

      container.append(span);

      cursor =
        pattern.lastIndex;
    }

    if (
      cursor < content.length
    ) {
      container.append(
        document.createTextNode(
          content.slice(cursor)
        )
      );
    }
  }

  function applyLayerPosition(
    element,
    layer
  ) {
    element.style.position =
      "absolute";

    element.style.left =
      `${numberOr(layer.x)}px`;

    element.style.top =
      `${numberOr(layer.y)}px`;

    element.style.width =
      `${Math.max(
        1,
        numberOr(
          layer.width,
          100
        )
      )}px`;

    element.style.height =
      `${Math.max(
        1,
        numberOr(
          layer.height,
          100
        )
      )}px`;

    element.style.opacity =
      String(
        Math.max(
          0,
          Math.min(
            1,
            numberOr(
              layer.opacity,
              1
            )
          )
        )
      );

    element.style.zIndex =
      String(
        numberOr(
          layer.zIndex,
          1
        )
      );

    element.style.transform =
      `rotate(${numberOr(
        layer.rotation
      )
      }deg)`;

    element.style.transformOrigin =
      "center center";
  }

  function normalizeAnimation(
    value
  ) {
    return String(
      value || "fade"
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim()
      .replace(
        /[\s_]+/g,
        "-"
      );
  }

  function getAnimationFrames(
    animationName,
    exiting,
    layer
  ) {
    const animation =
      normalizeAnimation(
        animationName
      );

    const rotation =
      numberOr(
        layer.rotation
      );

    const base =
      `rotate(${rotation}deg)`;

    const createFrames =
      (
        hiddenTransform,
        visibleTransform = base
      ) => (
        exiting
          ? [
            {
              opacity:
                numberOr(
                  layer.opacity,
                  1
                ),

              transform:
                visibleTransform
            },
            {
              opacity: 0,
              transform:
                hiddenTransform
            }
          ]
          : [
            {
              opacity: 0,
              transform:
                hiddenTransform
            },
            {
              opacity:
                numberOr(
                  layer.opacity,
                  1
                ),

              transform:
                visibleTransform
            }
          ]
      );

    if (
      [
        "none",
        "aucune"
      ].includes(animation)
    ) {
      return [
        {
          opacity:
            numberOr(
              layer.opacity,
              1
            ),

          transform: base
        },
        {
          opacity:
            numberOr(
              layer.opacity,
              1
            ),

          transform: base
        }
      ];
    }

    if (
      [
        "slide-up",
        "glissement-vers-le-haut"
      ].includes(animation)
    ) {
      return createFrames(
        exiting
          ? `translateY(-60px) ${base}`
          : `translateY(60px) ${base}`
      );
    }

    if (
      [
        "slide-down",
        "glissement-vers-le-bas"
      ].includes(animation)
    ) {
      return createFrames(
        exiting
          ? `translateY(60px) ${base}`
          : `translateY(-60px) ${base}`
      );
    }

    if (
      [
        "slide-left",
        "glissement-vers-la-gauche"
      ].includes(animation)
    ) {
      return createFrames(
        exiting
          ? `translateX(-80px) ${base}`
          : `translateX(80px) ${base}`
      );
    }

    if (
      [
        "slide-right",
        "glissement-vers-la-droite"
      ].includes(animation)
    ) {
      return createFrames(
        exiting
          ? `translateX(80px) ${base}`
          : `translateX(-80px) ${base}`
      );
    }

    if (
      [
        "zoom",
        "zoom-in",
        "scale",
        "grow",
        "agrandissement"
      ].includes(animation)
    ) {
      return createFrames(
        exiting
          ? `${base} scale(1.25)`
          : `${base} scale(0.65)`
      );
    }

    if (
      [
        "bounce",
        "rebond"
      ].includes(animation)
    ) {
      if (exiting) {
        return [
          {
            opacity:
              numberOr(
                layer.opacity,
                1
              ),

            transform:
              `${base} scale(1)`
          },
          {
            opacity: 0,
            transform:
              `${base} scale(0.6)`
          }
        ];
      }

      return [
        {
          opacity: 0,
          transform:
            `${base} scale(0.5)`
        },
        {
          opacity:
            numberOr(
              layer.opacity,
              1
            ),

          transform:
            `${base} scale(1.12)`
        },
        {
          opacity:
            numberOr(
              layer.opacity,
              1
            ),

          transform:
            `${base} scale(1)`
        }
      ];
    }

    return createFrames(base);
  }

  function animateLayer(
    element,
    layer,
    exiting = false
  ) {
    const animationName =
      exiting
        ? layer.exitAnimation
        : layer.enterAnimation;

    const animation =
      element.animate(
        getAnimationFrames(
          animationName,
          exiting,
          layer
        ),
        {
          duration:
            exiting
              ? 300
              : 400,

          easing:
            exiting
              ? "ease-in"
              : "cubic-bezier(.2,.8,.2,1)",

          fill: "forwards"
        }
      );

    return animation;
  }

  function scheduleLayer(
    element,
    layer
  ) {
    const delay =
      Math.max(
        0,
        numberOr(
          layer.delayMs
        )
      );

    const duration =
      Math.max(
        500,
        numberOr(
          layer.durationMs,
          7000
        )
      );

    element.style.visibility =
      "hidden";

    addTimer(
      () => {
        element.style.visibility =
          "visible";

        animateLayer(
          element,
          layer,
          false
        );

        if (
          element instanceof
          HTMLVideoElement
        ) {
          element.currentTime = 0;

          element.play().catch(
            error => {
              debug(
                "Lecture vidéo bloquée.",
                error.message
              );
            }
          );
        }
      },
      delay
    );

    const exitAt =
      delay +
      Math.max(
        400,
        duration - 300
      );

    addTimer(
      () => {
        animateLayer(
          element,
          layer,
          true
        );
      },
      exitAt
    );

    addTimer(
      () => {
        element.style.visibility =
          "hidden";

        if (
          element instanceof
          HTMLVideoElement
        ) {
          element.pause();
        }
      },
      delay + duration
    );

    return delay + duration;
  }

  function getMediaUrl(
    rule,
    variant,
    mediaKind
  ) {
    const media =
      parseObject(
        variant?.media
      );

    const directUrl =
      media[`${mediaKind}Url`] ??
      variant?.[`${mediaKind}Url`] ??
      "";

    /*
     * Format actuel de l’API publique.
     */
    if (
      typeof directUrl === "string" &&
      directUrl.trim()
    ) {
      return directUrl.trim();
    }

    /*
     * Ancien format, conservé en secours.
     */
    if (
      !rule?.publicId ||
      !variant?.publicId
    ) {
      return "";
    }

    return (
      API_BASE +
      "/api/overlays/" +
      encodeURIComponent(
        state.accessToken
      ) +
      "/donation-alerts/" +
      encodeURIComponent(
        rule.publicId
      ) +
      "/variants/" +
      encodeURIComponent(
        variant.publicId
      ) +
      "/media/" +
      encodeURIComponent(
        mediaKind
      )
    );
  }

  function createVideoLayer(
    rule,
    variant,
    layer
  ) {
    if (
      !booleanOr(
        layer.visible,
        true
      )
    ) {
      console.warn(
        "[Overlay dons] Calque vidéo masqué."
      );

      return null;
    }

    const videoUrl =
      getMediaUrl(
        rule,
        variant,
        "video"
      );

    const imageUrl =
      getMediaUrl(
        rule,
        variant,
        "image"
      );

    /*
     * Ce message doit toujours apparaître,
     * même sans ?debug=1.
     */
    console.log(
      "[Overlay dons] Média détecté :",
      {
        variant:
          variant?.publicId,

        media:
          variant?.media,

        videoUrl,
        imageUrl
      }
    );

    let element = null;

    if (videoUrl) {
      const video =
        document.createElement(
          "video"
        );

      video.src = videoUrl;
      video.preload = "auto";
      video.playsInline = true;

      video.muted =
        booleanOr(
          layer.muted,
          true
        );

      video.defaultMuted =
        video.muted;

      video.loop =
        booleanOr(
          layer.loop,
          false
        );

      video.disablePictureInPicture =
        true;

      video.style.objectFit =
        layer.fit || "contain";

      video.addEventListener(
        "loadedmetadata",
        () => {
          console.log(
            "[Overlay dons] Métadonnées vidéo chargées :",
            {
              source:
                video.currentSrc,

              duration:
                video.duration,

              width:
                video.videoWidth,

              height:
                video.videoHeight
            }
          );
        }
      );

      video.addEventListener(
        "canplay",
        () => {
          console.log(
            "[Overlay dons] Vidéo prête à être jouée."
          );
        }
      );

      video.addEventListener(
        "error",
        () => {
          console.error(
            "[Overlay dons] Erreur vidéo :",
            {
              source:
                video.currentSrc ||
                videoUrl,

              code:
                video.error?.code,

              message:
                video.error?.message,

              networkState:
                video.networkState,

              readyState:
                video.readyState
            }
          );
        }
      );

      element = video;
    } else if (imageUrl) {
      const image =
        document.createElement(
          "img"
        );

      image.src = imageUrl;
      image.alt = "";
      image.draggable = false;

      image.style.objectFit =
        layer.fit || "contain";

      image.addEventListener(
        "error",
        () => {
          console.error(
            "[Overlay dons] Erreur image :",
            imageUrl
          );
        }
      );

      element = image;
    }

    if (!element) {
      console.warn(
        "[Overlay dons] Aucun média disponible.",
        variant
      );

      return null;
    }

    element.className =
      "donation-overlay-media";

    applyLayerPosition(
      element,
      layer
    );

    elements.stage.append(
      element
    );

    if (
      element instanceof
      HTMLMediaElement
    ) {
      state.activeMedia.push(
        element
      );

      /*
       * Force le chargement après insertion
       * dans le DOM.
       */
      element.load();
    }

    return element;
  }

  function createVideoLayer(
    rule,
    variant,
    layer
  ) {
    if (
      !booleanOr(
        layer.visible,
        true
      )
    ) {
      return null;
    }

    const videoUrl =
      getMediaUrl(
        rule,
        variant,
        "video"
      );

    const imageUrl =
      getMediaUrl(
        rule,
        variant,
        "image"
      );

    let element = null;

    if (videoUrl) {
      const video =
        document.createElement(
          "video"
        );

      video.src = videoUrl;
      video.preload = "auto";
      video.playsInline = true;

      video.loop =
        booleanOr(
          layer.loop,
          false
        );

      video.muted =
        booleanOr(
          layer.muted,
          true
        );

      video.style.objectFit =
        layer.fit || "contain";

      video.addEventListener(
        "loadeddata",
        () => {
          debug(
            "Vidéo chargée.",
            {
              url: videoUrl,
              duration:
                video.duration
            }
          );
        }
      );

      video.addEventListener(
        "error",
        () => {
          debug(
            "Impossible de charger la vidéo.",
            {
              url: videoUrl,

              error:
                video.error?.message ??
                video.error?.code ??
                "Erreur inconnue"
            }
          );
        }
      );

      element = video;
    } else if (imageUrl) {
      const image =
        document.createElement(
          "img"
        );

      image.src = imageUrl;
      image.alt = "";
      image.draggable = false;

      image.style.objectFit =
        layer.fit || "contain";

      image.addEventListener(
        "error",
        () => {
          debug(
            "Impossible de charger l’image.",
            {
              url: imageUrl
            }
          );
        }
      );

      element = image;
    }

    if (!element) {
      debug(
        "Aucun média disponible pour la variante.",
        {
          variant:
            variant.publicId,

          media:
            variant.media
        }
      );

      return null;
    }

    element.className =
      "donation-overlay-media";

    applyLayerPosition(
      element,
      layer
    );

    elements.stage.append(
      element
    );

    if (
      element instanceof
      HTMLMediaElement
    ) {
      state.activeMedia.push(
        element
      );
    }

    return element;
  }

  function createTextLayer(
    donation,
    layer
  ) {
    if (
      !booleanOr(
        layer.visible,
        true
      )
    ) {
      return null;
    }

    const element =
      document.createElement(
        "div"
      );

    element.className =
      "donation-overlay-text";

    applyLayerPosition(
      element,
      layer
    );

    element.style.display =
      "flex";

    element.style.alignItems =
      "center";

    const alignment =
      String(
        layer.textAlign ||
        "center"
      );

    element.style.textAlign =
      alignment;

    element.style.justifyContent =
      alignment === "left"
        ? "flex-start"
        : alignment === "right"
          ? "flex-end"
          : "center";

    element.style.fontFamily =
      layer.fontFamily ||
      "Inter, sans-serif";

    element.style.fontSize =
      `${Math.max(
        8,
        numberOr(
          layer.fontSizePx,
          64
        )
      )}px`;

    element.style.fontWeight =
      String(
        layer.fontWeight ||
        800
      );

    element.style.lineHeight =
      String(
        numberOr(
          layer.lineHeight,
          1.15
        )
      );

    element.style.color =
      layer.color ||
      "#ffffff";

    element.style.whiteSpace =
      "pre-wrap";

    element.style.overflowWrap =
      "anywhere";

    element.style.textShadow =
      typeof layer.textShadow ===
        "string"
        ? layer.textShadow
        : booleanOr(
          layer.textShadow,
          true
        )
          ? (
            "0 3px 12px " +
            "rgba(0, 0, 0, 0.75)"
          )
          : "none";

    const content =
      replaceVariables(
        layer.template,
        donation
      );

    renderRichText(
      element,
      content
    );

    elements.stage.append(
      element
    );

    return element;
  }

  function startSound(
    rule,
    variant
  ) {
    const soundUrl =
      getMediaUrl(
        rule,
        variant,
        "sound"
      );

    if (!soundUrl) {
      return null;
    }

    const audio =
      document.createElement(
        "audio"
      );

    audio.src = soundUrl;
    audio.preload = "auto";

    const configuredVolume =
      numberOr(
        rule.soundVolume,
        100
      );

    audio.volume =
      Math.max(
        0,
        Math.min(
          1,
          configuredVolume > 1
            ? configuredVolume / 100
            : configuredVolume
        )
      );

    state.activeMedia.push(
      audio
    );

    audio.play().catch(
      error => {
        debug(
          "Lecture du son bloquée.",
          error.message
        );
      }
    );

    return audio;
  }

  function resizeStage() {
    if (
      !elements.stage ||
      !elements.viewport
    ) {
      return;
    }

    const width =
      Math.max(
        1,
        state.canvasWidth
      );

    const height =
      Math.max(
        1,
        state.canvasHeight
      );

    const scale =
      Math.min(
        window.innerWidth /
        width,

        window.innerHeight /
        height
      );

    elements.stage.style.width =
      `${width}px`;

    elements.stage.style.height =
      `${height}px`;

    elements.stage.style.position =
      "absolute";

    elements.stage.style.left =
      "50%";

    elements.stage.style.top =
      "50%";

    elements.stage.style.transformOrigin =
      "center center";

    elements.stage.style.transform =
      "translate(-50%, -50%) " +
      `scale(${scale})`;
  }

  async function playDonationAlert(
    delivery,
    rule,
    variant
  ) {
    cleanupScene();

    const donation =
      delivery.donation || {};

    const layout =
      normalizeLayout(
        rule,
        variant
      );

    state.canvasWidth =
      layout.canvas.width;

    state.canvasHeight =
      layout.canvas.height;

    elements.stage.replaceChildren();

    elements.viewport.hidden =
      false;

    resizeStage();

    let maximumEnd =
      Math.max(
        1000,
        numberOr(
          layout.durationMs,
          7000
        ),

        numberOr(
          rule.displayDurationMs,
          7000
        )
      );

    const videoLayer =
      createVideoLayer(
        rule,
        variant,
        layout.video
      );

    if (videoLayer) {
      maximumEnd =
        Math.max(
          maximumEnd,

          scheduleLayer(
            videoLayer,
            layout.video
          )
        );
    }

    for (
      const textLayer of
      layout.texts
    ) {
      const textElement =
        createTextLayer(
          donation,
          textLayer
        );

      if (!textElement) {
        continue;
      }

      maximumEnd =
        Math.max(
          maximumEnd,

          scheduleLayer(
            textElement,
            textLayer
          )
        );
    }

    startSound(
      rule,
      variant
    );

    maximumEnd =
      Math.min(
        120000,
        maximumEnd
      );

    debug(
      "Alerte affichée.",
      {
        donorName:
          donation.donorName,

        amount:
          donation.amount,

        rule:
          rule.name,

        variant:
          variant.name,

        duration:
          maximumEnd
      }
    );

    await sleep(
      maximumEnd + 350
    );

    cleanupScene();
  }

  async function completeDelivery(
    delivery
  ) {
    const deliveryId =
      delivery.publicId ||
      delivery.deliveryPublicId;

    if (!deliveryId) {
      return;
    }

    await apiFetch(
      "/api/overlays/" +
      encodeURIComponent(
        state.accessToken
      ) +
      "/donations/" +
      encodeURIComponent(
        deliveryId
      ) +
      "/complete",
      {
        method: "POST",

        body: JSON.stringify({
          claimToken:
            delivery.claimToken,

          claim_token:
            delivery.claimToken
        })
      }
    );
  }

  async function processDelivery(
    delivery
  ) {
    const donation =
      delivery?.donation;

    if (!donation) {
      await completeDelivery(
        delivery
      );

      return;
    }

    const forcedRule =
      delivery.rulePublicId
        ? state.rules.find(
          item =>
            item.publicId ===
            delivery.rulePublicId
        )
        : null;

    const rule =
      forcedRule ||
      findMatchingRule(donation);

    if (!rule) {
      debug(
        "Aucune règle ne correspond au don.",
        donation
      );

      await completeDelivery(
        delivery
      );

      return;
    }

    const forcedVariant =
      delivery.variantPublicId &&
        Array.isArray(rule?.variants)
        ? rule.variants.find(
          item =>
            item.publicId ===
            delivery.variantPublicId &&
            item.enabled !== false
        )
        : null;

    const variant =
      forcedVariant ||
      chooseVariant(rule);

    if (!variant) {
      debug(
        "La règle ne possède aucune variante active.",
        rule
      );

      await completeDelivery(
        delivery
      );

      return;
    }

    const alertDelay =
      Math.max(
        0,
        numberOr(
          rule.alertDelayMs,
          0
        )
      );

    if (alertDelay > 0) {
      await sleep(alertDelay);
    }

    try {
      await playDonationAlert(
        delivery,
        rule,
        variant
      );
    } finally {
      await completeDelivery(
        delivery
      );
    }
  }

  async function pollDeliveries() {
    if (
      state.stopped ||
      state.processing
    ) {
      return;
    }

    state.processing = true;

    try {
      const data =
        await apiFetch(
          "/api/overlays/" +
          encodeURIComponent(
            state.accessToken
          ) +
          "/donations/next",
          {
            method: "POST"
          }
        );

      const delivery =
        data?.delivery;

      if (delivery) {
        if (
          !delivery.claimToken &&
          data.claimToken
        ) {
          delivery.claimToken =
            data.claimToken;
        }

        await processDelivery(
          delivery
        );
      }
    } catch (error) {
      debug(
        "Erreur pendant la récupération des dons.",
        error.message
      );
    } finally {
      state.processing = false;

      if (!state.stopped) {
        window.setTimeout(
          pollDeliveries,
          POLL_INTERVAL_MS
        );
      }
    }
  }

  async function refreshConfiguration() {
    try {
      await loadConfiguration();
    } catch (error) {
      debug(
        "Impossible d’actualiser la configuration.",
        error.message
      );
    }
  }

  async function startApplication() {
    state.debugEnabled =
      new URL(
        window.location.href
      ).searchParams.get(
        "debug"
      ) === "1";

    state.accessToken =
      getOverlayToken();

    if (!state.accessToken) {
      debug(
        "Code d’overlay manquant."
      );

      return;
    }

    if (
      !elements.viewport ||
      !elements.stage
    ) {
      console.error(
        "Les éléments HTML de l’overlay sont introuvables."
      );

      return;
    }

    elements.viewport.hidden =
      true;

    try {
      await loadConfiguration();
    } catch (error) {
      debug(
        "Impossible de charger l’overlay.",
        error.message
      );

      window.setTimeout(
        startApplication,
        5000
      );

      return;
    }

    window.addEventListener(
      "resize",
      resizeStage
    );

    window.setInterval(
      refreshConfiguration,
      CONFIG_REFRESH_MS
    );

    pollDeliveries();
  }

  window.addEventListener(
    "beforeunload",
    () => {
      state.stopped = true;
      cleanupScene();
    }
  );

  startApplication();
})();