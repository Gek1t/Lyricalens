import React from 'react';

interface HighlightedTextProps {
  text: string;
  targetWord: string;
  className?: string;
  highlightClassName?: string;
  onWordClick?: (word: string, fullSentence: string) => void;
}

/**
 * Escapes regex special characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders sentence with target word & inflections highlighted,
 * and allows tapping on ANY individual word (or the highlighted phrase/word)
 * to trigger word lookup in a bottom drawer.
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  targetWord,
  className = '',
  highlightClassName = 'font-semibold text-stone-950 dark:text-stone-50 underline decoration-[#516050] dark:decoration-[#8FB996] decoration-[1.75px] underline-offset-[5px] bg-[#516050]/[0.08] dark:bg-[#8FB996]/[0.15] px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-[#516050]/15 transition-all',
  onWordClick
}) => {
  if (!text) {
    return null;
  }

  // Tokenize the full sentence into words and whitespace/punctuation
  // Regex splits words [A-Za-z0-9'-]+ and other characters
  const cleanTarget = targetWord?.trim() || '';

  // Function to render a single clickable word token
  const renderWordToken = (wordToken: string, key: string | number, isTarget: boolean) => {
    // Strip leading/trailing punctuation for lookup
    const cleanWord = wordToken.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

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
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(cleanWord, text);
        }}
        className={
          isTarget
            ? `${highlightClassName} cursor-pointer`
            : 'hover:text-[#516050] dark:hover:text-[#8FB996] hover:underline underline-offset-2 cursor-pointer transition-colors duration-150'
        }
      >
        {wordToken}
      </span>
    );
  };

  // If no target word provided, just make all words clickable
  if (!cleanTarget) {
    const tokens = text.split(/(\s+|[.,!?;:()""“”]+)/);
    return (
      <span className={className}>
        {tokens.map((token, idx) => {
          if (/^[a-zA-Z0-9'-]+$/.test(token)) {
            return renderWordToken(token, idx, false);
          }
          return <span key={idx}>{token}</span>;
        })}
      </span>
    );
  }

  // If target has multiple words or single word
  try {
    let pattern: RegExp;
    if (cleanTarget.includes(' ')) {
      pattern = new RegExp(`(${escapeRegExp(cleanTarget)})`, 'gi');
    } else {
      const stem = cleanTarget.replace(/(?:ing|ed|es|s|ly|tion|ence|ance|ity)$/i, '');
      const matchPattern = stem.length >= 4 
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
            return renderWordToken(chunk, `chunk-${chunkIdx}`, true);
          }

          // In regular text chunk, split words to allow tapping any individual word
          const subTokens = chunk.split(/(\s+|[.,!?;:()""“”]+)/);
          return (
            <span key={`chunk-${chunkIdx}`}>
              {subTokens.map((st, sIdx) => {
                if (/^[a-zA-Z0-9'-]+$/.test(st)) {
                  return renderWordToken(st, `${chunkIdx}-${sIdx}`, false);
                }
                return <span key={`${chunkIdx}-${sIdx}`}>{st}</span>;
              })}
            </span>
          );
        })}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
};
