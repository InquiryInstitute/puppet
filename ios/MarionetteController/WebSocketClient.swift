import Foundation
import Combine

class WebSocketClient: ObservableObject {
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession?
    private var cancellables = Set<AnyCancellable>()
    
    var onConnect: (() -> Void)?
    var onDisconnect: (() -> Void)?
    var onError: ((Error) -> Void)?
    
    func connect(url: String) {
        guard let url = URL(string: url) else {
            print("Invalid WebSocket URL: \(url)")
            return
        }
        
        let session = URLSession(configuration: .default)
        let task = session.webSocketTask(with: url)
        
        self.urlSession = session
        self.webSocketTask = task
        
        task.resume()
        
        // Start listening for messages
        receiveMessage()
        
        // Notify connection
        onConnect?()
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        urlSession = nil
        onDisconnect?()
    }
    
    func send(data: [String: Any]) {
        guard let webSocketTask = webSocketTask else { return }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
            let message = URLSessionWebSocketTask.Message.string(String(data: jsonData, encoding: .utf8) ?? "")
            webSocketTask.send(message) { error in
                if let error = error {
                    print("WebSocket send error: \(error)")
                    self.onError?(error)
                }
            }
        } catch {
            print("JSON serialization error: \(error)")
            onError?(error)
        }
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    print("Received: \(text)")
                case .data(let data):
                    print("Received data: \(data)")
                @unknown default:
                    break
                }
                // Continue receiving
                self?.receiveMessage()
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self?.onError?(error)
            }
        }
    }
}
