import { router } from 'expo-router';

import { HabitForm } from '../../components/HabitForm';
import { useHabits } from '../../lib/store';

export default function NewHabitScreen() {
  const { create } = useHabits();
  return (
    <HabitForm
      submitLabel="Add habit"
      onSubmit={async (input) => {
        await create(input);
        router.back();
      }}
    />
  );
}
