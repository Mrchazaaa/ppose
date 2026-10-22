import { useMemo, useState } from "react";
import { outputTemplate, type Template } from "../model/templates";

export function useCaptureSettings(template: Template, canChangeAspect: boolean) {
  const [aspect, setAspect] = useState("original");
  const [timer, setTimer] = useState(0);
  const [background, setBackground] = useState<string | null>(null);
  const captureTemplate = useMemo(
    () => outputTemplate(template, aspect === "original" ? null : Number(aspect)),
    [template, aspect],
  );

  function chooseAspect(value: string) {
    if (!canChangeAspect || !["original", "1", "0.8", "0.5625"].includes(value)) return;
    setAspect(value);
  }

  return { aspect, chooseAspect, canChangeAspect, timer, setTimer, background, setBackground, captureTemplate };
}
