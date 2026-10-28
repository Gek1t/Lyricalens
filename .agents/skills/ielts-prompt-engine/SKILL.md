---
name: ielts-prompt-engine
description: Prompt engineering guidelines and JSON schemas for generating standard IELTS Reading/Listening exam materials. Enforces academic vocabulary integration, logical self-consistency in T/F/NG and Summary Completion questions, and JSON Schema enforcement.
---

# IELTS Exam Generation Prompt Engineering Guide

## Generation Rules
1. **Passage Specifications**:
   - Word count: 750 - 900 words.
   - Style: Academic (Band 7.5+ tone, formal connectors, complex clause structures).
   - Target Words Integration: Must naturally embed user's target vocabulary with highlighted markers `<target id="...">word</target>`.
2. **Strict Question Schema**:
   - **T/F/NG (True / False / Not Given)**: Must have unambiguous text references in the passage for True/False, and absent/unverifiable claims for Not Given.
   - **Summary Completion**: Provide word bank or exact 1-3 word extraction constraints.
   - **JSON Schema Enforcement**: Response must strictly match the `ExamPaper` JSON Interface without markdown wrappers.
