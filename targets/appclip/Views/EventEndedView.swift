import SwiftUI

struct EventEndedView: View {
    let event: Event
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "clock.badge.xmark")
                .font(.system(size: 64))
                .foregroundColor(.white)
            
            Text("Event Ended")
                .font(.largeTitle).bold()
                .foregroundColor(.white)
            
            Text("The photo roll for \(event.title) has been closed by the host.")
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            // If they had already joined, we could show a button to view the gallery
            if LocalStorage.shared.getGuestName(for: event.id) != nil {
                NavigationLink(destination: MainTabView(event: event)) {
                    Text("View Gallery")
                        .font(.headline)
                        .foregroundColor(.black)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.white)
                        .cornerRadius(12)
                        .padding(.horizontal, 32)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.ignoresSafeArea())
    }
}
