import SwiftUI
import AVKit

struct GalleryView: View {
    let event: Event
    
    @State private var photos: [Photo] = []
    @State private var isLoading = true
    @State private var selectedPhotoIndex: Int? = nil
    
    // For Masonry layout
    private var leftColumnPhotos: [(Int, Photo)] {
        photos.enumerated().filter { $0.offset % 2 == 0 }.map { ($0.offset, $0.element) }
    }
    private var rightColumnPhotos: [(Int, Photo)] {
        photos.enumerated().filter { $0.offset % 2 != 0 }.map { ($0.offset, $0.element) }
    }
    
    var body: some View {
        ZStack {
            Color(red: 9/255, green: 9/255, blue: 11/255).ignoresSafeArea()
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Hero Section
                    ZStack(alignment: .bottom) {
                        if let coverUrl = event.cover_photo_url, let url = URL(string: coverUrl) {
                            AsyncImage(url: url) { phase in
                                if let image = phase.image {
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } else {
                                    Color(red: 17/255, green: 17/255, blue: 17/255)
                                }
                            }
                            .frame(height: 350)
                            .clipped()
                        } else {
                            Color(red: 17/255, green: 17/255, blue: 17/255)
                                .frame(height: 350)
                        }
                        
                        LinearGradient(
                            colors: [.clear, Color(red: 9/255, green: 9/255, blue: 11/255, opacity: 0.6), Color(red: 9/255, green: 9/255, blue: 11/255)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 200)
                        
                        // Back Button placeholder (if needed, but MainTabView handles tabs)
                        // If they wanted a back button, we can add it here.
                        /*
                        HStack {
                            Button(action: {}) {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.left")
                                        .font(.system(size: 16))
                                    Text("CAMERA")
                                        .font(.system(size: 11, weight: .bold))
                                        .tracking(2)
                                }
                                .foregroundColor(.white)
                                .opacity(0.6)
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 250)
                        */
                    }
                    .frame(height: 350)
                    
                    // Title Section
                    VStack(alignment: .leading, spacing: 4) {
                        Text(event.title)
                            .font(.system(size: 48, weight: .regular, design: .serif))
                            .foregroundColor(Color(red: 252/255, green: 252/255, blue: 252/255))
                            .tracking(-1)
                        
                        Text("THE FILM ROLL IS DEVELOPED")
                            .font(.system(size: 10, weight: .regular))
                            .foregroundColor(Color.white.opacity(0.8))
                            .tracking(3)
                            .padding(.bottom, 24)
                        
                        HStack(alignment: .center) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(photos.count)")
                                    .font(.system(size: 32, weight: .regular, design: .serif))
                                    .foregroundColor(.white)
                                Text("TOTAL PICTURES")
                                    .font(.system(size: 9, weight: .regular))
                                    .foregroundColor(Color.white.opacity(0.5))
                                    .tracking(2)
                            }
                            
                            Rectangle()
                                .fill(Color.white.opacity(0.2))
                                .frame(width: 1, height: 32)
                                .padding(.horizontal, 24)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                let uniqueGuests = Set(photos.map { $0.guest_name }).count
                                Text("\(uniqueGuests)")
                                    .font(.system(size: 32, weight: .regular, design: .serif))
                                    .foregroundColor(.white)
                                Text("PEOPLE JOINED")
                                    .font(.system(size: 9, weight: .regular))
                                    .foregroundColor(Color.white.opacity(0.5))
                                    .tracking(2)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                    .background(Color(red: 9/255, green: 9/255, blue: 11/255))
                    .offset(y: -80)
                    .overlay(
                        Rectangle().frame(height: 1).foregroundColor(Color.white.opacity(0.1)),
                        alignment: .bottom
                    )
                    
                    // Grid Section
                    if isLoading {
                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .padding(.top, 40)
                    } else if photos.isEmpty {
                        VStack(spacing: 8) {
                            Text("The roll is empty.")
                                .font(.system(size: 24, weight: .regular, design: .serif))
                                .italic()
                                .foregroundColor(Color.white.opacity(0.5))
                            Text("NO MEDIA WAS CAPTRD AT THIS EVENT.")
                                .font(.system(size: 10, weight: .regular))
                                .foregroundColor(Color.white.opacity(0.3))
                                .tracking(2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 80)
                        .background(
                            RoundedRectangle(cornerRadius: 48)
                                .stroke(Color.white.opacity(0.2), style: StrokeStyle(lineWidth: 1, dash: [5]))
                        )
                        .padding(.horizontal, 16)
                        .padding(.top, -30)
                    } else {
                        HStack(alignment: .top, spacing: 8) {
                            // Left Column
                            VStack(spacing: 8) {
                                ForEach(leftColumnPhotos, id: \.1.id) { item in
                                    MasonryItemView(photo: item.1, isLarge: true)
                                        .onTapGesture {
                                            withAnimation(.spring()) {
                                                selectedPhotoIndex = item.0
                                            }
                                        }
                                }
                            }
                            
                            // Right Column
                            VStack(spacing: 8) {
                                ForEach(rightColumnPhotos, id: \.1.id) { item in
                                    MasonryItemView(photo: item.1, isLarge: false)
                                        .onTapGesture {
                                            withAnimation(.spring()) {
                                                selectedPhotoIndex = item.0
                                            }
                                        }
                                }
                            }
                        }
                        .padding(.horizontal, 8)
                        .padding(.top, -40)
                        .padding(.bottom, 100)
                    }
                }
            }
            
            // Lightbox Overlay
            if let selectedIndex = selectedPhotoIndex {
                LightboxView(
                    photos: photos,
                    initialIndex: selectedIndex,
                    onClose: {
                        withAnimation(.spring()) {
                            selectedPhotoIndex = nil
                        }
                    }
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

// MARK: - Masonry Item
struct MasonryItemView: View {
    let photo: Photo
    let isLarge: Bool
    
    var body: some View {
        GeometryReader { geo in
            let itemWidth = geo.size.width
            let itemHeight = isLarge ? itemWidth * 1.5 : itemWidth * 1.1
            
            ZStack(alignment: .bottomLeading) {
                AsyncImage(url: URL(string: photo.storage_path)) { phase in
                    if let image = phase.image {
                        image.resizable().aspectRatio(contentMode: .fill)
                    } else {
                        Color(red: 17/255, green: 17/255, blue: 17/255)
                    }
                }
                .frame(width: itemWidth, height: itemHeight)
                .clipped()
                
                LinearGradient(
                    colors: [.clear, Color.black.opacity(0.5), Color.black.opacity(0.9)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: itemHeight / 2)
                
                Text(photo.guest_name)
                    .font(.system(size: 18, weight: .regular, design: .serif))
                    .italic()
                    .foregroundColor(.white)
                    .opacity(0.9)
                    .shadow(color: .black.opacity(0.5), radius: 4, x: 0, y: 2)
                    .padding(16)
                
                if photo.media_type == "video" {
                    VStack {
                        HStack {
                            Spacer()
                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(Color.white.opacity(0.8))
                                .shadow(radius: 4)
                                .padding(12)
                        }
                        Spacer()
                    }
                }
            }
            .frame(width: itemWidth, height: itemHeight)
            .background(Color(red: 17/255, green: 17/255, blue: 17/255))
            .clipped()
        }
        .aspectRatio(1 / (isLarge ? 1.5 : 1.1), contentMode: .fit)
    }
}

// MARK: - Lightbox

struct LightboxView: View {
    let photos: [Photo]
    @State var currentIndex: Int
    let onClose: () -> Void
    
    @State private var dragOffset: CGFloat = 0
    
    init(photos: [Photo], initialIndex: Int, onClose: @escaping () -> Void) {
        self.photos = photos
        self._currentIndex = State(initialValue: initialIndex)
        self.onClose = onClose
    }
    
    var body: some View {
        ZStack {
            // Dark Background that fades on drag
            Color.black
                .opacity(Double(1.0 - abs(dragOffset) / 200.0))
                .ignoresSafeArea()
            
            // Top Bar
            VStack {
                HStack {
                    Spacer()
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 48, height: 48)
                            .background(Circle().fill(Color.black.opacity(0.4)).overlay(Circle().stroke(Color.white.opacity(0.2), lineWidth: 1)))
                    }
                    .padding(.top, 56)
                    .padding(.trailing, 20)
                }
                Spacer()
            }
            .zIndex(30)
            
            // Carousel
            TabView(selection: $currentIndex) {
                ForEach(Array(photos.enumerated()), id: \.element.id) { index, photo in
                    if photo.media_type == "video", let videoUrl = URL(string: photo.storage_path) {
                        VideoPlayer(player: AVPlayer(url: videoUrl))
                            .tag(index)
                            .background(Color(red: 17/255, green: 17/255, blue: 17/255))
                            .cornerRadius(32, corners: [.bottomLeft, .bottomRight])
                            .clipped()
                            .padding(.bottom, 170)
                    } else {
                        ZoomableImage(url: URL(string: photo.storage_path))
                            .tag(index)
                            .background(Color(red: 17/255, green: 17/255, blue: 17/255))
                            .cornerRadius(32, corners: [.bottomLeft, .bottomRight])
                            .clipped()
                            .padding(.bottom, 170)
                    }
                }
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .ignoresSafeArea()
            .scaleEffect(1.0 - abs(dragOffset) / 800.0)
            .offset(y: dragOffset)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        dragOffset = value.translation.height
                    }
                    .onEnded { value in
                        if abs(value.translation.height) > 150 || abs(value.velocity.height) > 500 {
                            onClose()
                        } else {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                dragOffset = 0
                            }
                        }
                    }
            )
            
            // Bottom Info Bar
            VStack {
                Spacer()
                if photos.indices.contains(currentIndex) {
                    let photo = photos[currentIndex]
                    VStack(alignment: .center, spacing: 4) {
                        HStack(alignment: .center, spacing: 8) {
                            Text(photo.guest_name)
                                .font(.system(size: 28, weight: .regular, design: .serif))
                                .italic()
                                .foregroundColor(.white)
                            
                            Image(systemName: "ellipsis")
                                .foregroundColor(Color.white.opacity(0.5))
                                .font(.system(size: 20))
                        }
                        .padding(.bottom, 4)
                        
                        if let date = ISO8601DateFormatter().date(from: photo.created_at) {
                            Text(date.formatted(date: .omitted, time: .shortened).uppercased())
                                .font(.system(size: 10, weight: .regular))
                                .foregroundColor(Color.white.opacity(0.4))
                                .tracking(2)
                        }
                        
                        HStack(spacing: 12) {
                            Spacer()
                            
                            Button(action: {
                                guard let url = URL(string: photo.storage_path) else { return }
                                let activityVC = UIActivityViewController(activityItems: [url], applicationActivities: nil)
                                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                                   let window = windowScene.windows.first,
                                   let rootVC = window.rootViewController {
                                    rootVC.present(activityVC, animated: true, completion: nil)
                                }
                            }) {
                                Image(systemName: "square.and.arrow.up")
                                    .font(.system(size: 20))
                                    .frame(width: 44, height: 44)
                                    .background(Circle().fill(Color.white.opacity(0.1)))
                                    .foregroundColor(.white)
                            }
                        }
                        .padding(.top, 16)
                    }
                    .frame(height: 170)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 24)
                    .background(Color.black)
                }
            }
            .ignoresSafeArea(edges: .bottom)
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
                    .aspectRatio(contentMode: .fill)
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
