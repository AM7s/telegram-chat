export function MessageBubble({ message }) {
    const time = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`message ${message.isOutgoing ? 'outgoing' : 'incoming'}`}>
            <div className="bubble">
                <p>{message.text}</p>
                <span className="time">{time}</span>
            </div>
        </div>
    );
}