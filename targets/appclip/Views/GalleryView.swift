import SwiftUI

struct GalleryView: View {
    let event: Event
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack {
                    Text("Photo Gallery")
                        .font(.largeTitle).bold()
                        .foregroundColor(.white)
                    
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            // Masonry grid items will go here
                            ForEach(0..<6) { i in
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .aspectRatio(3/4, contentMode: .fit)
                                    .cornerRadius(12)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
