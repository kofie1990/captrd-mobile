import SwiftUI

struct CameraView: View {
    let event: Event
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack {
                Spacer()
                Text("Camera Viewfinder")
                    .font(.title)
                    .foregroundColor(.white)
                Text("AVFoundation logic will go here.")
                    .foregroundColor(.gray)
                Spacer()
                
                // Shutter Button Placeholder
                Circle()
                    .stroke(Color.white, lineWidth: 4)
                    .frame(width: 80, height: 80)
                    .padding(.bottom, 32)
            }
        }
    }
}
