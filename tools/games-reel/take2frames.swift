// take2frames <take.mov> <outDir> <cropY> <fps> <from-to,from-to,...>
// A Simulator take -> 960x1560 PNG frames, the same shape and size webrec writes, so frames2mp4 encodes
// it like every other reel. Keeps only the listed spans (seconds of the take) to cut the dead air between
// gestures; within a span it plays at life speed. cropY is where the 960x1560 window starts, in take pixels
// after scaling the take's width to 960.
//
//   xcrun simctl io <udid> recordVideo --codec=h264 take.mov   # Ctrl-C to stop
//   swiftc -O take2frames.swift -o take2frames && ./take2frames take.mov frames 422 12 "2.1-5.4,7.0-9.8"
//   ../frames2mp4 frames ../../assets/wordwheel-demo.mp4 12 700
import AVFoundation
import AppKit

let a = CommandLine.arguments
guard a.count == 6, let cropY = Double(a[3]), let fps = Double(a[4]) else {
    FileHandle.standardError.write("usage: take2frames <take.mov> <outDir> <cropY> <fps> <from-to,...>\n".data(using: .utf8)!)
    exit(2)
}
let spans = a[5].split(separator: ",").map { $0.split(separator: "-").map { Double($0)! } }
let out = URL(fileURLWithPath: a[2])
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

let gen = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: a[1])))
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.appliesPreferredTrackTransform = true

let W = 960, H = 1560
var n = 0
for s in spans {
    var t = s[0]
    while t < s[1] {
        let src = try gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil)
        let k = Double(W) / Double(src.width), sh = Double(src.height) * k
        let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.interpolationQuality = .high
        // CoreGraphics is bottom-up: place the scaled take so its row cropY lands on the frame's top edge
        ctx.draw(src, in: CGRect(x: 0, y: Double(H) - sh + cropY, width: Double(W), height: sh))
        let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
        try rep.representation(using: .png, properties: [:])!.write(to: out.appendingPathComponent(String(format: "f%04d.png", n)))
        n += 1
        t += 1 / fps
    }
}
print("\(n) frames -> \(out.path)")
