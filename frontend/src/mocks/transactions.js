// Mock-сервис для имитации работы с API

let mockTransactions = [
  {
    id: '1',
    text: 'Купил кофе',
    amount: 350,
    category: 'Кафе',
    date: '2026-10-08',
    time: '09:15',
  },
  {
    id: '2',
    text: 'Продукты в Пятёрочке',
    amount: 1250,
    category: 'Продукты',
    date: '2026-10-07',
    time: '18:30',
  },
  {
    id: '3',
    text: 'Такси до дома',
    amount: 450,
    category: 'Транспорт',
    date: '2026-10-07',
    time: '22:10',
  },
];

let nextId = 4;

export const getTransactions = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockTransactions]);
    }, 300);
  });
};

export const createTransaction = (text) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const amountMatch = text.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 0;
      
      const newTransaction = {
        id: String(nextId++),
        text: text,
        amount: amount,
        category: 'Другое',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
      };
      
      mockTransactions.unshift(newTransaction);
      resolve(newTransaction);
    }, 500);
  });
};

export const updateTransaction = (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockTransactions.findIndex((t) => t.id === id);
      
      if (index === -1) {
        reject(new Error('Транзакция не найдена'));
        return;
      }
      
      mockTransactions[index] = {
        ...mockTransactions[index],
        ...data,
      };
      
      resolve(mockTransactions[index]);
    }, 300);
  });
};