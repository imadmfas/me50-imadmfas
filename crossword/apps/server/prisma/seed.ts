import { PrismaClient } from '@prisma/client';
import { RAW_WORDBANK } from '../../../packages/shared/src/wordbank/raw.js';
import { normalizeArabic, segmentToCells } from '../../../packages/shared/src/normalizer.js';
import { DIFFICULTY_RULES } from '../../../packages/shared/src/constants.js';

const prisma = new PrismaClient();

const BOT_PRACTICE_USER_ID = 'bot-practice';

const ACHIEVEMENTS = [
  { id: 'ach-first-win', code: 'first_win', title: 'أول انتصار', titleEn: 'First Win', description: 'اربح أول مباراة تنافسية لك', icon: '🏆' },
  { id: 'ach-streak-7', code: 'streak_7', title: 'مثابرة أسبوع', titleEn: '7-Day Streak', description: 'العب سبعة أيام متتالية', icon: '🔥' },
  { id: 'ach-scholar', code: 'scholar_50', title: 'باحث', titleEn: 'Scholar', description: 'أكمل 50 كلمة بشكل صحيح', icon: '📚' },
  { id: 'ach-hard-diff', code: 'hard_master', title: 'خبير الصعب', titleEn: 'Hard Mode Master', description: 'اربح مباراة في المستوى الصعب', icon: '🧠' },
  { id: 'ach-daily-10', code: 'daily_10', title: 'مواظب', titleEn: 'Daily Regular', description: 'أكمل التحدي اليومي 10 مرات', icon: '📅' },
];

async function main() {
  console.log('Seeding word bank...');
  let count = 0;
  for (const raw of RAW_WORDBANK) {
    if (!raw.verified) continue;
    const answerNormalized = normalizeArabic(raw.answer);
    const length = segmentToCells(answerNormalized).length;
    const rules = DIFFICULTY_RULES[raw.difficulty];
    if (length < rules.minLen || length > rules.maxLen) {
      throw new Error(`[seed] "${raw.answer}" (${raw.id}) length ${length} outside ${raw.difficulty} range — run build:wordbank first`);
    }
    await prisma.wordEntry.upsert({
      where: { id: raw.id },
      update: {
        answer: raw.answer, answerNormalized, length, clue: raw.clue, clueEn: raw.clueEn,
        category: raw.category, difficulty: raw.difficulty, factCard: raw.factCard, source: raw.source,
        verified: raw.verified, tagsJson: JSON.stringify(raw.tags),
      },
      create: {
        id: raw.id, answer: raw.answer, answerNormalized, length, clue: raw.clue, clueEn: raw.clueEn,
        category: raw.category, difficulty: raw.difficulty, factCard: raw.factCard, source: raw.source,
        verified: raw.verified, tagsJson: JSON.stringify(raw.tags),
      },
    });
    count++;
  }
  console.log(`  ${count} word entries upserted.`);

  console.log('Seeding practice bot account...');
  await prisma.user.upsert({
    where: { id: BOT_PRACTICE_USER_ID },
    update: {},
    create: {
      id: BOT_PRACTICE_USER_ID,
      username: 'الروبوت_المدرّب',
      usernameKey: 'الروبوت_المدرب',
      avatarSeed: BOT_PRACTICE_USER_ID,
    },
  });

  console.log('Seeding achievements...');
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { id: a.id }, update: a, create: a });
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
