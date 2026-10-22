import { useEffect, useRef, useState } from "react";
import { type Template } from "../model/templates";
import {
  useCaptureLayersViewModel,
  type LayerInput,
} from "./useCaptureLayersViewModel";
import { useCaptureSource } from "./useCaptureSource";
import { useCaptureFrames } from "./useCaptureFrames";
import { useCaptureSettings } from "./useCaptureSettings";
import { useCaptureCountdown } from "./useCaptureCountdown";

export function useCaptureViewModel(
  template: Template,
  stream: MediaStream | null,
  onFinish?: (result: { template: Template; frames: Blob[]; background: string | null }) => void,
) {
  const isMounted = useRef(true);
  const delivered = useRef(false);
  const photos = useCaptureFrames(template.guides.length);
  const [phase, setPhase] = useState<"capture" | "review" | "results">(
    "capture",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const settings = useCaptureSettings(template, !busy && !photos.hasFrames);
  const { captureTemplate, background } = settings;
  const source = useCaptureSource(stream, captureTemplate, phase === "capture");
  const mode = phase === "capture" ? source.kind : phase;
  const countdown = useCaptureCountdown(mode === "camera", takePhoto);
  const layerInputs: LayerInput[] = [
    phase === "capture"
      ? source.layer
      : {
          id: "base",
          kind: "image",
          label: "Camera / photo",
          url: photos.current?.url,
          alt: `Captured frame ${photos.index + 1}`,
          defaultOpacity: 100,
          zIndex: 0,
          aspectRatio: captureTemplate.width / captureTemplate.height,
          className: "review-image",
        },
    {
      id: "overlay",
      kind: "image",
      label: "Frame overlay",
      url: photos.overlayUrl,
      alt: "",
      defaultOpacity: 40,
      zIndex: 1,
      className: "frame-overlay",
    },
    ...(!photos.custom
      ? [
          {
            id: "guide",
            kind: "image" as const,
            label: "Guide overlay",
            url: template.guides[photos.index],
            alt: "Pose guide",
            defaultOpacity: 100,
            zIndex: 2,
            className: "pose-guide",
            style: {
              width: `${(template.guideWidth / template.width) * 100}%`,
              height: `${(template.guideHeight / template.height) * 100}%`,
            },
          },
        ]
      : []),
  ];
  const layers = useCaptureLayersViewModel(layerInputs);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase === "results" && onFinish && photos.originals.length && !delivered.current) {
      delivered.current = true;
      onFinish({ template: captureTemplate, frames: photos.originals, background });
    }
  }, [phase, photos.originals, captureTemplate, background, onFinish]);

  function clearError() {
    setError("");
    source.dismissError();
  }

  async function takePhoto() {
    if (busy || phase !== "capture" || !source.ready) return;
    setBusy(true);
    clearError();
    try {
      const blob = await source.capture();
      if (!isMounted.current) return;
      photos.store(blob);
      setPhase("review");
    } catch (reason) {
      if (isMounted.current) setError(String(reason));
    } finally {
      if (isMounted.current) setBusy(false);
    }
  }

  async function importPhoto(file: File) {
    if (busy) return;
    setBusy(true);
    countdown.cancel();
    clearError();
    try {
      if ((await source.importPhoto(file)) && isMounted.current)
        setPhase("capture");
    } catch (reason) {
      if (isMounted.current) setError(String(reason));
    } finally {
      if (isMounted.current) setBusy(false);
    }
  }

  function importVideo(file: File) {
    if (busy) return;
    clearError();
    try {
      source.importVideo(file);
      countdown.cancel();
      setPhase("capture");
    } catch (reason) {
      setError(String(reason));
    }
  }

  function useCamera() {
    if (busy || !source.useCamera()) return;
    countdown.cancel();
    setError("");
    setPhase("capture");
  }

  function accept() {
    if (busy || phase !== "review") return;
    const outcome = photos.accept();
    if (!outcome) return;
    clearError();
    if (outcome === "next") setPhase("capture");
    else if (!photos.custom) finish();
  }

  function finish() {
    stream?.getTracks().forEach((track) => track.stop());
    setPhase("results");
  }

  function makeGif() {
    if (busy || !photos.complete) return;
    finish();
  }

  function addFrame() {
    if (busy || !photos.add()) return;
    countdown.cancel();
    clearError();
    setPhase("capture");
  }

  function select(position: number) {
    if (busy) return;
    const selection = photos.select(position);
    if (!selection) return;
    countdown.cancel();
    clearError();
    setPhase(selection === "captured" ? "review" : "capture");
  }

  function retake() {
    if (busy) return;
    photos.retake();
    clearError();
    setPhase("capture");
  }

  function chooseTimer(seconds: number) {
    settings.setTimer(seconds);
    countdown.cancel();
  }
  function shoot() {
    if (busy || countdown.remaining || !source.ready || phase !== "capture") return;
    if (source.kind === "camera" && settings.timer) countdown.start(settings.timer);
    else void takePhoto();
  }
  function toggleOverlay(position: number) {
    if (!busy) photos.toggleOverlay(position);
  }
  return {
    mode,
    busy,
    layers,
    camera: {
      ready: source.ready,
      countdown: countdown.remaining,
      error: error || source.error,
      shoot,
      useCamera,
      importPhoto,
      importVideo,
      videoTime: source.videoTime,
      videoDuration: source.videoDuration,
      seek: source.seek,
      placement: source.placement,
      rotate: source.rotate,
      resize: source.resize,
    },
    photos: {
      frames: photos.frames,
      index: photos.index,
      current: photos.current,
      completed: photos.completed,
      overlayIndex: photos.overlayIndex,
      toggleOverlay,
      select,
      retake,
      accept,
      addFrame,
      makeGif,
      custom: photos.custom,
    },
    settings: {
      aspect: settings.aspect,
      chooseAspect: settings.chooseAspect,
      canChangeAspect: settings.canChangeAspect,
      timer: settings.timer,
      chooseTimer,
      background,
      setBackground: settings.setBackground,
      hasFrames: photos.hasFrames,
    },
    result: { template: captureTemplate, frames: photos.originals, background },
  };
}
