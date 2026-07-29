import cron from 'node-cron';
import { prisma } from '../db.js';
import { sendPushToUser, pushConfigured } from '../push.js';

/**
 * Daily re-engagement notifications. Escalation ladder by days-inactive,
 * at most one push/day, and silence after 7 consecutive ignored pushes —
 * see MASTER BUILD PROMPT §8. This job runs hourly and, for each user,
 * only actually sends once it's ~19:00 in THAT user's stored IANA
 * timezone (falls back to UTC if unset), so everyone gets their nudge at
 * their own local evening rather than a single global UTC hour.
 */

const MESSAGE_POOL = [
  'اشتقنا لك! لغز جديد بانتظارك اليوم في الكلمات المتقاطعة النيونية.',
  'كلمة واحدة يوميًا تكفي لتتعلم شيئًا جديدًا — عد إلينا اليوم.',
  'خصمك التالي في الانتظار. هل أنت مستعد لجولة سريعة؟',
  'التحدي اليومي يتجدد كل يوم — لا تفوّت فرصة تعلّم مصطلح جديد.',
  'رصيدك من المعرفة ينتظر إضافة جديدة اليوم.',
  'دقيقتان فقط تكفيان لحل لغز وتعلّم حقيقة علمية ممتعة.',
  'مجتمع اللاعبين نشط الآن — انضم إلى مباراة مباشرة.',
  'هل تتذكر آخر كلمة حللتها؟ راجعها في قسم "التعلّم".',
  'تقدّمك محفوظ، وخصومك يتقدمون — عد للمنافسة.',
  'كل يوم غياب هو لغز أقل تعلّمته. عد اليوم!',
];

function daysInactive(lastActiveAt: Date): number {
  return Math.floor((Date.now() - lastActiveAt.getTime()) / 86400000);
}

function escalationType(days: number): string | null {
  if (days >= 14) return 'new_content';
  if (days >= 7) return 'rank_drop';
  if (days >= 3) return 'streak_risk';
  if (days >= 1) return 'inactivity_day1';
  return null;
}

function escalationTitle(type: string): string {
  switch (type) {
    case 'streak_risk': return 'سلسلتك في خطر!';
    case 'rank_drop': return 'ترتيبك تراجع';
    case 'new_content': return 'محتوى جديد بانتظارك';
    default: return 'الكلمات المتقاطعة النيونية';
  }
}

function isLocalEveningHour(timezone: string, targetHour = 19): boolean {
  try {
    const hour = Number(
      new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date()),
    );
    return hour === targetHour;
  } catch {
    return false;
  }
}

async function pickUnusedMessage(userId: string): Promise<string> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
  const recent = await prisma.notificationLog.findMany({
    where: { userId, sentAt: { gte: fourteenDaysAgo } },
    orderBy: { sentAt: 'desc' },
    take: MESSAGE_POOL.length,
  });
  const recentIndices = new Set(recent.map((_, i) => i)); // best-effort: avoid the N most recent slots
  const candidates = MESSAGE_POOL.filter((_, i) => !recentIndices.has(i));
  const pool = candidates.length > 0 ? candidates : MESSAGE_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function runInactivityCheck(): Promise<void> {
  if (!pushConfigured) return;

  const oneDayAgo = new Date(Date.now() - 86400000);
  const candidates = await prisma.user.findMany({
    where: { lastActiveAt: { lt: oneDayAgo }, pushSubscriptions: { some: {} } },
  });

  for (const user of candidates) {
    if (!isLocalEveningHour(user.timezone)) continue;

    const days = daysInactive(user.lastActiveAt);
    const type = escalationType(days);
    if (!type) continue;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alreadySentToday = await prisma.notificationLog.findFirst({
      where: { userId: user.id, sentAt: { gte: today } },
    });
    if (alreadySentToday) continue; // at most one push per day

    const last7 = await prisma.notificationLog.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 7,
    });
    if (last7.length === 7 && last7.every((n) => !n.opened)) continue; // silence after 7 ignored

    const body = await pickUnusedMessage(user.id);
    await sendPushToUser(user.id, { title: escalationTitle(type), body, url: '/home' });
    await prisma.notificationLog.create({ data: { userId: user.id, type } });
  }
}

export function startNotificationCron(): void {
  if (!pushConfigured) {
    console.log('[notifications] VAPID keys not configured — daily re-engagement push disabled.');
    return;
  }
  // Every hour, on the hour — see isLocalEveningHour for the actual per-user gating.
  cron.schedule('0 * * * *', () => {
    runInactivityCheck().catch((err) => console.error('[notifications] cron run failed', err));
  });
}
