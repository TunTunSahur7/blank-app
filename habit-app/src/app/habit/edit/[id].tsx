import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { HabitForm } from '../../../components/HabitForm';
import { useHabits, useStrings } from '../../../lib/store';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStrings();
  const { habits, update, remove } = useHabits();
  const habit = habits.find((h) => h.id === Number(id));
  if (!habit) return null;

  const confirmDelete = () =>
    Alert.alert(s.deleteConfirmTitle(habit.name), s.deleteConfirmBody, [
      { text: s.cancel, style: 'cancel' },
      {
        text: s.delete,
        style: 'destructive',
        onPress: async () => {
          await remove(habit.id);
          router.dismissTo('/');
        },
      },
    ]);

  return (
    <HabitForm
      title={s.editHabitTitle}
      initial={habit}
      submitLabel={s.save}
      onSubmit={async (input) => {
        await update(habit.id, input);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}
