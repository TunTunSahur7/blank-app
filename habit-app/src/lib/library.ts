import { ALL_DAYS } from './dates';
import type { HabitInput } from './db';
import type { Lang } from './i18n';

/**
 * The Habit Library: specific, achievable habits worth tracking, each with a one-line reason,
 * in English and Albanian. Small and concrete beats vague ("Read 10 pages", not "Read more").
 */

const WEEKDAYS = 0b0111110;
const MWF = 0b0101010;

type Text = { en: string; sq: string };

export type LibraryEntry = Omit<HabitInput, 'name' | 'promise'> & { id: string; name: Text; why: Text };

/** A library habit in one language, ready to add. */
export type LibraryHabit = HabitInput & { id: string; why: string };

export type Category = { id: string; title: Text; habits: LibraryEntry[]; only?: Lang };

const h = (id: string, icon: string, color: string, en: [string, string], sq: [string, string], days = ALL_DAYS): LibraryEntry => ({
  id, icon, color, days, reminder: null, name: { en: en[0], sq: sq[0] }, why: { en: en[1], sq: sq[1] },
});

export const CATEGORIES: Category[] = [
  {
    // Everyday habits that fit Albanian life: the evening xhiro, family, coffee culture.
    id: 'ours',
    title: { en: 'Albanian Essentials', sq: 'Shprehitë tona' },
    only: 'sq',
    habits: [
      h('xhiro', 'walk', '#34C759', ['Evening walk (xhiro)', 'The xhiro tradition, as a daily health habit.'], ['Bëj xhiron e mbrëmjes', 'Tradita e xhiros, e kthyer në shprehi shëndeti.']),
      h('parents', 'call', '#34C759', ['Call your parents', 'Family comes first, especially from far away.'], ['Thirr prindërit ose gjyshërit', 'Familja vjen e para, sidomos kur jeni larg.']),
      h('nocig', 'nosmoke', '#8E8E93', ['No cigarettes today', 'Every smoke-free day counts.'], ['Asnjë cigare sot', 'Çdo ditë pa duhan ka rëndësi.']),
      h('coffee2', 'coffee', '#A2845E', ['Max 2 coffees, none after 4 PM', 'Enjoy your coffee without losing sleep.'], ['Maksimumi 2 kafe, asnjë pas orës 16', 'Shijojeni kafen pa e prishur gjumin.']),
      h('table', 'nophone', '#FF2D55', ['No phone at the table', 'Meals are for the people around you.'], ['Pa telefon në tavolinë', 'Dreka dhe darka janë për familjen.']),
      h('german', 'language', '#007AFF', ['Learn German or English, 10 min', 'For work, studies or a new start.'], ['Mëso gjermanisht ose anglisht 10 minuta', 'Për punë, studime ose një fillim të ri.']),
      h('save100', 'money', '#34C759', ['Save something (100 lekë / 1€)', 'The habit matters more than the amount.'], ['Kurse diçka (100 lekë / 1€)', 'Shprehia ka më shumë rëndësi se shuma.']),
      h('midnight', 'sleep', '#5856D6', ['Asleep before midnight', 'Late nights cost you the next day.'], ['Gjumë para mesnate', 'Netët e vona i paguani të nesërmen.']),
      h('gooddeed', 'kind', '#FF2D55', ['One good deed', 'Hospitality and helping others, every day.'], ['Një vepër e mirë', 'Mikpritja dhe ndihma, çdo ditë.']),
      h('prayer', 'gratitude', '#AF52DE', ['Prayer or a quiet moment', 'A pause for your faith or your thoughts.'], ['Lutje ose një çast qetësie', 'Një pushim për besimin ose mendimet tuaja.']),
    ],
  },
  {
    id: 'health',
    title: { en: 'Health', sq: 'Shëndeti' },
    habits: [
      h('water', 'water', '#007AFF', ['Drink 8 glasses of water', 'Even mild dehydration drags on energy and focus.'], ['Pi 8 gota ujë', 'Edhe pak dehidrim ul energjinë dhe përqendrimin.']),
      h('sleep7', 'sleep', '#5856D6', ['Sleep 7+ hours', 'Sleep is when your body and memory recover.'], ['Fli 7+ orë', 'Gjumi është kur trupi dhe kujtesa rikuperohen.']),
      h('vitamins', 'pill', '#FF9500', ['Take your vitamins', 'A two-second habit that’s easy to forget.'], ['Merr vitaminat', 'Dy sekonda, por harrohet lehtë.']),
      h('veg', 'veggies', '#34C759', ['Eat a vegetable with every meal', 'The simplest diet rule that actually lasts.'], ['Perime në çdo vakt', 'Rregulli më i thjeshtë i ushqimit që zgjat.']),
      h('caffeine', 'coffee', '#A2845E', ['No caffeine after 2 PM', 'Caffeine lingers for hours and quietly costs you sleep.'], ['Pa kafeinë pas orës 14', 'Kafeina zgjat me orë dhe ua merr gjumin.']),
      h('floss', 'floss', '#30B0C7', ['Floss', 'Your future self (and dentist) will thank you.'], ['Pastro dhëmbët me fill', 'Ju (dhe dentisti) do të falënderoni veten.']),
    ],
  },
  {
    id: 'fitness',
    title: { en: 'Fitness', sq: 'Fitnesi' },
    habits: [
      h('steps', 'steps', '#34C759', ['Walk 8,000 steps', 'The easiest way to move more without a gym.'], ['Ec 8.000 hapa', 'Mënyra më e lehtë për të lëvizur pa palestër.']),
      h('workout', 'strength', '#FF3B30', ['Work out', 'Three days a week builds real strength.'], ['Stërvitu', 'Tri ditë në javë ndërtojnë forcë të vërtetë.'], MWF),
      h('stretch', 'stretch', '#30B0C7', ['Stretch for 10 minutes', 'Undo a day of sitting.'], ['Shtriqu 10 minuta', 'Fshini një ditë të tërë ndenjur.']),
      h('pushups', 'pushups', '#FF9500', ['20 push-ups', 'Two minutes. No equipment. No excuses.'], ['20 shtytje', 'Dy minuta. Pa pajisje. Pa justifikime.']),
      h('yoga', 'yoga', '#AF52DE', ['Yoga', 'Strength, balance and a calmer mind at once.'], ['Joga', 'Forcë, ekuilibër dhe mendje e qetë njëherësh.']),
      h('outside', 'outdoors', '#34C759', ['Get outside', 'Daylight and fresh air, even for ten minutes.'], ['Dil jashtë', 'Dritë dhe ajër i pastër, qoftë edhe dhjetë minuta.']),
    ],
  },
  {
    id: 'mind',
    title: { en: 'Mind', sq: 'Mendja' },
    habits: [
      h('meditate', 'meditate', '#5856D6', ['Meditate 10 minutes', 'Train your attention like a muscle.'], ['Medito 10 minuta', 'Stërviteni vëmendjen si një muskul.']),
      h('grateful', 'gratitude', '#FF9500', ['Write 3 things you’re grateful for', 'Shifts your focus to what’s going right.'], ['3 gjëra për të cilat jam mirënjohës', 'E kthen vëmendjen te ajo që shkon mirë.']),
      h('journal', 'journal', '#30B0C7', ['Journal', 'Get the noise out of your head and onto the page.'], ['Shkruaj ditarin', 'Nxirrni zhurmën nga koka dhe hidheni në letër.']),
      h('read10', 'read', '#FF9500', ['Read 10 pages', 'About a dozen books a year, ten pages at a time.'], ['Lexo 10 faqe', 'Rreth 12 libra në vit, dhjetë faqe në ditë.']),
      h('lang', 'language', '#007AFF', ['Practice a language', 'Ten minutes a day adds up to 60 hours a year.'], ['Mëso një gjuhë', 'Dhjetë minuta në ditë bëjnë 60 orë në vit.']),
      h('breathing', 'breath', '#30B0C7', ['Box breathing', 'Four slow breaths to reset when stress spikes.'], ['Frymëmarrje e qetë', 'Katër frymëmarrje të ngadalta kur rritet stresi.']),
    ],
  },
  {
    id: 'focus',
    title: { en: 'Focus', sq: 'Fokusi' },
    habits: [
      h('nophone1h', 'nophone', '#FF2D55', ['No phone for the first hour', 'Start the day on your terms, not your notifications.'], ['Pa telefon orën e parë', 'Fillojeni ditën sipas jush, jo sipas njoftimeve.']),
      h('plan', 'plan', '#007AFF', ['Plan tomorrow tonight', 'Wake up already knowing what matters.'], ['Planifiko nesërmen sonte', 'Zgjohuni duke ditur çfarë ka rëndësi.']),
      h('deepwork', 'timer', '#5856D6', ['1 hour of deep work', 'One focused hour beats a distracted day.'], ['1 orë punë e përqendruar', 'Një orë fokusi mund një ditë të shpërqendruar.'], WEEKDAYS),
      h('bed', 'bed', '#AF52DE', ['Make your bed', 'One small win before 8 AM.'], ['Rregullo shtratin', 'Një fitore e vogël para orës 8.']),
      h('wake7', 'alarm', '#FF9500', ['Wake up by 7', 'A consistent wake time fixes more than your mornings.'], ['Zgjohu deri në 7', 'Një orar i qëndrueshëm rregullon më shumë se mëngjeset.']),
      h('inbox', 'inbox', '#8E8E93', ['Inbox zero', 'Clear it once, stop carrying it all day.'], ['Email-et në zero', 'Pastrojeni një herë, mos e mbani gjithë ditën.'], WEEKDAYS),
    ],
  },
  {
    id: 'money',
    title: { en: 'Money', sq: 'Paratë' },
    habits: [
      h('nospend', 'nospend', '#34C759', ['No-spend day', 'See how often “just this once” happens.'], ['Ditë pa shpenzime', 'Shihni sa shpesh ndodh “vetëm këtë herë”.'], WEEKDAYS),
      h('track', 'money', '#30B0C7', ['Track every expense', 'You can’t change what you don’t see.'], ['Shëno çdo shpenzim', 'Nuk ndryshoni dot atë që nuk e shihni.']),
      h('save', 'money', '#34C759', ['Save something today', 'Any amount. The habit matters more than the sum.'], ['Kurse diçka sot', 'Çdo shumë. Shprehia ka më shumë rëndësi.']),
      h('impulse', 'nospend', '#FF9500', ['No impulse buys', 'Wait 24 hours before buying anything you didn’t plan.'], ['Pa blerje impulsive', 'Prisni 24 orë para se të blini diçka të paplanifikuar.']),
    ],
  },
  {
    id: 'people',
    title: { en: 'People', sq: 'Njerëzit' },
    habits: [
      h('call', 'call', '#34C759', ['Text or call someone you love', 'Relationships run on small, regular contact.'], ['Shkruaj ose thirr dikë që do', 'Marrëdhëniet ushqehen me kontakt të vogël e të rregullt.']),
      h('kindness', 'kind', '#FF2D55', ['One act of kindness', 'It makes their day, and yours.'], ['Një gjest mirësie', 'Ua bën ditën më të mirë, edhe juve.']),
      h('quality', 'partner', '#AF52DE', ['Quality time, phones down', 'Be fully there for the people in front of you.'], ['Kohë cilësore, pa telefona', 'Jini plotësisht aty për njerëzit pranë jush.']),
      h('dog', 'pet', '#A2845E', ['Walk the dog', 'Good for both of you.'], ['Shëtit qenin', 'E mirë për të dy.']),
    ],
  },
  {
    id: 'quit',
    title: { en: 'Break a habit', sq: 'Lëri pas' },
    habits: [
      h('nosocial', 'social', '#FF3B30', ['No social media', 'Win back hours every week.'], ['Pa rrjete sociale', 'Fitoni orë të tëra çdo javë.']),
      h('nodoom', 'nophone', '#5856D6', ['No doomscrolling after 10 PM', 'Protect your sleep from the feed.'], ['Pa telefon pas orës 22', 'Mbrojeni gjumin nga ekrani.']),
      h('noalcohol', 'noalcohol', '#AF52DE', ['No alcohol', 'Better sleep, clearer mornings.'], ['Pa alkool', 'Gjumë më i mirë, mëngjese më të kthjellta.']),
      h('nosmoking', 'nosmoke', '#8E8E93', ['No smoking', 'Every smoke-free day counts.'], ['Pa duhan', 'Çdo ditë pa duhan ka rëndësi.']),
      h('nojunk', 'food', '#FF9500', ['No junk food', 'Eat on purpose, not on autopilot.'], ['Pa ushqim të shpejtë', 'Hani me qëllim, jo në automatik.']),
      h('nosoda', 'water', '#FF2D55', ['No sugary drinks', 'The easiest sugar to cut.'], ['Pa pije me sheqer', 'Sheqeri më i lehtë për ta hequr.']),
    ],
  },
  {
    id: 'self',
    title: { en: 'Self-care', sq: 'Kujdesi për veten' },
    habits: [
      h('skincare', 'clean', '#FF2D55', ['Skincare routine', 'Two minutes, morning and night.'], ['Kujdesi për lëkurën', 'Dy minuta, mëngjes dhe mbrëmje.']),
      h('sunlight', 'sun', '#FF9500', ['Morning sunlight', 'Ten minutes of daylight helps set your body clock.'], ['Dielli i mëngjesit', 'Dhjetë minuta dritë rregullojnë orën e trupit.']),
      h('cold', 'cold', '#007AFF', ['Cold shower', 'Thirty seconds of cold for a sharp start.'], ['Dush i ftohtë', 'Tridhjetë sekonda të ftohta për një fillim të mprehtë.']),
      h('tidy', 'home', '#30B0C7', ['Tidy for 10 minutes', 'A calmer space, a calmer head.'], ['Rregullo shtëpinë 10 minuta', 'Hapësirë më e qetë, mendje më e qetë.']),
      h('create', 'art', '#AF52DE', ['Create something', 'Draw, write, play: make instead of scroll.'], ['Krijo diçka', 'Vizato, shkruaj, luaj: krijo në vend që të shfletosh.']),
      h('photo', 'photo', '#5856D6', ['Take a photo of your day', 'A year of tiny memories.'], ['Bëj një foto të ditës', 'Një vit me kujtime të vogla.']),
    ],
  },
];

const ALL: LibraryEntry[] = CATEGORIES.flatMap((c) => c.habits);
const BY_ID = new Map(ALL.map((x) => [x.id, x]));

const pick = (...ids: string[]): LibraryEntry[] =>
  ids.map((id) => {
    const found = BY_ID.get(id);
    if (!found) throw new Error(`Unknown library habit: ${id}`);
    return found;
  });

export type Pack = { id: string; title: Text; subtitle: Text; color: string; habits: LibraryEntry[]; only?: Lang };

/** One-tap bundles built around goals people actually search for. */
export const PACKS: Pack[] = [
  {
    id: 'ours', title: { en: 'Albanian Essentials', sq: 'Shprehitë tona' }, subtitle: { en: 'Daily habits for us', sq: 'Për çdo ditë, për ne' },
    color: '#E41E20', only: 'sq', habits: pick('xhiro', 'parents', 'nocig', 'coffee2', 'table', 'midnight'),
  },
  {
    id: 'morning', title: { en: 'Morning Routine', sq: 'Rutina e mëngjesit' }, subtitle: { en: 'Own the first hour', sq: 'Fitojeni orën e parë' },
    color: '#FF9500', habits: pick('bed', 'water', 'sunlight', 'nophone1h', 'plan'),
  },
  {
    id: 'monk', title: { en: 'Monk Mode', sq: 'Monk Mode' }, subtitle: { en: 'Deep focus, zero noise', sq: 'Fokus i thellë, zero zhurmë' },
    color: '#1D1D1F', habits: pick('deepwork', 'nosocial', 'meditate', 'read10', 'workout', 'noalcohol'),
  },
  {
    id: 'detox', title: { en: 'Dopamine Detox', sq: 'Detoks dopamine' }, subtitle: { en: 'Reset your brain', sq: 'Rinisni trurin' },
    color: '#5856D6', habits: pick('nosocial', 'nodoom', 'nojunk', 'outside', 'journal'),
  },
  {
    id: 'sleep', title: { en: 'Better Sleep', sq: 'Gjumë më i mirë' }, subtitle: { en: 'Fall asleep faster', sq: 'Bini në gjumë më shpejt' },
    color: '#007AFF', habits: pick('caffeine', 'nodoom', 'sunlight', 'sleep7'),
  },
  {
    id: 'glow', title: { en: 'Glow Up', sq: 'Glow Up' }, subtitle: { en: 'Look and feel your best', sq: 'Dukuni dhe ndihuni më mirë' },
    color: '#FF2D55', habits: pick('skincare', 'water', 'workout', 'sleep7', 'veg'),
  },
  {
    id: 'calm', title: { en: 'Calm Mind', sq: 'Mendje e qetë' }, subtitle: { en: 'Less stress, more peace', sq: 'Më pak stres, më shumë qetësi' },
    color: '#30B0C7', habits: pick('grateful', 'meditate', 'outside', 'call', 'breathing'),
  },
  {
    id: 'money', title: { en: 'Money Reset', sq: 'Rregullo paratë' }, subtitle: { en: 'Spend less, save more', sq: 'Shpenzo më pak, kurse më shumë' },
    color: '#34C759', habits: pick('track', 'nospend', 'impulse', 'save'),
  },
];

/** A library entry in one language. */
export function localize(e: LibraryEntry, lang: Lang): LibraryHabit {
  return { id: e.id, name: e.name[lang], why: e.why[lang], icon: e.icon, color: e.color, days: e.days, reminder: e.reminder, promise: null };
}

export const categoriesFor = (lang: Lang) => CATEGORIES.filter((c) => !c.only || c.only === lang);
export const packsFor = (lang: Lang) => PACKS.filter((p) => !p.only || p.only === lang);

/** Shown during onboarding: broad appeal, easy first wins. */
export function popular(lang: Lang): LibraryHabit[] {
  const ids =
    lang === 'sq'
      ? ['water', 'xhiro', 'read10', 'parents', 'nocig', 'midnight', 'german', 'workout']
      : ['water', 'read10', 'steps', 'meditate', 'sleep7', 'nophone1h', 'workout', 'grateful'];
  return pick(...ids).map((e) => localize(e, lang));
}

export const ALL_LIBRARY = ALL;
