import './App.css'
import { useState, useRef, useEffect } from 'react'

function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // New ref for audio chunks
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      // Reset chunks when starting new recording
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Data available:', event.data.size, 'bytes');
          console.log('Data type:', event.data.type);
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        saveAudioChunk();
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);

      // Start the 5-second interval
      timerRef.current = setInterval(() => {
        recorder.stop();
        recorder.start();
      }, 5000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const saveAudioChunk = () => {
    console.log('Audio chunks before blob creation:', audioChunksRef.current.length);
    console.log('Audio chunks sizes:', audioChunksRef.current.map(chunk => chunk.size));
    
    if (audioChunksRef.current.length === 0) return;

    // Use the correct MIME type
    const audioBlob = new Blob(audioChunksRef.current, { 
      type: 'audio/webm;codecs=opus' 
    });
    
    console.log('Final blob size:', audioBlob.size);
    console.log('Final blob type:', audioBlob.type);
    
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('Created URL:', audioUrl);
    setMessages(prev => [...prev, audioUrl]);
    // Reset chunks after saving
    audioChunksRef.current = [];
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // Clear the interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="message-area">
        {messages.map((audioUrl, index) => (
          <div key={index}>
            <audio controls src={audioUrl} />
          </div>
        ))}
      </div>
      <button 
        onClick={handleRecordClick}
        style={{ backgroundColor: isRecording ? '#dc3545' : '#0069d9' }}
      >
        {isRecording ? 'Recording' : 'Start Recording'}
      </button>
    </div>
  )
}

export default App