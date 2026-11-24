import React from 'react';
import { Music2, Sparkles } from 'lucide-react';
import type { WordExample } from '../types';
import type { IELTSContextResult, LyricContextResult } from '../utils/contextFinder';
import { HighlightedText } from './HighlightedText';

interface ContextualImmersionSectionProps {
  word: string;
  songContext: LyricContextResult;
  ieltsContext: IELTSContextResult;
  examples?: ReadonlyArray<WordExample>;
  variant?: 'sheet' | 'drawer';
  onWordClick: (word: string, fullSentence?: string) => void;
}

function isUsefulContextExample(example: WordExample): boolean {
  const en = example?.en?.trim();
  if (!en) return false;
  return (
    !en.startsWith('Vocabulary item:') &&
    !en.startsWith('Key vocabulary') &&
    !en.startsWith('Contextual expression:') &&
    !en.startsWith('Lyric expression') &&
    !en.startsWith('Phrase:')
  );
}

/**
 * Shared contextual immersion section rendering matched lyric context, IELTS passage context,
 * or AI/AR-generated scene examples with interactive word-by-word lookup.
 */
export function ContextualImmersionSection({
  word,
  songContext,
  ieltsContext,
  examples = [],
  variant = 'sheet',
  onWordClick,
}: ContextualImmersionSectionProps): React.ReactElement | null {
  const showFallbackExamples = !songContext.found && !ieltsContext.found;
  const displayExamples: WordExample[] = [];
  const seenEn = new Set<string>();

  if (songContext.lyricEn) seenEn.add(songContext.lyricEn.trim().toLowerCase());
  if (ieltsContext.sentenceEn) seenEn.add(ieltsContext.sentenceEn.trim().toLowerCase());

  for (const ex of examples) {
    if (!isUsefulContextExample(ex)) continue;
    const isArExample = Boolean(ex.source?.includes('AR'));
    if (!showFallbackExamples && !isArExample) continue;
    const key = ex.en.trim().toLowerCase();
    if (seenEn.has(key)) continue;
    seenEn.add(key);
    displayExamples.push(ex);
    if (displayExamples.length >= 2) break;
  }

  if (!songContext.found && !ieltsContext.found && displayExamples.length === 0) {
    return null;
  }

  const isSheet = variant === 'sheet';
  const blockPadding = isSheet ? 'pl-4 py-1.5 space-y-2' : 'pl-3.5 py-1 space-y-1.5';
  const sentenceSize = isSheet ? 'text-[17px] sm:text-[18px] leading-[1.65]' : 'text-[16px] leading-[1.6]';
  const cnSize = isSheet ? 'text-[13px]' : 'text-[12.5px]';
  const wrapperClass = isSheet
    ? 'space-y-4 pt-2 border-t border-stone-200/60 dark:border-white/10'
    : 'space-y-4 pt-1';

  return (
    <div className={wrapperClass}>
      <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
        CONTEXTUAL IMMERSION
      </div>

      {songContext.found && (
        <div className={`relative ${blockPadding} border-l-2 border-[#516050] dark:border-[#8FB996]`}>
          <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#516050] dark:text-[#8FB996]">
            <Music2 className="w-3.5 h-3.5" />
            <span>
              {isSheet ? 'Lyrics' : 'LYRICS'} · {songContext.songTitle}
            </span>
          </div>

          <p className={`font-serif-luxury ${sentenceSize} text-stone-900 dark:text-stone-100`}>
            &quot;
            <HighlightedText
              text={songContext.lyricEn || ''}
              targetWord={word}
              onWordClick={(clicked, sentence) => onWordClick(clicked, sentence)}
            />
            &quot;
          </p>

          <p className={`${cnSize} text-stone-500 dark:text-stone-400 font-sans leading-relaxed`}>
            {songContext.lyricCn}
          </p>
        </div>
      )}

      {ieltsContext.found && (
        <div className={`relative ${blockPadding} border-l-2 border-[#A86F3E] dark:border-amber-400`}>
          <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#A86F3E] dark:text-amber-300">
            <span>{isSheet ? 'IELTS Academic · Passage 2' : 'IELTS ACADEMIC · PASSAGE 2'}</span>
          </div>

          <p className={`font-serif-luxury ${sentenceSize} text-stone-900 dark:text-stone-100`}>
            &quot;
            <HighlightedText
              text={ieltsContext.sentenceEn}
              targetWord={word}
              highlightClassName="font-semibold text-stone-950 dark:text-stone-50 underline decoration-[#A86F3E] dark:decoration-amber-400 decoration-[1.75px] underline-offset-[5px] bg-[#A86F3E]/[0.08] dark:bg-amber-400/[0.15] px-1.5 py-0.5 rounded-sm cursor-pointer hover:bg-[#A86F3E]/15 transition-all"
              onWordClick={(clicked, sentence) => onWordClick(clicked, sentence)}
            />
            &quot;
          </p>

          <p className={`${cnSize} text-stone-500 dark:text-stone-400 font-sans leading-relaxed`}>
            {ieltsContext.sentenceCn}
          </p>
        </div>
      )}

      {displayExamples.map((ex, idx) => (
        <div
          key={`${ex.en.slice(0, 24)}-${idx}`}
          className={`relative ${blockPadding} border-l-2 border-[#516050] dark:border-[#8FB996]`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-wider text-[#516050] dark:text-[#8FB996]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ex.source || 'CONTEXTUAL EXAMPLE'}</span>
          </div>

          <p className={`font-serif-luxury ${sentenceSize} text-stone-900 dark:text-stone-100`}>
            &quot;
            <HighlightedText
              text={ex.en}
              targetWord={word}
              onWordClick={(clicked, sentence) => onWordClick(clicked, sentence)}
            />
            &quot;
          </p>

          {ex.cn && (
            <p className={`${cnSize} text-stone-500 dark:text-stone-400 font-sans leading-relaxed`}>
              {ex.cn}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
