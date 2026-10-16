import { ALL_DAYS } from './dates';
import type { HabitInput } from './db';

/**
 * The Habit Library: specific, achievable habits worth tracking, each with a one-line reason.
 * Small and concrete beats vague ("Read 10 pages", not "Read more").
 */

const WEEKDAYS = 0b0111110;
const MWF = 0b0101010;

export type LibraryHabit = HabitInput & { why: string };

export type Category = { id: string; title: string; habits: LibraryHabit[] };

const h = (name: string, icon: string, color: string, why: string, days = ALL_DAYS): LibraryHabit => ({
  name, icon, color, days, reminder: null, why,
});

export const CATEGORIES: Category[] = [
  {
    id: 'health',
    title: 'Health',
    habits: [
      h('Drink 8 glasses of water', 'water', '#007AFF', 'Even mild dehydration drags on energy and focus.'),
      h('Sleep 7+ hours', 'sleep', '#5856D6', 'Sleep is when your body and memory recover.'),
      h('Take your vitamins', 'pill', '#FF9500', 'A two-second habit that’s easy to forget.'),
      h('Eat a vegetable with every meal', 'veggies', '#34C759', 'The simplest diet rule that actually lasts.'),
      h('No caffeine after 2 PM', 'coffee', '#A2845E', 'Caffeine lingers for hours and quietly costs you sleep.'),
      h('Floss', 'floss', '#30B0C7', 'Your future self (and dentist) will thank you.'),
    ],
  },
  {
    id: 'fitness',
    title: 'Fitness',
    habits: [
      h('Walk 8,000 steps', 'steps', '#34C759', 'The easiest way to move more without a gym.'),
      h('Work out', 'strength', '#FF3B30', 'Three days a week builds real strength.', MWF),
      h('Stretch for 10 minutes', 'stretch', '#30B0C7', 'Undo a day of sitting.'),
      h('20 push-ups', 'pushups', '#FF9500', 'Two minutes. No equipment. No excuses.'),
      h('Yoga', 'yoga', '#AF52DE', 'Strength, balance and a calmer mind at once.'),
      h('Get outside', 'outdoors', '#34C759', 'Daylight and fresh air, even for ten minutes.'),
    ],
  },
  {
    id: 'mind',
    title: 'Mind',
    habits: [
      h('Meditate 10 minutes', 'meditate', '#5856D6', 'Train your attention like a muscle.'),
      h('Write 3 things you’re grateful for', 'gratitude', '#FF9500', 'Shifts your focus to what’s going right.'),
      h('Journal', 'journal', '#30B0C7', 'Get the noise out of your head and onto the page.'),
      h('Read 10 pages', 'read', '#FF9500', 'About a dozen books a year, ten pages at a time.'),
      h('Practice a language', 'language', '#007AFF', 'Ten minutes a day adds up to 60 hours a year.'),
      h('Box breathing', 'breath', '#30B0C7', 'Four slow breaths to reset when stress spikes.'),
    ],
  },
  {
    id: 'focus',
    title: 'Focus',
    habits: [
      h('No phone for the first hour', 'nophone', '#FF2D55', 'Start the day on your terms, not your notifications.'),
      h('Plan tomorrow tonight', 'plan', '#007AFF', 'Wake up already knowing what matters.'),
      h('1 hour of deep work', 'timer', '#5856D6', 'One focused hour beats a distracted day.', WEEKDAYS),
      h('Make your bed', 'bed', '#AF52DE', 'One small win before 8 AM.'),
      h('Wake up by 7', 'alarm', '#FF9500', 'A consistent wake time fixes more than your mornings.'),
      h('Inbox zero', 'inbox', '#8E8E93', 'Clear it once, stop carrying it all day.', WEEKDAYS),
    ],
  },
  {
    id: 'money',
    title: 'Money',
    habits: [
      h('No-spend day', 'nospend', '#34C759', 'See how often “just this once” happens.', WEEKDAYS),
      h('Track every expense', 'money', '#30B0C7', 'You can’t change what you don’t see.'),
      h('Save something today', 'money', '#34C759', 'Any amount. The habit matters more than the sum.'),
      h('No impulse buys', 'nospend', '#FF9500', 'Wait 24 hours before buying anything you didn’t plan.'),
    ],
  },
  {
    id: 'people',
    title: 'People',
    habits: [
      h('Text or call someone you love', 'call', '#34C759', 'Relationships run on small, regular contact.'),
      h('One act of kindness', 'kind', '#FF2D55', 'It makes their day, and yours.'),
      h('Quality time, phones down', 'partner', '#AF52DE', 'Be fully there for the people in front of you.'),
      h('Walk the dog', 'pet', '#A2845E', 'Good for both of you.'),
    ],
  },
  {
    id: 'quit',
    title: 'Break a habit',
    habits: [
      h('No social media', 'social', '#FF3B30', 'Win back hours every week.'),
      h('No doomscrolling after 10 PM', 'nophone', '#5856D6', 'Protect your sleep from the feed.'),
      h('No alcohol', 'noalcohol', '#AF52DE', 'Better sleep, clearer mornings.'),
      h('No smoking', 'nosmoke', '#8E8E93', 'Every smoke-free day counts.'),
      h('No junk food', 'food', '#FF9500', 'Eat on purpose, not on autopilot.'),
      h('No sugary drinks', 'water', '#FF2D55', 'The easiest sugar to cut.'),
    ],
  },
  {
    id: 'self',
    title: 'Self-care',
    habits: [
      h('Skincare routine', 'clean', '#FF2D55', 'Two minutes, morning and night.'),
      h('Morning sunlight', 'sun', '#FF9500', 'Ten minutes of daylight helps set your body clock.'),
      h('Cold shower', 'cold', '#007AFF', 'Thirty seconds of cold for a sharp start.'),
      h('Tidy for 10 minutes', 'home', '#30B0C7', 'A calmer space, a calmer head.'),
      h('Create something', 'art', '#AF52DE', 'Draw, write, play: make instead of scroll.'),
      h('Take a photo of your day', 'photo', '#5856D6', 'A year of tiny memories.'),
    ],
  },
];

export const ALL_LIBRARY: LibraryHabit[] = CATEGORIES.flatMap((c) => c.habits);

const byName = new Map(ALL_LIBRARY.map((x) => [x.name, x]));
const pick = (...names: string[]): LibraryHabit[] =>
  names.map((n) => {
    const found = byName.get(n);
    if (!found) throw new Error(`Unknown library habit: ${n}`);
    return found;
  });

export type Pack = { id: string; title: string; subtitle: string; color: string; habits: LibraryHabit[] };

/** One-tap bundles built around goals people actually search for. */
export const PACKS: Pack[] = [
  {
    id: 'morning', title: 'Morning Routine', subtitle: 'Own the first hour', color: '#FF9500',
    habits: pick('Make your bed', 'Drink 8 glasses of water', 'Morning sunlight', 'No phone for the first hour', 'Plan tomorrow tonight'),
  },
  {
    id: 'monk', title: 'Monk Mode', subtitle: 'Deep focus, zero noise', color: '#1D1D1F',
    habits: pick('1 hour of deep work', 'No social media', 'Meditate 10 minutes', 'Read 10 pages', 'Work out', 'No alcohol'),
  },
  {
    id: 'detox', title: 'Dopamine Detox', subtitle: 'Reset your brain', color: '#5856D6',
    habits: pick('No social media', 'No doomscrolling after 10 PM', 'No junk food', 'Get outside', 'Journal'),
  },
  {
    id: 'sleep', title: 'Better Sleep', subtitle: 'Fall asleep faster', color: '#007AFF',
    habits: pick('No caffeine after 2 PM', 'No doomscrolling after 10 PM', 'Morning sunlight', 'Sleep 7+ hours'),
  },
  {
    id: 'glow', title: 'Glow Up', subtitle: 'Look and feel your best', color: '#FF2D55',
    habits: pick('Skincare routine', 'Drink 8 glasses of water', 'Work out', 'Sleep 7+ hours', 'Eat a vegetable with every meal'),
  },
  {
    id: 'calm', title: 'Calm Mind', subtitle: 'Less stress, more peace', color: '#30B0C7',
    habits: pick('Write 3 things you’re grateful for', 'Meditate 10 minutes', 'Get outside', 'Text or call someone you love', 'Box breathing'),
  },
  {
    id: 'money', title: 'Money Reset', subtitle: 'Spend less, save more', color: '#34C759',
    habits: pick('Track every expense', 'No-spend day', 'No impulse buys', 'Save something today'),
  },
];

/** Shown during onboarding: broad appeal, easy first wins. */
export const POPULAR: LibraryHabit[] = pick(
  'Drink 8 glasses of water', 'Read 10 pages', 'Walk 8,000 steps', 'Meditate 10 minutes',
  'Sleep 7+ hours', 'No phone for the first hour', 'Work out', 'Write 3 things you’re grateful for',
);
