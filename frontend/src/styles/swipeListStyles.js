import { StyleSheet } from 'react-native';

export const swipeListStyles = StyleSheet.create({
  hiddenContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },

  editButton: {
    backgroundColor: '#3B82F6', // Синий
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
    marginRight: 4,
  },

  deleteButton: {
    backgroundColor: '#EF4444', // Красный
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});