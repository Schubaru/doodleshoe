// webrec <url> <outDir> <w> <h> <frames> <settleMs> <stepJsFile>
// Loads a page in an offscreen WKWebView, runs the step script once per frame with `i`
// bound to the frame index, snapshots, and writes f0000.png ... No browser automation stack.
import WebKit
import AppKit

let a = CommandLine.arguments
guard a.count == 8,
      let w = Double(a[3]), let h = Double(a[4]),
      let total = Int(a[5]), let settle = Int(a[6]),
      let stepJS = try? String(contentsOfFile: a[7], encoding: .utf8) else {
    FileHandle.standardError.write("usage: webrec <url> <outDir> <w> <h> <frames> <settleMs> <stepJsFile>\n".data(using: .utf8)!)
    exit(2)
}
let url = URL(string: a[1])!
let outDir = URL(fileURLWithPath: a[2])
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

final class Rec: NSObject, WKNavigationDelegate {
    let web: WKWebView
    let w: Double, h: Double, total: Int, settle: Int, stepJS: String, outDir: URL
    var frame = 0
    init(w: Double, h: Double, total: Int, settle: Int, stepJS: String, outDir: URL) {
        self.w = w; self.h = h; self.total = total
        self.settle = settle; self.stepJS = stepJS; self.outDir = outDir
        let cfg = WKWebViewConfiguration()
        cfg.websiteDataStore = .nonPersistent()
        web = WKWebView(frame: CGRect(x: 0, y: 0, width: w, height: h), configuration: cfg)
        super.init()
        web.navigationDelegate = self
        // an offscreen window: WKWebView will not paint without one
        let win = NSWindow(contentRect: web.frame, styleMask: [.borderless], backing: .buffered, defer: false)
        win.contentView = web
        win.setFrameOrigin(NSPoint(x: -10000, y: -10000))
        win.orderFront(nil)
    }
    func webView(_ v: WKWebView, didFinish n: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) { self.tick() }
    }
    func webView(_ v: WKWebView, didFail n: WKNavigation!, withError e: Error) { die(e) }
    func webView(_ v: WKWebView, didFailProvisionalNavigation n: WKNavigation!, withError e: Error) { die(e) }
    func die(_ e: Error) {
        FileHandle.standardError.write("load failed: \(e.localizedDescription)\n".data(using: .utf8)!)
        exit(1)
    }

    func tick() {
        guard frame < total else {
            print("\(total) frames -> \(self.outDir.path)")
            exit(0)
        }
        let i = frame
        web.evaluateJavaScript("(function(i){\n\(stepJS)\n})(\(i))") { _, err in
            if let err = err { FileHandle.standardError.write("step \(i): \(err)\n".data(using: .utf8)!) }
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(self.settle)) {
                let cfg = WKSnapshotConfiguration()
                cfg.rect = CGRect(x: 0, y: 0, width: self.w, height: self.h)
                self.web.takeSnapshot(with: cfg) { img, err in
                    guard let img = img,
                          let tiff = img.tiffRepresentation,
                          let rep = NSBitmapImageRep(data: tiff),
                          let png = rep.representation(using: .png, properties: [:]) else {
                        FileHandle.standardError.write("snapshot \(i) failed: \(err?.localizedDescription ?? "?")\n".data(using: .utf8)!)
                        exit(1)
                    }
                    try? png.write(to: self.outDir.appendingPathComponent(String(format: "f%04d.png", i)))
                    self.frame += 1
                    self.tick()
                }
            }
        }
    }
}

let rec = Rec(w: w, h: h, total: total, settle: settle, stepJS: stepJS, outDir: outDir)
rec.web.load(URLRequest(url: url))
app.run()
