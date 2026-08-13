import SwiftUI

struct EventEndedView: View {
    let event: Event
    @EnvironmentObject var appState: AppState
    @State private var showGallery = false
    
    var body: some View {
        if showGallery {
            EventContainerView(event: event)
        } else {
            ZStack {
                Color.black.ignoresSafeArea()
                
                // Background Cover Photo
                if let coverUrl = event.cover_photo_url, let url = URL(string: coverUrl) {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable().aspectRatio(contentMode: .fill)
                        } else {
                            Color.black
                        }
                    }
                    .ignoresSafeArea()
                    .opacity(0.8)
                }
                
                LinearGradient(
                    colors: [Color.black.opacity(0.4), Color.black.opacity(0.8), Color.black],
                    startPoint: .top,
                    endPoint: .bottom
                ).ignoresSafeArea()
                
                // Back Button
                VStack {
                    HStack {
                        Button(action: {
                            appState.event = nil
                            appState.eventCode = nil
                        }) {
                            Image(systemName: "arrow.left")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 40, height: 40)
                                .background(Circle().fill(Color.white.opacity(0.1)).overlay(Circle().stroke(Color.white.opacity(0.2), lineWidth: 1)))
                        }
                        .padding(.leading, 24)
                        .padding(.top, 16)
                        Spacer()
                    }
                    Spacer()
                }
                .zIndex(10)
                
                VStack(spacing: 24) {
                    Spacer()
                    
                    Text(event.title)
                        .font(.system(size: 40, weight: .bold, design: .serif))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    Text("Event has ended. Thank you for contributing to the experience.")
                        .font(.system(size: 20, design: .serif))
                        .italic()
                        .foregroundColor(Color.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 16)
                    
                    if LocalStorage.shared.getGuestName(for: event.id) != nil {
                        Button(action: {
                            showGallery = true
                        }) {
                            Text("CLICK HERE TO SEE THE EVENT PHOTOS")
                                .font(.system(size: 12, weight: .bold, design: .monospaced))
                                .foregroundColor(.black)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.white)
                                .cornerRadius(100)
                        }
                        .padding(.horizontal, 32)
                        .padding(.top, 16)
                        .padding(.bottom, 48)
                    } else {
                        Spacer().frame(height: 48)
                    }
                }
            }
        }
    }
}
