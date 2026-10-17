import { useState, useCallback, useRef, useEffect } from 'react';

const API_URL = 'https://api.green-api.com';

export function useGreenApi(credentials) {
  const [messages, setMessages] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);

  // Проверка аккаунта и получение реального chatId
  const checkAccount = useCallback(async (phoneNumber) => {
    // Очищаем номер от нецифровых символов (на случай, если пользователь ввел + или пробелы)
    const cleanPhone = Number(phoneNumber.replace(/\D/g, ''));
    const url = `${API_URL}/waInstance${credentials.idInstance}/checkAccount/${credentials.apiTokenInstance}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: cleanPhone }),
    });

    if (!response.ok) {
      throw new Error('Ошибка проверки аккаунта');
    }

    const data = await response.json();
    
    // GREEN-API может вернуть ошибку в теле ответа даже при статусе 200
    if (data.existsWhatsapp === false || !data.chatId) {
      throw new Error('Пользователь с таким номером не найден в Telegram');
    }

    return data.chatId;
  }, [credentials]);

  // Отправка текстового сообщения
  const sendMessage = useCallback(async (chatId, text) => {
    const url = `${API_URL}/waInstance${credentials.idInstance}/sendMessage/${credentials.apiTokenInstance}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: text }),
    });
    
    if (!response.ok) throw new Error('Ошибка отправки');
    const data = await response.json();
    
    // Оптимистичное локальное обновление
    setMessages(prev => [...prev, {
      id: data.idMessage,
      chatId: chatId, // Обязательно сохраняем chatId, чтобы фильтр работал
      text,
      isOutgoing: true,
      timestamp: Date.now(),
    }]);
    return data;
  }, [credentials]);

  // Опрос уведомлений
  const startPolling = useCallback(async () => {
    pollingRef.current = true;
    setIsPolling(true);

    while (pollingRef.current) {
      try {
        const recvUrl = `${API_URL}/waInstance${credentials.idInstance}/receiveNotification/${credentials.apiTokenInstance}`;
        const res = await fetch(recvUrl);
        
        if (!res.ok) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const notification = await res.json();
        if (!notification || !notification.receiptId) {
          // Очередь пуста — короткая пауза
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        const { receiptId, body } = notification;

        // Обрабатываем только входящие текстовые сообщения
        if (body?.typeWebhook === 'incomingMessageReceived' &&
            body?.messageData?.typeMessage === 'textMessage') {
          const senderId = body.senderData?.chatId || '';
          const text = body.messageData.textMessageData?.textMessage || '';
          
          setMessages(prev => [...prev, {
            id: body.idMessage,
            chatId: senderId,
            text,
            isOutgoing: false,
            timestamp: body.timestamp * 1000,
          }]);
        }

        // Подтверждаем удаление — продвигаем очередь
        const delUrl = `${API_URL}/waInstance${credentials.idInstance}/deleteNotification/${credentials.apiTokenInstance}/${receiptId}`;
        await fetch(delUrl, { method: 'DELETE' });

      } catch (err) {
        console.error('Ошибка опроса:', err);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setIsPolling(false);
  }, [credentials]);

  const stopPolling = useCallback(() => {
    pollingRef.current = false;
  }, []);

  // Останавливаем опрос при размонтировании
  useEffect(() => {
    return () => { pollingRef.current = false; };
  }, []);

  return { messages, sendMessage, checkAccount, startPolling, stopPolling, isPolling };
}