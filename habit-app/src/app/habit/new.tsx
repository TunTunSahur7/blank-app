import { router } from 'expo-router';

import { HabitForm } from '../../components/HabitForm';
import { useHabits, useStrings } from '../../lib/store';

export default function NewHabitScreen() {
  const s = useStrings();
  const { create } = useHabits();
  return (
    <HabitForm
      title={s.newHabitTitle}
      submitLabel={s.add}
      onSubmit={async (input) => {
        await create(input);
        router.back();
      }}
    />
  );
}
