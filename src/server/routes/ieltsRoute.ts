import { Router, type Response } from 'express';
import { prisma, sanitizeBigInt } from '../prisma';
import { type AuthenticatedRequest, authenticate } from '../auth';

const router = Router();
router.use(authenticate);

// GET /api/ielts/tests - Get all test records
router.get('/tests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tests = await prisma.iELTSTest.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    const parsed = tests.map((t) => ({
      ...sanitizeBigInt(t),
      questionResults: t.questionResults ? JSON.parse(t.questionResults) : [],
      rawQuestions: t.rawQuestions ? JSON.parse(t.rawQuestions) : [],
    }));

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ielts/tests - Save a test record
router.post('/tests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      timestamp,
      bandScore,
      passageTitle,
      totalQuestions,
      correctCount,
      durationSeconds,
      questionResults,
      rawQuestions,
    } = req.body;

    const record = await prisma.iELTSTest.create({
      data: {
        userId,
        timestamp: BigInt(timestamp || Date.now()),
        bandScore: Number(bandScore) || 0,
        passageTitle: passageTitle || 'Untitled Mock Test',
        totalQuestions: Number(totalQuestions) || 0,
        correctCount: Number(correctCount) || 0,
        durationSeconds: Number(durationSeconds) || 0,
        questionResults: JSON.stringify(questionResults || []),
        rawQuestions: JSON.stringify(rawQuestions || []),
      },
    });

    res.json({
      success: true,
      data: {
        ...sanitizeBigInt(record),
        questionResults: questionResults || [],
        rawQuestions: rawQuestions || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ielts/custom-passages - Get all custom reading passages for authenticated user
router.get('/custom-passages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const passages = await prisma.customPassage.findMany({
      where: { userId },
      orderBy: { addedTimestamp: 'desc' },
    });

    const parsed = passages.map((p) => ({
      ...sanitizeBigInt(p),
      questions: p.questions ? JSON.parse(p.questions) : [],
    }));

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ielts/custom-passages - Save a custom reading passage with composite user isolation
router.post('/custom-passages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      id,
      cambridgeBook,
      testNum,
      passageNum,
      title,
      subTitle,
      readingPassage,
      questions,
      addedTimestamp,
    } = req.body;

    const passageId = id || `custom-p-${Date.now()}`;
    const upserted = await prisma.customPassage.upsert({
      where: {
        userId_id: {
          userId,
          id: passageId,
        },
      },
      update: {
        title,
        subTitle,
        readingPassage,
        questions: JSON.stringify(questions || []),
      },
      create: {
        id: passageId,
        userId,
        cambridgeBook: cambridgeBook || null,
        testNum: testNum || null,
        passageNum: passageNum || null,
        title: title || 'Custom Reading Passage',
        subTitle: subTitle || null,
        readingPassage: readingPassage || '',
        questions: JSON.stringify(questions || []),
        addedTimestamp: BigInt(addedTimestamp || Date.now()),
        isOnlineAdded: true,
      },
    });

    res.json({
      success: true,
      data: {
        ...sanitizeBigInt(upserted),
        questions: questions || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ielts/custom-listening - Get all custom listening materials for authenticated user
router.get('/custom-listening', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const listeningList = await prisma.customListening.findMany({
      where: { userId },
      orderBy: { addedTimestamp: 'desc' },
    });

    const parsed = listeningList.map((item) => ({
      ...sanitizeBigInt(item),
      questions: item.questions ? JSON.parse(item.questions) : [],
      transcript: item.transcript ? JSON.parse(item.transcript) : null,
    }));

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ielts/custom-listening - Save or update custom listening material with composite user isolation
router.post('/custom-listening', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      id,
      cambridgeBook,
      testNum,
      sectionNum,
      title,
      topic,
      audioUrl,
      questions,
      transcript,
      addedTimestamp,
    } = req.body;

    const listeningId = id || `custom-l-${Date.now()}`;
    const upserted = await prisma.customListening.upsert({
      where: {
        userId_id: {
          userId,
          id: listeningId,
        },
      },
      update: {
        title: title || 'Custom Listening',
        topic: topic || null,
        audioUrl: audioUrl || null,
        questions: JSON.stringify(questions || []),
        transcript: transcript ? JSON.stringify(transcript) : null,
      },
      create: {
        id: listeningId,
        userId,
        cambridgeBook: cambridgeBook || null,
        testNum: testNum || null,
        sectionNum: sectionNum || null,
        title: title || 'Custom Listening',
        topic: topic || null,
        audioUrl: audioUrl || null,
        questions: JSON.stringify(questions || []),
        transcript: transcript ? JSON.stringify(transcript) : null,
        addedTimestamp: BigInt(addedTimestamp || Date.now()),
        isOnlineAdded: true,
      },
    });

    res.json({
      success: true,
      data: {
        ...sanitizeBigInt(upserted),
        questions: questions || [],
        transcript: transcript || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/ielts/custom-listening/:id - Remove custom listening material
router.delete('/custom-listening/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await prisma.customListening.deleteMany({
      where: { userId, id },
    });

    res.json({ success: true, message: 'Custom listening material deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
