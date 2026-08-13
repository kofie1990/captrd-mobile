import SwiftUI

struct NameEntryView: View {
    let event: Event
    @EnvironmentObject var appState: AppState
    @State private var name: String = ""
    @State private var isSubmitting = false
    @State private var hasJoined = false
    
    var body: some View {
        if hasJoined {
            EventContainerView(event: event)
        } else {
            ZStack {
                Color.black.ignoresSafeArea()
                
                // Background Cover Photo
                if let coverUrl = event.cover_photo_url, !coverUrl.isEmpty, let url = URL(string: coverUrl) {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable().aspectRatio(contentMode: .fill)
                        } else {
                            Color.black
                        }
                    }
                    .ignoresSafeArea()
                    .opacity(0.8)
                } else {
                    AsyncImage(url: URL(string: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop")) { phase in
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
                    colors: [Color.black.opacity(0.4), Color.clear, Color.black.opacity(0.95)],
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
                
                VStack {
                    Spacer()
                    
                    VStack(spacing: 24) {
                        Text(event.title)
                            .font(.custom("Playfair Display", size: 48))
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .minimumScaleFactor(0.5)
                            .shadow(color: .black.opacity(0.5), radius: 10, x: 0, y: 0)
                        
                        if let revealDate = event.reveal_at {
                            Text(revealDate.formatted(date: .numeric, time: .omitted).uppercased())
                                .font(.system(size: 12, weight: .bold, design: .monospaced))
                                .tracking(3)
                                .foregroundColor(Color.white.opacity(0.8))
                                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 0)
                        }
                        
                        if let details = event.invite_details, !details.isEmpty {
                            Text("\"\(details)\"")
                                .font(.custom("Playfair Display", size: 20))
                                .italic()
                                .foregroundColor(.white.opacity(0.9))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)
                                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 0)
                        }
                        
                        VStack(spacing: 16) {
                            TextField("Enter your name to join", text: $name)
                                .font(.custom("Playfair Display", size: 18))
                                .multilineTextAlignment(.center)
                                .foregroundColor(.white)
                                .padding(.vertical, 20)
                                .padding(.horizontal, 24)
                                .background(Color.black.opacity(0.4))
                                .cornerRadius(32)
                                .overlay(RoundedRectangle(cornerRadius: 32).stroke(Color.white.opacity(0.2), lineWidth: 1))
                                .accentColor(.white)
                                .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 0)
                                .frame(maxWidth: 320)
                            
                            Button(action: joinEvent) {
                                if isSubmitting {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                } else {
                                    Text("JOIN FILM ROLL")
                                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                                        .tracking(2)
                                }
                            }
                            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                            .frame(maxWidth: 320)
                            .padding(.vertical, 20)
                            .background(name.trimmingCharacters(in: .whitespaces).isEmpty ? Color.white.opacity(0.3) : Color.white)
                            .foregroundColor(name.trimmingCharacters(in: .whitespaces).isEmpty ? Color.black.opacity(0.5) : .black)
                            .cornerRadius(32)
                            .shadow(color: .white.opacity(0.3), radius: 10, x: 0, y: 0)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 48)
                }
            }
            .onTapGesture {
                UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
            }
        }
    }
    
    private let profanityList = [
        "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "whore",
        "slut", "faggot", "nigger", "nigga", "retard", "crap", "bastard"
    ]
    
    func joinEvent() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return }
        
        let lowerName = trimmedName.lowercased()
        if profanityList.contains(where: { lowerName.contains($0) }) {
            // Optional: You could show a SwiftUI alert here. For now, just return.
            // In a full implementation we'd add an @State var showErrorAlert = true
            return
        }
        
        isSubmitting = true
        // For now, simply save to local storage and proceed.
        // In a full implementation, you'd insert the participant record into Supabase here.
        LocalStorage.shared.saveGuestName(trimmedName, for: event.id)
        
        // Start Live Activity
        let maxPhotos = event.max_photos_per_user ?? 15
        LiveActivityManager.shared.startActivity(eventName: event.title, picturesLeft: maxPhotos)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isSubmitting = false
            hasJoined = true
        }
    }
}
