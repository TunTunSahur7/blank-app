import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { HabitForm } from '../../../components/HabitForm';
import { useHabits } from '../../../lib/store';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, update, remove } = useHabits();
  const habit = habits.find((h) => h.id === Number(id));
  if (!habit) return null;

  const confirmDelete = () =>
    Alert.alert(`Delete “${habit.name}”?`, 'This removes the habit and its whole history. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(habit.id);
          router.dismissTo('/');
        },
      },
    ]);

  return (
    <HabitForm
      title="Edit Habit"
      initial={habit}
      submitLabel="Save"
      onSubmit={async (input) => {
        await update(habit.id, input);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}
