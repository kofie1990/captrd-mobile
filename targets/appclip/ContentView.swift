import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if appState.isFetching {
                SkeletonLoadingView()
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

struct SkeletonLoadingView: View {
    @State private var opacity: Double = 0.5
    
    var body: some View {
        ZStack {
            Color(red: 9/255, green: 9/255, blue: 11/255).ignoresSafeArea()
            
            VStack(alignment: .leading, spacing: 0) {
                // Header Skeleton
                VStack(alignment: .leading, spacing: 12) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(red: 28/255, green: 28/255, blue: 30/255))
                        .frame(width: 150, height: 20)
                    
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color(red: 28/255, green: 28/255, blue: 30/255))
                        .frame(width: 250, height: 40)
                }
                .padding(.bottom, 32)
                .padding(.horizontal, 24)
                .padding(.top, 80)
                
                // Cards Skeleton
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        RoundedRectangle(cornerRadius: 24)
                            .fill(Color(red: 28/255, green: 28/255, blue: 30/255))
                            .frame(width: 280, height: 380)
                        
                        RoundedRectangle(cornerRadius: 24)
                            .fill(Color(red: 28/255, green: 28/255, blue: 30/255))
                            .frame(width: 280, height: 380)
                    }
                    .padding(.horizontal, 24)
                }
                
                Spacer()
            }
            .opacity(opacity)
            .onAppear {
                withAnimation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                    opacity = 1.0
                }
            }
        }
    }
}
