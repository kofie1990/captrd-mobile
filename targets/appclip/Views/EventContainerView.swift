import SwiftUI

struct EventContainerView: View {
    let event: Event
    
    enum ActiveScreen {
        case camera
        case gallery
    }
    
    @State private var activeScreen: ActiveScreen = .camera
    
    var body: some View {
        ZStack {
            if activeScreen == .camera {
                CameraView(
                    event: event,
                    onViewGallery: {
                        withAnimation {
                            activeScreen = .gallery
                        }
                    }
                )
                .transition(.opacity)
            } else {
                GalleryView(
                    event: event,
                    onViewCamera: {
                        withAnimation {
                            activeScreen = .camera
                        }
                    }
                )
                .transition(.opacity)
            }
        }
    }
}
