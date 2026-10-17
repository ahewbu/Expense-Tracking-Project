import { StyleSheet } from 'react-native';

export const confirmStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },

  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#57534E',
    marginBottom: 24,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    paddingVertical: 8,
  },

  valueDescription: {
    fontSize: 16,
    color: '#1C1917',
    paddingVertical: 8,
  },

  input: {
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1C1917',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },

  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },

  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },

  catBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },

  catText: {
    fontSize: 14,
    color: '#57534E',
  },

  catTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },

  buttonConfirm: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },

  buttonConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonEdit: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },

  buttonEditText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});