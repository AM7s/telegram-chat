import { useState, useRef, useEffect } from "react";
import { useGreenApi } from '../hooks/useGreenApi';
import { MessageBubble } from './MessageBubble';

export function ChatWindow({ credentials, onLogout }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [currentChatId, setCurrentChatId] = useState(null);
    const [inputText, setInputText] = useState('');
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    
    const { messages, sendMessage, checkAccount, startPolling, stopPolling, isPolling } = useGreenApi(credentials);
    const messagesEndRef = useRef(null);

    const handleCreateChat = async () => {
        if (!phoneNumber.trim()) return;
        
        setIsLoadingChat(true);
        try {
            // Получаем настоящий chatId через CheckAccount
            const realChatId = await checkAccount(phoneNumber);
            setCurrentChatId(realChatId);
            setPhoneNumber(''); // Очищаем поле после успеха
        } catch (err) {
            alert(err.message || 'Не удалось найти пользователя');
        } finally {
            setIsLoadingChat(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !currentChatId) return;
        const text = inputText.trim();
        setInputText('');
        try {
            await sendMessage(currentChatId, text);
        } catch (err) {
            alert('Ошибка при отправке сообщения');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Запуск опроса
    useEffect(() => {
        startPolling();
        return () => stopPolling();
    }, [startPolling, stopPolling]);

    // Автопрокрутка вниз
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Фильтруем сообщения для текущего чата
    const currentMessages = messages.filter(msg => msg.chatId === currentChatId);

    return (
        <div className="chat-app">
            <header className="chat-header">
                <span>Telegram Chat</span>
                <span className={`status ${isPolling ? 'active' : ''}`}>
                    {isPolling ? 'Прием': 'Остановлено'}
                </span>
                <button onClick={onLogout}>Выйти</button>
            </header>

            <div className="chat-body">
                {!currentChatId ? (
                    <div className="new-chat">
                        <p>Введите номер получателя для создания чата</p>
                        <input 
                            type="tel" 
                            placeholder="79999999999" 
                            value={phoneNumber} 
                            onChange={e => setPhoneNumber(e.target.value)} 
                            disabled={isLoadingChat}
                        />
                        <button onClick={handleCreateChat} disabled={isLoadingChat || !phoneNumber.trim()}>
                            {isLoadingChat ? 'Поиск...' : 'Создать чат'}
                        </button>
                    </div>
                ):(
                    <>
                    <div className="chat-info">
                        Текущий чат ID: {currentChatId}
                        <button onClick={() => setCurrentChatId(null)}>Сменить</button>
                    </div>

                    <div className="messages">
                        {currentMessages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="input-bar">
                        <textarea 
                            value={inputText} 
                            onChange={e => setInputText(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            placeholder="Введите сообщение..." 
                            rows={1} 
                        />
                        <button onClick={handleSend} disabled={!inputText.trim()}>Отправить</button>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}