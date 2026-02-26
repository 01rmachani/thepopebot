# Radio Stream Player

A modern, responsive web-based radio stream player built with HTML5, CSS3, and vanilla JavaScript. This application allows users to play internet radio streams with an intuitive interface, stream management, and persistent storage.

## 🎵 Features

### Core Functionality
- **Stream Playback**: Play internet radio streams using the HTML5 Audio API
- **Play/Pause/Stop Controls**: Full audio control with visual feedback
- **Volume Control**: Adjustable volume with visual slider and percentage display
- **Stream Management**: Add, remove, and organize your favorite radio stations

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, gradient-based design with smooth animations
- **Real-time Status**: Visual indicators showing connection, buffering, and playback status
- **Error Handling**: Comprehensive error messages for network and audio issues
- **Keyboard Shortcuts**: Space to play/pause, S to stop, arrow keys for volume

### Data Persistence
- **Local Storage**: Automatically saves your stream list between sessions
- **Volume Memory**: Remembers your preferred volume level
- **Default Streams**: Includes sample stations to get you started

## 🚀 Getting Started

### Installation
1. Download or clone the radio player files
2. Ensure you have all four files in the same directory:
   - `index.html` - Main webpage
   - `style.css` - Styling
   - `script.js` - JavaScript functionality
   - `README.md` - This documentation

### Usage
1. Open `index.html` in a modern web browser
2. Use the default streams or add your own
3. Click "Select" on a stream, then press "Play" to start listening

### Adding Streams
1. In the "Add New Stream" section, enter:
   - **Stream Name**: A friendly name (e.g., "BBC Radio 1")
   - **Stream URL**: The direct stream URL (e.g., "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one")
2. Click "Add Stream"
3. Your stream will appear in the "Saved Streams" list

## 🎛️ Controls & Shortcuts

### Mouse/Touch Controls
- **Play/Pause Button**: Start or pause the current stream
- **Stop Button**: Stop playback and reset the stream
- **Volume Slider**: Adjust playback volume (0-100%)
- **Select Button**: Choose a stream from your saved list
- **Delete Button**: Remove a stream from your list (with confirmation)

### Keyboard Shortcuts
- **Space**: Play/pause current stream
- **S**: Stop playback
- **Up Arrow**: Increase volume by 10%
- **Down Arrow**: Decrease volume by 10%

## 🔧 Technical Details

### Architecture
The application follows a clean, modular architecture:

```
RadioPlayer Class
├── Audio Management (HTML5 Audio API)
├── UI Controllers (DOM manipulation)
├── Event Handlers (user interactions)
├── Local Storage (data persistence)
└── Error Handling (graceful degradation)
```

### Browser Compatibility
- **Modern Browsers**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Required Features**: HTML5 Audio, ES6 Classes, Local Storage

### Audio Formats Supported
The player supports any audio format that the browser's HTML5 Audio API can handle:
- **Common Formats**: MP3, AAC, OGG, WebM
- **Stream Protocols**: HTTP, HTTPS
- **Note**: Some streams may not work due to CORS restrictions

## 📱 Mobile Features

### Touch Optimization
- Large, finger-friendly buttons
- Responsive layout that adapts to screen size
- Optimized for both portrait and landscape orientations

### Mobile-Specific Behaviors
- Automatic pause when switching apps (optional)
- Optimized layout for small screens
- Touch-friendly volume control

## 🛡️ Error Handling

The application includes comprehensive error handling:

### Network Errors
- Connection failures
- Invalid stream URLs
- Timeout issues

### Audio Errors
- Unsupported formats
- Decoding errors
- Playback restrictions

### User Errors
- Invalid input validation
- Duplicate stream names
- Missing required fields

## 💾 Data Storage

### Local Storage Structure
```javascript
{
  "radioStreamPlayer_streams": [
    {
      "id": "timestamp",
      "name": "Stream Name",
      "url": "http://stream.url"
    }
  ],
  "radioPlayer_volume": "50"
}
```

### Privacy
- All data is stored locally in your browser
- No personal information is collected or transmitted
- Stream URLs are only used for playback

## 🎨 Customization

### Styling
The CSS uses CSS custom properties (variables) for easy theming. Key colors:
- Primary: `#3498db` (blue)
- Success: `#27ae60` (green)  
- Error: `#e74c3c` (red)
- Background: Gradient `#667eea` to `#764ba2`

### Adding Features
The modular JavaScript structure makes it easy to add features:
1. Extend the `RadioPlayer` class
2. Add new methods for functionality
3. Update the UI accordingly
4. Handle new events as needed

## 🔍 Debugging

### Developer Tools
The application exposes debugging utilities in the browser console:

```javascript
// Access the player instance
debugRadio.player

// View current streams
debugRadio.streams()

// View current stream
debugRadio.currentStream()

// Clear all saved data
debugRadio.clearStreams()
```

### Common Issues
1. **Stream won't play**: Check URL, try in browser directly
2. **No audio**: Check volume, browser permissions
3. **Streams not saving**: Check localStorage is enabled
4. **Mobile issues**: Ensure user interaction before playing

## 📋 Example Stream URLs

Here are some public radio streams you can try:

### BBC Streams
```
BBC Radio 1: http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one
BBC Radio 2: http://stream.live.vc.bbcmedia.co.uk/bbc_radio_two
BBC Radio 4: http://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm
```

### Jazz & Classical
```
Jazz Radio: http://jazz-wr11.ice.infomaniak.ch/jazz-wr11-128.mp3
Classical: http://stream.classical.com/classical128.mp3
```

### International
```
Radio France Info: http://direct.franceinfo.fr/live/franceinfo-midfi.mp3
NPR: http://npr-ice.streamguys1.com/live.mp3
```

**Note**: Stream URLs may change over time. Always verify URLs are current and working.

## 🚨 Security Considerations

### CORS (Cross-Origin Resource Sharing)
Some radio streams may not work due to CORS restrictions. This is a browser security feature, not a bug in the application.

### HTTPS Requirements
Modern browsers require HTTPS for many audio features. Consider serving over HTTPS in production.

### Content Security Policy
If implementing CSP headers, ensure audio sources are allowed.

## 🤝 Contributing

To contribute improvements:
1. Test thoroughly across different browsers
2. Maintain the existing code style and structure
3. Add comments for new functionality
4. Update this documentation for new features
5. Ensure mobile compatibility

## 📄 License

This Radio Stream Player is provided as-is for educational and personal use. Feel free to modify and adapt for your needs.

## 🔗 Resources

- [HTML5 Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (for advanced audio features)
- [Radio Stream Directory](https://www.radio-locator.com/) (find stream URLs)
- [Internet Radio Guide](https://www.internet-radio.com/) (discover new stations)

---

**Built with ❤️ using modern web technologies**