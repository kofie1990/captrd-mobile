import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if appState.isFetching {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
            } else if let error = appState.error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundColor(.red)
                    Text("Error")
                        .font(.title2).bold()
                        .foregroundColor(.white)
                    Text(error)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
            } else if let event = appState.event {
                // Determine if event ended
                if let endAt = event.end_at, endAt < Date() {
                    EventEndedView(event: event)
                } else if LocalStorage.shared.getGuestName(for: event.id) != nil {
                    // Already joined, go to gallery/camera logic
                    MainTabView(event: event)
                } else {
                    NameEntryView(event: event)
                }
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.system(size: 64))
                        .foregroundColor(.gray)
                    Text("Scan a Captrd QR code to join an event.")
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
            }
        }
    }
}
