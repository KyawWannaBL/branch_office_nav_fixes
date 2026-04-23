import React, { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

const textOriginals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

function shouldSkip(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "script" || tag === "style" || tag === "code" || tag === "pre";
}

export default function AutoTranslateDom() {
  const { lang } = useLanguage();
  const busyRef = useRef(false);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    const applyTranslations = () => {
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();

        while (node) {
          const textNode = node as Text;
          const parentEl = textNode.parentElement;

          if (!shouldSkip(parentEl)) {
            const current = textNode.textContent || "";
            const original = textOriginals.get(textNode) ?? current;

            if (!textOriginals.has(textNode)) {
              textOriginals.set(textNode, original);
            }

            const trimmed = original.trim();
            if (trimmed) {
              const translated = t(lang, trimmed);
              if (translated !== trimmed) {
                const leading = original.match(/^\s*/)?.[0] || "";
                const trailing = original.match(/\s*$/)?.[0] || "";
                textNode.textContent = `${leading}${translated}${trailing}`;
              } else if (lang === "en") {
                textNode.textContent = original;
              }
            } else if (lang === "en") {
              textNode.textContent = original;
            }
          }

          node = walker.nextNode();
        }

        const elements = root.querySelectorAll("*");
        elements.forEach((el) => {
          if (shouldSkip(el)) return;

          const attrs = ["placeholder", "title", "aria-label"];
          let originalMap = attrOriginals.get(el);
          if (!originalMap) {
            originalMap = {};
            attrOriginals.set(el, originalMap);
          }

          attrs.forEach((attr) => {
            const current = el.getAttribute(attr);
            if (!current) return;

            if (!(attr in originalMap!)) {
              originalMap![attr] = current;
            }

            const original = originalMap![attr];
            const translated = t(lang, original);
            el.setAttribute(attr, translated);
          });
        });
      } finally {
        busyRef.current = false;
      }
    };

    applyTranslations();

    const observer = new MutationObserver(() => {
      if (!busyRef.current) {
        requestAnimationFrame(applyTranslations);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}
