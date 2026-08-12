import SwiftUI
import AVFoundation

struct CameraView: View {
    let event: Event
    @Binding var selectedTab: Int
    
    @StateObject private var model = CameraViewModel()
    @State private var showGrid = false
    @State private var flashMode: AVCaptureDevice.FlashMode = .off
    @State private var showFlash = false
    @State private var isCapturing = false
    @State private var guestName: String = ""
    @State private var photosCount = 0
    @State private var isUploading = false
    @State private var latestPhotoUrl: String? = nil
    @State private var pendingUploads: [FailedUpload] = []
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Camera Area
                ZStack {
                    if let image = model.photo?.image {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .clipped()
                    } else {
                        CameraPreview(session: model.session)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .clipped()
                    }
                    
                    // Top Bar Gradient
                    VStack {
                        if isUploading {
                            Text("Upload in progress...")
                                .font(.system(size: 11, weight: .bold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.white.opacity(0.2))
                                .cornerRadius(12)
                                .foregroundColor(.white)
                                .padding(.top, 48)
                                .transition(.opacity)
                        } else if !pendingUploads.isEmpty {
                            Button(action: retryPendingUploads) {
                                HStack(spacing: 8) {
                                    Image(systemName: "arrow.clockwise.icloud.fill")
                                    Text("Retry \(pendingUploads.count) Failed")
                                        .font(.system(size: 11, weight: .bold))
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.red.opacity(0.8))
                                .cornerRadius(12)
                                .foregroundColor(.white)
                            }
                            .padding(.top, 48)
                            .transition(.opacity)
                        }
                        LinearGradient(
                            colors: [Color.black.opacity(0.6), .clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 120)
                        Spacer()
                    }
                    
                    // Top Bar Content
                    VStack {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(guestName)'s Roll".uppercased())
                                    .font(.system(size: 11, weight: .bold, design: .default))
                                    .foregroundColor(Color.white.opacity(0.7))
                                    .tracking(2)
                                
                                Text("\(photosCount) / \(event.max_photos_per_user ?? 10) EXPOSURES")
                                    .font(.system(size: 9, weight: .regular))
                                    .foregroundColor(Color.white.opacity(0.4))
                                    .tracking(2)
                            }
                            
                            Spacer()
                            
                            HStack(spacing: 8) {
                                if model.photo == nil {
                                    Button(action: {
                                        let generator = UIImpactFeedbackGenerator(style: .light)
                                        generator.impactOccurred()
                                        flashMode = flashMode == .off ? .on : .off
                                        model.setFlashMode(flashMode)
                                    }) {
                                        Image(systemName: flashMode == .on ? "bolt.fill" : "bolt.slash.fill")
                                            .foregroundColor(flashMode == .on ? .yellow : Color.white.opacity(0.7))
                                            .frame(width: 44, height: 44)
                                            .background(Circle().fill(Color.white.opacity(0.1)))
                                    }
                                    
                                    Button(action: {
                                        let generator = UISelectionFeedbackGenerator()
                                        generator.selectionChanged()
                                        withAnimation { showGrid.toggle() }
                                    }) {
                                        Image(systemName: "square.grid.3x3.fill")
                                            .foregroundColor(.white)
                                            .frame(width: 44, height: 44)
                                            .background(Circle().fill(showGrid ? Color.white.opacity(0.3) : Color.white.opacity(0.1)))
                                    }
                                }
                                
                                Button(action: {
                                    let generator = UIImpactFeedbackGenerator(style: .light)
                                    generator.impactOccurred()
                                    model.flipCamera()
                                }) {
                                    Image(systemName: "arrow.triangle.2.circlepath.camera.fill")
                                        .foregroundColor(.white)
                                        .frame(width: 44, height: 44)
                                        .background(Circle().fill(Color.white.opacity(0.1)))
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 60)
                        
                        Spacer()
                    }
                    
                    // Viewfinder Overlay
                    if model.photo == nil {
                        ViewfinderOverlay(showGrid: showGrid)
                        if showFlash {
                            Color.white
                                .ignoresSafeArea()
                                .opacity(0.8)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .cornerRadius(32, corners: [.bottomLeft, .bottomRight])
                .edgesIgnoringSafeArea(.top)
                
                // Bottom Bar
                HStack {
                    // Left: Gallery Thumbnail
                    Button(action: {
                        selectedTab = 1
                    }) {
                        if let thumb = latestPhotoUrl {
                            AsyncImage(url: URL(string: thumb)) { phase in
                                if let image = phase.image {
                                    image.resizable().aspectRatio(contentMode: .fill)
                                } else {
                                    Color.white.opacity(0.1)
                                }
                            }
                            .frame(width: 56, height: 56)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white, lineWidth: 2))
                        } else {
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color.white.opacity(0.1))
                                .frame(width: 56, height: 56)
                                .overlay(Image(systemName: "photo").foregroundColor(Color.white.opacity(0.4)))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.2), lineWidth: 1))
                        }
                    }
                    
                    Spacer()
                    
                    // Center: Shutter or Review
                    if let image = model.photo?.image {
                        HStack(spacing: 32) {
                            Button(action: {
                                let generator = UIImpactFeedbackGenerator(style: .light)
                                generator.impactOccurred()
                                model.retakePhoto()
                            }) {
                                Image(systemName: "xmark")
                                    .font(.system(size: 24, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(width: 64, height: 64)
                                    .background(Circle().fill(Color.white.opacity(0.15)))
                                    .overlay(Circle().stroke(Color.white.opacity(0.2), lineWidth: 1))
                                    .shadow(radius: 4)
                            }
                            
                            Button(action: {
                                uploadPhoto(image: image)
                            }) {
                                ZStack {
                                    Circle().fill(Color.white).frame(width: 64, height: 64)
                                        .shadow(radius: 4)
                                    if isUploading {
                                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .black))
                                    } else {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 24, weight: .bold))
                                            .foregroundColor(.black)
                                    }
                                }
                            }
                            .disabled(isUploading)
                        }
                    } else {
                        if photosCount >= (event.max_photos_per_user ?? 15) {
                            Text("ROLL COMPLETE")
                                .font(.system(size: 14, weight: .bold, design: .monospaced))
                                .foregroundColor(.black)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(Color.white)
                                .cornerRadius(100)
                        } else {
                            Button(action: {
                                isCapturing = true
                                showFlash = true
                                let generator = UIImpactFeedbackGenerator(style: .heavy)
                                generator.impactOccurred()
                                model.capturePhoto()
                                withAnimation(.easeOut(duration: 0.2)) {
                                    showFlash = false
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                    isCapturing = false
                                }
                            }) {
                                ZStack {
                                    Circle()
                                        .stroke(Color.white.opacity(0.3), lineWidth: 4)
                                        .frame(width: 76, height: 76)
                                        .shadow(color: Color.white.opacity(0.2), radius: 8)
                                    Circle()
                                        .fill(Color.white)
                                        .frame(width: 64, height: 64)
                                        .scaleEffect(isCapturing ? 0.95 : 1.0)
                                        .opacity(isCapturing ? 0.8 : 1.0)
                                        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCapturing)
                                }
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Right: Photos Left
                    if model.photo == nil {
                        Text("\(photosCount)/\(event.max_photos_per_user ?? 15)")
                            .font(.system(size: 14, weight: .bold, design: .serif))
                            .foregroundColor(.black)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.white)
                            .cornerRadius(12)
                    } else {
                        Spacer().frame(width: 48)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.vertical, 32)
                .background(Color.black)
            }
        }
        .onAppear {
            guestName = LocalStorage.shared.getGuestName(for: event.id) ?? "Guest"
            pendingUploads = FailedUploadManager.shared.getFailedUploads(for: event.id)
            model.startSession()
            fetchPhotosCount()
        }
        .onDisappear {
            model.stopSession()
        }
    }
    
    private func fetchPhotosCount() {
        SupabaseClient.shared.fetchPhotos(for: event.id) { result in
            if case .success(let photos) = result {
                DispatchQueue.main.async {
                    let userPhotos = photos.filter { $0.guest_name == self.guestName }
                    self.photosCount = userPhotos.count
                    self.latestPhotoUrl = userPhotos.first?.storage_path
                }
            }
        }
    }
    
    private func uploadPhoto(image: UIImage) {
        guard let data = image.jpegData(compressionQuality: 0.8) else { return }
        
        isUploading = true
        SupabaseClient.shared.uploadPhoto(data: data, eventId: event.id, guestName: guestName) { result in
            DispatchQueue.main.async {
                isUploading = false
                switch result {
                case .success(let url):
                    photosCount += 1
                    latestPhotoUrl = url
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                    model.retakePhoto() // Reset to camera view
                case .failure(let error):
                    print("Upload failed: \(error)")
                    FailedUploadManager.shared.saveFailedUpload(image: data, eventId: event.id, guestName: guestName)
                    pendingUploads = FailedUploadManager.shared.getFailedUploads(for: event.id)
                    model.retakePhoto()
                }
            }
        }
    }
    
    private func retryPendingUploads() {
        guard !pendingUploads.isEmpty else { return }
        
        let currentPending = pendingUploads
        pendingUploads = [] // Optimistically clear
        
        var failedAgain: [FailedUpload] = []
        let group = DispatchGroup()
        
        isUploading = true
        
        for item in currentPending {
            group.enter()
            
            guard let data = FileManager.default.contents(atPath: item.uri) else {
                failedAgain.append(item)
                group.leave()
                continue
            }
            
            SupabaseClient.shared.uploadPhoto(data: data, eventId: item.eventId, guestName: item.guestName) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let url):
                        FailedUploadManager.shared.deleteFailedUpload(id: item.id)
                        photosCount += 1
                        latestPhotoUrl = url
                    case .failure(_):
                        failedAgain.append(item)
                    }
                    group.leave()
                }
            }
        }
        
        group.notify(queue: .main) {
            isUploading = false
            if !failedAgain.isEmpty {
                pendingUploads = failedAgain
            } else {
                pendingUploads = FailedUploadManager.shared.getFailedUploads(for: event.id)
            }
        }
    }
}

// MARK: - Viewfinder Overlay

struct ViewfinderOverlay: View {
    var showGrid: Bool
    
    var body: some View {
        ZStack {
            if showGrid {
                GeometryReader { geo in
                    Path { path in
                        let w = geo.size.width
                        let h = geo.size.height
                        path.move(to: CGPoint(x: w/3, y: 0))
                        path.addLine(to: CGPoint(x: w/3, y: h))
                        path.move(to: CGPoint(x: w*2/3, y: 0))
                        path.addLine(to: CGPoint(x: w*2/3, y: h))
                        path.move(to: CGPoint(x: 0, y: h/3))
                        path.addLine(to: CGPoint(x: w, y: h/3))
                        path.move(to: CGPoint(x: 0, y: h*2/3))
                        path.addLine(to: CGPoint(x: w, y: h*2/3))
                    }
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                }
            }
            
            // Frame with precise corners
            RoundedRectangle(cornerRadius: 32)
                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                .padding(16)
                .padding(.vertical, 16)
            
            // Corner Accents
            GeometryReader { geo in
                let p: CGFloat = 16
                let vP: CGFloat = 32
                let cSize: CGFloat = 28
                
                Path { path in
                    // Top Left
                    path.move(to: CGPoint(x: p, y: vP + cSize))
                    path.addLine(to: CGPoint(x: p, y: vP + 8))
                    path.addQuadCurve(to: CGPoint(x: p + 8, y: vP), control: CGPoint(x: p, y: vP))
                    path.addLine(to: CGPoint(x: p + cSize, y: vP))
                    
                    // Top Right
                    path.move(to: CGPoint(x: geo.size.width - p - cSize, y: vP))
                    path.addLine(to: CGPoint(x: geo.size.width - p - 8, y: vP))
                    path.addQuadCurve(to: CGPoint(x: geo.size.width - p, y: vP + 8), control: CGPoint(x: geo.size.width - p, y: vP))
                    path.addLine(to: CGPoint(x: geo.size.width - p, y: vP + cSize))
                    
                    // Bottom Left
                    path.move(to: CGPoint(x: p, y: geo.size.height - vP - cSize))
                    path.addLine(to: CGPoint(x: p, y: geo.size.height - vP - 8))
                    path.addQuadCurve(to: CGPoint(x: p + 8, y: geo.size.height - vP), control: CGPoint(x: p, y: geo.size.height - vP))
                    path.addLine(to: CGPoint(x: p + cSize, y: geo.size.height - vP))
                    
                    // Bottom Right
                    path.move(to: CGPoint(x: geo.size.width - p - cSize, y: geo.size.height - vP))
                    path.addLine(to: CGPoint(x: geo.size.width - p - 8, y: geo.size.height - vP))
                    path.addQuadCurve(to: CGPoint(x: geo.size.width - p, y: geo.size.height - vP - 8), control: CGPoint(x: geo.size.width - p, y: geo.size.height - vP))
                    path.addLine(to: CGPoint(x: geo.size.width - p, y: geo.size.height - vP - cSize))
                }
                .stroke(Color.white.opacity(0.5), lineWidth: 2)
            }
            
            // Center Reticle
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                    .frame(width: 56, height: 56)
                Circle()
                    .fill(Color.white.opacity(0.3))
                    .frame(width: 4, height: 4)
            }
        }
    }
}

// Custom Corner Radius Modifier
struct CornerRadiusStyle: ViewModifier {
    var radius: CGFloat
    var corners: UIRectCorner
    
    struct CornerRadiusShape: Shape {
        var radius = CGFloat.infinity
        var corners = UIRectCorner.allCorners
        
        func path(in rect: CGRect) -> Path {
            let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
            return Path(path.cgPath)
        }
    }
    
    func body(content: Content) -> some View {
        content.clipShape(CornerRadiusShape(radius: radius, corners: corners))
    }
}

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        ModifiedContent(content: self, modifier: CornerRadiusStyle(radius: radius, corners: corners))
    }
}

// MARK: - AVFoundation ViewModel
class CameraViewModel: NSObject, ObservableObject, AVCapturePhotoCaptureDelegate {
    @Published var session = AVCaptureSession()
    @Published var photo: PhotoData?
    
    private var photoOutput = AVCapturePhotoOutput()
    private var currentPosition: AVCaptureDevice.Position = .back
    private var currentFlashMode: AVCaptureDevice.FlashMode = .off
    
    struct PhotoData {
        var image: UIImage
    }
    
    override init() {
        super.init()
        setupCamera()
    }
    
    func setupCamera() {
        session.beginConfiguration()
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: currentPosition),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }
        
        if session.canAddInput(input) { session.addInput(input) }
        if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }
        session.commitConfiguration()
    }
    
    func flipCamera() {
        session.beginConfiguration()
        session.inputs.forEach { session.removeInput($0) }
        currentPosition = currentPosition == .back ? .front : .back
        
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: currentPosition),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }
        
        if session.canAddInput(input) { session.addInput(input) }
        session.commitConfiguration()
    }
    
    func setFlashMode(_ mode: AVCaptureDevice.FlashMode) {
        self.currentFlashMode = mode
    }
    
    func startSession() {
        DispatchQueue.global(qos: .userInitiated).async {
            self.session.startRunning()
        }
    }
    
    func stopSession() {
        session.stopRunning()
    }
    
    func capturePhoto() {
        guard let connection = photoOutput.connection(with: .video) else { return }
        connection.videoOrientation = .portrait
        
        let settings = AVCapturePhotoSettings()
        settings.flashMode = currentFlashMode
        photoOutput.capturePhoto(with: settings, delegate: self)
    }
    
    func retakePhoto() {
        photo = nil
    }
    
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let data = photo.fileDataRepresentation(),
              let image = UIImage(data: data) else { return }
        
        DispatchQueue.main.async {
            self.photo = PhotoData(image: image)
        }
    }
}

// MARK: - Camera Preview Wrapper
struct CameraPreview: UIViewRepresentable {
    class VideoPreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var videoPreviewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }
    
    let session: AVCaptureSession
    
    func makeUIView(context: Context) -> VideoPreviewView {
        let view = VideoPreviewView()
        view.videoPreviewLayer.session = session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        view.videoPreviewLayer.connection?.videoOrientation = .portrait
        return view
    }
    
    func updateUIView(_ uiView: VideoPreviewView, context: Context) {}
}
