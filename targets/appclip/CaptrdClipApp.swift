import SwiftUI

@main
struct CaptrdClipApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb, perform: handleUserActivity)
        }
    }
    
    func handleUserActivity(_ userActivity: NSUserActivity) {
        guard let incomingURL = userActivity.webpageURL,
              let components = URLComponents(url: incomingURL, resolvingAgainstBaseURL: true) else {
            return
        }
        
        // Expected URL: https://captrd.live/e/{short_code}
        let pathComponents = incomingURL.pathComponents
        
        // Find the "e" component and get the next one
        if let eIndex = pathComponents.firstIndex(of: "e"),
           eIndex + 1 < pathComponents.count {
            let code = pathComponents[eIndex + 1]
            appState.eventCode = code
            appState.fetchEventDetails()
        }
    }
}

class AppState: ObservableObject {
    @Published var eventCode: String?
    @Published var event: Event?
    @Published var isFetching = false
    @Published var error: String?
    
    func fetchEventDetails() {
        guard let code = eventCode else { return }
        isFetching = true
        error = nil
        
        SupabaseClient.shared.fetchEvent(by: code) { [weak self] result in
            DispatchQueue.main.async {
                self?.isFetching = false
                switch result {
                case .success(let event):
                    self?.event = event
                case .failure(let error):
                    self?.error = error.localizedDescription
                }
            }
        }
    }
}
