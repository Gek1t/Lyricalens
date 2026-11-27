import React from 'react';
import {
  isMultiWordHeading,
  normalizeClickableToken,
  tokenizeClickableSegment,
} from '../utils/textTokenizer';

interface HighlightedTextProps {
  text: string;
  targetWord: string;
  className?: string;
  highlightClassName?: string;
  tokenClassName?: string;
  onWordClick?: (word: string, fullSentence: string) => void;
}

const DEFAULT_TOKEN_CLASS =
  'hover:text-stone-950 dark:hover:text-white hover:underline underline-offset-2 cursor-pointer transition-colors duration-150';

/**
 * Escapes regex special characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders sentence with target word & inflections highlighted,
 * and allows tapping on ANY individual word (including words inside highlighted phrases)
 * to trigger word lookup in a bottom drawer.
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  targetWord,
  className = '',
  highlightClassName = 'font-semibold text-stone-950 dark:text-stone-50 underline decoration-stone-900/75 dark:decoration-stone-200/80 decoration-[1.75px] underline-offset-[5px] bg-stone-900/[0.06] dark:bg-white/[0.12] px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-stone-900/12 transition-all',
  tokenClassName = DEFAULT_TOKEN_CLASS,
  onWordClick,
}) => {
  if (!text) {
    return null;
  }

  const cleanTarget = targetWord?.trim() || '';

  const renderWordToken = (
    wordToken: string,
    lookupOverride: string | null,
    key: string | number,
    isTarget: boolean,
    customClass?: string
  ) => {
    const cleanWord = lookupOverride ?? normalizeClickableToken(wordToken);

    if (!cleanWord || !onWordClick) {
      return (
        <span key={key} className={isTarget ? highlightClassName : undefined}>
          {wordToken}
        </span>
      );
    }

    return (
      <span
        key={key}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(cleanWord, text);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onWordClick(cleanWord, text);
          }
        }}
        className={isTarget ? `${highlightClassName} cursor-pointer` : customClass || tokenClassName}
      >
        {wordToken}
      </span>
    );
  };

  const renderPlainSegment = (segment: string, keyPrefix: string, innerTokenClass?: string) => {
    const tokens = tokenizeClickableSegment(segment);
    return (
      <span key={keyPrefix}>
        {tokens.map((item, sIdx) => {
          if (item.lookupWord) {
            return renderWordToken(
              item.raw,
              item.lookupWord,
              `${keyPrefix}-${sIdx}`,
              false,
              innerTokenClass
            );
          }
          return <span key={`${keyPrefix}-${sIdx}`}>{item.raw}</span>;
        })}
      </span>
    );
  };

  if (!cleanTarget) {
    return <span className={className}>{renderPlainSegment(text, 'plain')}</span>;
  }

  try {
    let pattern: RegExp;
    if (cleanTarget.includes(' ')) {
      pattern = new RegExp(`(${escapeRegExp(cleanTarget)})`, 'gi');
    } else {
      const stem = cleanTarget.replace(/(?:ing|ed|es|s|ly|tion|ence|ance|ity)$/i, '');
      const matchPattern =
        stem.length >= 4
          ? `\\b(${escapeRegExp(stem)}[a-zA-Z]*)\\b|\\b(${escapeRegExp(cleanTarget)})\\b`
          : `\\b(${escapeRegExp(cleanTarget)}[a-zA-Z]*)\\b`;
      pattern = new RegExp(matchPattern, 'gi');
    }

    const chunks = text.split(pattern).filter(Boolean);

    return (
      <span className={className}>
        {chunks.map((chunk, chunkIdx) => {
          const isMatch = pattern.test(chunk) || chunk.toLowerCase() === cleanTarget.toLowerCase();
          pattern.lastIndex = 0;

          if (isMatch) {
            // If matched target spans multiple words, preserve outer pill highlight while making each word individually clickable
            if (/\s+/.test(chunk.trim())) {
              return (
                <span key={`chunk-${chunkIdx}`} className={highlightClassName}>
                  {renderPlainSegment(chunk, `match-${chunkIdx}`, DEFAULT_TOKEN_CLASS)}
                </span>
              );
            }
            return renderWordToken(chunk, null, `chunk-${chunkIdx}`, true);
          }

          return renderPlainSegment(chunk, `chunk-${chunkIdx}`);
        })}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
};

interface ClickableWordHeadingProps {
  word: string;
  onWordClick?: (word: string, fullSentence: string) => void;
}

const HEADING_TOKEN_CLASS =
  'hover:text-stone-950 dark:hover:text-white active:text-stone-950 dark:active:text-white underline decoration-stone-300/80 dark:decoration-white/25 decoration-dotted underline-offset-[6px] hover:decoration-stone-900 dark:hover:decoration-stone-200 cursor-pointer rounded-md px-0.5 -mx-0.5 active:bg-stone-900/10 dark:active:bg-white/15 transition-colors duration-150';

/**
 * Renders multi-word phrase headings as individually clickable words while leaving single-word headings inert.
 */
export function ClickableWordHeading({ word, onWordClick }: ClickableWordHeadingProps): React.ReactElement {
  if (!isMultiWordHeading(word) || !onWordClick) {
    return <>{word}</>;
  }
  return <HighlightedText text={word} targetWord="" tokenClassName={HEADING_TOKEN_CLASS} onWordClick={onWordClick} />;
}
