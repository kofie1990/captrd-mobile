import SwiftUI

struct NameEntryView: View {
    let event: Event
    @EnvironmentObject var appState: AppState
    @State private var name: String = ""
    @State private var isSubmitting = false
    @State private var hasJoined = false
    
    var body: some View {
        if hasJoined {
            MainTabView(event: event)
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
                    .opacity(0.4)
                }
                
                LinearGradient(
                    colors: [Color.black.opacity(0.1), Color.black.opacity(0.8), Color.black],
                    startPoint: .top,
                    endPoint: .bottom
                ).ignoresSafeArea()
                
                VStack(spacing: 24) {
                    Spacer()
                    
                    Text("Join")
                        .font(.subheadline)
                        .textCase(.uppercase)
                        .foregroundColor(.gray)
                    
                    Text(event.title)
                        .font(.system(size: 40, weight: .bold, design: .serif))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    if let details = event.invite_details, !details.isEmpty {
                        Text(details)
                            .font(.system(size: 16, design: .serif))
                            .italic()
                            .foregroundColor(.white.opacity(0.8))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    
                    VStack(spacing: 12) {
                        TextField("Enter your name", text: $name)
                            .padding()
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                            .accentColor(.white)
                            .font(.headline)
                            .multilineTextAlignment(.center)
                        
                        Button(action: joinEvent) {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .black))
                            } else {
                                Text("Join Film Roll")
                                    .font(.headline).bold()
                            }
                        }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(name.trimmingCharacters(in: .whitespaces).isEmpty ? Color.white.opacity(0.3) : Color.white)
                        .foregroundColor(.black)
                        .cornerRadius(100)
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 48)
                }
            }
        }
    }
    
    func joinEvent() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return }
        
        isSubmitting = true
        // For now, simply save to local storage and proceed.
        // In a full implementation, you'd insert the participant record into Supabase here.
        LocalStorage.shared.saveGuestName(trimmedName, for: event.id)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isSubmitting = false
            hasJoined = true
        }
    }
}
