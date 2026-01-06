'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

type HighlightedInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

/**
 * A contentEditable input component that highlights placeholder patterns in the text.
 * Highlights patterns like "value.$", "ticket_id.$" with a blue background.
 * Only highlights standalone placeholders, not patterns within URLs.
 *
 * @param value - The current text value
 * @param onChange - Callback function when the text changes
 * @param placeholder - Placeholder text (not visually rendered but stored as data attribute)
 * @param className - Additional CSS classes to apply
 * @param id - HTML id attribute for the element
 */
export function HighlightedInput({ value, onChange, placeholder, className, id }: HighlightedInputProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Update the content when value changes externally
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.textContent !== value) {
      contentEditableRef.current.textContent = value;
      highlightContent();
    }
  }, [value]);

  /**
   * Applies syntax highlighting to placeholder patterns in the contentEditable div.
   * Highlights patterns matching "word.word.$" format, ensuring they are standalone
   * (preceded/followed by space, slash, or string boundaries).
   * Preserves cursor position during highlighting.
   */
  const highlightContent = () => {
    if (!contentEditableRef.current) return;

    const text = contentEditableRef.current.textContent || '';

    // Match patterns like "something.$" but not as part of a URL (use word boundaries or specific delimiters)
    // This regex matches word_or_dots.$ only when preceded by start, space, or / and followed by end, space, or /
    const regex = /(^|[\s/])([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*\.\$)(?=[\s/]|$)/g;

    if (!regex.test(text)) {
      // No matches, just use plain text
      if (contentEditableRef.current.innerHTML !== text) {
        contentEditableRef.current.innerHTML = text;
      }
      return;
    }

    // Save cursor position
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const cursorOffset = range ? range.startOffset : 0;
    const anchorNode = range ? range.startContainer : null;

    // Replace with highlighted version, preserving the delimiter
    const highlighted = text.replace(
      regex,
      '$1<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">$2</span>'
    );

    if (contentEditableRef.current.innerHTML !== highlighted) {
      contentEditableRef.current.innerHTML = highlighted;

      // Restore cursor position
      try {
        if (anchorNode && selection && range) {
          const newRange = document.createRange();
          newRange.setStart(contentEditableRef.current.childNodes[0] || contentEditableRef.current, cursorOffset);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } catch (e) {
        // If cursor restoration fails, just continue
      }
    }
  };

  /**
   * Handles input events from the contentEditable div.
   * Extracts the plain text content, calls the onChange callback, and reapplies highlighting.
   */
  const handleInput = () => {
    if (contentEditableRef.current) {
      const text = contentEditableRef.current.textContent || '';
      onChange(text);
      highlightContent();
    }
  };

  /**
   * Handles paste events to ensure only plain text is inserted.
   * Prevents rich text formatting from being pasted into the input.
   *
   * @param e - The clipboard event
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div
      ref={contentEditableRef}
      contentEditable
      id={id}
      onInput={handleInput}
      onBlur={highlightContent}
      onPaste={handlePaste}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'font-mono text-xs',
        !value && 'text-muted-foreground',
        className
      )}
      data-placeholder={placeholder}
      suppressContentEditableWarning
    />
  );
}
