import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if appState.isFetching {
                SplashLoadingView()
            } else if let error = appState.error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundColor(.red)
                    Text("Error")
                        .font(.custom("Inter", size: 22).bold())
                        .foregroundColor(.white)
                    Text(error)
                        .foregroundColor(.gray)
                        .font(.custom("Inter", size: 16))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
            } else if let event = appState.event {
                // Determine if event ended
                if let endAt = event.end_at, endAt < Date() {
                    EventEndedView(event: event)
                } else if LocalStorage.shared.getGuestName(for: event.id) != nil {
                    // Already joined, go to gallery/camera logic
                    EventContainerView(event: event)
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

struct SplashLoadingView: View {
    @State private var rotation: Double = 0
    @State private var scale: CGFloat = 0.9
    @State private var textTracking: CGFloat = 2
    @State private var glowOpacity: Double = 0.3
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            // Pulsing ambient glow
            RadialGradient(
                gradient: Gradient(colors: [Color.white.opacity(0.15), .clear]),
                center: .center,
                startRadius: 50,
                endRadius: 300
            )
            .scaleEffect(scale)
            .opacity(glowOpacity)
            
            VStack(spacing: 48) {
                // Spinning Aperture Ring
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.05), lineWidth: 1)
                        .frame(width: 90, height: 90)
                    
                    Circle()
                        .trim(from: 0.1, to: 0.9)
                        .stroke(
                            AngularGradient(
                                gradient: Gradient(colors: [.white, Color.white.opacity(0.1)]),
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 2, lineCap: .round)
                        )
                        .frame(width: 90, height: 90)
                        .rotationEffect(.degrees(rotation))
                    
                    Circle()
                        .fill(Color.white)
                        .frame(width: 6, height: 6)
                        .offset(y: -45)
                        .rotationEffect(.degrees(rotation * 1.5)) // Spins faster
                }
                
                // Premium Text Reveal
                VStack(spacing: 8) {
                    Text("CAPTRD")
                        .font(.custom("Playfair Display", size: 28))
                        .foregroundColor(.white)
                        .tracking(textTracking)
                        .opacity(scale)
                    
                    Text("DEVELOPING FILM...")
                        .font(.custom("Inter", size: 9).bold())
                        .foregroundColor(Color.white.opacity(0.5))
                        .tracking(4)
                }
            }
        }
        .onAppear {
            withAnimation(Animation.linear(duration: 2).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                scale = 1.05
                glowOpacity = 0.6
                textTracking = 8
            }
        }
    }
}
