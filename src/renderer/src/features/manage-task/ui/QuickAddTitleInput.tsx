import { Box, Text } from "@mantine/core";
import {
  type FC,
  type KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { QuickAddSegment } from "../lib/parseQuickAdd";

type QuickAddTitleInputProps = {
  segments: QuickAddSegment[];
  onTextChange: (text: string) => void;
  /** Enter submits the form instead of inserting a line break — this is a
   * single-line field. */
  onSubmit?: () => void;
  placeholder?: string;
};

const SEGMENT_COLOR: Record<QuickAddSegment["type"], string | undefined> = {
  plain: undefined,
  priority: "red",
  due: "blue",
  label: "grape",
  project: "teal",
  kanbanStatus: "violet",
};

/** Character offset of the caret within `root`'s text content — the DOM
 * position, not a segment index, since segments are recomputed from scratch
 * on every keystroke and don't have stable identities to anchor to. */
const getCaretOffset = (root: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();

  preRange.selectNodeContents(root);
  preRange.setEnd(range.endContainer, range.endOffset);

  return preRange.toString().length;
};

const setCaretOffset = (root: HTMLElement, offset: number): void => {
  const selection = window.getSelection();
  if (!selection) return;

  let remaining = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= length;
    node = walker.nextNode();
  }

  // Offset landed past the end of the content (e.g. text just got shorter) —
  // fall back to placing the caret at the end instead of leaving it stale.
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Highlighted quick-add title field (SPECIFICATION.md "Добавление задачи"):
 * a plain `contentEditable` div, since highlighting recognized tokens inline
 * needs to render styled spans mid-text — no Mantine input renders arbitrary
 * markup inside its value.
 *
 * The span tree is rebuilt imperatively (not via React children) on every
 * `segments` change: React's text-child diffing bails out of updating a
 * segment whose computed text is unchanged from the previous render, even
 * when the browser just mutated that exact text node natively as part of
 * typing. The stray native edit then survives alongside whatever React did
 * add (e.g. a new trailing segment), duplicating the typed character.
 * Fully replacing the DOM children every time guarantees they always match
 * `segments` exactly, discarding any native edits `handleInput` already
 * captured into state.
 */
export const QuickAddTitleInput: FC<QuickAddTitleInputProps> = ({
  segments,
  onTextChange,
  onSubmit,
  placeholder,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const caretOffsetRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    caretOffsetRef.current = getCaretOffset(el);
    onTextChange(el.textContent ?? "");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Skip while an IME composition is in progress — Enter there confirms
    // the candidate, it shouldn't submit the form.
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit?.();
    }
  };

  // Gaining focus (including the modal's initial autofocus) always lands the
  // caret at the end, regardless of where the browser would otherwise put it
  // — this is a single-line field, editing from the middle isn't the common
  // case worth defaulting to.
  const handleFocus = () => {
    setFocused(true);
    const el = ref.current;
    if (!el) return;
    const end = el.textContent?.length ?? 0;
    caretOffsetRef.current = end;
    setCaretOffset(el, end);
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.replaceChildren(
      ...segments.map((segment) => {
        const span = document.createElement("span");
        span.textContent = segment.text;
        const color = SEGMENT_COLOR[segment.type];
        if (color) span.style.color = `var(--mantine-color-${color}-6)`;
        if (segment.type !== "plain") span.style.fontWeight = "700";
        return span;
      }),
    );

    if (document.activeElement === el && caretOffsetRef.current !== null) {
      setCaretOffset(el, caretOffsetRef.current);
    }
  }, [segments]);

  const isEmpty = segments.every((segment) => segment.text === "");

  return (
    <Box style={{ position: "relative" }}>
      {isEmpty && !focused && (
        <Text
          c="dimmed"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            padding: "0.5rem 0",
            fontSize: "1.25rem",
            fontWeight: 650,
            pointerEvents: "none",
          }}
        >
          {placeholder}
        </Text>
      )}
      <Box
        ref={ref}
        component="div"
        contentEditable
        suppressContentEditableWarning
        data-autofocus
        role="textbox"
        aria-label="Task title"
        aria-multiline={false}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => setFocused(false)}
        style={{
          minHeight: "1.5rem",
          padding: "0.5rem 0",
          fontSize: "1.25rem",
          fontWeight: 650,
          outline: "none",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
    </Box>
  );
};
