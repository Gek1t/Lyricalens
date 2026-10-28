---
name: lrc-audio-sync
description: Technical specification and algorithms for LRC lyric parsing, HTML5 Audio API synchronization, millisecond-accurate word/sentence highlighting, and smooth automated UI scrolling.
---

# LRC Lyric Parsing & Audio Sync Specification

## Technical Patterns
1. **LRC RegEx Parser**:
   - Match timestamp pattern `/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/`.
   - Convert `[mm:ss.xx]` to absolute milliseconds for O(1) binary search lookup.
2. **Low-Latency Sync Loop**:
   - Bind `HTML5AudioElement` event `timeupdate`.
   - Use Binary Search (upper bound) to locate active lyric line in $O(\log N)$ time per audio frame.
3. **Smooth Scroll & Interactive Click**:
   - Current line element triggers `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
   - Word click handler extracts target word and opens quiet ⭐收藏 Quick-Action.
