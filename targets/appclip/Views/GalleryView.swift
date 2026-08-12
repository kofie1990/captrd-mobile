import SwiftUI

struct GalleryView: View {
    let event: Event
    
    @State private var photos: [Photo] = []
    @State private var isLoading = true
    @State private var selectedPhotoIndex: Int? = nil
    
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack {
                Text("Photo Gallery")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.top, 20)
                
                if isLoading {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    Spacer()
                } else if photos.isEmpty {
                    Spacer()
                    Text("No photos yet.")
                        .foregroundColor(.gray)
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 2) {
                            ForEach(Array(photos.enumerated()), id: \.element.id) { index, photo in
                                AsyncImage(url: URL(string: photo.storage_path)) { phase in
                                    if let image = phase.image {
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fill)
                                    } else {
                                        Color.gray.opacity(0.3)
                                    }
                                }
                                .frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                                .aspectRatio(1, contentMode: .fill)
                                .clipped()
                                .onTapGesture {
                                    selectedPhotoIndex = index
                                }
                            }
                        }
                        .padding(.horizontal, 2)
                    }
                }
            }
            
            // Lightbox Overlay
            if let selectedIndex = selectedPhotoIndex {
                LightboxView(
                    photos: photos,
                    initialIndex: selectedIndex,
                    onClose: { selectedPhotoIndex = nil }
                )
                .transition(.opacity)
                .zIndex(100)
            }
        }
        .onAppear {
            loadPhotos()
        }
    }
    
    private func loadPhotos() {
        isLoading = true
        SupabaseClient.shared.fetchPhotos(for: event.id) { result in
            DispatchQueue.main.async {
                isLoading = false
                switch result {
                case .success(let fetchedPhotos):
                    self.photos = fetchedPhotos
                case .failure(let error):
                    print("Error fetching photos: \(error)")
                }
            }
        }
    }
}

// MARK: - Lightbox

struct LightboxView: View {
    let photos: [Photo]
    @State var currentIndex: Int
    let onClose: () -> Void
    
    init(photos: [Photo], initialIndex: Int, onClose: @escaping () -> Void) {
        self.photos = photos
        self._currentIndex = State(initialValue: initialIndex)
        self.onClose = onClose
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            TabView(selection: $currentIndex) {
                ForEach(Array(photos.enumerated()), id: \.element.id) { index, photo in
                    ZoomableImage(url: URL(string: photo.storage_path))
                        .tag(index)
                }
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .ignoresSafeArea()
            
            // Close Button
            VStack {
                HStack {
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                    .padding(.top, 40)
                    .padding(.leading, 20)
                    Spacer()
                }
                Spacer()
                
                // Info Overlay
                if photos.indices.contains(currentIndex) {
                    let photo = photos[currentIndex]
                    VStack(alignment: .leading, spacing: 4) {
                        Text(photo.guest_name)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                        
                        // Parse date
                        if let date = ISO8601DateFormatter().date(from: photo.created_at) {
                            Text(date.formatted(date: .abbreviated, time: .shortened))
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.7))
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                    .background(
                        LinearGradient(
                            colors: [.black.opacity(0.8), .clear],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                }
            }
        }
    }
}

// MARK: - Zoomable Image

struct ZoomableImage: View {
    let url: URL?
    
    @State private var scale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    
    var body: some View {
        AsyncImage(url: url) { phase in
            if let image = phase.image {
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .scaleEffect(scale)
                    .offset(offset)
                    .gesture(
                        MagnificationGesture()
                            .onChanged { value in
                                scale = max(1.0, value)
                            }
                            .onEnded { _ in
                                if scale < 1.0 {
                                    withAnimation(.spring()) {
                                        scale = 1.0
                                        offset = .zero
                                    }
                                }
                            }
                    )
                    .simultaneousGesture(
                        DragGesture()
                            .onChanged { value in
                                if scale > 1.0 {
                                    offset = value.translation
                                }
                            }
                            .onEnded { _ in
                                if scale <= 1.0 {
                                    withAnimation(.spring()) {
                                        offset = .zero
                                    }
                                }
                            }
                    )
            } else {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
            }
        }
    }
}
