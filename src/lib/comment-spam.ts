/**
 * Content checks for public comments, on top of the honeypot field, the rate
 * limit and pre-moderation. Two outcomes besides "accept":
 *
 *   - "reject": links. Told plainly, because a real reader can simply remove
 *     the link and send again.
 *   - "discard": advertising (betting, crypto, loans, pharmacy, adult, SEO)
 *     and keyword stuffing. Answered exactly like a normal comment, so bots
 *     never learn which messages get through.
 *
 * Deliberately conservative: ordinary words that spam also uses ("win",
 * "login", "slot") only count inside the run-together brand names spammers
 * use, never in normal sentences, so genuine comments aren't caught.
 */

export type SpamVerdict =
  | { action: "accept" }
  | { action: "reject"; message: string }
  | { action: "discard"; reasons: string[] };

const LINK_PATTERNS = [
  /https?:\/\//i,
  /\bwww\./i,
  // Bare domains: maxwin.bet, cheap-loans.xyz, site.com/page
  /\b[a-z0-9][a-z0-9-]*\.(com|net|org|info|biz|io|co|me|xyz|top|site|online|shop|store|club|live|vip|win|bet|casino|app|link|click|pro|cc|ru|cn)\b/i,
  // Spelled-out domains: "maxwin dot com"
  /\b[a-z0-9-]+\s*(\(|\[)?\s*dot\s*(\)|\])?\s*(com|net|org|xyz|bet)\b/i,
];

/** Whole words or phrases that only advertising uses. */
const SPAM_TERMS: RegExp[] = [
  /\b(betting|bookmaker|bookmakers|sportsbook|casino|casinos|poker|roulette|baccarat|blackjack)\b/i,
  /\b(online\s+slots?|slot\s+machines?|free\s+spins?|betting\s+tips|odds\s+boost)\b/i,
  /\b(bitcoin|btc|ethereum|crypto(currency)?|forex|binary\s+options?|nft\s+drop|airdrop|trading\s+signals?)\b/i,
  /\b(payday\s+loans?|instant\s+loans?|quick\s+loans?|loan\s+app|credit\s+repair)\b/i,
  // Selling medicines, not asking about them: readers of a hospital site may
  // genuinely mention tramadol or Viagra in a question.
  /\b(buy|order|cheap|discount(ed)?|sale)\s+(\w+\s+)?(viagra|cialis|levitra|tramadol|xanax|oxycodone|pills?|meds|medications?)\b/i,
  /\b(online\s+pharmacy|without\s+(a\s+)?prescription|no\s+prescription\s+needed|diet\s+pills?|weight\s+loss\s+pills?)\b/i,
  /\b(porn|xxx|escort|escorts|onlyfans|hookup|adult\s+dating|nude)\b/i,
  /\b(seo\s+services?|backlinks?|buy\s+followers|guest\s+post(ing)?|link\s+building)\b/i,
];

/** Fragments of the run-together brand names spammers repeat ("maxwinexchlogin"). */
const BRAND_FRAGMENTS = /(login|signin|bet|casino|slot|spin|exch|win|jackpot|crypto|coin|loan|cash|promo|bonus|vip|apk)/i;

/** A single unspaced token of 12+ letters containing two spam fragments. */
function brandTokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]{12,}/g) ?? []).filter((t) => {
    const hits = new Set((t.match(new RegExp(BRAND_FRAGMENTS.source, "gi")) ?? []).map((m) => m.toLowerCase()));
    return hits.size >= 2;
  });
}

export function checkComment(input: { author: string; content: string }): SpamVerdict {
  const author = input.author.trim();
  const content = input.content.trim();
  const both = `${author}\n${content}`;

  if (LINK_PATTERNS.some((re) => re.test(both))) {
    return {
      action: "reject",
      message: "Please remove the link or web address from your comment. If you need to share one with us, email the hospital instead.",
    };
  }

  const reasons: string[] = [];
  if (SPAM_TERMS.some((re) => re.test(both))) reasons.push("advertising terms");

  const brands = brandTokens(both);
  if (brands.length) reasons.push(`brand name "${brands[0]}"`);

  // Keyword stuffing: the same long, unusual word repeated, or the "name" is
  // itself a word repeated in the comment.
  const words = content.toLowerCase().match(/[a-z0-9]{9,}/g) ?? [];
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const stuffed = Array.from(counts.entries()).find(([w, n]) => n >= 3 || (n >= 2 && !/\s/.test(author) && w === author.toLowerCase()));
  if (stuffed) reasons.push(`repeated "${stuffed[0]}"`);

  return reasons.length ? { action: "discard", reasons } : { action: "accept" };
}
